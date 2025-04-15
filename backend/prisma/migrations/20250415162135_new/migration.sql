-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_recordedById_fkey";

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "recordedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
