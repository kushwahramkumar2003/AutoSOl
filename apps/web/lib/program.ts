import { idl } from "@/program/idl";
import { AutoSol } from "@/program/types";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

// ─── PDA seed constants (must match on-chain program) ────────────────────────
const GLOBAL_FEE_SETTINGS_SEED = "global_fee_settings";
const GLOBAL_FEE_VAULT_SEED = "global_fee_vault";
const SOL_VAULT_SEED = "sol_vault";
const SPL_VAULT_SEED = "spl_vault";
const VAULT_AUTHORITY_SEED = "vault_authority";
const SPL_FEE_VAULT_SEED = "spl_fee_vault";
const FEE_VAULT_AUTHORITY_SEED = "fee_vault_authority";

// Native SOL wrapped mint address
const NATIVE_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentScheduleData {
  owner: PublicKey;
  totalAmount: anchor.BN;
  remainingAmount: anchor.BN;
  paymentAmount: anchor.BN;
  recipient: PublicKey;
  mint: PublicKey;
  payments: Payment[];
  createdAt: anchor.BN;
  status: ScheduleStatus;
  paymentType: PaymentType;
  memo: string;
  vaultBump: number;
}

export interface Payment {
  scheduledTime: anchor.BN;
  executed: boolean;
  executionTime: anchor.BN;
  executedBy: PublicKey | null;
  txSignature?: PublicKey | null;
}

export interface FeeSettingsData {
  authority: PublicKey;
  feePercentage: number;
  executorAllowedKeys: PublicKey[];
  feeCollectorAllowedKeys: PublicKey[];
  initialized: boolean;
}

export enum ScheduleStatus {
  Active = "Active",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export enum PaymentType {
  Sol = "Sol",
  SplToken = "SplToken",
}

export interface CreateScheduleParams {
  paymentAmount: number; // in lamports or smallest token unit
  recipientAddress: PublicKey;
  scheduleTimes: number[]; // Unix timestamps
  memo: string;
}

export interface CreateSplScheduleParams extends CreateScheduleParams {
  mint: PublicKey;
}

export interface ScheduleWithAddress {
  address: PublicKey;
  data: PaymentScheduleData;
}

export class AutoSolError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = "AutoSolError";
  }
}

export class AutoSolProgram {
  private program: Program<AutoSol>;
  private connection: Connection;
  private programId: PublicKey;
  private logger: (message: string, ...args: unknown[]) => void;

  constructor(
    provider: anchor.AnchorProvider,
    debug: boolean = false,
    customLogger?: (message: string, ...args: unknown[]) => void
  ) {
    if (!provider.publicKey) {
      throw new AutoSolError(
        "Provider wallet not connected",
        "WALLET_NOT_CONNECTED"
      );
    }

    this.program = new Program(idl as unknown as AutoSol, provider);
    this.connection = provider.connection;
    this.programId = new PublicKey(idl.address);
    this.logger = customLogger || (debug ? console.log : () => { });
  }

  // ─── PDA derivations ──────────────────────────────────────────────────

