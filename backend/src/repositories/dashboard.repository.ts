import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { PrismaClientType, PrismaTransactionClient } from './db.repository';

export const dashboardRepository = {
  getGuestCount: (tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.guest.count(),
  getRoomCount: (args?: Prisma.RoomCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.room.count(args),
  getStayCount: (args?: Prisma.StayCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.stay.count(args),
  getReservationCount: (args?: Prisma.ReservationCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.reservation.count(args),
  getReservations: (args?: Prisma.ReservationFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.reservation.findMany(args),
  getReviewCount: (args?: Prisma.ReviewCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.review.count(args),
  getContactMessageCount: (args?: Prisma.ContactMessageCountArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.contactMessage.count(args),
  
  getIncomes: (args?: Prisma.IncomeFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.income.findMany(args),
  getExpenses: (args?: Prisma.ExpenseFindManyArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.expense.findMany(args),
  
  aggregateIncome: (args: Prisma.IncomeAggregateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.income.aggregate(args),
  aggregateExpense: (args: Prisma.ExpenseAggregateArgs, tx: PrismaClientType | PrismaTransactionClient = prisma) => tx.expense.aggregate(args),
};

