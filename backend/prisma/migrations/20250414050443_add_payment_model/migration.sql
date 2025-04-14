-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('Cash', 'Online');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMonth" INTEGER NOT NULL,
    "paymentYear" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
