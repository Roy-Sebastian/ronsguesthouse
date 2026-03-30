import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type {
  PrismaClientType,
  PrismaTransactionClient,
} from './db.repository';

export const guestRepository = {
  findAll: (
    args?: Prisma.GuestFindManyArgs,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.guest.findMany({ orderBy: { createdAt: 'desc' }, ...args }),

  findById: (
    id: string,
    args?: Omit<Prisma.GuestFindUniqueArgs, 'where'>,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.guest.findUnique({ where: { id }, ...args }),

  findByIdNumber: (
    idNumber: string,
    args?: Omit<Prisma.GuestFindFirstArgs, 'where'>,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.guest.findFirst({ where: { idNumber }, ...args }),

  create: (
    args: Prisma.GuestCreateArgs,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.guest.create(args),

  update: (
    id: string,
    args: Omit<Prisma.GuestUpdateArgs, 'where'>,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.guest.update({ where: { id }, ...args }),

  delete: (
    id: string,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.guest.delete({ where: { id } }),

  count: (
    args?: Prisma.GuestCountArgs,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) => tx.guest.count(args),
};
