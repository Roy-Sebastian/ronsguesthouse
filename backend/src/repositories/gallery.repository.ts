import { Prisma } from '@prisma/client';

import type { PrismaClientType, PrismaTransactionClient } from './db.repository';
import { prisma } from '../config/prisma';

export const galleryRepository = {
  findAll: (args?: Prisma.GalleryFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.gallery.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
  findById: (id: string, args?: Omit<Prisma.GalleryFindUniqueArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.gallery.findUnique({ where: { id }, ...args }),
  create: (args: Prisma.GalleryCreateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.gallery.create(args),
  update: (id: string, args: Omit<Prisma.GalleryUpdateArgs, 'where'>, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.gallery.update({ where: { id }, ...args }),
  delete: (id: string, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.gallery.delete({ where: { id } }),
};
