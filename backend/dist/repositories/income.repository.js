"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incomeRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.incomeRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.income.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.income.findUnique({ where: { id }, ...args }),
    findByTransactionId: (transactionId, args, tx = prisma_1.prisma) => tx.income.findUnique({ where: { transactionId }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.income.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.income.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.income.delete({ where: { id } }),
    deleteMany: (args, tx = prisma_1.prisma) => tx.income.deleteMany(args),
};
