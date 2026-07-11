const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

let mongodbUri = "";
try {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    const matches = envFile.match(/MONGODB_URI\s*=\s*(.*)/);
    if (matches && matches[1]) {
      mongodbUri = matches[1].trim();
    }
  }
} catch (err) {
  console.error("Failed to parse .env.local:", err.message);
}

if (!mongodbUri) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function run() {
  await mongoose.connect(mongodbUri);
  const UserSchema = new mongoose.Schema({
    clerkId: String,
    fullName: String,
    email: String,
    role: String,
    status: String,
  }, { collection: "users" });
  
  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const users = await User.find({}).lean();
  
  console.log("\nRegistered Users in MongoDB:");
  console.log("================================================================================");
  if (users.length === 0) {
    console.log("No users found in database.");
  } else {
    users.forEach(u => {
      console.log(`Name: ${u.fullName} | Email: ${u.email} | ClerkID: ${u.clerkId} | Role: ${u.role} | Status: ${u.status}`);
    });
  }
  console.log("================================================================================");
  
  await mongoose.disconnect();
}

run().catch(console.error);
