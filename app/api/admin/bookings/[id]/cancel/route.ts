import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { TourDeparture as TourDepartureModel } from "@/models/TourDeparture";
import { AuditLog as AuditLogModel } from "@/models/AuditLog";
import { sendCancellationNotification } from "@/lib/notifications/service";
import mongoose from "mongoose";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().min(3, "Cancellation reason must be at least 3 characters long"),
  policyAcknowledged: z.boolean().optional(),
});

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
    const body = await request.json().catch(() => ({}));
    const parseResult = cancelSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: parseResult.error.issues[0]?.message || "Invalid cancellation data",
        },
        { status: 400 }
      );
    }

    const { reason } = parseResult.data;

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

    // Eligibility check
    if (booking.bookingStatus === "cancelled") {
      return NextResponse.json(
        {
          status: "error",
          message: `Booking ${booking.bookingReference} is already cancelled.`,
        },
        { status: 400 }
      );
    }

    if (booking.bookingStatus === "completed") {
      return NextResponse.json(
        {
          status: "error",
          message: "Completed expeditions cannot be cancelled.",
        },
        { status: 400 }
      );
    }

    const previousStatus = booking.bookingStatus;
    const isPaid = booking.paymentStatus === "paid";

    // 1. Release reserved seats on departure schedule
    let seatsReleased = 0;
    if (booking.departureSchedule || (booking.tour && booking.departureDate)) {
      const departure = booking.departureSchedule
        ? await TourDepartureModel.findById(booking.departureSchedule)
        : await TourDepartureModel.findOne({
            tour: (booking.tour as any)._id || booking.tour,
            startDate: booking.departureDate,
          });

      if (departure) {
        departure.reservedSeats = Math.max(0, departure.reservedSeats - booking.travelers);
        if (departure.status === "sold_out" && departure.reservedSeats < departure.capacity) {
          departure.status = departure.reservedSeats >= departure.capacity * 0.8 ? "limited" : "open";
        }
        await departure.save();
        seatsReleased = booking.travelers;
      }
    }

    // 2. Update booking status and cancellation metadata
    booking.bookingStatus = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = new mongoose.Types.ObjectId(session.userId);
    booking.cancellationReason = reason.trim();
    booking.cancellationPolicySnapshot =
      "Standard Touroholic Policy: Reservation cancelled by administrator. Seats released to inventory. Paid reservations require manual financial reconciliation.";

    await booking.save();

    // 3. Record administrative Audit Log
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    await AuditLogModel.create({
      actorId: new mongoose.Types.ObjectId(session.userId),
      actorEmail: session.email,
      actorRole: session.role,
      action: "booking_cancellation",
      targetType: "Booking",
      targetId: booking._id.toString(),
      targetReference: booking.bookingReference,
      details: {
        reason: booking.cancellationReason,
        previousStatus,
        totalPrice: booking.totalPrice,
        travelersReleased: seatsReleased,
        isPaid,
        refundActionRequired: isPaid,
      },
      ipAddress: clientIp,
    });

    // 4. Send customer in-app notification & email safely
    const recipientUser = booking.user as any;
    const recipientTour = booking.tour as any;

    let notificationResult: any = null;
    try {
      notificationResult = await sendCancellationNotification({
        userId: recipientUser?._id || booking.user,
        bookingId: booking._id,
        customerName: booking.guestName || recipientUser?.name || "Valued Traveler",
        customerEmail: booking.guestEmail || recipientUser?.email || "",
        bookingReference: booking.bookingReference,
        tourName: recipientTour?.name || "Expedition Tour",
        departureDate: booking.departureDate,
        totalPrice: booking.totalPrice,
        currency: booking.currency || "USD",
        cancellationReason: booking.cancellationReason,
        isPaid,
      });
    } catch (notifErr) {
      console.error("Non-fatal cancellation notification dispatch error:", notifErr);
    }

    return NextResponse.json({
      status: "success",
      message: `Booking ${booking.bookingReference} has been cancelled successfully.`,
      data: {
        bookingReference: booking.bookingReference,
        bookingStatus: booking.bookingStatus,
        cancelledAt: booking.cancelledAt,
        cancelledBy: session.email,
        cancellationReason: booking.cancellationReason,
        seatsReleased,
        refundActionRequired: isPaid,
        notificationDeliveryStatus: notificationResult.emailResult?.status || "in_app_only",
      },
    });
  } catch (error) {
    console.error("POST /api/admin/bookings/[id]/cancel error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process booking cancellation." },
      { status: 500 }
    );
  }
}
