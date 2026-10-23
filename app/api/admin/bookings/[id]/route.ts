import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { Notification as NotificationModel } from "@/models/Notification";
import { AuditLog as AuditLogModel } from "@/models/AuditLog";
import mongoose from "mongoose";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Forbidden: Admin privileges required." },
        { status: 403 }
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

    // Lookup booking by ObjectId or bookingReference
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: new mongoose.Types.ObjectId(id) }
      : { bookingReference: id };

    const booking = await BookingModel.findOne(query)
      .populate("tour")
      .populate("user", "name email role photo createdAt")
      .populate("departureSchedule")
      .populate("cancelledBy", "name email")
      .populate("paymentReconciledBy", "name email")
      .lean();

    if (!booking) {
      return NextResponse.json(
        { status: "error", message: "Booking reservation not found." },
        { status: 404 }
      );
    }

    // Fetch related notification history and audit logs
    const [notifications, auditLogs] = await Promise.all([
      NotificationModel.find({ booking: booking._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      AuditLogModel.find({ targetId: booking._id.toString() })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return NextResponse.json({
      status: "success",
      data: {
        booking,
        notifications,
        auditLogs,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/bookings/[id] error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch booking reservation details." },
      { status: 500 }
    );
  }
}
