"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.auditLogRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.auditLog.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.auditLog.findUnique({ where: { id }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.auditLog.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.auditLog.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.auditLog.delete({ where: { id } }),
};
