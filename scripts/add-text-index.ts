/**
 * One-time migration: create weighted text index on the live Jobs collection.
 *
 * The Mongoose schema definition in Job.ts only creates the index for NEW
 * collections. For an existing Atlas database with thousands of documents
 * already in it, run this script once to retroactively apply the index.
 *
 * Run with:
 *   npx tsx scripts/add-text-index.ts
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

    // Drop any existing conflicting text index before creating the new one.
    // The catch ignores the error if the index doesn't exist yet.
    console.log("[Migration] Dropping existing text index (if any)...");
    await Job.collection
      .dropIndex("title_text_company_text_description_text")
      .catch(() => {
        console.log("[Migration] No conflicting index found, skipping drop.");
      });
    await Job.collection
      .dropIndex("jobs_text_search")
      .catch(() => {});

    // Create the weighted compound text index
    console.log("[Migration] Creating weighted text index...");
    await Job.collection.createIndex(
      {
        title: "text",
        company: "text",
        skills: "text",
        description: "text",
      },
      {
        weights: { title: 10, skills: 8, company: 5, description: 1 },
        name: "jobs_text_search",
      }
    );

    console.log(
      "[Migration] ✅ Text index 'jobs_text_search' created successfully."
    );
    process.exit(0);
  } catch (err: any) {
    console.error("[Migration] ❌ Failed:", err.message);
    process.exit(1);
  }
}

migrate();
