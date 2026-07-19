import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL bypasses PgBouncer for Prisma Migrate (required for DDL)
    url: process.env["DIRECT_URL"]!,
    adapter: () => {
      const pool = new Pool({
        connectionString: process.env["DATABASE_URL"]!,
        max: 10,
      });
      return new PrismaPg(pool);
    },
  },
});
