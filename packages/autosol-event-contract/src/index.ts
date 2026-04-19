import bs58 from "bs58";
import { z } from "zod";

export const DEFAULT_REDIS_QUEUE = "solana_auto_sol_events";
export const DEFAULT_REDIS_STREAM = "solana_auto_sol_events_stream";
export const DEFAULT_REDIS_DEAD_LETTER_STREAM =
  "solana_auto_sol_events_dlq";
export const DEFAULT_REDIS_CONSUMER_GROUP = "autosol-workers";
export const DEFAULT_REDIS_STREAM_MAXLEN = 10_000;
export const DEFAULT_REDIS_DEAD_LETTER_STREAM_MAXLEN = 2_000;
export const SOL_NATIVE_MINT = "11111111111111111111111111111111";

const pubkeyArrayToString = (arr: number[]): string => {
  return bs58.encode(new Uint8Array(arr));
};

const pubkeySchema = z.union([
  z.string(),
  z.array(z.number()).transform(pubkeyArrayToString),
]);

const bigintSchema = z.union([
  z.bigint(),
  z.string().transform((value) => BigInt(value)),
  z.number().transform((value) => BigInt(value)),
]);

const intSchema = z.union([
  z.string().transform((value) => parseInt(value, 10)),
  z.number(),
]);

const timestampSchema = z.union([
  z.string().transform((value) => new Date(parseInt(value, 10) * 1000)),
  z.number().transform((value) => new Date(value * 1000)),
  z.date(),
]);

export const PaymentScheduleCreatedEventSchema = z.object({
  schedule_id: pubkeySchema,
  proposal_id: pubkeySchema,
  request_id: pubkeySchema,
  owner: pubkeySchema,
  recipient: pubkeySchema,
  mint: pubkeySchema,
  total_amount: bigintSchema,
  payment_amount: bigintSchema,
  fee_amount: bigintSchema,
  payment_count: intSchema,
  created_at: timestampSchema,
  is_sol: z.boolean(),
  is_commitment: z.boolean(),
  is_request: z.boolean(),
});

export const PaymentExecutedEventSchema = z.object({
  schedule_id: pubkeySchema,
  payment_index: intSchema,
  amount: bigintSchema,
  recipient: pubkeySchema,
  mint: pubkeySchema,
  executed_at: timestampSchema,
  executed_by: pubkeySchema,
  is_sol: z.boolean(),
});

export const PaymentScheduleCancelledEventSchema = z.object({
  schedule_id: pubkeySchema,
  owner: pubkeySchema,
  mint: pubkeySchema,
  refund_amount: bigintSchema,
  cancelled_at: timestampSchema,
  is_sol: z.boolean(),
});

export const PaymentSchedulePausedEventSchema = z.object({
  schedule_id: pubkeySchema,
  owner: pubkeySchema,
  paused_at: timestampSchema,
});

export const PaymentScheduleResumedEventSchema = z.object({
  schedule_id: pubkeySchema,
  owner: pubkeySchema,
  resumed_at: timestampSchema,
});

export const PaymentCommitmentProposedEventSchema = z.object({
  proposal_id: pubkeySchema,
  owner: pubkeySchema,
  recipient: pubkeySchema,
  mint: pubkeySchema,
  payment_amount: bigintSchema,
  payment_count: intSchema,
  schedule_times: z.array(timestampSchema),
  memo: z.string(),
  note_uri: z.string(),
  created_at: timestampSchema,
  is_sol: z.boolean(),
});

export const PaymentCommitmentAcceptedEventSchema = z.object({
  proposal_id: pubkeySchema,
  owner: pubkeySchema,
  recipient: pubkeySchema,
  accepted_at: timestampSchema,
});

export const PaymentCommitmentActivatedEventSchema = z.object({
  proposal_id: pubkeySchema,
  schedule_id: pubkeySchema,
  owner: pubkeySchema,
  recipient: pubkeySchema,
  activated_at: timestampSchema,
  is_sol: z.boolean(),
});

