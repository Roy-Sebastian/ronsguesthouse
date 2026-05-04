import "dotenv/config";
import { RoleType } from "@prisma/client";
import process from "process";
import { auth } from "../dist/config/auth";
import { prisma } from "../dist/config/prisma";

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
