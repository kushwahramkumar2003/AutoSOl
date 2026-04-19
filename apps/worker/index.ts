import { Prisma, PrismaClient, getPrismaClient } from "@autosol/db";
import Redis from "ioredis";
import {
  DEFAULT_REDIS_CONSUMER_GROUP,
  DEFAULT_REDIS_DEAD_LETTER_STREAM,
  DEFAULT_REDIS_DEAD_LETTER_STREAM_MAXLEN,
  DEFAULT_REDIS_STREAM,
  DEFAULT_REDIS_STREAM_MAXLEN,
  PaymentCommitmentAcceptedEventSchema,
  PaymentCommitmentActivatedEventSchema,
  PaymentCommitmentProposedEventSchema,
  FeePercentageUpdatedEventSchema,
  FeesWithdrawnEventSchema,
  PaymentExecutedEventSchema,
  PaymentScheduleCancelledEventSchema,
  PaymentScheduleCreatedEventSchema,
  buildEventKey,
  parseStreamPayload,
} from "@autosol/event-contract";
import type { EventWrapper } from "@autosol/event-contract";

const config = {
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  redisStream: process.env.REDIS_STREAM || DEFAULT_REDIS_STREAM,
  redisDeadLetterStream:
    process.env.REDIS_DEAD_LETTER_STREAM || DEFAULT_REDIS_DEAD_LETTER_STREAM,
  redisConsumerGroup:
    process.env.REDIS_CONSUMER_GROUP || DEFAULT_REDIS_CONSUMER_GROUP,
  databaseUrl:
    process.env.DATABASE_URL || "postgresql://localhost:5432/autosol",
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || "3", 10),
  readCount: parseInt(process.env.REDIS_READ_COUNT || "10", 10),
  blockMs: parseInt(process.env.REDIS_BLOCK_MS || "10000", 10),
  claimIdleMs: parseInt(process.env.REDIS_CLAIM_IDLE_MS || "30000", 10),
  redisDeadLetterStreamMaxLen: parseInt(
    process.env.REDIS_DEAD_LETTER_STREAM_MAXLEN ||
      String(DEFAULT_REDIS_DEAD_LETTER_STREAM_MAXLEN),
    10
  ),
};

type StreamEntry = {
  id: string;
  payload: string;
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const EVENT_PRIORITY: Record<string, number> = {
  PaymentCommitmentProposedEvent: 0,
  PaymentCommitmentAcceptedEvent: 1,
  PaymentScheduleCreatedEvent: 2,
  PaymentCommitmentActivatedEvent: 3,
  PaymentExecutedEvent: 4,
  PaymentScheduleCancelledEvent: 4,
  FeesWithdrawnEvent: 5,
  FeePercentageUpdatedEvent: 6,
};

class RetryableOrderingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableOrderingError";
  }
}

class AutoSolWorkerService {
  private prisma: PrismaClient;
  private redis: Redis;
  private redisBlocking: Redis;
  private isShuttingDown = false;
  private activeJobs = new Set<Promise<void>>();

  constructor() {
    this.prisma = getPrismaClient();
    this.redis = new Redis(config.redisUrl);
    this.redisBlocking = new Redis(config.redisUrl);

    process.on("SIGINT", () => void this.shutdown());
    process.on("SIGTERM", () => void this.shutdown());
  }

  async start() {
    console.log("🚀 AutoSol Worker Service Starting...");
    console.log(`   Redis Stream: ${config.redisStream}`);
    console.log(`   Dead Letter Stream: ${config.redisDeadLetterStream}`);
    console.log(
      `   Dead Letter Stream Max Length: ${config.redisDeadLetterStreamMaxLen}`
    );
    console.log(`   Consumer Group: ${config.redisConsumerGroup}`);
    console.log(`   Worker Concurrency: ${config.workerConcurrency}`);
    console.log(`   Max Retries: ${config.maxRetries}`);

    try {
      await this.redis.ping();
      await this.redisBlocking.ping();
      console.log("✅ Redis connections established");

      await this.prisma.$connect();
      console.log("✅ Database connection established");

      await this.ensureDatabaseCompatibility();
      console.log("✅ Database schema is compatible");

      await this.ensureConsumerGroup();
      console.log("✅ Redis consumer group ready");

      const workers = Array.from({ length: config.workerConcurrency }, (_, i) =>
        this.startWorker(i + 1)
      );

      await Promise.all(workers);
    } catch (error) {
      console.error("❌ Failed to start worker service:", error);
      await this.shutdown();
    }
  }

