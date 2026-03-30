"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.dashboardRepository = {
    getGuestCount: (tx = prisma_1.prisma) => tx.guest.count(),
    getRoomCount: (args, tx = prisma_1.prisma) => tx.room.count(args),
    getStayCount: (args, tx = prisma_1.prisma) => tx.stay.count(args),
    getReservationCount: (args, tx = prisma_1.prisma) => tx.reservation.count(args),
    getReservations: (args, tx = prisma_1.prisma) => tx.reservation.findMany(args),
    getReviewCount: (args, tx = prisma_1.prisma) => tx.review.count(args),
    getContactMessageCount: (args, tx = prisma_1.prisma) => tx.contactMessage.count(args),
    getIncomes: (args, tx = prisma_1.prisma) => tx.income.findMany(args),
    getExpenses: (args, tx = prisma_1.prisma) => tx.expense.findMany(args),
    aggregateIncome: (args, tx = prisma_1.prisma) => tx.income.aggregate(args),
    aggregateExpense: (args, tx = prisma_1.prisma) => tx.expense.aggregate(args),
};
