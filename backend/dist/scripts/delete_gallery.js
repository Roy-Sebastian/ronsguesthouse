"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
async function main() {
    await prisma_1.prisma.gallery.deleteMany({});
    console.log('Cleaned up gallery table!');
}
main().catch(console.error).finally(() => prisma_1.prisma.$disconnect());
