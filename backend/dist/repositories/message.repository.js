"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.messageRepository = {
    findAll: (args, tx = prisma_1.prisma) => tx.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, ...args }),
    findById: (id, args, tx = prisma_1.prisma) => tx.contactMessage.findUnique({ where: { id }, ...args }),
    create: (args, tx = prisma_1.prisma) => tx.contactMessage.create(args),
    update: (id, args, tx = prisma_1.prisma) => tx.contactMessage.update({ where: { id }, ...args }),
    delete: (id, tx = prisma_1.prisma) => tx.contactMessage.delete({ where: { id } }),
};
