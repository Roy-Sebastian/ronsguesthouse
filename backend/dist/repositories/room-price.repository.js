"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomPriceRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.roomPriceRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.roomPrice.findMany(args),
    findById: (id, args, tx = prisma_1.prisma) => tx.roomPrice.findUnique({ where: { id }, ...args }),
    findByRoomAndDateRange: (roomId, startDate, endDate, tx = prisma_1.prisma) => tx.roomPrice.findMany({
        where: {
            roomId,
            date: { gte: startDate, lt: endDate },
        },
        orderBy: { date: 'asc' },
    }),
    upsert: (roomId, date, price, tx = prisma_1.prisma) => tx.roomPrice.upsert({
        where: { roomId_date: { roomId, date } },
        create: { roomId, date, price },
        update: { price },
    }),
    create: (args, tx = prisma_1.prisma) => tx.roomPrice.create(args),
    delete: (id, tx = prisma_1.prisma) => tx.roomPrice.delete({ where: { id } }),
    count: (args, tx = prisma_1.prisma) => tx.roomPrice.count(args),
};
