import "dotenv/config";
import { RoleType, RoomType, RoomStatus } from "@prisma/client";
import process from "process";
import { auth } from "../src/config/auth";
import { prisma } from "../src/config/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  // Create superadmin
  const saResult = await auth.api.signUpEmail({
    body: {
      name: "Super Admin",
      email: "superadmin@ronsguesthouse.com",
      password: "Admin@12345",
    },
  });

  await prisma.user.update({
    where: { email: "superadmin@ronsguesthouse.com" },
    data: { role: RoleType.superadmin, isActive: true },
  });

  // Create admin
  const adminResult = await auth.api.signUpEmail({
    body: {
      name: "Admin Ron",
      email: "admin@ronsguesthouse.com",
      password: "Admin@12345",
    },
  });

  await prisma.user.update({
    where: { email: "admin@ronsguesthouse.com" },
    data: { role: RoleType.admin, phone: "081234567890", isActive: true },
  });

  // Create receptionist
  await auth.api.signUpEmail({
    body: {
      name: "Receptionist Sari",
      email: "receptionist@ronsguesthouse.com",
      password: "Admin@12345",
    },
  });

  await prisma.user.update({
    where: { email: "receptionist@ronsguesthouse.com" },
    data: { role: RoleType.receptionist, phone: "082345678901", isActive: true },
  });

  console.log("✅ Users created");

  // Create amenities
  const amenities = await Promise.all([
    prisma.amenity.upsert({ where: { name: "AC" }, update: {}, create: { name: "AC", icon: "AirVent" } }),
    prisma.amenity.upsert({ where: { name: "WiFi" }, update: {}, create: { name: "WiFi", icon: "Wifi" } }),
    prisma.amenity.upsert({ where: { name: "TV" }, update: {}, create: { name: "TV", icon: "Tv" } }),
    prisma.amenity.upsert({ where: { name: "Kamar Mandi Dalam" }, update: {}, create: { name: "Kamar Mandi Dalam", icon: "Bath" } }),
    prisma.amenity.upsert({ where: { name: "Kulkas" }, update: {}, create: { name: "Kulkas", icon: "Package" } }),
    prisma.amenity.upsert({ where: { name: "Water Heater" }, update: {}, create: { name: "Water Heater", icon: "Flame" } }),
  ]);

  console.log("✅ Amenities created");

  // Create facilities
  await Promise.all([
    prisma.facility.create({ data: { name: "Parkir Gratis", description: "Area parkir luas tersedia gratis", icon: "Car" } }),
    prisma.facility.create({ data: { name: "WiFi Gratis", description: "Koneksi internet WiFi di seluruh area", icon: "Wifi" } }),
    prisma.facility.create({ data: { name: "Sarapan", description: "Sarapan pagi termasuk dalam paket tertentu", icon: "Coffee" } }),
    prisma.facility.create({ data: { name: "Resepsionis 24 Jam", description: "Staf siap melayani 24 jam penuh", icon: "Clock" } }),
    prisma.facility.create({ data: { name: "Taman", description: "Taman asri untuk bersantai", icon: "TreePine" } }),
  ]);

  console.log("✅ Facilities created");

  // Gallery seeding removed as per user request to start fresh
  console.log("\n🎉 Seeding completed!");
  console.log("\n📋 Login credentials:");
  console.log("   SuperAdmin: superadmin@ronsguesthouse.com / Admin@12345");
  console.log("   Admin:      admin@ronsguesthouse.com / Admin@12345");
  console.log("   Receptionist: receptionist@ronsguesthouse.com / Admin@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