export const PaymentRequestProposedEventSchema = z.object({
  request_id: pubkeySchema,
  requester: pubkeySchema,
  payer: pubkeySchema,
  mint: pubkeySchema,
  payment_amount: bigintSchema,
  payment_count: intSchema,
  schedule_times: z.array(timestampSchema),
  memo: z.string(),
  note_uri: z.string(),
  created_at: timestampSchema,
  is_sol: z.boolean(),
});

export const PaymentRequestDeclinedEventSchema = z.object({
  request_id: pubkeySchema,
  requester: pubkeySchema,
  payer: pubkeySchema,
  decisioned_at: timestampSchema,
});

export const PaymentRequestRevokedEventSchema = z.object({
  request_id: pubkeySchema,
  requester: pubkeySchema,
  payer: pubkeySchema,
  decisioned_at: timestampSchema,
});

export const PaymentRequestAcceptedEventSchema = z.object({
  request_id: pubkeySchema,
  schedule_id: pubkeySchema,
  requester: pubkeySchema,
  payer: pubkeySchema,
  accepted_at: timestampSchema,
  is_sol: z.boolean(),
});

export const FeesWithdrawnEventSchema = z.object({
  amount: bigintSchema,
  mint: pubkeySchema,
  withdrawn_by: pubkeySchema,
  withdrawn_at: timestampSchema,
  is_sol: z.boolean(),
});

export const FeePercentageUpdatedEventSchema = z.object({
  old_percentage: intSchema,
  new_percentage: intSchema,
  updated_at: timestampSchema,
});

export const EventWrapperSchema = z.object({
  event_type: z.string(),
  event_data: z.record(z.unknown()),
  signature: z.string(),
  slot: z.union([
    z.bigint(),
    z.number().transform((value) => BigInt(value)),
    z.string().transform((value) => BigInt(value)),
  ]),
  timestamp: timestampSchema,
});

export type EventWrapper = z.infer<typeof EventWrapperSchema>;
export type PaymentScheduleCreatedEvent = z.infer<
  typeof PaymentScheduleCreatedEventSchema
>;
export type PaymentExecutedEvent = z.infer<typeof PaymentExecutedEventSchema>;
export type PaymentScheduleCancelledEvent = z.infer<
  typeof PaymentScheduleCancelledEventSchema
>;
export type PaymentSchedulePausedEvent = z.infer<
  typeof PaymentSchedulePausedEventSchema
>;
export type PaymentScheduleResumedEvent = z.infer<
  typeof PaymentScheduleResumedEventSchema
>;
export type PaymentCommitmentProposedEvent = z.infer<
  typeof PaymentCommitmentProposedEventSchema
>;
export type PaymentCommitmentAcceptedEvent = z.infer<
  typeof PaymentCommitmentAcceptedEventSchema
>;
export type PaymentCommitmentActivatedEvent = z.infer<
  typeof PaymentCommitmentActivatedEventSchema
>;
export type PaymentRequestProposedEvent = z.infer<
  typeof PaymentRequestProposedEventSchema
>;
export type PaymentRequestDeclinedEvent = z.infer<
  typeof PaymentRequestDeclinedEventSchema
>;
export type PaymentRequestRevokedEvent = z.infer<
  typeof PaymentRequestRevokedEventSchema
>;
export type PaymentRequestAcceptedEvent = z.infer<
  typeof PaymentRequestAcceptedEventSchema
>;
export type FeesWithdrawnEvent = z.infer<typeof FeesWithdrawnEventSchema>;
export type FeePercentageUpdatedEvent = z.infer<
  typeof FeePercentageUpdatedEventSchema
>;

