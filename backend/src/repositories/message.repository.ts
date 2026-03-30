import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { PrismaClientType, PrismaTransactionClient } from './db.repository';

export const messageRepository = {
  findAll: (args?: Prisma.ContactMessageFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
  findById: (id: string, args?: Omit<Prisma.ContactMessageFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.contactMessage.findUnique({ where: { id }, ...args }),
  create: (args: Prisma.ContactMessageCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.contactMessage.create(args),
  update: (id: string, args: Omit<Prisma.ContactMessageUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.contactMessage.update({ where: { id }, ...args }),
  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.contactMessage.delete({ where: { id } }),
};
