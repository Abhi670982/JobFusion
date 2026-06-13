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
  // NOTE: MONGODB_URI is intentionally accessed inside the function —
  // NOT at module evaluation time — so the build never crashes when the
  // env-var is absent during static generation.
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    // Throw at runtime so the API route returns a 500 instead of crashing
    // the entire build.
    throw new Error(
      "MONGODB_URI environment variable is not defined. " +
        "Add it to your .env.local or Vercel project settings."
    );
  }

  // Already connected — reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Another invocation already started connecting — wait for it
  if (global._mongoosePromise) {
    await global._mongoosePromise;
    return;
  }

  // Start a new connection and cache the promise
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
    // Reset so the next invocation retries
    global._mongoosePromise = null;
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
}