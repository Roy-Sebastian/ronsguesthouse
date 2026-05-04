-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('late_checkout', 'room_damage', 'missing_items', 'other');

-- CreateEnum
CREATE TYPE "PenaltyStatus" AS ENUM ('pending', 'paid', 'waived');

-- CreateTable
CREATE TABLE "penalties" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" "PenaltyType" NOT NULL DEFAULT 'other',
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "status" "PenaltyStatus" NOT NULL DEFAULT 'pending',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penalties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "penalties_reservationId_idx" ON "penalties"("reservationId");

-- CreateIndex
CREATE INDEX "penalties_status_idx" ON "penalties"("status");

-- AddForeignKey
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
