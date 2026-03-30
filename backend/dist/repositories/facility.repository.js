"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facilityRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.facilityRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.facility.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.facility.findUnique({ where: { id }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.facility.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.facility.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.facility.delete({ where: { id } }),
};
