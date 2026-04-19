import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, BN, web3 } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import * as schedule from "node-schedule";
import * as fs from "fs";
import * as path from "path";
import * as winston from "winston";
import type { AutoSol } from "./types/auto_sol";

// ─── Configuration ───────────────────────────────────────────────────────────
const PROGRAM_ID = new PublicKey(
  "G4zWuZQ7SaP9VgE7bhucKgQ7MVWjLVBhL4wHK6ymVAQL"
);
const DEFAULT_EXECUTION_TIMES = ["0 0 0 * * *", "0 0 12 * * *"]; // midnight & noon
const CONFIG_FILE = path.join(process.cwd(), "executor-config.json");
const LOG_FILE = path.join(process.cwd(), "executor.log");

// PDA seed constants (must match on-chain program)
const SEEDS = {
  FEE_SETTINGS: "global_fee_settings",
  SOL_VAULT: "sol_vault",
  SPL_VAULT: "spl_vault",
  VAULT_AUTHORITY: "vault_authority",
} as const;

// ─── Custom error ────────────────────────────────────────────────────────────
class ExecutorError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ExecutorError";
  }
}

// ─── Logger ──────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: LOG_FILE }),
    new winston.transports.Console(),
  ],
});

// ─── Type helpers ────────────────────────────────────────────────────────────

interface PaymentEntry {
  scheduledTime: BN;
  executed: boolean;
  executionTime: BN;
  executedBy: PublicKey | null;
}

interface PaymentScheduleData {
  owner: PublicKey;
  totalAmount: BN;
  remainingAmount: BN;
  paymentAmount: BN;
  recipient: PublicKey;
  mint: PublicKey;
  payments: PaymentEntry[];
  createdAt: BN;
  status: { active?: object; completed?: object; cancelled?: object };
  paymentType: { sol?: object; splToken?: object };
  memo: string;
  vaultBump: number;
}

interface ExecutionResult {
  scheduleAddress: string;
  paymentIndex: number;
  success: boolean;
  txSignature?: string;
  error?: string;
  amount?: number;
  isSplToken?: boolean;
  mint?: string;
}

// ─── AutoSol Backend ─────────────────────────────────────────────────────────
class AutoSolBackend {
  private connection: Connection;
  private wallet: anchor.Wallet;
  private provider: AnchorProvider;
  private program: Program<AutoSol>;
  private idl: any;

  constructor(
    connection: Connection,
    wallet: anchor.Wallet,
    network: "devnet" | "mainnet-beta" | "localnet" = "localnet"
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.provider = new AnchorProvider(connection, wallet as any, {
      commitment: "confirmed",
    });
    this.loadIDL();
    this.program = new Program(this.idl, this.provider) as Program<AutoSol>;
    logger.info(`AutoSol Backend initialized on ${network}`, {
      executor: this.wallet.publicKey.toString(),
    });
  }

  private loadIDL() {
    try {
      const idlPath = path.join(process.cwd(), "idl.json");
      if (!fs.existsSync(idlPath)) {
        throw new ExecutorError("IDL file not found", "IDL_NOT_FOUND");
      }
      this.idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
      logger.info("IDL loaded successfully");
    } catch (error) {
      throw new ExecutorError("Failed to load IDL", "IDL_LOAD_ERROR", error);
    }
  }

