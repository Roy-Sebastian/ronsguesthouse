import { Prisma } from '@prisma/client';

import type {
  PrismaClientType,
  PrismaTransactionClient,
} from './db.repository';
import { prisma } from '../config/prisma';

export const expenseRepository = {
  findAll: (
    args?: Prisma.ExpenseFindManyArgs,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.expense.findMany({ orderBy: { createdAt: 'desc' }, ...args }),

  findById: (
    id: string,
    args?: Omit<Prisma.ExpenseFindUniqueArgs, 'where'>,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.expense.findUnique({ where: { id }, ...args }),

  create: (
    args: Prisma.ExpenseCreateArgs,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.expense.create(args),

  update: (
    id: string,
    args: Omit<Prisma.ExpenseUpdateArgs, 'where'>,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.expense.update({ where: { id }, ...args }),

  delete: (
    id: string,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.expense.delete({ where: { id } }),
};
