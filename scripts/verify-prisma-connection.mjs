import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function mask(url) {
  return (url || "").replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  console.log("DATABASE_URL:", mask(databaseUrl));
  console.log("DIRECT_URL:", mask(directUrl));

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("\n1) Raw SELECT 1...");
    const raw = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log("   OK:", raw);

    console.log("2) Count users...");
    const userCount = await prisma.user.count();
    console.log("   users:", userCount);

    console.log("3) Count jobs...");
    const jobCount = await prisma.job.count();
    console.log("   jobs:", jobCount);

    console.log("4) Count profiles...");
    const profileCount = await prisma.profile.count();
    console.log("   profiles:", profileCount);

    console.log("5) Count settings...");
    const settingsCount = await prisma.settings.count();
    console.log("   settings:", settingsCount);

    console.log("6) Sample user findFirst...");
    const sample = await prisma.user.findFirst({
      select: { id: true, email: true, clerkId: true, role: true },
    });
    console.log("   sample:", sample);

    console.log("\nAll Prisma runtime checks passed.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("\nFAILED:", err.message);
  if (err.code) console.error("code:", err.code);
  if (err.meta) console.error("meta:", err.meta);
  process.exit(1);
});
