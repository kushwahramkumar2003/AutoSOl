import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { z } from "zod";

// Environment configuration
const config = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  redisQueue: process.env.REDIS_QUEUE || "solana_auto_sol_events",
  databaseUrl:
    process.env.DATABASE_URL || "postgresql://localhost:5432/autosol",
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || "5"),
  maxRetries: parseInt(process.env.MAX_RETRIES || "3"),
  retryDelay: parseInt(process.env.RETRY_DELAY || "5000"), // 5 seconds
};

// Helper function to convert Pubkey array to base58 string
const pubkeyArrayToString = (arr: number[]): string => {
  // Convert number array to Uint8Array and then to base58 string
  const uint8Array = new Uint8Array(arr);
  return Buffer.from(uint8Array).toString("base64"); // Using base64 for now, you might want to use base58
};

// Zod schemas for event validation - Updated to handle array inputs
const PaymentScheduleCreatedEventSchema = z.object({
  schedule_id: z.union([
    z.string(),
    z.array(z.number()).transform(pubkeyArrayToString),
  ]),
  owner: z.union([
    z.string(),
    z.array(z.number()).transform(pubkeyArrayToString),
  ]),
  recipient: z.union([
    z.string(),
    z.array(z.number()).transform(pubkeyArrayToString),
  ]),
  total_amount: z.union([
    z.string().transform((val) => BigInt(val)),
    z.number().transform((val) => BigInt(val)),
  ]),
  payment_amount: z.union([
    z.string().transform((val) => BigInt(val)),
    z.number().transform((val) => BigInt(val)),
  ]),
  payment_count: z.union([
    z.string().transform((val) => parseInt(val)),
    z.number(),
  ]),
  created_at: z.union([
    z.string().transform((val) => new Date(parseInt(val) * 1000)),
    z.number().transform((val) => new Date(val * 1000)),
  ]),
});

const PaymentExecutedEventSchema = z.object({
  schedule_id: z.union([
    z.string(),
    z.array(z.number()).transform(pubkeyArrayToString),
  ]),
  payment_index: z.union([
    z.string().transform((val) => parseInt(val)),
    z.number(),
  ]),
  amount: z.union([
    z.string().transform((val) => BigInt(val)),
    z.number().transform((val) => BigInt(val)),
  ]),
  recipient: z.union([
    z.string(),
    z.array(z.number()).transform(pubkeyArrayToString),
  ]),
  executed_at: z.union([
    z.string().transform((val) => new Date(parseInt(val) * 1000)),
    z.number().transform((val) => new Date(val * 1000)),
  ]),
  executed_by: z.union([
    z.string(),
    z.array(z.number()).transform(pubkeyArrayToString),
  ]),
});

const PaymentScheduleCancelledEventSchema = z.object({
  schedule_id: z.union([
    z.string(),
    z.array(z.number()).transform(pubkeyArrayToString),
  ]),
  owner: z.union([
    z.string(),
    z.array(z.number()).transform(pubkeyArrayToString),
  ]),
  refund_amount: z.union([
    z.string().transform((val) => BigInt(val)),
    z.number().transform((val) => BigInt(val)),
  ]),
  cancelled_at: z.union([
    z.string().transform((val) => new Date(parseInt(val) * 1000)),
    z.number().transform((val) => new Date(val * 1000)),
  ]),
});

const FeesWithdrawnEventSchema = z.object({
  amount: z.union([
    z.string().transform((val) => BigInt(val)),
    z.number().transform((val) => BigInt(val)),
  ]),
  withdrawn_by: z.union([
    z.string(),
    z.array(z.number()).transform(pubkeyArrayToString),
  ]),
  withdrawn_at: z.union([
    z.string().transform((val) => new Date(parseInt(val) * 1000)),
    z.number().transform((val) => new Date(val * 1000)),
  ]),
});

const FeePercentageUpdatedEventSchema = z.object({
  old_percentage: z.number(),
  new_percentage: z.number(),
  updated_at: z.union([
    z.string().transform((val) => new Date(parseInt(val) * 1000)),
    z.number().transform((val) => new Date(val * 1000)),
  ]),
});

const EventWrapperSchema = z.object({
  event_type: z.string(),
  event_data: z.record(z.any()),
  signature: z.string(),
  slot: z.number().transform((val) => BigInt(val)),
  timestamp: z.number().transform((val) => new Date(val * 1000)),
});

type EventWrapper = z.infer<typeof EventWrapperSchema>;

class AutoSolWorkerService {
  private prisma: PrismaClient;
  private redis: Redis;
  private isShuttingDown = false;
  private activeJobs = new Set<Promise<void>>();

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(config.redisUrl);

