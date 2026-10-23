import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { AuditLog as AuditLogModel } from "@/models/AuditLog";
import { sendPaymentReminderNotification } from "@/lib/notifications/service";
import mongoose from "mongoose";

const COOLDOWN_HOURS = Number(process.env.PAYMENT_REMINDER_COOLDOWN_HOURS) || 24;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Forbidden: Administrator privileges required." },
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

    const bookingQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: new mongoose.Types.ObjectId(id) }
      : { bookingReference: id };

    const booking = await BookingModel.findOne(bookingQuery)
      .populate("tour", "name price currency destination")
      .populate("user", "name email");

    if (!booking) {
      return NextResponse.json(
        { status: "error", message: "Booking reservation not found." },
        { status: 404 }
      );
    }

    // 1. Eligibility validation
    if (booking.bookingStatus === "cancelled") {
      return NextResponse.json(
        { status: "error", message: "Cannot send payment reminder for a cancelled reservation." },
        { status: 400 }
      );
    }

    if (booking.bookingStatus === "completed") {
      return NextResponse.json(
        { status: "error", message: "Cannot send payment reminder for an already completed tour." },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json(
        {
          status: "error",
          message: `Booking ${booking.bookingReference} is already paid. Payment reminders are disabled.`,
        },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === "refunded") {
      return NextResponse.json(
        { status: "error", message: "Booking has already been refunded. Payment reminders are disabled." },
        { status: 400 }
      );
    }

    // 2. Cooldown validation
    const now = new Date();
    if (booking.lastPaymentReminderSentAt) {
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      const lastSentTime = new Date(booking.lastPaymentReminderSentAt).getTime();
      const nextAllowedTime = new Date(lastSentTime + cooldownMs);

      if (now.getTime() < nextAllowedTime.getTime()) {
        const remainingHours = Math.ceil((nextAllowedTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        return NextResponse.json(
          {
            status: "error",
            message: `A payment reminder was recently sent on ${new Date(
              booking.lastPaymentReminderSentAt
            ).toLocaleString()}. Cooldown active: next reminder allowed in ~${remainingHours} hour(s) (after ${nextAllowedTime.toLocaleString()}).`,
            nextAllowedAt: nextAllowedTime.toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // 3. Update reminder counters
    booking.lastPaymentReminderSentAt = now;
    booking.paymentReminderCount = (booking.paymentReminderCount || 0) + 1;
    await booking.save();

    // 4. Record Audit Log
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const recipientUser = booking.user as any;
    const recipientTour = booking.tour as any;
    const customerEmail = booking.guestEmail || recipientUser?.email || "";

    await AuditLogModel.create({
      actorId: new mongoose.Types.ObjectId(session.userId),
      actorEmail: session.email,
      actorRole: session.role,
      action: "payment_reminder_sent",
      targetType: "Booking",
      targetId: booking._id.toString(),
      targetReference: booking.bookingReference,
      details: {
        reminderCount: booking.paymentReminderCount,
        amountDue: booking.totalPrice,
        currency: booking.currency || "USD",
        paymentDueAt: booking.paymentDueAt,
        customerEmail,
      },
      ipAddress: clientIp,
    });

    // 5. Dispatch notification (in-app + email)
    const notificationResult = await sendPaymentReminderNotification({
      userId: recipientUser?._id || booking.user,
      bookingId: booking._id,
      customerName: booking.guestName || recipientUser?.name || "Explorer",
      customerEmail,
      bookingReference: booking.bookingReference,
      tourName: recipientTour?.name || "Expedition Tour",
      departureDate: booking.departureDate,
      amountDue: booking.totalPrice,
      currency: booking.currency || "USD",
      paymentDueAt: booking.paymentDueAt || new Date(Date.now() + 3 * 86400000),
      originUrl: request.nextUrl.origin,
    });

    return NextResponse.json({
      status: "success",
      message: `Payment reminder successfully sent to ${customerEmail}.`,
      data: {
        bookingReference: booking.bookingReference,
        recipientEmail: customerEmail,
        lastPaymentReminderSentAt: booking.lastPaymentReminderSentAt,
        reminderCount: booking.paymentReminderCount,
        inAppNotificationSaved: Boolean(notificationResult.notification),
        emailDeliveryStatus: notificationResult.emailResult?.status || "skipped_no_provider",
        emailDeliveryProvider: notificationResult.emailResult?.provider || "none",
        emailMessage: notificationResult.emailResult?.error || "Notification delivered",
      },
    });
  } catch (error) {
    console.error("POST /api/admin/bookings/[id]/remind error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to send payment reminder." },
      { status: 500 }
    );
  }
}
