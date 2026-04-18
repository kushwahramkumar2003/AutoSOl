import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { PublicKey, Connection, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Types from the Anchor program
interface PaymentData {
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
  payments: PaymentData[];
  createdAt: BN;
  status: { active?: {} | { completed?: {} } | { cancelled?: {} } };
  memo: string;
}

interface FeeSettingsData {
  authority: PublicKey;
  feePercentage: number;
  executorAllowedKeys: PublicKey[];
  feeCollectorAllowedKeys: PublicKey[];
}

// Program configuration
const PROGRAM_ID = new PublicKey("G4zWuZQ7SaP9VgE7bhucKgQ7MVWjLVBhL4wHK6ymVAQL");
const GLOBAL_FEE_SETTINGS_SEED = "global_fee_settings";
const GLOBAL_FEE_VAULT_SEED = "global_fee_vault";

// Hardcoded allowed keys for fee withdrawal (from the program)
const FEE_WITHDRAWAL_ALLOWED_KEYS = [
  "FxfMxvBecat982M1DpeCwqWRRc4gk35UZH5bhaFqVoDX",
  "9KP44gv69EoXN2aB71u1HoYy5ZSZjXTpyYXygJ9phwCN",
  "BS5QbyrCvPreGPPQ7XzEkdpFk7J7LPd9RfYDF8rXmVm7",
  "68AzXw2QAhh6NkrH5bqvDn3hPGk1mix4ewFGQ7AoTpe1",
  "Aq1nGUuXDkPraveNewR7yBpgLELgV8pymEqzgmAsqTDX"
];

// HTTP backend wallet (executor wallet)
const HTTP_BACKEND_WALLET = "8dRCBu5V2v6JHR3HxN9zjN91WoX4FfGzgdM8nXawUbqt";

// Derived PDA addresses
const [FEE_SETTINGS_ADDRESS] = PublicKey.findProgramAddressSync(
  [Buffer.from(GLOBAL_FEE_SETTINGS_SEED)],
  PROGRAM_ID
);

const [SOL_FEE_VAULT_ADDRESS] = PublicKey.findProgramAddressSync(
  [Buffer.from(GLOBAL_FEE_VAULT_SEED)],
  PROGRAM_ID
);

// Custom error class
class AutoSolBackendError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "AutoSolBackendError";
  }
}

// Validation utilities
class ValidationUtils {
  static validatePublicKey(key: string): boolean {
    try {
      new PublicKey(key);
      return true;
    } catch {
      return false;
    }
  }

  static validateAmount(amount: number): boolean {
    return amount > 0 && Number.isFinite(amount) && amount <= 1000000;
  }

  static validateFeePercentage(percentage: number): boolean {
    return percentage >= 0 && percentage <= 500 && Number.isInteger(percentage);
  }

  static isAuthorizedWithdrawalKey(key: PublicKey): boolean {
    return FEE_WITHDRAWAL_ALLOWED_KEYS.includes(key.toString());
  }
}

// Main AutoSol Backend class
class AutoSolBackend {
  private connection: Connection;
  private wallet: Keypair;
  private provider: AnchorProvider;
  private program: Program;
  private idl: any;

