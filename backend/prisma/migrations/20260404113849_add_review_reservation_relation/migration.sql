-- AlterTable: Add reservationId column to reviews table
ALTER TABLE "reviews" ADD COLUMN "reservationId" TEXT;

-- CreateIndex: Unique constraint on reservationId
CREATE UNIQUE INDEX "reviews_reservationId_key" ON "reviews"("reservationId");

-- AddForeignKey: Review.reservationId -> Reservation.id
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
