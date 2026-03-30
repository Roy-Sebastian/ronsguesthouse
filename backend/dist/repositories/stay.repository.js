"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stayRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.stayRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.stay.findMany({ orderBy: { checkInAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.stay.findUnique({ where: { id }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.stay.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.stay.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.stay.delete({ where: { id } }),
    count: (args, tx = prisma_1.prisma) => tx.stay.count(args),
};
