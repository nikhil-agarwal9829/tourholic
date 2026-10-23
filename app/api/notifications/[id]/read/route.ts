import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Notification as NotificationModel } from "@/models/Notification";
import mongoose from "mongoose";

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { status: "error", message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid notification ID." },
        { status: 400 }
      );
    }

    const notif = await NotificationModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(session.userId),
    });

    if (!notif) {
      return NextResponse.json(
        { status: "error", message: "Notification not found." },
        { status: 404 }
      );
    }

    notif.read = true;
    notif.readAt = new Date();
    await notif.save();

    return NextResponse.json({
      status: "success",
      message: "Notification marked as read.",
      data: notif,
    });
  } catch (error) {
    console.error("PATCH /api/notifications/[id]/read error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update notification." },
      { status: 500 }
    );
  }
}
