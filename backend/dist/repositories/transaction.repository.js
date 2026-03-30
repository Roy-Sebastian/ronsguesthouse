"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.transactionRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.transaction.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.transaction.findUnique({ where: { id }, ...args }),
    findByReservationId: (reservationId, args, tx = prisma_1.prisma) => tx.transaction.findUnique({ where: { reservationId }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.transaction.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.transaction.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.transaction.delete({ where: { id } }),
    count: (args, tx = prisma_1.prisma) => tx.transaction.count(args),
};
