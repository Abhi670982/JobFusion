import mongoose from "mongoose";

// ─── Global cache for Vercel/serverless hot-reload safety ────────────────────
declare global {
  var _mongooseConn: typeof mongoose | null;
  var _mongoosePromise: Promise<typeof mongoose> | null;
}

if (!global._mongooseConn) {
  global._mongooseConn = null;
}
if (!global._mongoosePromise) {
  global._mongoosePromise = null;
}

export async function connectDB(): Promise<void> {
  const MONGODB_URI = process.env.MONGODB_URI;

  // 👇 ADD THESE LOGS
  console.log("=================================");
  console.log("Mongo URI:", MONGODB_URI);
  console.log("=================================");

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI environment variable is not defined. " +
        "Add it to your .env.local or Vercel project settings."
    );
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (global._mongoosePromise) {
    await global._mongoosePromise;
    return;
  }

  const opts: mongoose.ConnectOptions = {
    bufferCommands: false,
  };

  global._mongoosePromise = mongoose.connect(MONGODB_URI, opts).then((m) => {
    console.log("✅ MongoDB Connected");
    global._mongooseConn = m;
    return m;
  });

  try {
    await global._mongoosePromise;
  } catch (error) {
    global._mongoosePromise = null;
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
}