import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type {
  PrismaClientType,
  PrismaTransactionClient,
} from './db.repository';

export const userRepository = {
  findAll: (
    args?: Prisma.UserFindManyArgs,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.user.findMany({ orderBy: { createdAt: 'desc' }, ...args }),

  findById: (
    id: string,
    args?: Omit<Prisma.UserFindUniqueArgs, 'where'>,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.user.findUnique({ where: { id }, ...args }),

  findByEmail: (
    email: string,
    args?: Omit<Prisma.UserFindUniqueArgs, 'where'>,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.user.findUnique({ where: { email }, ...args }),

  create: (
    args: Prisma.UserCreateArgs,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.user.create(args),

  update: (
    id: string,
    args: Omit<Prisma.UserUpdateArgs, 'where'>,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.user.update({ where: { id }, ...args }),

  updateMany: (
    args: Prisma.UserUpdateManyArgs,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.user.updateMany(args),

  delete: (
    id: string,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.user.delete({ where: { id } }),

  count: (
    args?: Prisma.UserCountArgs,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.user.count(args),
};
