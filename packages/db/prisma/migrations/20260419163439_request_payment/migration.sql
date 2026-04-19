-- AlterTable
ALTER TABLE "fee_withdrawals" ALTER COLUMN "mint" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_schedules" ALTER COLUMN "mint" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "mint" DROP DEFAULT;
