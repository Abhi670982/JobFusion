const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

async function run() {
  console.log(`Connecting to Postgres database via Prisma...`);
  
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany();
    
    console.log("\nRegistered Users in PostgreSQL (Supabase):");
    console.log("================================================================================");
    if (users.length === 0) {
      console.log("No users found in database.");
    } else {
      users.forEach(u => {
        console.log(`Name: ${u.fullName} | Email: ${u.email} | ClerkID: ${u.clerkId} | Role: ${u.role} | Status: ${u.status}`);
      });
    }
    console.log("================================================================================");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Error running script:", err);
  process.exit(1);
});
