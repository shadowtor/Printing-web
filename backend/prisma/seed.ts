import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Placeholder seed: extend this with real seed data as needed.
  await prisma.$connect();
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

