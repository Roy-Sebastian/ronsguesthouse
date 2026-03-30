import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const stayRepository = {
  findAll: (args?: Prisma.StayFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.stay.findMany({ orderBy: { checkInAt: 'desc' }, ...args }),

  findById: (id: string, args?: Omit<Prisma.StayFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.stay.findUnique({ where: { id }, ...args }),

  create: (args: Prisma.StayCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.stay.create(args),

  update: (id: string, args: Omit<Prisma.StayUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.stay.update({ where: { id }, ...args }),

  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.stay.delete({ where: { id } }),

  count: (args?: Prisma.StayCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.stay.count(args),
};
