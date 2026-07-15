/**
 * One-time migration: create recency and TTL indexes on the live Jobs collection.
 *
 * Required env: MONGODB_URI
 */

import { connectDB } from "../src/lib/mongodb";
import Job from "../src/models/Job";

async function migrate() {
  try {
    // If not defined, try to load from the root .env file
    if (!process.env.MONGODB_URI) {
      const fs = require("fs");
      const path = require("path");
      const envPath = path.resolve(__dirname, "../.env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        envContent.split("\n").forEach((line: string) => {
          const match = line.trim().match(/^([^#=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove wrapping quotes if any
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.substring(1, value.length - 1);
            }
            process.env[key] = value;
          }
        });
      }
    }

    console.log("[Migration] Connecting to MongoDB...");
    await connectDB();

    console.log("[Migration] Creating TTL index on expiresAt...");
    await Job.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log("[Migration] Creating index on postedAtDate + isActive + source...");
    await Job.collection.createIndex({ postedAtDate: -1, isActive: 1, source: 1 });

    console.log("[Migration] Creating index on matchedSkill + postedAtDate...");
    await Job.collection.createIndex({ matchedSkill: 1, postedAtDate: -1 });

    console.log("[Migration] Recency indexes created successfully.");
    process.exit(0);
  } catch (err: any) {
    console.error("[Migration] Fatal migration error:", err.message);
    process.exit(1);
  }
}

migrate();
