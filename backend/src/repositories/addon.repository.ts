import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { PrismaClientType, PrismaTransactionClient } from './db.repository';

export const addonRepository = {
  findAll: (args?: Prisma.AddOnFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.addOn.findMany({ orderBy: { createdAt: 'desc' }, ...args }),

  findById: (id: string, args?: Omit<Prisma.AddOnFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.addOn.findUnique({ where: { id }, ...args }),

  create: (args: Prisma.AddOnCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.addOn.create(args),

  update: (id: string, args: Omit<Prisma.AddOnUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.addOn.update({ where: { id }, ...args }),

  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.addOn.delete({ where: { id } }),
};
