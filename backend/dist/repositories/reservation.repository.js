"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.reservationRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.reservation.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.reservation.findUnique({ where: { id }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.reservation.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.reservation.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.reservation.delete({ where: { id } }),
    count: (args, tx = prisma_1.prisma) => tx.reservation.count(args),
};