  private async ensureConsumerGroup() {
    try {
      await this.redis.call(
        "XGROUP",
        "CREATE",
        config.redisStream,
        config.redisConsumerGroup,
        "0",
        "MKSTREAM"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("BUSYGROUP")) {
        throw error;
      }
    }
  }

  private async ensureDatabaseCompatibility() {
    const requiredColumns: Array<[tableName: string, columnName: string]> = [
      ["event_logs", "event_key"],
      ["event_logs", "stream_id"],
      ["event_logs", "last_attempt_at"],
      ["event_logs", "processed_at"],
      ["payment_schedules", "mint"],
      ["payment_schedules", "fee_amount"],
      ["payment_schedules", "is_sol"],
      ["payment_schedules", "schedule_policy"],
      ["payment_schedules", "proposal_id"],
      ["payments", "mint"],
      ["payments", "is_sol"],
      ["fee_withdrawals", "mint"],
      ["fee_withdrawals", "is_sol"],
      ["payment_commitment_proposals", "note_uri"],
      ["payment_commitment_proposals", "schedule_times"],
      ["payment_commitment_proposals", "status"],
    ];

    const missingColumns: string[] = [];

    for (const [tableName, columnName] of requiredColumns) {
      const rows = await this.prisma.$queryRaw<
        Array<{ exists: boolean }>
      >`SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = ${tableName}
            AND column_name = ${columnName}
        ) AS "exists"`;

      if (!rows[0]?.exists) {
        missingColumns.push(`${tableName}.${columnName}`);
      }
    }

    if (missingColumns.length > 0) {
      throw new Error(
        [
          "Database schema is behind the worker code.",
          `Missing columns: ${missingColumns.join(", ")}`,
          "Run the worker Prisma migration before starting the consumer:",
          "  cd packages/db",
          "  ../../node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma",
        ].join("\n")
      );
    }
  }

  private async startWorker(workerId: number): Promise<void> {
    const consumerName = `worker-${workerId}`;
    console.log(`👷 ${consumerName} started`);

    while (!this.isShuttingDown) {
      try {
        await this.reclaimPendingMessages(consumerName);
        const entries = await this.readNewMessages(consumerName);

        if (entries.length === 0) {
          continue;
        }

        for (const entry of entries) {
          const job = this.processStreamEntry(consumerName, entry);
          this.activeJobs.add(job);

          job.finally(() => {
            this.activeJobs.delete(job);
          });

          await job;
        }
      } catch (error) {
        console.error(`❌ ${consumerName} loop error:`, error);
        await sleep(1000);
      }
    }

    console.log(`👷 ${consumerName} stopped`);
  }

  private async reclaimPendingMessages(consumerName: string) {
    const result = (await this.redis.call(
      "XAUTOCLAIM",
      config.redisStream,
      config.redisConsumerGroup,
      consumerName,
      String(config.claimIdleMs),
      "0-0",
      "COUNT",
      String(config.readCount)
    )) as [string, Array<[string, string[]]>, string[]];

    const entries = this.sortStreamEntries(
      this.normalizeStreamEntries(result?.[1] || [])
    );

    for (const entry of entries) {
      await this.processStreamEntry(consumerName, entry);
    }
  }

  private async readNewMessages(consumerName: string): Promise<StreamEntry[]> {
    const result = (await this.redisBlocking.call(
      "XREADGROUP",
      "GROUP",
      config.redisConsumerGroup,
      consumerName,
      "COUNT",
      String(config.readCount),
      "BLOCK",
      String(config.blockMs),
      "STREAMS",
      config.redisStream,
      ">"
    )) as Array<[string, Array<[string, string[]]>]> | null;

    if (!result || result.length === 0) {
      return [];
    }

    return this.sortStreamEntries(
      this.normalizeStreamEntries(result[0]?.[1] || [])
    );
  }

  private normalizeStreamEntries(
    entries: Array<[string, string[]]>
  ): StreamEntry[] {
    return entries
      .map(([id, fieldList]) => {
        const fields: Record<string, string> = {};
        for (let i = 0; i < fieldList.length; i += 2) {
          const key = fieldList[i];
          const value = fieldList[i + 1];
          if (key && value) {
            fields[key] = value;
          }
        }

        if (!fields.payload) {
          return null;
        }

        return { id, payload: fields.payload };
      })
      .filter((entry): entry is StreamEntry => entry !== null);
  }

