import 'dotenv/config';
import { prisma } from '../config/prisma';
import { encryptKtp, hashKtp } from '../utils/crypto.util';

async function migrateKtp() {
  console.log('Fetching all existing guests with plaintext ID numbers...');
  
  const guests = await prisma.guest.findMany({
    where: {
      idNumber: { not: null },
      idNumberEncrypted: null // only migrate those that haven't been migrated
    }
  });

  console.log(`Found ${guests.length} guests to migrate.`);

  let successCount = 0;
  let failCount = 0;

  for (const guest of guests) {
    if (!guest.idNumber) continue;
    
    try {
      const encrypted = encryptKtp(guest.idNumber);
      const hashed = hashKtp(guest.idNumber);

      await prisma.guest.update({
        where: { id: guest.id },
        data: {
          idNumberEncrypted: encrypted,
          idNumberHash: hashed,
          // Note: In a final production pass, you would set idNumber: null here
          // idNumber: null 
        }
      });
      successCount++;
    } catch (error) {
      console.error(`Failed to migrate guest ${guest.id}:`, error);
      failCount++;
    }
  }

  console.log(`\nMigration Complete!`);
  console.log(`- Successfully encrypted: ${successCount}`);
  console.log(`- Failed: ${failCount}`);
  
  await prisma.$disconnect();
}

migrateKtp().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
