"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.galleryRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.galleryRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.gallery.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.gallery.findUnique({ where: { id }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.gallery.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.gallery.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.gallery.delete({ where: { id } }),
};