  private sortStreamEntries(entries: StreamEntry[]): StreamEntry[] {
    return [...entries].sort((left, right) => {
      const leftPriority = this.getEventPriority(left);
      const rightPriority = this.getEventPriority(right);

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.id.localeCompare(right.id);
    });
  }

  private getEventPriority(entry: StreamEntry): number {
    try {
      const event = parseStreamPayload(entry.payload);
      return EVENT_PRIORITY[event.event_type] ?? Number.MAX_SAFE_INTEGER;
    } catch {
      return Number.MAX_SAFE_INTEGER;
    }
  }

  private async processStreamEntry(
    consumerName: string,
    entry: StreamEntry
  ): Promise<void> {
    let eventLog:
      | {
        id: string;
        retryCount: number;
      }
      | null = null;

    try {
      const event = parseStreamPayload(entry.payload);
      const eventKey = buildEventKey(event);

      const existing = await this.prisma.eventLog.findUnique({
        where: { eventKey },
        select: { id: true, retryCount: true, status: true },
      });

      if (existing?.status === "PROCESSED") {
        await this.acknowledge(entry.id);
        return;
      }

      if (existing) {
        eventLog = await this.prisma.eventLog.update({
          where: { eventKey },
          data: {
            eventType: event.event_type,
            signature: event.signature,
            slot: event.slot,
            streamId: entry.id,
            status: "PROCESSING",
            error: null,
            eventData: event.event_data as Prisma.InputJsonValue,
            lastAttemptAt: new Date(),
          },
          select: { id: true, retryCount: true },
        });
      } else {
        eventLog = await this.prisma.eventLog.create({
          data: {
            eventKey,
            eventType: event.event_type,
            signature: event.signature,
            slot: event.slot,
            streamId: entry.id,
            status: "PROCESSING",
            eventData: event.event_data as Prisma.InputJsonValue,
            lastAttemptAt: new Date(),
          },
          select: { id: true, retryCount: true },
        });
      }

      if (!eventLog) {
        throw new Error(`Failed to persist event log for ${eventKey}`);
      }

      console.log(`🔄 ${consumerName} processing ${eventKey}`);
      await this.handleEventByType(event);

      await this.prisma.eventLog.update({
        where: { id: eventLog.id },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          error: null,
        },
      });

      await this.acknowledge(entry.id);
      console.log(`✅ ${consumerName} processed ${eventKey}`);
    } catch (error) {
      console.error(`❌ ${consumerName} failed to process ${entry.id}:`, error);

      if (!eventLog) {
        return;
      }

      const retryCount = eventLog.retryCount + 1;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (retryCount > config.maxRetries) {
        await this.prisma.eventLog.update({
          where: { id: eventLog.id },
          data: {
            retryCount,
            status: "DEAD_LETTER",
            error: errorMessage,
            lastAttemptAt: new Date(),
          },
        });

        await this.redis.call(
          "XADD",
          config.redisDeadLetterStream,
          "MAXLEN",
          "~",
          String(config.redisDeadLetterStreamMaxLen),
          "*",
          "payload",
          entry.payload,
          "stream_id",
          entry.id,
          "error",
          errorMessage
        );
        await this.acknowledge(entry.id);
        return;
      }

      await this.prisma.eventLog.update({
        where: { id: eventLog.id },
        data: {
          retryCount,
          status: "RETRYING",
          error: errorMessage,
          lastAttemptAt: new Date(),
        },
      });
    }
  }

  private async acknowledge(streamId: string) {
    await this.redis.call(
      "XACK",
      config.redisStream,
      config.redisConsumerGroup,
      streamId
    );
  }

  private async handleEventByType(event: EventWrapper): Promise<void> {
    switch (event.event_type) {
      case "PaymentScheduleCreatedEvent":
        await this.handlePaymentScheduleCreated(event);
        return;
      case "PaymentCommitmentProposedEvent":
        await this.handlePaymentCommitmentProposed(event);
        return;
      case "PaymentCommitmentAcceptedEvent":
        await this.handlePaymentCommitmentAccepted(event);
        return;
      case "PaymentCommitmentActivatedEvent":
        await this.handlePaymentCommitmentActivated(event);
        return;
      case "PaymentExecutedEvent":
        await this.handlePaymentExecuted(event);
        return;
      case "PaymentScheduleCancelledEvent":
        await this.handlePaymentScheduleCancelled(event);
        return;
      case "FeesWithdrawnEvent":
        await this.handleFeesWithdrawn(event);
        return;
      case "FeePercentageUpdatedEvent":
        await this.handleFeePercentageUpdated(event);
        return;
      default:
        throw new Error(`Unknown event type: ${event.event_type}`);
    }
  }

  private async handlePaymentScheduleCreated(event: EventWrapper) {
    const data = PaymentScheduleCreatedEventSchema.parse(event.event_data);

    const proposalId =
      data.proposal_id === "11111111111111111111111111111111"
        ? null
        : data.proposal_id;

    if (data.is_commitment && proposalId) {
      const proposal = await this.prisma.paymentCommitmentProposal.findUnique({
        where: { id: proposalId },
        select: { id: true },
      });

      if (!proposal) {
        throw new RetryableOrderingError(
          `Commitment proposal ${proposalId} is not indexed yet; retry after PaymentCommitmentProposedEvent is processed`
        );
      }
    }

    await this.prisma.paymentSchedule.upsert({
      where: { id: data.schedule_id },
      update: {
        owner: data.owner,
        recipient: data.recipient,
        mint: data.mint,
        totalAmount: data.total_amount,
        paymentAmount: data.payment_amount,
        feeAmount: data.fee_amount,
        paymentCount: data.payment_count,
        status: "ACTIVE",
        createdAt: data.created_at,
        isSol: data.is_sol,
        schedulePolicy: data.is_commitment ? "COMMITMENT" : "STANDARD",
        proposalId,
      },
      create: {
        id: data.schedule_id,
        owner: data.owner,
        recipient: data.recipient,
        mint: data.mint,
        totalAmount: data.total_amount,
        paymentAmount: data.payment_amount,
        feeAmount: data.fee_amount,
        paymentCount: data.payment_count,
        status: "ACTIVE",
        createdAt: data.created_at,
        isSol: data.is_sol,
        schedulePolicy: data.is_commitment ? "COMMITMENT" : "STANDARD",
        proposalId,
      },
    });
  }

  private async handlePaymentCommitmentProposed(event: EventWrapper) {
    const data = PaymentCommitmentProposedEventSchema.parse(event.event_data);

    await this.prisma.paymentCommitmentProposal.upsert({
      where: { id: data.proposal_id },
      update: {
        owner: data.owner,
        recipient: data.recipient,
        mint: data.mint,
        paymentAmount: data.payment_amount,
        paymentCount: data.payment_count,
        scheduleTimes: data.schedule_times.map((time) => time.toISOString()),
        memo: data.memo,
        noteUri: data.note_uri,
        isSol: data.is_sol,
        status: "PROPOSED",
        createdAt: data.created_at,
      },
      create: {
        id: data.proposal_id,
        owner: data.owner,
        recipient: data.recipient,
        mint: data.mint,
        paymentAmount: data.payment_amount,
        paymentCount: data.payment_count,
        scheduleTimes: data.schedule_times.map((time) => time.toISOString()),
        memo: data.memo,
        noteUri: data.note_uri,
        isSol: data.is_sol,
        status: "PROPOSED",
        createdAt: data.created_at,
      },
    });
  }

  private async handlePaymentCommitmentAccepted(event: EventWrapper) {
    const data = PaymentCommitmentAcceptedEventSchema.parse(event.event_data);

    const updated = await this.prisma.paymentCommitmentProposal.updateMany({
      where: { id: data.proposal_id },
      data: {
        owner: data.owner,
        recipient: data.recipient,
        status: "ACCEPTED",
        acceptedAt: data.accepted_at,
      },
    });

    if (updated.count === 0) {
      throw new RetryableOrderingError(
        `Commitment proposal ${data.proposal_id} is not indexed yet; retry after PaymentCommitmentProposedEvent is processed`
      );
    }
  }

  private async handlePaymentCommitmentActivated(event: EventWrapper) {
    const data = PaymentCommitmentActivatedEventSchema.parse(event.event_data);

    const updated = await this.prisma.paymentCommitmentProposal.updateMany({
      where: { id: data.proposal_id },
      data: {
        owner: data.owner,
        recipient: data.recipient,
        status: "ACTIVATED",
        activatedAt: data.activated_at,
      },
    });

    if (updated.count === 0) {
      throw new RetryableOrderingError(
        `Commitment proposal ${data.proposal_id} is not indexed yet; retry after PaymentCommitmentProposedEvent is processed`
      );
    }
  }

  private async handlePaymentExecuted(event: EventWrapper) {
    const data = PaymentExecutedEventSchema.parse(event.event_data);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const schedule = await tx.paymentSchedule.findUnique({
        where: { id: data.schedule_id },
        select: { id: true, paymentCount: true },
      });

      if (!schedule) {
        throw new RetryableOrderingError(
          `Schedule ${data.schedule_id} is not indexed yet; retry after PaymentScheduleCreatedEvent is processed`
        );
      }

      await tx.payment.upsert({
        where: { signature: event.signature },
        update: {
          scheduleId: data.schedule_id,
          paymentIndex: data.payment_index,
          amount: data.amount,
          recipient: data.recipient,
          mint: data.mint,
          isSol: data.is_sol,
          executedAt: data.executed_at,
          executedBy: data.executed_by,
          signature: event.signature,
          slot: event.slot,
        },
        create: {
          scheduleId: data.schedule_id,
          paymentIndex: data.payment_index,
          amount: data.amount,
          recipient: data.recipient,
          mint: data.mint,
          isSol: data.is_sol,
          executedAt: data.executed_at,
          executedBy: data.executed_by,
          signature: event.signature,
          slot: event.slot,
        },
      });

      const paymentsExecuted = await tx.payment.count({
        where: { scheduleId: data.schedule_id },
      });

      await tx.paymentSchedule.update({
        where: { id: data.schedule_id },
        data: {
          paymentsExecuted,
          status:
            paymentsExecuted >= schedule.paymentCount
              ? "COMPLETED"
              : "ACTIVE",
        },
      });
    });
  }

  private async handlePaymentScheduleCancelled(event: EventWrapper) {
    const data = PaymentScheduleCancelledEventSchema.parse(event.event_data);

    const updated = await this.prisma.paymentSchedule.updateMany({
      where: { id: data.schedule_id },
      data: {
        status: "CANCELLED",
        mint: data.mint,
        isSol: data.is_sol,
      },
    });

    if (updated.count === 0) {
      throw new RetryableOrderingError(
        `Schedule ${data.schedule_id} is not indexed yet; retry after PaymentScheduleCreatedEvent is processed`
      );
    }
  }

  private async handleFeesWithdrawn(event: EventWrapper) {
    const data = FeesWithdrawnEventSchema.parse(event.event_data);

    await this.prisma.feeWithdrawal.upsert({
      where: { signature: event.signature },
      update: {
        amount: data.amount,
        mint: data.mint,
        isSol: data.is_sol,
        withdrawnBy: data.withdrawn_by,
        withdrawnAt: data.withdrawn_at,
        signature: event.signature,
        slot: event.slot,
      },
      create: {
        amount: data.amount,
        mint: data.mint,
        isSol: data.is_sol,
        withdrawnBy: data.withdrawn_by,
        withdrawnAt: data.withdrawn_at,
        signature: event.signature,
        slot: event.slot,
      },
    });
  }

  private async handleFeePercentageUpdated(event: EventWrapper) {
    const data = FeePercentageUpdatedEventSchema.parse(event.event_data);

    await this.prisma.feePercentageUpdate.upsert({
      where: { signature: event.signature },
      update: {
        oldPercentage: data.old_percentage,
        newPercentage: data.new_percentage,
        updatedAt: data.updated_at,
        signature: event.signature,
        slot: event.slot,
      },
      create: {
        oldPercentage: data.old_percentage,
        newPercentage: data.new_percentage,
        updatedAt: data.updated_at,
        signature: event.signature,
        slot: event.slot,
      },
    });
  }

  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    console.log("🛑 Shutting down worker service...");
    this.isShuttingDown = true;

    if (this.activeJobs.size > 0) {
      await Promise.allSettled(this.activeJobs);
    }

    this.redis.disconnect();
    this.redisBlocking.disconnect();
    await this.prisma.$disconnect();
    process.exit(0);
  }
}

const service = new AutoSolWorkerService();
service.start().catch((error) => {
  console.error("💥 Worker service crashed:", error);
  process.exit(1);
});
