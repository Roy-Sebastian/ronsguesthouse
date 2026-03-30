import { prisma } from '../config/prisma';

export type PrismaClientType = typeof prisma;
export type PrismaTransactionClient = Omit<
  PrismaClientType,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export const dbRepository = {
  transaction: <T>(fn: (tx: PrismaTransactionClient) => Promise<T>) => {
    return prisma.$transaction(fn);
  },
  executeRaw: (query: any, tx?: PrismaTransactionClient) => {
    return (tx || prisma).$executeRawUnsafe(query);
  }
};
