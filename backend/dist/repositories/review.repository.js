"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.reviewRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.review.findMany({ ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.review.findUnique({ where: { id }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.review.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.review.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.review.delete({ where: { id } }),
};
