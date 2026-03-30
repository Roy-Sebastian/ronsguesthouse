"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.expenseRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.expense.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.expense.findUnique({ where: { id }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.expense.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.expense.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.expense.delete({ where: { id } }),
};
