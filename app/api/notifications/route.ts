import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Notification as NotificationModel } from "@/models/Notification";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { status: "error", message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    const userObjectId = new mongoose.Types.ObjectId(session.userId);

    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find({ user: userObjectId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments({ user: userObjectId, read: false }),
    ]);

    return NextResponse.json({
      status: "success",
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}
