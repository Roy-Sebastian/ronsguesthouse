import { prisma } from '../config/prisma';
async function main() {
  await prisma.gallery.deleteMany({});
  console.log('Cleaned up gallery table!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