  private getFeeSettingsPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_FEE_SETTINGS_SEED)],
      this.programId
    );
  }

  private getFeeVaultPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_FEE_VAULT_SEED)],
      this.programId
    );
  }

  private getPaymentVaultPDA(scheduleAddress: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SOL_VAULT_SEED), scheduleAddress.toBuffer()],
      this.programId
    );
  }

  private getSplVaultPDA(
    scheduleAddress: PublicKey,
    mint: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(SPL_VAULT_SEED),
        scheduleAddress.toBuffer(),
        mint.toBuffer(),
      ],
      this.programId
    );
  }

  private getVaultAuthorityPDA(
    scheduleAddress: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(VAULT_AUTHORITY_SEED), scheduleAddress.toBuffer()],
      this.programId
    );
  }

  private getSplFeeVaultPDA(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SPL_FEE_VAULT_SEED), mint.toBuffer()],
      this.programId
    );
  }

  private getFeeVaultAuthorityPDA(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(FEE_VAULT_AUTHORITY_SEED), mint.toBuffer()],
      this.programId
    );
  }

  // ─── Public helpers ───────────────────────────────────────────────────

  /** Returns true if the given mint address is native SOL (wrapped). */
  public static isNativeSol(mint: string | PublicKey): boolean {
    const mintStr = typeof mint === "string" ? mint : mint.toString();
    return (
      mintStr === NATIVE_SOL_MINT.toString() ||
      mintStr === "11111111111111111111111111111111"
    );
  }

  // ─── Fetch helpers ────────────────────────────────────────────────────

  public async getFeeSettings(): Promise<FeeSettingsData> {
    try {
      const [feeSettingsAddress] = this.getFeeSettingsPDA();
      const feeSettings =
        await this.program.account.feeSettings.fetch(feeSettingsAddress);

      return {
        authority: feeSettings.authority,
        feePercentage: feeSettings.feePercentage,
        executorAllowedKeys: feeSettings.executorAllowedKeys,
        feeCollectorAllowedKeys: feeSettings.feeCollectorAllowedKeys,
        initialized: feeSettings.initialized,
      };
    } catch (error) {
      this.logger("Error fetching fee settings:", error);
      throw new AutoSolError(
        "Failed to fetch fee settings data",
        "FEE_SETTINGS_FETCH_ERROR",
        error as Error
      );
    }
  }

  public async getPaymentSchedule(
    scheduleAddress: PublicKey
  ): Promise<PaymentScheduleData> {
    try {
      const schedule =
        await this.program.account.paymentSchedule.fetch(scheduleAddress);

      return this.mapScheduleData(schedule);
    } catch (error) {
      this.logger("Error fetching payment schedule:", error);
      throw new AutoSolError(
        "Failed to fetch payment schedule data",
        "PAYMENT_SCHEDULE_FETCH_ERROR",
        error as Error
      );
    }
  }

  private mapScheduleData(schedule: any): PaymentScheduleData {
    return {
      owner: schedule.owner,
      totalAmount: schedule.totalAmount,
      remainingAmount: schedule.remainingAmount,
      paymentAmount: schedule.paymentAmount,
      recipient: schedule.recipient,
      mint: schedule.mint,
      payments: schedule.payments.map(
        (payment: {
          scheduledTime: anchor.BN;
          executed: boolean;
          executionTime: anchor.BN;
          executedBy: PublicKey | null;
        }) => ({
          scheduledTime: payment.scheduledTime,
          executed: payment.executed,
          executionTime: payment.executionTime,
          executedBy: payment.executedBy,
          txSignature: payment.executedBy,
        })
      ),
      createdAt: schedule.createdAt,
      status: this.mapScheduleStatus(schedule.status),
      paymentType: this.mapPaymentType(schedule.paymentType),
      memo: schedule.memo,
      vaultBump: schedule.vaultBump,
    };
  }

  private mapScheduleStatus(status: {
    active?: Record<string, never>;
    completed?: Record<string, never>;
    cancelled?: Record<string, never>;
  }): ScheduleStatus {
    if (status.active) return ScheduleStatus.Active;
    if (status.completed) return ScheduleStatus.Completed;
    if (status.cancelled) return ScheduleStatus.Cancelled;
    return ScheduleStatus.Active;
  }

  private mapPaymentType(paymentType: {
    sol?: Record<string, never>;
    splToken?: Record<string, never>;
  }): PaymentType {
    if (paymentType.splToken) return PaymentType.SplToken;
    return PaymentType.Sol;
  }

  // ─── Cost calculation ─────────────────────────────────────────────────

  public async calculateTotalCost(
    paymentAmount: number,
    scheduleCount: number
  ): Promise<{ totalAmount: number; feeAmount: number; totalCost: number }> {
    try {
      const feeSettings = await this.getFeeSettings();
      const totalAmount = paymentAmount * scheduleCount;
      const feeAmount = Math.floor(
        (totalAmount * feeSettings.feePercentage) / 10000
      );
      const totalCost = totalAmount + feeAmount;

      return { totalAmount, feeAmount, totalCost };
    } catch (error) {
      this.logger("Error calculating total cost:", error);
      throw new AutoSolError(
        "Failed to calculate total cost",
        "COST_CALCULATION_ERROR",
        error as Error
      );
    }
  }

  // ─── Create SOL payment schedule ──────────────────────────────────────

  public async createPaymentSchedule(
    params: CreateScheduleParams,
    paymentScheduleKeypair: Keypair = Keypair.generate()
  ): Promise<{ scheduleAddress: PublicKey; txSignature: string }> {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      const { paymentAmount, recipientAddress, scheduleTimes, memo } = params;

      this.validateScheduleTimes(scheduleTimes);

      const scheduleTimesBN = scheduleTimes.map((time) => new anchor.BN(time));
      const paymentAmountBN = new anchor.BN(paymentAmount);

      this.logger("Creating SOL payment schedule with params:", {
        paymentAmount: paymentAmountBN.toString(),
        recipient: recipientAddress.toString(),
        scheduleTimes: scheduleTimesBN.map((t) => t.toString()),
        memo,
      });

      const txSignature = await this.program.methods
        .createPaymentSchedule(
          paymentAmountBN,
          recipientAddress,
          scheduleTimesBN,
          memo
        )
        .accounts({
          paymentSchedule: paymentScheduleKeypair.publicKey,
          user: this.program.provider.publicKey,
        })
        .signers([paymentScheduleKeypair])
        .rpc({ skipPreflight: false, maxRetries: 1, commitment: "confirmed" });

      this.logger(
        "SOL payment schedule created:",
        paymentScheduleKeypair.publicKey.toString()
      );

      return {
        scheduleAddress: paymentScheduleKeypair.publicKey,
        txSignature,
      };
    } catch (error) {
      this.logger("Error creating payment schedule:", error);
      if (error instanceof AutoSolError) throw error;
      throw this.wrapTransactionError(error, "CREATE_SCHEDULE_ERROR");
    }
  }

  // ─── Create SPL payment schedule ──────────────────────────────────────

  public async createSplPaymentSchedule(
    params: CreateSplScheduleParams,
    paymentScheduleKeypair: Keypair = Keypair.generate()
  ): Promise<{ scheduleAddress: PublicKey; txSignature: string }> {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      const { paymentAmount, recipientAddress, scheduleTimes, memo, mint } =
        params;

      this.validateScheduleTimes(scheduleTimes);

      const scheduleTimesBN = scheduleTimes.map((time) => new anchor.BN(time));
      const paymentAmountBN = new anchor.BN(paymentAmount);

      // Derive user's ATA for this mint
      const userTokenAccount = await getAssociatedTokenAddress(
        mint,
        this.program.provider.publicKey
      );

      // ── Preflight: ensure user ATA exists, create if missing ──────────
      let needsAtaCreation = false;
      try {
        await getAccount(this.connection, userTokenAccount);
      } catch {
        // Account doesn't exist — we'll prepend a create-ATA instruction
        needsAtaCreation = true;
        this.logger(
          "User ATA does not exist for mint",
          mint.toString(),
          "— will create it in the same transaction"
        );
      }

      // Derive PDAs
      const [paymentVault] = this.getSplVaultPDA(
        paymentScheduleKeypair.publicKey,
        mint
      );
      const [vaultAuthority] = this.getVaultAuthorityPDA(
        paymentScheduleKeypair.publicKey
      );
      const [feeVault] = this.getSplFeeVaultPDA(mint);
      const [feeVaultAuthority] = this.getFeeVaultAuthorityPDA(mint);

      this.logger("Creating SPL payment schedule with params:", {
        paymentAmount: paymentAmountBN.toString(),
        recipient: recipientAddress.toString(),
        mint: mint.toString(),
        scheduleTimes: scheduleTimesBN.map((t) => t.toString()),
        memo,
        needsAtaCreation,
      });

      // Build the main program instruction
      const mainIx = await this.program.methods
        .createSplPaymentSchedule(
          paymentAmountBN,
          recipientAddress,
          scheduleTimesBN,
          memo
        )
        .accounts({
          paymentSchedule: paymentScheduleKeypair.publicKey,
          user: this.program.provider.publicKey,
          userTokenAccount,
          paymentVault,
          vaultAuthority,
          feeVault,
          feeVaultAuthority,
          mint,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        } as any)
        .instruction();

      // Assemble transaction: optionally prepend ATA creation
      const tx = new anchor.web3.Transaction();

      if (needsAtaCreation) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            this.program.provider.publicKey, // payer
            userTokenAccount,                // ATA address
            this.program.provider.publicKey, // owner
            mint,                            // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      tx.add(mainIx);

      // Send transaction
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = this.program.provider.publicKey;
      tx.sign(paymentScheduleKeypair);

      const txSignature = await this.program.provider.sendAndConfirm!(tx, [paymentScheduleKeypair], {
        skipPreflight: false,
        maxRetries: 1,
        commitment: "confirmed",
      });

      this.logger(
        "SPL payment schedule created:",
        paymentScheduleKeypair.publicKey.toString()
      );

      return {
        scheduleAddress: paymentScheduleKeypair.publicKey,
        txSignature,
      };
    } catch (error) {
      this.logger("Error creating SPL payment schedule:", error);
      if (error instanceof AutoSolError) throw error;
      throw this.wrapTransactionError(error, "CREATE_SPL_SCHEDULE_ERROR");
    }
  }

  // ─── Cancel SOL payment schedule ──────────────────────────────────────

  public async cancelPaymentSchedule(
    scheduleAddress: PublicKey
  ): Promise<string> {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      const scheduleData = await this.getPaymentSchedule(scheduleAddress);
      if (!scheduleData.owner.equals(this.program.provider.publicKey)) {
        throw new AutoSolError(
          "You are not the owner of this payment schedule",
          "UNAUTHORIZED_CANCELLATION"
        );
      }

      if (scheduleData.status !== ScheduleStatus.Active) {
        throw new AutoSolError(
          "Payment schedule is not active",
          "INVALID_SCHEDULE_STATUS"
        );
      }

      this.logger("Cancelling SOL payment schedule:", scheduleAddress.toString());

      const txSignature = await this.program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: scheduleAddress,
          owner: this.program.provider.publicKey,
        })
        .rpc();

      this.logger("SOL payment schedule cancelled:", txSignature);
      return txSignature;
    } catch (error) {
      this.logger("Error cancelling payment schedule:", error);
      if (error instanceof AutoSolError) throw error;
      throw new AutoSolError(
        "Failed to cancel payment schedule",
        "CANCEL_SCHEDULE_ERROR",
        error as Error
      );
    }
  }

  // ─── Cancel SPL payment schedule ──────────────────────────────────────

  public async cancelSplPaymentSchedule(
    scheduleAddress: PublicKey
  ): Promise<string> {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      const scheduleData = await this.getPaymentSchedule(scheduleAddress);
      if (!scheduleData.owner.equals(this.program.provider.publicKey)) {
        throw new AutoSolError(
          "You are not the owner of this payment schedule",
          "UNAUTHORIZED_CANCELLATION"
        );
      }

      if (scheduleData.status !== ScheduleStatus.Active) {
        throw new AutoSolError(
          "Payment schedule is not active",
          "INVALID_SCHEDULE_STATUS"
        );
      }

      const mint = scheduleData.mint;

      // Owner's ATA to receive refund
      const ownerTokenAccount = await getAssociatedTokenAddress(
        mint,
        this.program.provider.publicKey
      );

      const [paymentVault] = this.getSplVaultPDA(scheduleAddress, mint);
      const [vaultAuthority] = this.getVaultAuthorityPDA(scheduleAddress);

      this.logger(
        "Cancelling SPL payment schedule:",
        scheduleAddress.toString()
      );

      const txSignature = await this.program.methods
        .cancelSplPaymentSchedule()
        .accounts({
          paymentSchedule: scheduleAddress,
          owner: this.program.provider.publicKey,
          ownerTokenAccount,
          paymentVault,
          vaultAuthority,
          mint,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

      this.logger("SPL payment schedule cancelled:", txSignature);
      return txSignature;
    } catch (error) {
      this.logger("Error cancelling SPL payment schedule:", error);
      if (error instanceof AutoSolError) throw error;
      throw new AutoSolError(
        "Failed to cancel SPL payment schedule",
        "CANCEL_SPL_SCHEDULE_ERROR",
        error as Error
      );
    }
  }

  // ─── Smart cancel (auto-detects SOL vs SPL) ──────────────────────────

  public async cancelSchedule(scheduleAddress: PublicKey): Promise<string> {
    const scheduleData = await this.getPaymentSchedule(scheduleAddress);
    if (scheduleData.paymentType === PaymentType.SplToken) {
      return this.cancelSplPaymentSchedule(scheduleAddress);
    }
    return this.cancelPaymentSchedule(scheduleAddress);
  }

  // ─── Query schedules ─────────────────────────────────────────────────

  public async getSchedulesForOwner(
    ownerAddress: PublicKey
  ): Promise<ScheduleWithAddress[]> {
    try {
      const schedules = await this.program.account.paymentSchedule.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: ownerAddress.toBase58(),
          },
        },
      ]);

      return schedules.map((schedule) => ({
        address: schedule.publicKey,
        data: this.mapScheduleData(schedule.account),
      }));
    } catch (error) {
      this.logger("Error fetching schedules for owner:", error);
      throw new AutoSolError(
        "Failed to fetch payment schedules",
        "SCHEDULES_FETCH_ERROR",
        error as Error
      );
    }
  }

  public async getSchedulesForRecipient(
    recipientAddress: PublicKey
  ): Promise<ScheduleWithAddress[]> {
    try {
      let schedules;

      try {
        schedules = await this.program.account.paymentSchedule.all([
          {
            memcmp: {
              offset: 8 + 32 + 8 + 8 + 8,
              bytes: recipientAddress.toBase58(),
            },
          },
        ]);
      } catch (memcmpError) {
        this.logger(
          "Recipient memcmp lookup failed, falling back to full scan:",
          memcmpError
        );

        const allSchedules = await this.program.account.paymentSchedule.all();
        schedules = allSchedules.filter((schedule) =>
          schedule.account.recipient.equals(recipientAddress)
        );
      }

      return schedules.map((schedule) => ({
        address: schedule.publicKey,
        data: this.mapScheduleData(schedule.account),
      }));
    } catch (error) {
      this.logger("Error fetching schedules for recipient:", error);
      throw new AutoSolError(
        "Failed to fetch incoming payment schedules",
        "INCOMING_SCHEDULES_FETCH_ERROR",
        error as Error
      );
    }
  }

  public async getActiveSchedules(): Promise<ScheduleWithAddress[]> {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      const allSchedules = await this.getSchedulesForOwner(
        this.program.provider.publicKey
      );
      return allSchedules.filter(
        (schedule) => schedule.data.status === ScheduleStatus.Active
      );
    } catch (error) {
      this.logger("Error fetching active schedules:", error);
      throw new AutoSolError(
        "Failed to fetch active payment schedules",
        "FETCH_ACTIVE_SCHEDULES_ERROR",
        error as Error
      );
    }
  }

  // ─── Stats ────────────────────────────────────────────────────────────

  public async getScheduleStats(): Promise<{
    totalSchedules: number;
    activeSchedules: number;
    completedSchedules: number;
    cancelledSchedules: number;
    totalAmountScheduled: number;
    totalAmountRemaining: number;
  }> {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      const allSchedules = await this.getSchedulesForOwner(
        this.program.provider.publicKey
      );

      const stats = {
        totalSchedules: allSchedules.length,
        activeSchedules: 0,
        completedSchedules: 0,
        cancelledSchedules: 0,
        totalAmountScheduled: 0,
        totalAmountRemaining: 0,
      };

      for (const schedule of allSchedules) {
        switch (schedule.data.status) {
          case ScheduleStatus.Active:
            stats.activeSchedules++;
            break;
          case ScheduleStatus.Completed:
            stats.completedSchedules++;
            break;
          case ScheduleStatus.Cancelled:
            stats.cancelledSchedules++;
            break;
        }

        stats.totalAmountScheduled += schedule.data.totalAmount.toNumber();
        stats.totalAmountRemaining += schedule.data.remainingAmount.toNumber();
      }

      return stats;
    } catch (error) {
      this.logger("Error calculating schedule stats:", error);
      throw new AutoSolError(
        "Failed to calculate schedule statistics",
        "STATS_CALCULATION_ERROR",
        error as Error
      );
    }
  }

  // ─── Balance check ────────────────────────────────────────────────────

  public async checkSufficientBalance(
    paymentAmount: number,
    scheduleCount: number
  ): Promise<{
    hasEnoughBalance: boolean;
    currentBalance: number;
    requiredBalance: number;
  }> {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      const currentBalance = await this.connection.getBalance(
        this.program.provider.publicKey
      );
      const { totalCost } = await this.calculateTotalCost(
        paymentAmount,
        scheduleCount
      );

      // Add extra for transaction fees and rent
      const requiredBalance = totalCost + 100000; // 0.1 SOL buffer

      return {
        hasEnoughBalance: currentBalance >= requiredBalance,
        currentBalance,
        requiredBalance,
      };
    } catch (error) {
      this.logger("Error checking balance:", error);
      throw new AutoSolError(
        "Failed to check wallet balance",
        "BALANCE_CHECK_ERROR",
        error as Error
      );
    }
  }

  // ─── Accessors ────────────────────────────────────────────────────────

  public getWalletAddress(): PublicKey | null {
    return this.program.provider.publicKey ?? null;
  }

  public getProgramId(): PublicKey {
    return this.programId;
  }

  public getConnection(): Connection {
    return this.connection;
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  private validateScheduleTimes(scheduleTimes: number[]): void {
    if (scheduleTimes.length === 0) {
      throw new AutoSolError(
        "Schedule times cannot be empty",
        "EMPTY_SCHEDULE"
      );
    }

    if (scheduleTimes.length > 10) {
      throw new AutoSolError(
        "Too many schedule times provided (max 10)",
        "TOO_MANY_SCHEDULE_TIMES"
      );
    }

    const currentTime = Math.floor(Date.now() / 1000);
    for (const time of scheduleTimes) {
      if (time <= currentTime) {
        throw new AutoSolError(
          "All schedule times must be in the future",
          "INVALID_SCHEDULE_TIME"
        );
      }
    }
  }

  private wrapTransactionError(error: unknown, defaultCode: string): AutoSolError {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (
      errMsg.toLowerCase().includes("already been processed") ||
      errMsg.toLowerCase().includes("blockhash not found") ||
      errMsg.toLowerCase().includes("transaction simulation failed")
    ) {
      return new AutoSolError(
        "This transaction was already submitted. Please check your Payments page — your schedule may have been created successfully.",
        "DUPLICATE_TRANSACTION",
        error as Error
      );
    }

    return new AutoSolError(
      "Failed to create payment schedule",
      defaultCode,
      error as Error
    );
  }
}
