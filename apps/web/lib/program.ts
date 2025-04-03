import { idl } from "@/program/idl";
import { AutoSol } from "@/program/types";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Connection,
  TransactionInstruction,
  Transaction,
  Keypair,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

export const PROGRAM_ID = new PublicKey(
  "6W2YxRyMJoDEWWRsTmh8KdkAuz4AahY2WLMXh3ZEigBf"
);

export class AutoSolError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "ApologyError";
  }
}

export class AutoSolProgram {
  private program: Program<AutoSol>;
  private connection: Connection;

  // eslint-disable-next-line
  private logger: (message: string, ...args: any[]) => void;

  constructor(
    provider: anchor.AnchorProvider,
    debug: boolean = false,
    // eslint-disable-next-line
    customLogger?: (message: string, ...args: any[]) => void
  ) {
    if (!provider.publicKey) {
      throw new AutoSolError(
        "Provider wallet not connected",
        "WALLET_NOT_CONNECTED"
      );
    }

    this.program = new Program(idl as unknown as AutoSol, PROGRAM_ID, provider);
    this.connection = provider.connection;
    this.logger = customLogger || (debug ? console.log : () => {});
  }

  /**
   * Get the fee vault account data
   */
  public getFeeVault = async (feeVaultAddress: PublicKey): Promise<any> => {
    try {
      return await this.program.account.feeVault.fetch(feeVaultAddress);
    } catch (error) {
      this.logger("Error fetching fee vault:", error);
      throw new AutoSolError(
        "Failed to fetch fee vault data",
        "FEE_VAULT_FETCH_ERROR"
      );
    }
  };

  /**
   * Get a payment schedule account data
   */
  public getPaymentSchedule = async (
    scheduleAddress: PublicKey
  ): Promise<any> => {
    try {
      return await this.program.account.paymentSchedule.fetch(scheduleAddress);
    } catch (error) {
      this.logger("Error fetching payment schedule:", error);
      throw new AutoSolError(
        "Failed to fetch payment schedule data",
        "PAYMENT_SCHEDULE_FETCH_ERROR"
      );
    }
  };

  /**
   * Calculate PDAs for a payment schedule
   */
  private calculateSchedulePDAs = async (scheduleAddress: PublicKey) => {
    // Calculate PDA for payment vault authority
    const [paymentVaultAuthority, paymentVaultAuthorityBump] =
      await PublicKey.findProgramAddressSync(
        [scheduleAddress.toBuffer()],
        PROGRAM_ID
      );

    // Calculate PDA for payment vault
    const [paymentVault] = await PublicKey.findProgramAddressSync(
      [scheduleAddress.toBuffer(), Buffer.from("vault")],
      PROGRAM_ID
    );

    return {
      paymentVaultAuthority,
      paymentVaultAuthorityBump,
      paymentVault,
    };
  };

  /**
   * Create a new payment schedule
   *
   * @param feeVaultAddress The address of the fee vault
   * @param paymentAmount The amount to pay in each scheduled payment
   * @param recipientAddress The recipient's public key
   * @param scheduleTimes Array of Unix timestamps when payments should execute
   * @param memo Optional description of the payment schedule
   * @param mintAddress The SPL token mint address
   * @param feeVaultTokenAccount The token account to receive fees
   */
  public createPaymentSchedule = async (
    feeVaultAddress: PublicKey,
    paymentAmount: number | bigint,
    recipientAddress: PublicKey,
    scheduleTimes: number[],
    memo: string,
    mintAddress: PublicKey,
    feeVaultTokenAccount: PublicKey
  ): Promise<{ scheduleAddress: PublicKey; txSignature: string }> => {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      // Validate inputs
      if (scheduleTimes.length === 0) {
        throw new AutoSolError(
          "Schedule times cannot be empty",
          "EMPTY_SCHEDULE"
        );
      }

      // Create a new keypair for the payment schedule account
      const paymentScheduleKeypair = Keypair.generate();
      const paymentScheduleAddress = paymentScheduleKeypair.publicKey;

      // Calculate PDAs
      const { paymentVaultAuthority, paymentVault } =
        await this.calculateSchedulePDAs(paymentScheduleAddress);

      // Get user's associated token account
      const userTokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        this.program.provider.publicKey
      );

      // Check if user's token account exists
      let userTokenAccountInfo;
      try {
        userTokenAccountInfo = await getAccount(
          this.connection,
          userTokenAccount
        );
      } catch (e) {
        throw new AutoSolError(
          "User token account does not exist",
          "TOKEN_ACCOUNT_NOT_FOUND"
        );
      }

