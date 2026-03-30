"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amenityRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.amenityRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.amenity.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, tx = prisma_1.prisma) => tx.amenity.findUnique({ where: { id } }),
    create: (args, tx = prisma_1.prisma) => tx.amenity.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.amenity.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.amenity.delete({ where: { id } }),
};
