const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load MONGODB_URI from .env.local
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

const email = process.argv[2];
if (!email) {
  console.log("Usage: node scripts/make-admin.js <email>");
  process.exit(1);
}

async function run() {
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongodbUri);
  console.log("Connected successfully.");

  // Inline User schema definition
  const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
    fullName: String,
  }, { collection: "users" });
  
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  let user = await User.findOne({ email: new RegExp(`^${email.trim()}$`, "i") });
  if (!user) {
    console.log(`User with email '${email}' not found. Pre-creating admin user document in MongoDB...`);
    user = await User.create({
      email: email.trim().toLowerCase(),
      fullName: email.split("@")[0].replace(/\b\w/g, c => c.toUpperCase()),
      role: "admin",
      clerkId: `preseeded_admin_${Date.now()}`
    });
  } else {
    user.role = "admin";
    await user.save();
  }
  console.log(`\n========================================`);
  console.log(`✅ Success! promoted '${user.fullName}' to admin.`);
  console.log(`User email: ${user.email}`);
  console.log(`User role: ${user.role}`);
  console.log(`========================================`);
  
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Error running script:", err);
  process.exit(1);
});