      // Convert scheduleTimes to BN array
      const scheduleTimesBN = scheduleTimes.map((time) => new anchor.BN(time));

      // Create the payment schedule
      const txSignature = await this.program.methods
        .createPaymentSchedule(
          new anchor.BN(paymentAmount.toString()),
          recipientAddress,
          scheduleTimesBN,
          memo
        )
        .accounts({
          paymentSchedule: paymentScheduleAddress,
          user: this.program.provider.publicKey,
          userTokenAccount: userTokenAccount,
          mint: mintAddress,
          paymentVault: paymentVault,
          paymentVaultAuthority: paymentVaultAuthority,
          feeVault: feeVaultAddress,
          feeVaultTokenAccount: feeVaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([paymentScheduleKeypair])
        .rpc();

      this.logger(
        "Payment schedule created:",
        paymentScheduleAddress.toString()
      );

      return {
        scheduleAddress: paymentScheduleAddress,
        txSignature,
      };
    } catch (error) {
      this.logger("Error creating payment schedule:", error);
      if (error instanceof AutoSolError) {
        throw error;
      }
      throw new AutoSolError(
        "Failed to create payment schedule",
        "CREATE_SCHEDULE_ERROR"
      );
    }
  };

  /**
   * Execute a payment from a schedule
   *
   * @param scheduleAddress The payment schedule account address
   * @param paymentIndex The index of the payment to execute
   * @param recipientTokenAccount The recipient's token account
   */
  public executePayment = async (
    scheduleAddress: PublicKey,
    paymentIndex: number,
    recipientTokenAccount: PublicKey
  ): Promise<string> => {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      // Get the payment schedule data
      const paymentSchedule = await this.getPaymentSchedule(scheduleAddress);

      // Check if payment index is valid
      if (paymentIndex >= paymentSchedule.payments.length) {
        throw new AutoSolError(
          "Invalid payment index",
          "INVALID_PAYMENT_INDEX"
        );
      }

      // Check if payment is already executed
      if (paymentSchedule.payments[paymentIndex].executed) {
        throw new AutoSolError(
          "Payment already executed",
          "PAYMENT_ALREADY_EXECUTED"
        );
      }

      // Calculate PDAs
      const { paymentVaultAuthority, paymentVault } =
        await this.calculateSchedulePDAs(scheduleAddress);

      // Execute the payment
      const txSignature = await this.program.methods
        .executePayment(new anchor.BN(paymentIndex))
        .accounts({
          paymentSchedule: scheduleAddress,
          paymentVault: paymentVault,
          paymentVaultAuthority: paymentVaultAuthority,
          recipientTokenAccount: recipientTokenAccount,
          keeper: this.program.provider.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      this.logger("Payment executed:", txSignature);
      return txSignature;
    } catch (error) {
      this.logger("Error executing payment:", error);
      if (error instanceof AutoSolError) {
        throw error;
      }
      throw new AutoSolError(
        "Failed to execute payment",
        "EXECUTE_PAYMENT_ERROR"
      );
    }
  };

  /**
   * Cancel a payment schedule and refund remaining tokens
   *
   * @param scheduleAddress The payment schedule account address
   * @param ownerTokenAccount The owner's token account to receive the refund
   */
  public cancelPaymentSchedule = async (
    scheduleAddress: PublicKey,
    ownerTokenAccount: PublicKey
  ): Promise<string> => {
    try {
      if (!this.program.provider.publicKey) {
        throw new AutoSolError("Wallet not connected", "WALLET_NOT_CONNECTED");
      }

      // Get the payment schedule data
      const paymentSchedule = await this.getPaymentSchedule(scheduleAddress);

      // Check if the caller is the owner
      if (!paymentSchedule.owner.equals(this.program.provider.publicKey)) {
        throw new AutoSolError(
          "Only the owner can cancel a payment schedule",
          "NOT_AUTHORIZED"
        );
      }

      // Calculate PDAs
      const { paymentVaultAuthority, paymentVault } =
        await this.calculateSchedulePDAs(scheduleAddress);

      // Cancel the payment schedule
      const txSignature = await this.program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: scheduleAddress,
          owner: this.program.provider.publicKey,
          paymentVault: paymentVault,
          paymentVaultAuthority: paymentVaultAuthority,
          ownerTokenAccount: ownerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
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
        "CANCEL_SCHEDULE_ERROR"
      );
    }
  };