  // ─── PDA derivations ────────────────────────────────────────────────────
  private getFeeSettingsPDA(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SEEDS.FEE_SETTINGS)],
      PROGRAM_ID
    )[0];
  }

  private getSolVaultPDA(schedule: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SEEDS.SOL_VAULT), schedule.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  private getSplVaultPDA(schedule: PublicKey, mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SEEDS.SPL_VAULT), schedule.toBuffer(), mint.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  private getVaultAuthorityPDA(schedule: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SEEDS.VAULT_AUTHORITY), schedule.toBuffer()],
      PROGRAM_ID
    )[0];
  }

  // ─── Check executor authorisation ───────────────────────────────────────
  private async assertAuthorised(): Promise<void> {
    const feeSettings = await this.program.account.feeSettings.fetch(
      this.getFeeSettingsPDA()
    );
    if (
      !feeSettings.executorAllowedKeys.some((key: PublicKey) =>
        key.equals(this.wallet.publicKey)
      )
    ) {
      throw new ExecutorError(
        "Unauthorized executor",
        "UNAUTHORIZED_EXECUTOR"
      );
    }
  }

  // ─── Bulk execute ───────────────────────────────────────────────────────
  async executePendingPayments(): Promise<{
    totalExecuted: number;
    totalFailed: number;
    results: ExecutionResult[];
  }> {
    try {
      logger.info("Scanning for pending payments");
      await this.assertAuthorised();

      const schedules = await this.program.account.paymentSchedule.all();
      const currentTime = Math.floor(Date.now() / 1000);
      const results: ExecutionResult[] = [];

      let totalExecuted = 0;
      let totalFailed = 0;

      for (const scheduleAccount of schedules) {
        const data = scheduleAccount.account as unknown as PaymentScheduleData;
        const addr = scheduleAccount.publicKey;

        // Skip non-active
        if (!("active" in data.status) || !data.status.active) {
          continue;
        }

        const isSpl = "splToken" in data.paymentType && !!data.paymentType.splToken;

        for (let i = 0; i < data.payments.length; i++) {
          const payment = data.payments[i];
          if (
            !payment ||
            payment.executed ||
            currentTime < payment.scheduledTime.toNumber()
          ) {
            continue;
          }

          logger.info(
            `Executing ${isSpl ? "SPL" : "SOL"} payment ${i} for schedule`,
            { scheduleAddress: addr.toString(), mint: data.mint.toString() }
          );

          try {
            const result = isSpl
              ? await this.executeSplPayment(addr, i, data)
              : await this.executeSolPayment(addr, i, data);

            results.push({
              scheduleAddress: addr.toString(),
              paymentIndex: i,
              success: true,
              txSignature: result.txSignature,
              amount: result.amount,
              isSplToken: isSpl,
              mint: data.mint.toString(),
            });
            totalExecuted++;
          } catch (error: any) {
            const errorMessage =
              error instanceof ExecutorError
                ? error.message
                : error?.message || "Unknown error";
            logger.error(`Failed to execute payment ${i}`, {
              scheduleAddress: addr.toString(),
              error: errorMessage,
            });
            results.push({
              scheduleAddress: addr.toString(),
              paymentIndex: i,
              success: false,
              error: errorMessage,
            });
            totalFailed++;
          }

          // Avoid rate limits
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      logger.info("Payment execution complete", { totalExecuted, totalFailed });
      return { totalExecuted, totalFailed, results };
    } catch (error) {
      throw new ExecutorError(
        "Failed to execute pending payments",
        "BULK_EXECUTION_ERROR",
        error
      );
    }
  }

  // ─── SOL payment execution ──────────────────────────────────────────────
  private async executeSolPayment(
    scheduleAddress: PublicKey,
    paymentIndex: number,
    scheduleData: PaymentScheduleData
  ): Promise<{ txSignature: string; amount: number }> {
    try {
      const txSignature = await this.program.methods
        .executePayment(new BN(paymentIndex))
        .accounts({
          paymentSchedule: scheduleAddress,
          executor: this.wallet.publicKey,
          recipient: scheduleData.recipient,
        })
        .signers([this.wallet.payer])
        .rpc();

      const amount = scheduleData.paymentAmount.toNumber() / LAMPORTS_PER_SOL;
      logger.info(`SOL payment ${paymentIndex} executed`, {
        scheduleAddress: scheduleAddress.toString(),
        amount,
        recipient: scheduleData.recipient.toString(),
        txSignature,
      });

      return { txSignature, amount };
    } catch (error) {
      throw new ExecutorError(
        `Failed to execute SOL payment ${paymentIndex}`,
        "SOL_PAYMENT_EXECUTION_ERROR",
        error
      );
    }
  }

  // ─── SPL token payment execution ───────────────────────────────────────
  private async executeSplPayment(
    scheduleAddress: PublicKey,
    paymentIndex: number,
    scheduleData: PaymentScheduleData
  ): Promise<{ txSignature: string; amount: number }> {
    try {
      const mint = scheduleData.mint;

      // Ensure recipient has an ATA (executor pays rent if needed)
      const recipientAta = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet.payer,
        mint,
        scheduleData.recipient
      );

      logger.info(`Recipient ATA ensured: ${recipientAta.address.toString()}`);

      const txSignature = await this.program.methods
        .executeSplPayment(new BN(paymentIndex))
        .accounts({
          paymentSchedule: scheduleAddress,
          executor: this.wallet.publicKey,
          recipientTokenAccount: recipientAta.address,
          mint,
        })
        .signers([this.wallet.payer])
        .rpc();

      const amount = scheduleData.paymentAmount.toNumber();
      logger.info(`SPL payment ${paymentIndex} executed`, {
        scheduleAddress: scheduleAddress.toString(),
        amount,
        mint: mint.toString(),
        recipient: scheduleData.recipient.toString(),
        recipientAta: recipientAta.address.toString(),
        txSignature,
      });

      return { txSignature, amount };
    } catch (error) {
      throw new ExecutorError(
        `Failed to execute SPL payment ${paymentIndex}`,
        "SPL_PAYMENT_EXECUTION_ERROR",
        error
      );
    }
  }

  async getWalletBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      throw new ExecutorError(
        "Failed to get wallet balance",
        "BALANCE_ERROR",
        error
      );
    }
  }
}

// ─── Executor Service ────────────────────────────────────────────────────────
class ExecutorService {
  private backend: AutoSolBackend;
  private executionTimes!: string[];
  private connection: Connection;
  private wallet: anchor.Wallet;

