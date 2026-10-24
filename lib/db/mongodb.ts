import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Returns true if a valid MongoDB connection string is provided in env.
 */
function getMongoUri(): string | undefined {
  return process.env.MONGODB_URI;
}

export function isMongoConfigured(): boolean {
  const uri = getMongoUri();
  return Boolean(uri && uri.trim().startsWith("mongodb"));
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const uri = getMongoUri();
  if (!uri || !isMongoConfigured()) {
    return null;
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = mongoose.connect(uri, opts).then(async (mongooseInstance) => {
      // Ensure all models are registered in Mongoose schema registry
      await import("@/models/Tour");
      await import("@/models/User");
      await import("@/models/Booking");
      await import("@/models/Review");
      await import("@/models/TourDeparture");
      await import("@/models/Notification");
      await import("@/models/AuditLog");
      await import("@/models/Payment");
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
    return cached!.conn;
  } catch (error) {
    cached!.promise = null;
    console.error("Failed to connect to MongoDB Atlas:", error);
    return null;
  }
}
