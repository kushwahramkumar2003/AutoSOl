-- CreateEnum
CREATE TYPE "PaymentSchedulePolicy" AS ENUM ('STANDARD', 'COMMITMENT');

-- CreateEnum
CREATE TYPE "PaymentCommitmentStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'ACTIVATED');

-- AlterTable
ALTER TABLE "payment_schedules" ADD COLUMN     "proposal_id" TEXT,
ADD COLUMN     "schedule_policy" "PaymentSchedulePolicy" NOT NULL DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "payment_commitment_proposals" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "payment_amount" BIGINT NOT NULL,
    "payment_count" INTEGER NOT NULL,
    "schedule_times" JSONB NOT NULL,
    "memo" TEXT NOT NULL,
    "note_uri" TEXT NOT NULL,
    "is_sol" BOOLEAN NOT NULL DEFAULT true,
    "status" "PaymentCommitmentStatus" NOT NULL DEFAULT 'PROPOSED',
    "accepted_at" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_commitment_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_commitment_proposals_owner_idx" ON "payment_commitment_proposals"("owner");

-- CreateIndex
CREATE INDEX "payment_commitment_proposals_recipient_idx" ON "payment_commitment_proposals"("recipient");

-- CreateIndex
CREATE INDEX "payment_commitment_proposals_status_idx" ON "payment_commitment_proposals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedules_proposal_id_key" ON "payment_schedules"("proposal_id");

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "payment_commitment_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

