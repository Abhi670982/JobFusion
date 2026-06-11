import mongoose from "mongoose";

// ─── Global cache for Vercel/serverless hot-reload safety ────────────────────
// In development, Next.js clears module cache on every hot-reload but we want
// to reuse the existing mongoose connection. We store it on `global` so it
// survives module re-evaluation between hot-reloads and between serverless
// function invocations in production.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | null;
}

if (!global._mongooseConn) {
  global._mongooseConn = null;
}
if (!global._mongoosePromise) {
  global._mongoosePromise = null;
}

export async function connectDB(): Promise<void> {
  // Disable Mongoose command buffering globally to prevent silent hangs if connection drops
  mongoose.set('bufferCommands', false);

  // NOTE: MONGODB_URI is intentionally accessed inside the function —
  // NOT at module evaluation time — so the build never crashes when the
  // env-var is absent during static generation.
  const MONGODB_URI = process.env.MONGODB_URI;

  console.log(`[DB] connectDB() called. Mongoose readyState: ${mongoose.connection.readyState}`);

  if (!MONGODB_URI) {
    console.error("[DB] MongoDB Connection Failed: MONGODB_URI is not defined");
    // Throw at runtime so the API route returns a 500 instead of crashing
    // the entire build.
    throw new Error(
      "MONGODB_URI environment variable is not defined. " +
        "Add it to your .env.local or Vercel project settings."
    );
  }

  // Already connected — reuse existing connection
  if (mongoose.connection.readyState === 1) {
    console.log("[DB] MongoDB Connected (reused existing connection)");
    return;
  }

  // If we are connecting (readyState === 2), wait for the active promise
  if (mongoose.connection.readyState === 2 && global._mongoosePromise) {
    console.log("[DB] MongoDB is already connecting. Waiting for existing connection promise...");
    await global._mongoosePromise;
    return;
  }

  // Otherwise, if state is disconnected (0) or disconnecting (3), reset the stale promise
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    if (global._mongoosePromise) {
      console.log("[DB] Mongoose is disconnected but stale promise exists. Resetting promise...");
      global._mongoosePromise = null;
    }
  }

  // Start a new connection and cache the promise
  const opts: mongoose.ConnectOptions = {
    bufferCommands: false,
  };

  console.log("[DB] Initiating new MongoDB connection...");
  global._mongoosePromise = mongoose.connect(MONGODB_URI, opts).then((m) => {
    console.log("[DB] MongoDB Connected Successfully");
    global._mongooseConn = m;
    return m;
  }).catch((err) => {
    console.error("[DB] MongoDB Connection Failed:", err);
    global._mongoosePromise = null;
    throw err;
  });

  try {
    await global._mongoosePromise;
  } catch (error) {
    global._mongoosePromise = null;
    throw error;
  }
}