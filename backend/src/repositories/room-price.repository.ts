import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const roomPriceRepository = {
  findAll: (args?: Prisma.RoomPriceFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.roomPrice.findMany(args),

  findById: (id: string, args?: Omit<Prisma.RoomPriceFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.roomPrice.findUnique({ where: { id }, ...args }),

  findByRoomAndDateRange: (
    roomId: string,
    startDate: Date,
    endDate: Date,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) =>
    tx.roomPrice.findMany({
      where: {
        roomId,
        date: { gte: startDate, lt: endDate },
      },
      orderBy: { date: 'asc' },
    }),

  upsert: (
    roomId: string,
    date: Date,
    price: number,
    tx: PrismaClientType | PrismaTransactionClient = prisma,
  ) =>
    tx.roomPrice.upsert({
      where: { roomId_date: { roomId, date } },
      create: { roomId, date, price },
      update: { price },
    }),

  create: (args: Prisma.RoomPriceCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.roomPrice.create(args),

  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.roomPrice.delete({ where: { id } }),

  count: (args?: Prisma.RoomPriceCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) =>
    tx.roomPrice.count(args),
};
