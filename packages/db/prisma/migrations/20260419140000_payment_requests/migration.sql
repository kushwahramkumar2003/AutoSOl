-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PaymentRequestStatus" AS ENUM ('PROPOSED', 'DECLINED', 'REVOKED', 'ACCEPTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
DO $$ BEGIN
    ALTER TYPE "PaymentSchedulePolicy" ADD VALUE IF NOT EXISTS 'REQUEST';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "PaymentScheduleStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_request_proposals" (
    "id" TEXT NOT NULL,
    "requester" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "payment_amount" BIGINT NOT NULL,
    "payment_count" INTEGER NOT NULL,
    "schedule_times" JSONB NOT NULL,
    "memo" TEXT NOT NULL,
    "note_uri" TEXT NOT NULL,
    "is_sol" BOOLEAN NOT NULL DEFAULT true,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PROPOSED',
    "decisioned_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_request_proposals_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "payment_schedules"
ADD COLUMN IF NOT EXISTS "request_id" TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS "payment_request_proposals_requester_idx" ON "payment_request_proposals"("requester");
CREATE INDEX IF NOT EXISTS "payment_request_proposals_payer_idx" ON "payment_request_proposals"("payer");
CREATE INDEX IF NOT EXISTS "payment_request_proposals_status_idx" ON "payment_request_proposals"("status");

-- Unique index for request linkage
CREATE UNIQUE INDEX IF NOT EXISTS "payment_schedules_request_id_key" ON "payment_schedules"("request_id");

-- FK
DO $$ BEGIN
ALTER TABLE "payment_schedules"
ADD CONSTRAINT "payment_schedules_request_id_fkey"
FOREIGN KEY ("request_id") REFERENCES "payment_request_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
