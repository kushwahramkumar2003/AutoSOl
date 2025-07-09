import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, BN, web3 } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as schedule from "node-schedule";
import * as fs from "fs";
import * as path from "path";
import * as winston from "winston";
import type { PaymentScheduleData } from "./types/auto_sol";
import type { AutoSol } from "./types";

// Configuration
const PROGRAM_ID = new PublicKey(
  "98g9uR7WZqinAnSeUgB5nUw3pbR6sNwFuYWW78yPHtva"
);
const HTTP_BACKEND_WALLET = "G8UmesEhavARgE6xTWbDq6iHvdp8W2yo4pbrW4jLsHxh";
const DEFAULT_EXECUTION_TIMES = ["0 0 0 * * *", "0 0 12 * * *"]; // 12:00 AM and 12:00 PM daily
const CONFIG_FILE = path.join(process.cwd(), "executor-config.json");
const LOG_FILE = path.join(process.cwd(), "executor.log");

// Custom error class
class ExecutorError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "ExecutorError";
  }
}

// Logger setup
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

// AutoSol Backend class (adapted from index.ts)
class AutoSolBackend {
  private connection: Connection;
  private wallet: anchor.Wallet;
  private provider: AnchorProvider;
  private program: Program<AutoSol>;
  private idl: any;

  constructor(
    connection: Connection,
    wallet: anchor.Wallet,
    network: "devnet" | "mainnet-beta" = "devnet"
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

  async executePendingPayments(): Promise<{
    totalExecuted: number;
    totalFailed: number;
    results: Array<{
      scheduleAddress: string;
      paymentIndex: number;
      success: boolean;
      txSignature?: string;
      error?: string;
      amount?: number;
    }>;
  }> {
    try {
      logger.info("Scanning for pending payments");
      const schedules = await this.program.account.paymentSchedule.all();
      const currentTime = Math.floor(Date.now() / 1000);
      const results: Array<{
        scheduleAddress: string;
        paymentIndex: number;
        success: boolean;
        txSignature?: string;
        error?: string;
        amount?: number;
      }> = [];

      let totalExecuted = 0;
      let totalFailed = 0;

      for (const schedule of schedules) {
        const scheduleData = schedule.account as PaymentScheduleData;
        const scheduleAddress = schedule.publicKey;

        if ("active" in scheduleData.status === false) {
          logger.warn("Skipping non-active schedule", {
            scheduleAddress: scheduleAddress.toString(),
          });
          continue;
        }

        for (let i = 0; i < scheduleData.payments.length; i++) {
          const payment = scheduleData.payments[i];
          if (
            payment &&
            !payment.executed &&
            currentTime >= payment.scheduledTime.toNumber()
          ) {
            logger.info(`Executing payment ${i} for schedule`, {
              scheduleAddress: scheduleAddress.toString(),
            });
            try {
              const result = await this.executePayment(scheduleAddress, i);
              results.push({
                scheduleAddress: scheduleAddress.toString(),
                paymentIndex: i,
                success: true,
                txSignature: result.txSignature,
                amount: result.amount,
              });
              totalExecuted++;
            } catch (error: any) {
              const errorMessage =
                error instanceof ExecutorError
                  ? error.message
                  : "Unknown error";
              logger.error(`Failed to execute payment ${i}`, {
                scheduleAddress: scheduleAddress.toString(),
                error: errorMessage,
                details: error.details,
              });
              results.push({
                scheduleAddress: scheduleAddress.toString(),
                paymentIndex: i,
                success: false,
                error: errorMessage,
              });
              totalFailed++;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Avoid rate limits
          }
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

  private async executePayment(
    scheduleAddress: PublicKey,
    paymentIndex: number
  ): Promise<{ txSignature: string; amount: number }> {
    try {
      const scheduleData = (await this.program.account.paymentSchedule.fetch(
        scheduleAddress
      )) as PaymentScheduleData;
      if (paymentIndex >= scheduleData.payments.length) {
        throw new ExecutorError(
          `Invalid payment index: ${paymentIndex}`,
          "INVALID_PAYMENT_INDEX"
        );
      }

      const payment = scheduleData.payments[paymentIndex];
      const currentTime = Math.floor(Date.now() / 1000);
      if (!payment) {
        throw new ExecutorError(
          `Payment at index ${paymentIndex} is undefined`,
          "PAYMENT_UNDEFINED"
        );
      }
      if (payment.executed) {
        throw new ExecutorError(
          `Payment ${paymentIndex} already executed`,
          "PAYMENT_ALREADY_EXECUTED"
        );
      }
      if (currentTime < payment.scheduledTime.toNumber()) {
        throw new ExecutorError(
          `Payment ${paymentIndex} not due yet`,
          "PAYMENT_NOT_DUE"
        );
      }

      const feeSettings = await this.program.account.feeSettings.fetch(
        PublicKey.findProgramAddressSync(
          [Buffer.from("global_fee_settings")],
          PROGRAM_ID
        )[0]
      );
      if (!feeSettings.httpBackendWallet.equals(this.wallet.publicKey)) {
        throw new ExecutorError(
          "Unauthorized executor",
          "UNAUTHORIZED_EXECUTOR"
        );
      }

      const [solPaymentVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("sol_vault"), scheduleAddress.toBuffer()],
        PROGRAM_ID
      );

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
      logger.info(`Payment ${paymentIndex} executed`, {
        scheduleAddress: scheduleAddress.toString(),
        amount,
        recipient: scheduleData.recipient.toString(),
        txSignature,
      });

      return { txSignature, amount };
    } catch (error) {
      throw new ExecutorError(
        `Failed to execute payment ${paymentIndex}`,
        "PAYMENT_EXECUTION_ERROR",
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

// Executor Service
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
      (process.env.NETWORK as "devnet" | "mainnet-beta") || "devnet"
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
      if (walletKeypair.publicKey.toString() !== HTTP_BACKEND_WALLET) {
        throw new ExecutorError(
          "Wallet does not match HTTP backend wallet",
          "INVALID_WALLET"
        );
      }
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
    } catch (error) {
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

// Main execution
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
