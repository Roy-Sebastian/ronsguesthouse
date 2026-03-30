import { Prisma } from '@prisma/client';

import { appendLine, extractAddOnLines } from './addon.utils';

type SyncPaidTransactionIncomeForAddOnParams = {
  tx: Prisma.TransactionClient;
  transactionId: string;
  amountIncrement: number;
  addOnLogLine: string;
  userId?: string | null;
  paymentDate?: Date | null;
};

export const buildIncomeDescriptionWithAddOns = (
  baseDescription: string,
  noteSource?: string | null,
): string => {
  const addOnLines = extractAddOnLines(noteSource);
  return addOnLines.length > 0
    ? `${baseDescription}\n${addOnLines.join('\n')}`
    : baseDescription;
};

export const appendAddOnToIncomeDescription = (
  currentDescription: string | null | undefined,
  addOnLogLine: string,
  fallbackBase = 'Pembayaran Reservasi / Kamar',
): string => {
  const base = String(currentDescription || '').trim() || fallbackBase;
  return appendLine(base, addOnLogLine);
};

export const syncPaidTransactionIncomeForAddOn = async ({
  tx,
  transactionId,
  amountIncrement,
  addOnLogLine,
  userId = null,
  paymentDate,
}: SyncPaidTransactionIncomeForAddOnParams): Promise<void> => {
  const linkedIncome = await tx.income.findUnique({
    where: { transactionId },
  });

  if (linkedIncome) {
    await tx.income.update({
      where: { id: linkedIncome.id },
      data: {
        amount: { increment: amountIncrement },
        description: appendAddOnToIncomeDescription(
          linkedIncome.description,
          addOnLogLine,
        ),
      },
    });
    return;
  }

  await tx.income.create({
    data: {
      transactionId,
      amount: amountIncrement,
      description: appendAddOnToIncomeDescription('Tambahan Add-On', addOnLogLine),
      userId,
      incomeDate: paymentDate || new Date(),
    },
  });
};
