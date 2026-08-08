import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma && (globalForPrisma.prisma as any).portalJob) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL environment variable is not defined");
    // Create a mock proxy that throws when used, but allows initialization to succeed
    prismaInstance = new Proxy({}, {
      get: function(target, prop) {
        return function() {
          throw new Error(`Cannot call prisma.${String(prop)}: DATABASE_URL is missing`);
        };
      }
    }) as any;
  } else {
    // Use pg Pool with Supabase transaction pooler (PgBouncer)
    const pool = new Pool({
      connectionString,
      max: 10,
    });
    const adapter = new PrismaPg(pool);

    prismaInstance = new PrismaClient({ adapter });
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