  constructor() {
    this.loadConfig();
    this.connection = new Connection(
      process.env.RPC_URL || "http://127.0.0.1:8899",
      "confirmed"
    );
    this.wallet = this.loadWallet();
    this.backend = new AutoSolBackend(
      this.connection,
      this.wallet,
      (process.env.NETWORK as "devnet" | "mainnet-beta" | "localnet") ||
        "localnet"
    );
  }

  private loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
        this.executionTimes = config.executionTimes || DEFAULT_EXECUTION_TIMES;
      } else {
        this.executionTimes = DEFAULT_EXECUTION_TIMES;
        fs.writeFileSync(
          CONFIG_FILE,
          JSON.stringify({ executionTimes: this.executionTimes }, null, 2)
        );
        logger.info("Created default config file", { path: CONFIG_FILE });
      }
      logger.info("Loaded execution schedule", { times: this.executionTimes });
    } catch (error) {
      logger.error("Failed to load config", { error });
      this.executionTimes = DEFAULT_EXECUTION_TIMES;
    }
  }

  private loadWallet(): anchor.Wallet {
    try {
      if (process.env.SOLANA_PRIVATE_KEY) {
        const privateKeyArray = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
        return new anchor.Wallet(
          Keypair.fromSecretKey(Uint8Array.from(privateKeyArray))
        );
      }
      const walletPath = path.join(
        process.env.HOME || process.env.USERPROFILE || "",
        ".config",
        "solana",
        "id.json"
      );
      if (!fs.existsSync(walletPath)) {
        throw new ExecutorError("Wallet file not found", "WALLET_NOT_FOUND");
      }
      const walletKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
      );
      return new anchor.Wallet(walletKeypair);
    } catch (error) {
      throw new ExecutorError(
        "Failed to load wallet",
        "WALLET_LOAD_ERROR",
        error
      );
    }
  }

  async start() {
    try {
      // Check wallet balance
      const balance = await this.backend.getWalletBalance();
      if (balance < 0.01) {
        logger.warn("Low wallet balance", { balance });
        throw new ExecutorError(
          "Insufficient wallet balance for transactions",
          "INSUFFICIENT_BALANCE"
        );
      }

      // Schedule execution jobs
      this.executionTimes.forEach((cron, index) => {
        schedule.scheduleJob(`execution-${index}`, cron, async () => {
          logger.info("Starting scheduled payment execution", {
            time: new Date().toISOString(),
          });
          try {
            const result = await this.backend.executePendingPayments();
            logger.info("Execution completed", {
              totalExecuted: result.totalExecuted,
              totalFailed: result.totalFailed,
              results: result.results.map((r) => ({
                schedule: r.scheduleAddress.slice(0, 8) + "...",
                index: r.paymentIndex,
                success: r.success,
                isSpl: r.isSplToken || false,
                tx: r.txSignature?.slice(0, 8) + "..." || r.error,
              })),
            });
          } catch (error: any) {
            logger.error("Scheduled execution failed", {
              error: error.message,
              code: error.code || "UNKNOWN",
              details: error.details,
            });
          }
        });
      });

      logger.info("Executor service started", {
        executionTimes: this.executionTimes,
      });
    } catch (error: any) {
      logger.error("Failed to start executor service", {
        error: error.message,
        code: error.code || "UNKNOWN",
        details: error.details,
      });
      throw error;
    }
  }

  async stop() {
    try {
      // Cancel all scheduled jobs
      const jobs = schedule.scheduledJobs;
      if (jobs) {
        for (const jobName in jobs) {
          jobs[jobName]?.cancel();
        }
      }
      logger.info("Executor service stopped");
    } catch (error: unknown) {
      let errMsg = "";
      if (error instanceof Error) {
        errMsg = error.message;
      } else if (typeof error === "object" && error !== null) {
        errMsg = (error as any).message || String(error);
      } else {
        errMsg = String(error);
      }
      logger.error("Failed to stop executor service", { error: errMsg });
      throw new ExecutorError("Failed to stop service", "STOP_ERROR", error);
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  try {
    const service = new ExecutorService();
    await service.start();

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Received SIGINT, shutting down...");
      await service.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM, shutting down...");
      await service.stop();
      process.exit(0);
    });
  } catch (error) {
    let errMsg = "";
    let code = "UNKNOWN";
    let details = undefined;
    if (error instanceof Error) {
      errMsg = error.message;
    } else if (typeof error === "object" && error !== null) {
      errMsg = (error as any).message || String(error);
      code = (error as any).code || "UNKNOWN";
      details = (error as any).details;
    } else {
      errMsg = String(error);
    }
    logger.error("Fatal error in executor service", {
      error: errMsg,
      code,
      details,
    });
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error("Unhandled error in main", { error: errMsg });
    process.exit(1);
  });
}
