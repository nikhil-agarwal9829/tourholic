import { NextResponse } from "next/server";
import { connectToDatabase, isMongoConfigured } from "@/lib/db/mongodb";

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      {
        success: false,
        service: "mongodb",
        status: "missing_configuration",
        message: "MONGODB_URI is not set in environment variables.",
      },
      { status: 503 }
    );
  }

  try {
    const mongooseInstance = await connectToDatabase();
    if (!mongooseInstance || !mongooseInstance.connection?.db) {
      return NextResponse.json(
        {
          success: false,
          service: "mongodb",
          status: "connection_failed",
          message: "Unable to establish connection to MongoDB Atlas. Check IP access list or network access.",
        },
        { status: 503 }
      );
    }

    const pingResult = await mongooseInstance.connection.db.admin().ping();
    if (pingResult && pingResult.ok === 1) {
      return NextResponse.json({
        success: true,
        service: "mongodb",
        status: "connected",
      });
    }

    return NextResponse.json(
      {
        success: false,
        service: "mongodb",
        status: "unhealthy",
        message: "MongoDB ping command returned unexpected status.",
      },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        service: "mongodb",
        status: "error",
        message: "Failed to communicate with MongoDB Atlas. Verify that client IP is whitelisted in Atlas Security settings.",
      },
      { status: 503 }
    );
  }
}
