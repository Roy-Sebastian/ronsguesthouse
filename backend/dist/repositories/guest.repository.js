"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.guestRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.guest.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.guest.findUnique({ where: { id }, ...args }),
    findByIdNumber: (idNumber, args, tx = prisma_1.prisma) => tx.guest.findFirst({ where: { idNumber }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.guest.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.guest.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.guest.delete({ where: { id } }),
    count: (args, tx = prisma_1.prisma) => tx.guest.count(args),
};
