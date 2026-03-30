import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const auditLogRepository = {
  findAll: (args?: Prisma.AuditLogFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.auditLog.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
  findById: (id: string, args?: Omit<Prisma.AuditLogFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.auditLog.findUnique({ where: { id }, ...args }),
  create: (args: Prisma.AuditLogCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.auditLog.create(args),
  update: (id: string, args: Omit<Prisma.AuditLogUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.auditLog.update({ where: { id }, ...args }),
  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.auditLog.delete({ where: { id } }),
};
