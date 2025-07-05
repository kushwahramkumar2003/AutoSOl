import { idl } from "@/program/idl";
import { AutoSol } from "@/program/types";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";

// Constants - Update these with your actual deployed addresses
const GLOBAL_FEE_SETTINGS_SEED = "global_fee_settings";
const GLOBAL_FEE_VAULT_SEED = "global_fee_vault";
const SOL_VAULT_SEED = "sol_vault";

// Types for better type safety
export interface PaymentScheduleData {
  owner: PublicKey;
  totalAmount: anchor.BN;
  remainingAmount: anchor.BN;
  paymentAmount: anchor.BN;
  recipient: PublicKey;
  payments: Payment[];
  createdAt: anchor.BN;
  status: ScheduleStatus;
  memo: string;
}

export interface Payment {
  scheduledTime: anchor.BN;
  executed: boolean;
  executionTime: anchor.BN;
  txSignature: PublicKey | null;
}

export interface FeeSettingsData {
  authority: PublicKey;
  feePercentage: number;
  httpBackendWallet: PublicKey;
  feeWithdrawalAllowedKeys: PublicKey[];
  initialized: boolean;
}

export enum ScheduleStatus {
  Active = "Active",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export interface CreateScheduleParams {
  paymentAmount: number; // in lamports
  recipientAddress: PublicKey;
  scheduleTimes: number[]; // Unix timestamps
  memo: string;
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
    this.logger = customLogger || (debug ? console.log : () => {});
  }

