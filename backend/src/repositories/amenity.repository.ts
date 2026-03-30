import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const amenityRepository = {
  findAll: (args?: Prisma.AmenityFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.amenity.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
  findById: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.amenity.findUnique({ where: { id } }),
  create: (args: Prisma.AmenityCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.amenity.create(args),
  update: (id: string, args: Omit<Prisma.AmenityUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.amenity.update({ where: { id }, ...args }),
  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.amenity.delete({ where: { id } }),
};
