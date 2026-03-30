"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.userRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.user.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.user.findUnique({ where: { id }, ...args }),
    findByEmail: (email, args, tx = prisma_1.prisma) => tx.user.findUnique({ where: { email }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.user.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.user.update({ where: { id }, ...args }),
    updateMany: (args, tx = prisma_1.prisma) => tx.user.updateMany(args),
    delete: (id, tx = prisma_1.prisma) => tx.user.delete({ where: { id } }),
    count: (args, tx = prisma_1.prisma) => tx.user.count(args),
};
