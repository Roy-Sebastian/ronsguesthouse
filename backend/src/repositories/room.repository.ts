import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { PrismaClientType, PrismaTransactionClient } from './db.repository';

export const roomRepository = {
  findAll: (args?: Prisma.RoomFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.room.findMany({ orderBy: { roomNumber: 'asc' }, ...args }),

  findById: (id: string, args?: Omit<Prisma.RoomFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.room.findUnique({ where: { id }, ...args }),

  findByRoomNumber: (roomNumber: string, args?: Omit<Prisma.RoomFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.room.findUnique({ where: { roomNumber }, ...args }),

  create: (args: Prisma.RoomCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.room.create(args),

  update: (id: string, args: Omit<Prisma.RoomUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.room.update({ where: { id }, ...args }),

  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.room.delete({ where: { id } }),

  count: (args?: Prisma.RoomCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.room.count(args),
};
