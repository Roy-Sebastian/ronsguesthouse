"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbRepository = void 0;
const prisma_1 = require("../config/prisma");
exports.dbRepository = {
    transaction: (fn) => {
        return prisma_1.prisma.$transaction(fn);
    },
    executeRaw: (query, tx) => {
        return (tx || prisma_1.prisma).$executeRawUnsafe(query);
    }
};
