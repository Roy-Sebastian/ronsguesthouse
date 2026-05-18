import "dotenv/config";
import { prisma } from '../config/prisma';

async function main() {
  console.log('Seeding dummy reviews...');
  
  const guest = await prisma.guest.create({
    data: {
      fullName: 'Dummy Guest',
      phone: '08123456789',
      email: 'dummy@example.com'
    }
  });

  const room = await prisma.room.findFirst();

  if (!room) {
    console.log('No room found!');
    return;
  }

  const user = await prisma.user.findFirst();

  const reviewsData = [
    { name: 'Budi Santoso', comment: 'Tempatnya sangat nyaman dan bersih. Pelayanan juga ramah. Sangat direkomendasikan!', rating: 5 },
    { name: 'Siti Aminah', comment: 'Lokasi strategis, dekat dengan tempat wisata. Sarapannya juga enak.', rating: 4 },
    { name: 'Andi Wijaya', comment: 'Fasilitas lengkap dan kamar sangat terawat. Harga sepadan dengan kualitas yang didapat.', rating: 5 },
    { name: 'Rina Marlina', comment: 'Suasana tenang, cocok untuk istirahat keluarga. Pasti akan kembali lagi ke sini.', rating: 5 }
  ];

  for (let i = 0; i < reviewsData.length; i++) {
    const data = reviewsData[i];
    
    const res = await prisma.reservation.create({
      data: {
        bookingCode: `DUMMY-REV-${i}`,
        guestId: guest.id,
        roomId: room.id,
        userId: user!.id,
        checkInDate: new Date(),
        checkOutDate: new Date(),
        totalPrice: 500000,
        status: 'checked_out'
      }
    });

    await prisma.review.create({
      data: {
        guestId: guest.id,
        reservationId: res.id,
        rating: data.rating,
        displayName: data.name,
        comment: data.comment,
        status: 'approved'
      }
    });
  }
  
  console.log('Dummy reviews seeded!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