  /**
   * Helper function to check if a payment is due and can be executed
   *
   * @param scheduleAddress The payment schedule address
   * @param paymentIndex The index of the payment to check
   */
  public isPaymentExecutable = async (
    scheduleAddress: PublicKey,
    paymentIndex: number
  ): Promise<{
    executable: boolean;
    reason?: string;
    dueTime?: number;
    currentTime?: number;
  }> => {
    try {
      const paymentSchedule = await this.getPaymentSchedule(scheduleAddress);

      // Check if schedule is active
      if (paymentSchedule.status.active === undefined) {
        return {
          executable: false,
          reason: "Payment schedule is not active",
        };
      }

      // Check if payment index is valid
      if (paymentIndex >= paymentSchedule.payments.length) {
        return {
          executable: false,
          reason: "Invalid payment index",
        };
      }

      const payment = paymentSchedule.payments[paymentIndex];

      // Check if payment is already executed
      if (payment.executed) {
        return {
          executable: false,
          reason: "Payment already executed",
        };
      }

      // Get current time
      const slot = await this.connection.getSlot();
      const currentTime = await this.connection.getBlockTime(slot);

      if (!currentTime) {
        return {
          executable: false,
          reason: "Could not get current time",
        };
      }

      // Check if payment is due
      const scheduledTime = payment.scheduledTime.toNumber();
      if (currentTime < scheduledTime) {
        return {
          executable: false,
          reason: "Payment not due yet",
          dueTime: scheduledTime,
          currentTime,
        };
      }

      // Check if there are sufficient funds in the vault
      if (paymentSchedule.remainingAmount.lt(paymentSchedule.paymentAmount)) {
        return {
          executable: false,
          reason: "Insufficient funds in payment vault",
        };
      }

      return {
        executable: true,
        dueTime: scheduledTime,
        currentTime,
      };
    } catch (error) {
      this.logger("Error checking payment executable status:", error);
      return {
        executable: false,
        reason: "Error checking payment status",
      };
    }
  };

  /**
   * Start auto-payment for a schedule by executing all due payments
   *
   * @param scheduleAddress The payment schedule address
   * @param recipientTokenAccount The recipient's token account
   */
  public startAutoPay = async (
    scheduleAddress: PublicKey,
    recipientTokenAccount: PublicKey
  ): Promise<{
    executedPayments: number[];
    pendingPayments: number[];
    txSignatures: string[];
  }> => {
    try {
      // Get payment schedule
      const paymentSchedule = await this.getPaymentSchedule(scheduleAddress);

      const executedPayments: number[] = [];
      const pendingPayments: number[] = [];
      const txSignatures: string[] = [];

      // Check each payment in the schedule
      for (let i = 0; i < paymentSchedule.payments.length; i++) {
        const status = await this.isPaymentExecutable(scheduleAddress, i);

        if (status.executable) {
          try {
            const txSig = await this.executePayment(
              scheduleAddress,
              i,
              recipientTokenAccount
            );
            executedPayments.push(i);
            txSignatures.push(txSig);
          } catch (error) {
            this.logger(`Failed to execute payment ${i}:`, error);
            pendingPayments.push(i);
          }
        } else if (status.reason === "Payment not due yet") {
          pendingPayments.push(i);
        }
      }

      return {
        executedPayments,
        pendingPayments,
        txSignatures,
      };
    } catch (error) {
      this.logger("Error in auto-pay:", error);
      if (error instanceof AutoSolError) {
        throw error;
      }
      throw new AutoSolError("Failed to execute auto-pay", "AUTO_PAY_ERROR");
    }
  };

  /**
   * Get all active payment schedules for a given owner
   *
   * @param ownerAddress The owner's public key (defaults to connected wallet)
   */
  public getSchedulesForOwner = async (
    ownerAddress?: PublicKey
  ): Promise<PublicKey[]> => {
    try {
      const owner = ownerAddress || this.program.provider.publicKey;

      if (!owner) {
        throw new AutoSolError("No owner specified", "INVALID_OWNER");
      }

      // Query program accounts filtered by owner
      const schedules = await this.program.account.paymentSchedule.all([
        {
          memcmp: {
            offset: 8, // Position of owner field in the account data
            bytes: owner.toBase58(),
          },
        },
      ]);

      return schedules.map((schedule) => schedule.publicKey);
    } catch (error) {
      this.logger("Error fetching owner schedules:", error);
      if (error instanceof AutoSolError) {
        throw error;
      }
      throw new AutoSolError(
        "Failed to fetch payment schedules",
        "FETCH_SCHEDULES_ERROR"
      );
    }
  };
}
