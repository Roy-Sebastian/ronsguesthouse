"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.roomRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.room.findMany({ orderBy: { roomNumber: 'asc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.room.findUnique({ where: { id }, ...args }),
    findByRoomNumber: (roomNumber, args, tx = prisma_1.prisma) => tx.room.findUnique({ where: { roomNumber }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.room.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.room.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.room.delete({ where: { id } }),
    count: (args, tx = prisma_1.prisma) => tx.room.count(args),
};
