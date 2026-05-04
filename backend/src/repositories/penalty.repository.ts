import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const penaltyRepository = {
  findAll: (args?: Prisma.PenaltyFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.penalty.findMany({ orderBy: { createdAt: 'desc' }, ...args }),

  findById: (id: string, args?: Omit<Prisma.PenaltyFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.penalty.findUnique({ where: { id }, ...args }),

  create: (args: Prisma.PenaltyCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.penalty.create(args),

  update: (id: string, args: Omit<Prisma.PenaltyUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.penalty.update({ where: { id }, ...args }),

  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.penalty.delete({ where: { id } }),

  count: (args?: Prisma.PenaltyCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.penalty.count(args),
};