export function parseEventData(event: EventWrapper) {
  switch (event.event_type) {
    case "PaymentScheduleCreatedEvent":
      return PaymentScheduleCreatedEventSchema.parse(event.event_data);
    case "PaymentExecutedEvent":
      return PaymentExecutedEventSchema.parse(event.event_data);
    case "PaymentScheduleCancelledEvent":
      return PaymentScheduleCancelledEventSchema.parse(event.event_data);
    case "PaymentSchedulePausedEvent":
      return PaymentSchedulePausedEventSchema.parse(event.event_data);
    case "PaymentScheduleResumedEvent":
      return PaymentScheduleResumedEventSchema.parse(event.event_data);
    case "PaymentCommitmentProposedEvent":
      return PaymentCommitmentProposedEventSchema.parse(event.event_data);
    case "PaymentCommitmentAcceptedEvent":
      return PaymentCommitmentAcceptedEventSchema.parse(event.event_data);
    case "PaymentCommitmentActivatedEvent":
      return PaymentCommitmentActivatedEventSchema.parse(event.event_data);
    case "PaymentRequestProposedEvent":
      return PaymentRequestProposedEventSchema.parse(event.event_data);
    case "PaymentRequestDeclinedEvent":
      return PaymentRequestDeclinedEventSchema.parse(event.event_data);
    case "PaymentRequestRevokedEvent":
      return PaymentRequestRevokedEventSchema.parse(event.event_data);
    case "PaymentRequestAcceptedEvent":
      return PaymentRequestAcceptedEventSchema.parse(event.event_data);
    case "FeesWithdrawnEvent":
      return FeesWithdrawnEventSchema.parse(event.event_data);
    case "FeePercentageUpdatedEvent":
      return FeePercentageUpdatedEventSchema.parse(event.event_data);
    default:
      throw new Error(`Unknown event type: ${event.event_type}`);
  }
}

export function buildEventKey(event: EventWrapper): string {
  switch (event.event_type) {
    case "PaymentScheduleCreatedEvent": {
      const data = PaymentScheduleCreatedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.schedule_id}`;
    }
    case "PaymentExecutedEvent": {
      const data = PaymentExecutedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.schedule_id}:${data.payment_index}`;
    }
    case "PaymentScheduleCancelledEvent": {
      const data = PaymentScheduleCancelledEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.schedule_id}`;
    }
    case "PaymentSchedulePausedEvent": {
      const data = PaymentSchedulePausedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.schedule_id}`;
    }
    case "PaymentScheduleResumedEvent": {
      const data = PaymentScheduleResumedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.schedule_id}`;
    }
    case "PaymentCommitmentProposedEvent": {
      const data = PaymentCommitmentProposedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.proposal_id}`;
    }
    case "PaymentCommitmentAcceptedEvent": {
      const data = PaymentCommitmentAcceptedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.proposal_id}`;
    }
    case "PaymentCommitmentActivatedEvent": {
      const data = PaymentCommitmentActivatedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.proposal_id}:${data.schedule_id}`;
    }
    case "PaymentRequestProposedEvent": {
      const data = PaymentRequestProposedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.request_id}`;
    }
    case "PaymentRequestDeclinedEvent": {
      const data = PaymentRequestDeclinedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.request_id}`;
    }
    case "PaymentRequestRevokedEvent": {
      const data = PaymentRequestRevokedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.request_id}`;
    }
    case "PaymentRequestAcceptedEvent": {
      const data = PaymentRequestAcceptedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.request_id}:${data.schedule_id}`;
    }
    case "FeesWithdrawnEvent": {
      const data = FeesWithdrawnEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.withdrawn_by}:${data.mint}:${data.amount.toString()}`;
    }
    case "FeePercentageUpdatedEvent": {
      const data = FeePercentageUpdatedEventSchema.parse(event.event_data);
      return `${event.event_type}:${event.signature}:${data.old_percentage}:${data.new_percentage}:${data.updated_at.toISOString()}`;
    }
    default:
      return `${event.event_type}:${event.signature}`;
  }
}

export function parseStreamPayload(rawPayload: string): EventWrapper {
  const rawEvent = JSON.parse(rawPayload);
  return EventWrapperSchema.parse(rawEvent);
}