    // Handle graceful shutdown
    process.on("SIGINT", () => this.shutdown());
    process.on("SIGTERM", () => this.shutdown());
  }

  async start() {
    console.log("🚀 AutoSol Worker Service Starting...");
    console.log(`📊 Configuration:`);
    console.log(`   Redis Queue: ${config.redisQueue}`);
    console.log(`   Worker Concurrency: ${config.workerConcurrency}`);
    console.log(`   Max Retries: ${config.maxRetries}`);

    try {
      await this.redis.ping();
      console.log("✅ Redis connection established");

      await this.prisma.$connect();
      console.log("✅ Database connection established");

      // Start worker processes
      const workers = Array.from({ length: config.workerConcurrency }, (_, i) =>
        this.startWorker(i + 1)
      );

      console.log(`🔄 Started ${config.workerConcurrency} worker processes`);

      await Promise.all(workers);
    } catch (error) {
      console.error("❌ Failed to start worker service:", error);
      await this.shutdown();
    }
  }

  private async startWorker(workerId: number): Promise<void> {
    console.log(`👷 Worker ${workerId} started`);

    while (!this.isShuttingDown) {
      try {
        // Block and wait for new events
        const result = await this.redis.brpop(config.redisQueue, 10); // 10 second timeout

        if (!result) {
          continue; // Timeout, continue polling
        }

        const [_, eventData] = result;
        const job = this.processEvent(workerId, eventData);
        this.activeJobs.add(job);

        job.finally(() => {
          this.activeJobs.delete(job);
        });
      } catch (error) {
        console.error(`❌ Worker ${workerId} error:`, error);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }

    console.log(`👷 Worker ${workerId} stopped`);
  }

  private async processEvent(
    workerId: number,
    eventData: string
  ): Promise<void> {
    let eventLog = null;

    try {
      // Parse and validate event
      const rawEvent = JSON.parse(eventData);
      const event = EventWrapperSchema.parse(rawEvent);

      console.log(
        `🔄 Worker ${workerId} processing: ${event.event_type} (${event.signature})`
      );

      // Check if event already exists to prevent duplicates
      const existingEvent = await this.prisma.eventLog.findUnique({
        where: { signature: event.signature },
      });

      if (existingEvent) {
        console.log(
          `⏭️ Worker ${workerId} skipping duplicate event: ${event.signature}`
        );
        return;
      }

      // Create event log entry
      eventLog = await this.prisma.eventLog.create({
        data: {
          eventType: event.event_type,
          signature: event.signature,
          slot: event.slot,
          eventData: event.event_data,
          status: "PENDING",
        },
      });

      // Process based on event type
      await this.handleEventByType(event);

      // Mark as processed
      await this.prisma.eventLog.update({
        where: { id: eventLog.id },
        data: { status: "PROCESSED" },
      });

      console.log(
        `✅ Worker ${workerId} completed: ${event.event_type} (${event.signature})`
      );
    } catch (error) {
      console.error(`❌ Worker ${workerId} failed to process event:`, error);

      if (eventLog) {
        const retryCount = eventLog.retryCount + 1;

        if (retryCount <= config.maxRetries) {
          // Schedule retry
          await this.prisma.eventLog.update({
            where: { id: eventLog.id },
            data: {
              retryCount,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });

          // Re-queue with delay
          setTimeout(async () => {
            await this.redis.lpush(config.redisQueue, eventData);
            console.log(
              `🔄 Requeued event for retry ${retryCount}/${config.maxRetries}`
            );
          }, config.retryDelay);
        } else {
          // Mark as failed
          await this.prisma.eventLog.update({
            where: { id: eventLog.id },
            data: {
              status: "FAILED",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });

          console.error(
            `💀 Event processing failed permanently after ${config.maxRetries} retries`
          );
        }
      } else {
        // If event creation failed due to unique constraint, just log and continue
        if (
          error instanceof Error &&
          error.message.includes("Unique constraint failed")
        ) {
          console.log(
            `⏭️ Worker ${workerId} skipping duplicate event (constraint error)`
          );
          return;
        }

        // For other errors during event log creation, we can't retry
        console.error(
          `💀 Failed to create event log, cannot retry: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  }

  private async handleEventByType(event: EventWrapper): Promise<void> {
    switch (event.event_type) {
      case "PaymentScheduleCreatedEvent":
        await this.handlePaymentScheduleCreated(event);
        break;

      case "PaymentExecutedEvent":
        await this.handlePaymentExecuted(event);
        break;

      case "PaymentScheduleCancelledEvent":
        await this.handlePaymentScheduleCancelled(event);
        break;

      case "FeesWithdrawnEvent":
        await this.handleFeesWithdrawn(event);
        break;

      case "FeePercentageUpdatedEvent":
        await this.handleFeePercentageUpdated(event);
        break;

      default:
        throw new Error(`Unknown event type: ${event.event_type}`);
    }
  }

  private async handlePaymentScheduleCreated(
    event: EventWrapper
  ): Promise<void> {
    const data = PaymentScheduleCreatedEventSchema.parse(event.event_data);

    await this.prisma.paymentSchedule.upsert({
      where: { id: data.schedule_id },
      update: {
        owner: data.owner,
        recipient: data.recipient,
        totalAmount: data.total_amount,
        paymentAmount: data.payment_amount,
        paymentCount: data.payment_count,
        status: "ACTIVE",
        createdAt: data.created_at,
      },
      create: {
        id: data.schedule_id,
        owner: data.owner,
        recipient: data.recipient,
        totalAmount: data.total_amount,
        paymentAmount: data.payment_amount,
        paymentCount: data.payment_count,
        status: "ACTIVE",
        createdAt: data.created_at,
      },
    });

    console.log(`📅 Created payment schedule: ${data.schedule_id}`);
  }

  private async handlePaymentExecuted(event: EventWrapper): Promise<void> {
    const data = PaymentExecutedEventSchema.parse(event.event_data);

    await this.prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.upsert({
        where: { signature: event.signature },
        update: {
          scheduleId: data.schedule_id,
          paymentIndex: data.payment_index,
          amount: data.amount,
          recipient: data.recipient,
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
          executedAt: data.executed_at,
          executedBy: data.executed_by,
          signature: event.signature,
          slot: event.slot,
        },
      });

      // Update payment schedule
      const schedule = await tx.paymentSchedule.findUnique({
        where: { id: data.schedule_id },
        include: { payments: true },
      });

      if (schedule) {
        const paymentsExecuted = schedule.payments.length;
        const isCompleted = paymentsExecuted >= schedule.paymentCount;

        await tx.paymentSchedule.update({
          where: { id: data.schedule_id },
          data: {
            paymentsExecuted,
            status: isCompleted ? "COMPLETED" : "ACTIVE",
          },
        });

        if (isCompleted) {
          console.log(`🎉 Payment schedule completed: ${data.schedule_id}`);
        }
      }
    });

    console.log(
      `💰 Payment executed: ${data.schedule_id} [${data.payment_index}]`
    );
  }

  private async handlePaymentScheduleCancelled(
    event: EventWrapper
  ): Promise<void> {
    const data = PaymentScheduleCancelledEventSchema.parse(event.event_data);

    await this.prisma.paymentSchedule.update({
      where: { id: data.schedule_id },
      data: {
        status: "CANCELLED",
      },
    });

    console.log(`❌ Payment schedule cancelled: ${data.schedule_id}`);
  }

  private async handleFeesWithdrawn(event: EventWrapper): Promise<void> {
    const data = FeesWithdrawnEventSchema.parse(event.event_data);

    await this.prisma.feeWithdrawal.upsert({
      where: { signature: event.signature },
      update: {
        amount: data.amount,
        withdrawnBy: data.withdrawn_by,
        withdrawnAt: data.withdrawn_at,
        signature: event.signature,
        slot: event.slot,
      },
      create: {
        amount: data.amount,
        withdrawnBy: data.withdrawn_by,
        withdrawnAt: data.withdrawn_at,
        signature: event.signature,
        slot: event.slot,
      },
    });

    console.log(`💸 Fees withdrawn: ${data.amount} by ${data.withdrawn_by}`);
  }

  private async handleFeePercentageUpdated(event: EventWrapper): Promise<void> {
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

    console.log(
      `⚙️ Fee percentage updated: ${data.old_percentage}% → ${data.new_percentage}%`
    );
  }

  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;

    console.log("🛑 Shutting down worker service...");
    this.isShuttingDown = true;

    // Wait for active jobs to complete
    if (this.activeJobs.size > 0) {
      console.log(
        `⏳ Waiting for ${this.activeJobs.size} active jobs to complete...`
      );
      await Promise.all(this.activeJobs);
    }

    // Close connections
    await this.redis.disconnect();
    await this.prisma.$disconnect();

    console.log("✅ Worker service shut down gracefully");
    process.exit(0);
  }
}

// Start the service
const service = new AutoSolWorkerService();
service.start().catch((error) => {
  console.error("💥 Worker service crashed:", error);
  process.exit(1);
});
