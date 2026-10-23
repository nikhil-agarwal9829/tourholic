import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { AuditLog as AuditLogModel } from "@/models/AuditLog";
import { sendPaymentReminderNotification } from "@/lib/notifications/service";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronEnabled = process.env.AUTOMATIC_REMINDERS_ENABLED === "true";

    // 1. Enforce Cron Authorization
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized cron invocation." },
        { status: 401 }
      );
    }

    // 2. Check if automatic reminders are enabled in config
    if (!isCronEnabled) {
      return NextResponse.json({
        status: "success",
        message: "Automated payment reminders are disabled (AUTOMATIC_REMINDERS_ENABLED is not set to true).",
        processed: 0,
      });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { status: "error", message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find eligible bookings:
    // - confirmed (not cancelled, not completed)
    // - unpaid or pending
    // - deadline within 48 hours OR already overdue
    // - cooldown: last reminder sent > 24 hours ago or never
    const eligibleBookings = await BookingModel.find({
      bookingStatus: "confirmed",
      paymentStatus: { $in: ["unpaid", "pending"] },
      paymentDueAt: { $lte: fortyEightHoursFromNow },
      $or: [
        { lastPaymentReminderSentAt: { $exists: false } },
        { lastPaymentReminderSentAt: null },
        { lastPaymentReminderSentAt: { $lt: twentyFourHoursAgo } },
      ],
    })
      .populate("tour", "name price currency")
      .populate("user", "name email")
      .limit(25);

    let sentCount = 0;
    const results = [];

    for (const booking of eligibleBookings) {
      try {
        booking.lastPaymentReminderSentAt = now;
        booking.paymentReminderCount = (booking.paymentReminderCount || 0) + 1;
        await booking.save();

        const recipientUser = booking.user as any;
        const recipientTour = booking.tour as any;
        const customerEmail = booking.guestEmail || recipientUser?.email || "";

        const notifResult = await sendPaymentReminderNotification({
          userId: recipientUser?._id || booking.user,
          bookingId: booking._id,
          customerName: booking.guestName || recipientUser?.name || "Traveler",
          customerEmail,
          bookingReference: booking.bookingReference,
          tourName: recipientTour?.name || "Expedition Tour",
          departureDate: booking.departureDate,
          amountDue: booking.totalPrice,
          currency: booking.currency || "USD",
          paymentDueAt: booking.paymentDueAt,
          originUrl: request.nextUrl.origin,
        });

        results.push({
          bookingReference: booking.bookingReference,
          status: notifResult.emailResult?.status || "in_app_saved",
        });

        sentCount++;
      } catch (err: unknown) {
        console.error(`Error sending reminder for ${booking.bookingReference}:`, err);
      }
    }

    if (sentCount > 0) {
      await AuditLogModel.create({
        actorEmail: "cron-scheduler@touroholic.internal",
        actorRole: "system",
        action: "scheduled_reminder_batch",
        targetType: "System",
        targetId: "cron-payment-reminders",
        details: {
          processedCount: sentCount,
          executionTime: now,
          results,
        },
      });
    }

    return NextResponse.json({
      status: "success",
      message: `Automated reminder batch executed. Processed ${sentCount} booking(s).`,
      processed: sentCount,
      results,
    });
  } catch (error) {
    console.error("GET /api/cron/payment-reminders error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process automated reminders." },
      { status: 500 }
    );
  }
}
