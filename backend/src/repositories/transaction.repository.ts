import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const transactionRepository = {
  findAll: (args?: Prisma.TransactionFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.transaction.findMany({ orderBy: { createdAt: 'desc' }, ...args }),

  findById: (id: string, args?: Omit<Prisma.TransactionFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.transaction.findUnique({ where: { id }, ...args }),

  findByReservationId: (reservationId: string, args?: Omit<Prisma.TransactionFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.transaction.findUnique({ where: { reservationId }, ...args }),

  create: (args: Prisma.TransactionCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.transaction.create(args),

  update: (id: string, args: Omit<Prisma.TransactionUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.transaction.update({ where: { id }, ...args }),

  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.transaction.delete({ where: { id } }),

  count: (args?: Prisma.TransactionCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.transaction.count(args),
};
