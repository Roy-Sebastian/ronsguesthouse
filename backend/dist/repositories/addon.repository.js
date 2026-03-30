"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addonRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.addonRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.addOn.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.addOn.findUnique({ where: { id }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.addOn.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.addOn.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.addOn.delete({ where: { id } }),
};
