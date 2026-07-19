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

const email = process.argv[2];
if (!email) {
  console.log("Usage: node scripts/make-admin.js <email>");
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
    const targetEmail = email.trim().toLowerCase();
    
    // Find user (case-insensitive email matching)
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: targetEmail,
          mode: "insensitive"
        }
      }
    });

    if (!user) {
      console.log(`User with email '${targetEmail}' not found. Pre-creating admin user in PostgreSQL...`);
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          fullName: targetEmail.split("@")[0].replace(/\b\w/g, c => c.toUpperCase()),
          role: "admin",
          clerkId: `preseeded_admin_${Date.now()}`
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "admin" }
      });
    }

    console.log(`\n========================================`);
    console.log(`✅ Success! Promoted '${user.fullName}' to admin.`);
    console.log(`User email: ${user.email}`);
    console.log(`User role: ${user.role}`);
    console.log(`========================================`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ Error running script:", err);
  process.exit(1);
});