  constructor(
    connection: Connection,
    wallet: Keypair,
    network: "devnet" | "mainnet-beta" = "devnet"
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.provider = new AnchorProvider(connection, wallet as any, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
    
    // Load IDL
    this.loadIDL();
    this.program = new Program(this.idl, this.provider);
    
    console.log(`🚀 AutoSol Backend initialized on ${network}`);
    console.log(`📍 Executor wallet: ${this.wallet.publicKey.toString()}`);
    console.log(`📋 Program ID: ${PROGRAM_ID.toString()}`);
  }

  private loadIDL() {
    try {
      const idlPath = path.join(process.cwd(), "idl.json");
      if (!fs.existsSync(idlPath)) {
        throw new AutoSolBackendError(
          "IDL file not found. Make sure idl.json exists in the current directory",
          "IDL_NOT_FOUND"
        );
      }
      this.idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
      console.log("✅ IDL loaded successfully");
    } catch (error) {
      if (error instanceof AutoSolBackendError) {
        throw error;
      }
      throw new AutoSolBackendError(
        "Failed to load IDL file",
        "IDL_LOAD_ERROR",
        error
      );
    }
  }

  /**
   * Initialize the program
   */
  async initialize(): Promise<{ txSignature: string }> {
    try {
      console.log("🔄 Initializing AutoSol program...");

      // Check if already initialized
      try {
        await this.program.account.feeSettings.fetch(FEE_SETTINGS_ADDRESS);
        throw new AutoSolBackendError(
          "Program is already initialized",
          "ALREADY_INITIALIZED"
        );
      } catch (error: any) {
        if (error.message?.includes("Account does not exist")) {
          // Program not initialized, continue
        } else if (error instanceof AutoSolBackendError) {
          throw error;
        }
      }

      const txSignature = await this.program.methods
        .initialize()
        .accounts({
          feeSettings: FEE_SETTINGS_ADDRESS,
          solFeeVault: SOL_FEE_VAULT_ADDRESS,
          authority: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Program initialized successfully");
      console.log(`📄 Transaction: ${txSignature}`);
      console.log(`🏦 Fee Settings: ${FEE_SETTINGS_ADDRESS.toString()}`);
      console.log(`💰 Fee Vault: ${SOL_FEE_VAULT_ADDRESS.toString()}`);

      return { txSignature };
    } catch (error) {
      console.error("❌ Initialization failed:", error);
      if (error instanceof AutoSolBackendError) {
        throw error;
      }
      throw new AutoSolBackendError(
        "Failed to initialize program",
        "INITIALIZATION_ERROR",
        error
      );
    }
  }

  /**
   * Get fee settings
   */
  async getFeeSettings(): Promise<FeeSettingsData> {
    try {
      const feeSettings = await this.program.account.feeSettings.fetch(FEE_SETTINGS_ADDRESS);
      return {
        authority: feeSettings.authority,
        feePercentage: feeSettings.feePercentage,
        executorAllowedKeys: feeSettings.executorAllowedKeys,
        feeCollectorAllowedKeys: feeSettings.feeCollectorAllowedKeys
      };
    } catch (error) {
      throw new AutoSolBackendError(
        "Failed to fetch fee settings",
        "FEE_SETTINGS_FETCH_ERROR",
        error
      );
    }
  }

  /**
   * Update fee percentage
   */
  async updateFeePercentage(newFeePercentage: number): Promise<{ txSignature: string }> {
    try {
      console.log(`🔄 Updating fee percentage to ${newFeePercentage / 100}%...`);

      if (!ValidationUtils.validateFeePercentage(newFeePercentage)) {
        throw new AutoSolBackendError(
          "Invalid fee percentage. Must be between 0 and 500 (0-5%)",
          "INVALID_FEE_PERCENTAGE"
        );
      }

      // Verify authority
      const feeSettings = await this.getFeeSettings();
      if (!feeSettings.authority.equals(this.wallet.publicKey)) {
        throw new AutoSolBackendError(
          "Unauthorized: Only the authority can update fee percentage",
          "UNAUTHORIZED_FEE_UPDATE"
        );
      }

      const txSignature = await this.program.methods
        .updateFeePercentage(newFeePercentage)
        .accounts({
          feeSettings: FEE_SETTINGS_ADDRESS,
          authority: this.wallet.publicKey,
        })
        .rpc();

      console.log("✅ Fee percentage updated successfully");
      console.log(`📄 Transaction: ${txSignature}`);

      return { txSignature };
    } catch (error) {
      console.error("❌ Fee update failed:", error);
      if (error instanceof AutoSolBackendError) {
        throw error;
      }
      throw new AutoSolBackendError(
        "Failed to update fee percentage",
        "FEE_UPDATE_ERROR",
        error
      );
    }
  }

  /**
   * Withdraw fees
   */
  async withdrawFees(amount: number): Promise<{ txSignature: string }> {
    try {
      console.log(`🔄 Withdrawing ${amount} SOL from fee vault...`);

      if (!ValidationUtils.validateAmount(amount)) {
        throw new AutoSolBackendError(
          "Invalid withdrawal amount",
          "INVALID_WITHDRAWAL_AMOUNT"
        );
      }

      // Verify authorization
      if (!ValidationUtils.isAuthorizedWithdrawalKey(this.wallet.publicKey)) {
        throw new AutoSolBackendError(
          "Unauthorized: Wallet is not authorized for fee withdrawal",
          "UNAUTHORIZED_FEE_WITHDRAWAL"
        );
      }

      // Check vault balance
      const vaultBalance = await this.connection.getBalance(SOL_FEE_VAULT_ADDRESS);
      const requiredLamports = amount * LAMPORTS_PER_SOL;
      
      if (vaultBalance < requiredLamports) {
        throw new AutoSolBackendError(
          `Insufficient vault balance. Available: ${vaultBalance / LAMPORTS_PER_SOL} SOL, Requested: ${amount} SOL`,
          "INSUFFICIENT_VAULT_BALANCE"
        );
      }

      const txSignature = await this.program.methods
        .withdrawFees(new BN(requiredLamports))
        .accounts({
          feeSettings: FEE_SETTINGS_ADDRESS,
          authority: this.wallet.publicKey,
          solFeeVault: SOL_FEE_VAULT_ADDRESS,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Fees withdrawn successfully");
      console.log(`📄 Transaction: ${txSignature}`);

      return { txSignature };
    } catch (error) {
      console.error("❌ Fee withdrawal failed:", error);
      if (error instanceof AutoSolBackendError) {
        throw error;
      }
      throw new AutoSolBackendError(
        "Failed to withdraw fees",
        "FEE_WITHDRAWAL_ERROR",
        error
      );
    }
  }

  /**
   * Execute a specific payment
   */
  async executePayment(
    scheduleAddress: PublicKey,
    paymentIndex: number
  ): Promise<{ txSignature: string; amount: number }> {
    try {
      // Fetch payment schedule
      const scheduleData: PaymentScheduleData = await this.program.account.paymentSchedule.fetch(scheduleAddress);
      
      // Validate payment index
      if (paymentIndex >= scheduleData.payments.length) {
        throw new AutoSolBackendError(
          `Invalid payment index: ${paymentIndex}`,
          "INVALID_PAYMENT_INDEX"
        );
      }

      const payment = scheduleData.payments[paymentIndex];
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if payment is already executed
      if (payment.executed) {
        throw new AutoSolBackendError(
          `Payment ${paymentIndex} is already executed`,
          "PAYMENT_ALREADY_EXECUTED"
        );
      }

      // Check if payment is due
      if (currentTime < payment.scheduledTime.toNumber()) {
        const dueDate = new Date(payment.scheduledTime.toNumber() * 1000);
        throw new AutoSolBackendError(
          `Payment ${paymentIndex} is not due yet. Due: ${dueDate.toISOString()}`,
          "PAYMENT_NOT_DUE"
        );
      }

      // Verify executor is authorized
      const feeSettings = await this.getFeeSettings();
      if (
        !feeSettings.executorAllowedKeys.some((key) =>
          key.equals(this.wallet.publicKey)
        )
      ) {
        throw new AutoSolBackendError(
          "Unauthorized: Wallet is not in the executor allowlist",
          "UNAUTHORIZED_EXECUTOR"
        );
      }

      // Derive SOL payment vault
      const [solPaymentVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("sol_vault"), scheduleAddress.toBuffer()],
        PROGRAM_ID
      );

      const txSignature = await this.program.methods
        .executePayment(new BN(paymentIndex))
        .accounts({
          paymentSchedule: scheduleAddress,
          feeSettings: FEE_SETTINGS_ADDRESS,
          executor: this.wallet.publicKey,
          recipient: scheduleData.recipient,
          solPaymentVault: solPaymentVault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const amount = scheduleData.paymentAmount.toNumber() / LAMPORTS_PER_SOL;

      console.log(`✅ Payment ${paymentIndex} executed successfully`);
      console.log(`💰 Amount: ${amount} SOL`);
      console.log(`👤 Recipient: ${scheduleData.recipient.toString()}`);
      console.log(`📄 Transaction: ${txSignature}`);

      return { txSignature, amount };
    } catch (error) {
      if (error instanceof AutoSolBackendError) {
        throw error;
      }
      throw new AutoSolBackendError(
        `Failed to execute payment ${paymentIndex}`,
        "PAYMENT_EXECUTION_ERROR",
        error
      );
    }
  }

  /**
   * Execute all pending payments
   */
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
      console.log("🔄 Scanning for pending payments...");

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

        // Skip non-active schedules
        if (!scheduleData.status.hasOwnProperty('active')) {
          continue;
        }

        for (let i = 0; i < scheduleData.payments.length; i++) {
          const payment = scheduleData.payments[i];

          if (!payment.executed && currentTime >= payment.scheduledTime.toNumber()) {
            console.log(`🎯 Executing payment ${i} for schedule ${scheduleAddress.toString()}`);
            
            try {
              const result = await this.executePayment(scheduleAddress, i);
              results.push({
                scheduleAddress: scheduleAddress.toString(),
                paymentIndex: i,
                success: true,
                txSignature: result.txSignature,
                amount: result.amount
              });
              totalExecuted++;
            } catch (error) {
              const errorMessage = error instanceof AutoSolBackendError 
                ? error.message 
                : "Unknown error occurred";
              
              console.error(`❌ Failed to execute payment ${i}:`, errorMessage);
              results.push({
                scheduleAddress: scheduleAddress.toString(),
                paymentIndex: i,
                success: false,
                error: errorMessage
              });
              totalFailed++;
            }

            // Add delay between executions to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      console.log(`📊 Execution complete - Executed: ${totalExecuted}, Failed: ${totalFailed}`);

      return {
        totalExecuted,
        totalFailed,
        results
      };
    } catch (error) {
      throw new AutoSolBackendError(
        "Failed to execute pending payments",
        "BULK_EXECUTION_ERROR",
        error
      );
    }
  }

  /**
   * Get payment status summary
   */
  async getPaymentSummary(): Promise<{
    totalSchedules: number;
    activeSchedules: number;
    completedSchedules: number;
    cancelledSchedules: number;
    pendingPayments: number;
    overduePayments: number;
    totalValueLocked: number;
    feeVaultBalance: number;
  }> {
    try {
      const schedules = await this.program.account.paymentSchedule.all();
      const currentTime = Math.floor(Date.now() / 1000);
      const feeVaultBalance = await this.connection.getBalance(SOL_FEE_VAULT_ADDRESS);

      let activeSchedules = 0;
      let completedSchedules = 0;
      let cancelledSchedules = 0;
      let pendingPayments = 0;
      let overduePayments = 0;
      let totalValueLocked = 0;

      for (const schedule of schedules) {
        const data = schedule.account as PaymentScheduleData;

        if (data.status.hasOwnProperty('active')) {
          activeSchedules++;
          totalValueLocked += data.remainingAmount.toNumber() / LAMPORTS_PER_SOL;

          // Count pending and overdue payments
          data.payments.forEach(payment => {
            if (!payment.executed) {
              if (currentTime >= payment.scheduledTime.toNumber()) {
                overduePayments++;
              } else {
                pendingPayments++;
              }
            }
          });
        } else if (data.status.hasOwnProperty('completed')) {
          completedSchedules++;
        } else if (data.status.hasOwnProperty('cancelled')) {
          cancelledSchedules++;
        }
      }

      return {
        totalSchedules: schedules.length,
        activeSchedules,
        completedSchedules,
        cancelledSchedules,
        pendingPayments,
        overduePayments,
        totalValueLocked,
        feeVaultBalance: feeVaultBalance / LAMPORTS_PER_SOL
      };
    } catch (error) {
      throw new AutoSolBackendError(
        "Failed to get payment summary",
        "SUMMARY_ERROR",
        error
      );
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      throw new AutoSolBackendError(
        "Failed to get wallet balance",
        "BALANCE_ERROR",
        error
      );
    }
  }
}

// Load wallet function
function loadWallet(): Keypair {
  try {
    // Try to load from SOLANA_PRIVATE_KEY environment variable first
    if (process.env.SOLANA_PRIVATE_KEY) {
      const privateKeyArray = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
      return Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    }

    // Fall back to default Solana CLI location
    const walletPath = path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      ".config",
      "solana",
      "id.json"
    );

    if (!fs.existsSync(walletPath)) {
      throw new Error("Wallet file not found. Set SOLANA_PRIVATE_KEY env var or ensure Solana CLI wallet exists");
    }

    const walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
    );

    return walletKeypair;
  } catch (error) {
    throw new AutoSolBackendError(
      "Failed to load wallet",
      "WALLET_LOAD_ERROR",
      error
    );
  }
}

// Main CLI setup
async function main() {
  const cli = new Command();
  cli.name("autosol-backend").description("AutoSol Backend Executor CLI").version("1.0.0");

  // Global options
  cli.option("-n, --network <network>", "Solana network", "localnet");
  cli.option("-r, --rpc <url>", "Custom RPC URL");

  // Initialize backend instance
  let backend: AutoSolBackend;

  cli.hook("preAction", async (thisCommand) => {
    const options = thisCommand.opts();
    const network = options.network as "devnet" | "mainnet-beta" | "localnet";
    
    let connection: Connection;
    if (options.rpc) {
      connection = new Connection(options.rpc, "confirmed");
    } else if (network === "localnet") {
      connection = new Connection("http://127.0.0.1:8899", "confirmed");
    } else {
      connection = new Connection(
        web3.clusterApiUrl(network as "devnet" | "mainnet-beta"),
        "confirmed"
      );
    }

    const wallet = loadWallet();
    backend = new AutoSolBackend(connection, wallet, network);
  });

  // Commands
  cli
    .command("initialize")
    .description("Initialize the AutoSol program")
    .action(async () => {
      try {
        const result = await backend.initialize();
        console.log("🎉 Initialization successful!");
        console.log(`Transaction: ${result.txSignature}`);
      } catch (error) {
        console.error("❌ Initialization failed:", error.message);
        process.exit(1);
      }
    });

  cli
    .command("update-fee")
    .description("Update the fee percentage")
    .requiredOption("-p, --percentage <number>", "Fee percentage in basis points (100 = 1%)")
    .action(async (options) => {
      try {
        const percentage = parseInt(options.percentage);
        const result = await backend.updateFeePercentage(percentage);
        console.log("🎉 Fee percentage updated!");
        console.log(`Transaction: ${result.txSignature}`);
      } catch (error) {
        console.error("❌ Fee update failed:", error.message);
        process.exit(1);
      }
    });

  cli
    .command("withdraw-fees")
    .description("Withdraw fees from the vault")
    .requiredOption("-a, --amount <number>", "Amount to withdraw in SOL")
    .action(async (options) => {
      try {
        const amount = parseFloat(options.amount);
        const result = await backend.withdrawFees(amount);
        console.log("🎉 Fees withdrawn!");
        console.log(`Transaction: ${result.txSignature}`);
      } catch (error) {
        console.error("❌ Fee withdrawal failed:", error.message);
        process.exit(1);
      }
    });

  cli
    .command("execute-payment")
    .description("Execute a specific payment")
    .requiredOption("-s, --schedule <address>", "Payment schedule address")
    .requiredOption("-i, --index <number>", "Payment index")
    .action(async (options) => {
      try {
        const scheduleAddress = new PublicKey(options.schedule);
        const paymentIndex = parseInt(options.index);
        const result = await backend.executePayment(scheduleAddress, paymentIndex);
        console.log("🎉 Payment executed!");
        console.log(`Amount: ${result.amount} SOL`);
        console.log(`Transaction: ${result.txSignature}`);
      } catch (error) {
        console.error("❌ Payment execution failed:", error.message);
        process.exit(1);
      }
    });

  cli
    .command("execute-all")
    .description("Execute all pending payments")
    .action(async () => {
      try {
        const result = await backend.executePendingPayments();
        console.log("🎉 Bulk execution complete!");
        console.log(`Executed: ${result.totalExecuted}, Failed: ${result.totalFailed}`);
        
        if (result.results.length > 0) {
          console.log("\n📋 Detailed Results:");
          result.results.forEach(r => {
            const status = r.success ? "✅" : "❌";
            console.log(`${status} ${r.scheduleAddress.slice(0, 8)}... Payment ${r.paymentIndex}`);
            if (r.success) {
              console.log(`   💰 ${r.amount} SOL - TX: ${r.txSignature?.slice(0, 8)}...`);
            } else {
              console.log(`   ❌ ${r.error}`);
            }
          });
        }
      } catch (error) {
        console.error("❌ Bulk execution failed:", error.message);
        process.exit(1);
      }
    });

  cli
    .command("status")
    .description("Show payment status summary")
    .action(async () => {
      try {
        const summary = await backend.getPaymentSummary();
        const walletBalance = await backend.getWalletBalance();
        
        console.log("\n📊 AutoSol Status Dashboard");
        console.log("═".repeat(40));
        console.log(`💰 Executor Balance: ${walletBalance.toFixed(4)} SOL`);
        console.log(`🏦 Fee Vault Balance: ${summary.feeVaultBalance.toFixed(4)} SOL`);
        console.log(`🔒 Total Value Locked: ${summary.totalValueLocked.toFixed(4)} SOL`);
        console.log("");
        console.log("📈 Schedule Statistics:");
        console.log(`   Total Schedules: ${summary.totalSchedules}`);
        console.log(`   Active: ${summary.activeSchedules}`);
        console.log(`   Completed: ${summary.completedSchedules}`);
        console.log(`   Cancelled: ${summary.cancelledSchedules}`);
        console.log("");
        console.log("⏰ Payment Status:");
        console.log(`   Pending: ${summary.pendingPayments}`);
        console.log(`   Overdue: ${summary.overduePayments}`);
      } catch (error) {
        console.error("❌ Failed to get status:", error.message);
        process.exit(1);
      }
    });

  cli
    .command("daemon")
    .description("Run payment executor daemon")
    .option("-i, --interval <seconds>", "Check interval in seconds", "60")
    .action(async (options) => {
      const interval = parseInt(options.interval) * 1000;
      
      console.log("🤖 Starting AutoSol payment daemon...");
      console.log(`⏱️  Check interval: ${options.interval} seconds`);
      
      const executeLoop = async () => {
        try {
          const result = await backend.executePendingPayments();
          if (result.totalExecuted > 0 || result.totalFailed > 0) {
            console.log(`[${new Date().toISOString()}] Executed: ${result.totalExecuted}, Failed: ${result.totalFailed}`);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Daemon error:`, error.message);
        }
      };

      // Initial execution
      await executeLoop();
      
      // Set up interval
      setInterval(executeLoop, interval);
      
      console.log("✅ Daemon started. Press Ctrl+C to stop.");
    });

  await cli.parseAsync(process.argv);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
