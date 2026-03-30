import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { PrismaClientType, PrismaTransactionClient } from './db.repository';

export const facilityRepository = {
  findAll: (args?: Prisma.FacilityFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.facility.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
  findById: (id: string, args?: Omit<Prisma.FacilityFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.facility.findUnique({ where: { id }, ...args }),
  create: (args: Prisma.FacilityCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.facility.create(args),
  update: (id: string, args: Omit<Prisma.FacilityUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.facility.update({ where: { id }, ...args }),
  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.facility.delete({ where: { id } }),
};
