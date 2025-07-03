import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// Payment struct from IDL
export interface Payment {
  scheduledTime: BN;
  executed: boolean;
  executionTime: BN;
  txSignature: PublicKey | null;
}

// ScheduleStatus enum from IDL
export type ScheduleStatus =
  | { active: {} }
  | { completed: {} }
  | { cancelled: {} };

// PaymentSchedule struct from IDL
export interface PaymentScheduleData {
  owner: PublicKey;
  totalAmount: BN;
  remainingAmount: BN;
  paymentAmount: BN;
  recipient: PublicKey;
  payments: Payment[];
  createdAt: BN;
  status: ScheduleStatus;
  memo: string;
}

// FeeSettings struct from IDL
export interface FeeSettingsData {
  authority: PublicKey;
  feePercentage: number;
  httpBackendWallet: PublicKey;
  feeWithdrawalAllowedKeys: PublicKey[];
  initialized: boolean;
}

// Event types from IDL
export interface FeePercentageUpdatedEvent {
  oldPercentage: number;
  newPercentage: number;
  updatedAt: BN;
}

export interface FeesWithdrawnEvent {
  amount: BN;
  withdrawnBy: PublicKey;
  withdrawnAt: BN;
}

export interface PaymentExecutedEvent {
  scheduleId: PublicKey;
  paymentIndex: BN;
  amount: BN;
  recipient: PublicKey;
  executedAt: BN;
  executedBy: PublicKey;
}

export interface PaymentScheduleCancelledEvent {
  scheduleId: PublicKey;
  owner: PublicKey;
  refundAmount: BN;
  cancelledAt: BN;
}

export interface PaymentScheduleCreatedEvent {
  scheduleId: PublicKey;
  owner: PublicKey;
  recipient: PublicKey;
  totalAmount: BN;
  paymentAmount: BN;
  paymentCount: BN;
  createdAt: BN;
}
