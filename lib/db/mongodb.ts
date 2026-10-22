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
export function isMongoConfigured(): boolean {
  return Boolean(MONGODB_URI && MONGODB_URI.trim().startsWith("mongodb"));
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (!isMongoConfigured()) {
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

    cached!.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongooseInstance) => {
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
