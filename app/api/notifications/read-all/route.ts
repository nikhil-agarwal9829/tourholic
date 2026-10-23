import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Notification as NotificationModel } from "@/models/Notification";
import mongoose from "mongoose";

export async function PATCH() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
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

    await NotificationModel.updateMany(
      {
        user: new mongoose.Types.ObjectId(session.userId),
        read: false,
      },
      {
        $set: { read: true, readAt: new Date() },
      }
    );

    return NextResponse.json({
      status: "success",
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("PATCH /api/notifications/read-all error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to mark notifications as read." },
      { status: 500 }
    );
  }
}
