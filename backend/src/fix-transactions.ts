import 'dotenv/config';
import { prisma } from './config/prisma';
import { ReservationStatus } from '@prisma/client';

async function main() {
  console.log('Fixing pending transactions...');
  const pendingTx = await prisma.transaction.findMany({
    where: {
      paymentStatus: 'pending',
      midtransOrderId: null,
    },
  });

  console.log(`Found ${pendingTx.length} pending manual transactions.`);

  for (const tx of pendingTx) {
    console.log(`Fixing transaction ${tx.id} for reservation ${tx.reservationId}`);
    
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { paymentStatus: 'paid', paymentDate: tx.paymentDate || new Date() },
    });

    const reservation = await prisma.reservation.findUnique({
      where: { id: tx.reservationId },
    });

    if (reservation && reservation.status === 'pending') {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'confirmed' },
      });
      console.log(`Updated reservation ${reservation.id} status to confirmed.`);
    }

    await prisma.income.upsert({
      where: { transactionId: tx.id },
      create: {
        transactionId: tx.id,
        amount: tx.amount,
        description: `Pembayaran Reservasi / Kamar (Dilunasi via Fix Script)`,
        incomeDate: tx.paymentDate || new Date(),
        sourceType: 'RESERVATION',
        referenceId: tx.reservationId,
        paymentMethod: tx.paymentMethod,
        status: 'paid',
        type: 'income',
      },
      update: {},
    });
  }

  console.log('Done!');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
