-- CreateEnum
CREATE TYPE "PaymentScheduleStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "payment_schedules" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "total_amount" BIGINT NOT NULL,
    "payment_amount" BIGINT NOT NULL,
    "payment_count" INTEGER NOT NULL,
    "payments_executed" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "payment_index" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "recipient" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL,
    "executed_by" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_withdrawals" (
    "id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "withdrawn_by" TEXT NOT NULL,
    "withdrawn_at" TIMESTAMP(3) NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_percentage_updates" (
    "id" TEXT NOT NULL,
    "old_percentage" INTEGER NOT NULL,
    "new_percentage" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_percentage_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "event_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_signature_key" ON "payments"("signature");

-- CreateIndex
CREATE UNIQUE INDEX "payments_schedule_id_payment_index_key" ON "payments"("schedule_id", "payment_index");

-- CreateIndex
CREATE UNIQUE INDEX "fee_withdrawals_signature_key" ON "fee_withdrawals"("signature");

-- CreateIndex
CREATE UNIQUE INDEX "fee_percentage_updates_signature_key" ON "fee_percentage_updates"("signature");

-- CreateIndex
CREATE UNIQUE INDEX "event_logs_signature_key" ON "event_logs"("signature");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "payment_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