  /**
   * Get the Program Derived Address (PDA) for fee settings
   */
  private getFeeSettingsPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_FEE_SETTINGS_SEED)],
      this.programId
    );
  }

  /**
   * Get the Program Derived Address (PDA) for fee vault
   */
  private getFeeVaultPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_FEE_VAULT_SEED)],
      this.programId
    );
  }

  /**
   * Get the Program Derived Address (PDA) for SOL payment vault
   */
  private getPaymentVaultPDA(scheduleAddress: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(SOL_VAULT_SEED), scheduleAddress.toBuffer()],
      this.programId
    );
  }

  /**
   * Get the fee settings account data
   */
  public async getFeeSettings(): Promise<FeeSettingsData> {
    try {
      const [feeSettingsAddress] = this.getFeeSettingsPDA();
      const feeSettings =
        await this.program.account.feeSettings.fetch(feeSettingsAddress);

      return {
        authority: feeSettings.authority,
        feePercentage: feeSettings.feePercentage,
        httpBackendWallet: feeSettings.httpBackendWallet,
        feeWithdrawalAllowedKeys: feeSettings.feeWithdrawalAllowedKeys,
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

  /**
   * Get a payment schedule account data
   */
  public async getPaymentSchedule(
    scheduleAddress: PublicKey
  ): Promise<PaymentScheduleData> {
    try {
      const schedule =
        await this.program.account.paymentSchedule.fetch(scheduleAddress);

      return {
        owner: schedule.owner,
        totalAmount: schedule.totalAmount,
        remainingAmount: schedule.remainingAmount,
        paymentAmount: schedule.paymentAmount,
        recipient: schedule.recipient,
        payments: schedule.payments.map(
          (payment: {
            scheduledTime: anchor.BN;
            executed: boolean;
            executionTime: anchor.BN;
            txSignature: PublicKey | null;
          }) => ({
            scheduledTime: payment.scheduledTime,
            executed: payment.executed,
            executionTime: payment.executionTime,
            txSignature: payment.txSignature,
          })
        ),
        createdAt: schedule.createdAt,
        status: this.mapScheduleStatus(schedule.status),
        memo: schedule.memo,
      };
    } catch (error) {
      this.logger("Error fetching payment schedule:", error);
      throw new AutoSolError(
        "Failed to fetch payment schedule data",
        "PAYMENT_SCHEDULE_FETCH_ERROR",
        error as Error
      );
    }
  }

  /**
   * Map schedule status from program to TypeScript enum
   */
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

  /**
   * Calculate the total cost including fees for a payment schedule
   */
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

      return {
        totalAmount,
        feeAmount,
        totalCost,
      };
    } catch (error) {
      this.logger("Error calculating total cost:", error);
      throw new AutoSolError(
        "Failed to calculate total cost",
        "COST_CALCULATION_ERROR",
        error as Error
      );
    }
  }

  /**
   * Create a new payment schedule for SOL payments
   */
  public async createPaymentSchedule(
    params: CreateScheduleParams,
    paymentScheduleKeypair: Keypair = Keypair.generate()
  ): Promise<{ scheduleAddress: PublicKey; txSignature: string }> {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      const { paymentAmount, recipientAddress, scheduleTimes, memo } = params;

      // Validation
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

      // Validate that all scheduled times are in the future
      const currentTime = Math.floor(Date.now() / 1000);
      for (const time of scheduleTimes) {
        if (time <= currentTime) {
          throw new AutoSolError(
            "All schedule times must be in the future",
            "INVALID_SCHEDULE_TIME"
          );
        }
      }

      // Convert schedule times to BN
      const scheduleTimesBN = scheduleTimes.map((time) => new anchor.BN(time));
      const paymentAmountBN = new anchor.BN(paymentAmount);

      this.logger("Creating payment schedule with params:", {
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
        .rpc();

      this.logger(
        "Payment schedule created:",
        paymentScheduleKeypair.publicKey.toString()
      );

      return {
        scheduleAddress: paymentScheduleKeypair.publicKey,
        txSignature,
      };
    } catch (error) {
      this.logger("Error creating payment schedule:", error);
      if (error instanceof AutoSolError) {
        throw error;
      }
      throw new AutoSolError(
        "Failed to create payment schedule",
        "CREATE_SCHEDULE_ERROR",
        error as Error
      );
    }
  }

  /**
   * Cancel a payment schedule and refund remaining SOL
   */
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

      this.logger("Cancelling payment schedule:", scheduleAddress.toString());

      const txSignature = await this.program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: scheduleAddress,
          owner: this.program.provider.publicKey,
        })
        .rpc();

      this.logger("Payment schedule cancelled:", txSignature);
      return txSignature;
    } catch (error) {
      this.logger("Error cancelling payment schedule:", error);
      if (error instanceof AutoSolError) {
        throw error;
      }
      throw new AutoSolError(
        "Failed to cancel payment schedule",
        "CANCEL_SCHEDULE_ERROR",
        error as Error
      );
    }
  }

  /**
   * Get all payment schedules for a given owner
   */
  public async getSchedulesForOwner(
    ownerAddress?: PublicKey
  ): Promise<ScheduleWithAddress[]> {
    try {
      const owner = ownerAddress || this.program.provider.publicKey;

      if (!owner) {
        throw new AutoSolError("No owner specified", "INVALID_OWNER");
      }

      this.logger("Fetching schedules for owner:", owner.toString());

      const schedules = await this.program.account.paymentSchedule.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: owner.toBase58(),
          },
        },
      ]);

      console.log("schedules", schedules);

      const schedulesWithData: ScheduleWithAddress[] = schedules.map(
        (schedule) => ({
          address: schedule.publicKey,
          data: {
            owner: schedule.account.owner,
            totalAmount: schedule.account.totalAmount,
            remainingAmount: schedule.account.remainingAmount,
            paymentAmount: schedule.account.paymentAmount,
            recipient: schedule.account.recipient,
            payments: schedule.account.payments.map(
              (payment: {
                scheduledTime: anchor.BN;
                executed: boolean;
                executionTime: anchor.BN;
                txSignature: PublicKey | null;
              }) => ({
                scheduledTime: payment.scheduledTime,
                executed: payment.executed,
                executionTime: payment.executionTime,
                txSignature: payment.txSignature,
              })
            ),
            createdAt: schedule.account.createdAt,
            status: this.mapScheduleStatus(schedule.account.status),
            memo: schedule.account.memo,
          },
        })
      );
      console.log(schedulesWithData);
      this.logger(`Found ${schedulesWithData.length} schedules for owner`);
      return schedulesWithData;
    } catch (error) {
      this.logger("Error fetching owner schedules:", error);
      if (error instanceof AutoSolError) {
        throw error;
      }
      throw new AutoSolError(
        "Failed to fetch payment schedules",
        "FETCH_SCHEDULES_ERROR",
        error as Error
      );
    }
  }

  /**
   * Get all payment schedules where the given address is the recipient (incoming transactions)
   */
  public async getSchedulesForRecipient(
    recipientAddress?: PublicKey
  ): Promise<ScheduleWithAddress[]> {
    try {
      const recipient = recipientAddress || this.program.provider.publicKey;

      if (!recipient) {
        throw new AutoSolError("No recipient specified", "INVALID_RECIPIENT");
      }

      this.logger("Fetching schedules for recipient:", recipient.toString());

      const schedules = await this.program.account.paymentSchedule.all([
        {
          memcmp: {
            offset: 8 + 32 + 8 + 8 + 8, // Skip discriminator + owner + totalAmount + remainingAmount + paymentAmount
            bytes: recipient.toBase58(),
          },
        },
      ]);

      console.log("incoming schedules", schedules);

      const schedulesWithData: ScheduleWithAddress[] = schedules.map(
        (schedule) => ({
          address: schedule.publicKey,
          data: {
            owner: schedule.account.owner,
            totalAmount: schedule.account.totalAmount,
            remainingAmount: schedule.account.remainingAmount,
            paymentAmount: schedule.account.paymentAmount,
            recipient: schedule.account.recipient,
            payments: schedule.account.payments.map(
              (payment: {
                scheduledTime: anchor.BN;
                executed: boolean;
                executionTime: anchor.BN;
                txSignature: PublicKey | null;
              }) => ({
                scheduledTime: payment.scheduledTime,
                executed: payment.executed,
                executionTime: payment.executionTime,
                txSignature: payment.txSignature,
              })
            ),
            createdAt: schedule.account.createdAt,
            status: this.mapScheduleStatus(schedule.account.status),
            memo: schedule.account.memo,
          },
        })
      );
      console.log("incoming schedulesWithData", schedulesWithData);
      this.logger(
        `Found ${schedulesWithData.length} incoming schedules for recipient`
      );
      return schedulesWithData;
    } catch (error) {
      this.logger("Error fetching recipient schedules:", error);
      if (error instanceof AutoSolError) {
        throw error;
      }
      throw new AutoSolError(
        "Failed to fetch incoming payment schedules",
        "FETCH_INCOMING_SCHEDULES_ERROR",
        error as Error
      );
    }
  }

  /**
   * Get all active payment schedules for the current user
   */
  public async getActiveSchedules(): Promise<ScheduleWithAddress[]> {
    try {
      const allSchedules = await this.getSchedulesForOwner();
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

  /**
   * Get payment schedule statistics for the current user
   */
  public async getScheduleStats(): Promise<{
    totalSchedules: number;
    activeSchedules: number;
    completedSchedules: number;
    cancelledSchedules: number;
    totalAmountScheduled: number;
    totalAmountRemaining: number;
  }> {
    try {
      const allSchedules = await this.getSchedulesForOwner();

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

  /**
   * Check if a wallet has sufficient balance for a payment schedule
   */
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

  /**
   * Get the current user's wallet address
   */
  public getWalletAddress(): PublicKey | null {
    return this.program.provider.publicKey ?? null;
  }

  /**
   * Get the program ID
   */
  public getProgramId(): PublicKey {
    return this.programId;
  }

  /**
   * Get connection
   */
  public getConnection(): Connection {
    return this.connection;
  }
}
