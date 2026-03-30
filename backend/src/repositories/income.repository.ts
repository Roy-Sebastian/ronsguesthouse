import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const incomeRepository = {
  findAll: (args?: Prisma.IncomeFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.income.findMany({ orderBy: { createdAt: 'desc' }, ...args }),

  findById: (id: string, args?: Omit<Prisma.IncomeFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.income.findUnique({ where: { id }, ...args }),

  findByTransactionId: (transactionId: string, args?: Omit<Prisma.IncomeFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.income.findUnique({ where: { transactionId }, ...args }),

  create: (args: Prisma.IncomeCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.income.create(args),

  update: (id: string, args: Omit<Prisma.IncomeUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.income.update({ where: { id }, ...args }),

  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.income.delete({ where: { id } }),

  deleteMany: (args: Prisma.IncomeDeleteManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.income.deleteMany(args),
};
