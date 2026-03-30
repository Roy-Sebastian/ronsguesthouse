import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const reviewRepository = {
  findAll: (args?: Prisma.ReviewFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.review.findMany({ ...args }),
  findById: (id: string, args?: Omit<Prisma.ReviewFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.review.findUnique({ where: { id }, ...args }),
  create: (args: Prisma.ReviewCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.review.create(args),
  update: (id: string, args: Omit<Prisma.ReviewUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.review.update({ where: { id }, ...args }),
  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.review.delete({ where: { id } }),
};
