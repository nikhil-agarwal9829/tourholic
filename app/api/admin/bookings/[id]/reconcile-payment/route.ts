import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { AuditLog as AuditLogModel } from "@/models/AuditLog";
import { dispatchNotification } from "@/lib/notifications/service";
import mongoose from "mongoose";
import { z } from "zod";

const reconcileSchema = z.object({
  paymentReference: z.string().min(3, "Payment reference or transaction ID is required (min 3 chars)"),
  paymentMethod: z.string().min(2, "Payment method is required"),
  notes: z.string().min(5, "Reconciliation audit note is required (min 5 chars) explaining verification source"),
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
    const parseResult = reconcileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: parseResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const { paymentReference, paymentMethod, notes } = parseResult.data;

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
      .populate("tour", "name price currency")
      .populate("user", "name email");

    if (!booking) {
      return NextResponse.json(
        { status: "error", message: "Booking reservation not found." },
        { status: 404 }
      );
    }

    if (booking.bookingStatus === "cancelled") {
      return NextResponse.json(
        { status: "error", message: "Cannot reconcile payment on a cancelled reservation." },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json(
        { status: "error", message: "Booking is already marked as paid." },
        { status: 400 }
      );
    }

    const now = new Date();
    booking.paymentStatus = "paid";
    booking.paidAt = now;
    booking.paymentReference = paymentReference.trim();
    booking.paymentMethod = paymentMethod.trim();
    booking.paymentReconciledBy = new mongoose.Types.ObjectId(session.userId);
    booking.paymentReconciledAt = now;
    booking.paymentReconciliationNotes = notes.trim();

    await booking.save();

    // Record Audit Log
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    await AuditLogModel.create({
      actorId: new mongoose.Types.ObjectId(session.userId),
      actorEmail: session.email,
      actorRole: session.role,
      action: "payment_reconciliation",
      targetType: "Booking",
      targetId: booking._id.toString(),
      targetReference: booking.bookingReference,
      details: {
        paymentReference,
        paymentMethod,
        notes,
        amountReconciled: booking.totalPrice,
        currency: booking.currency,
      },
      ipAddress: clientIp,
    });

    // Notify customer
    const recipientUser = booking.user as any;
    const recipientTour = booking.tour as any;
    await dispatchNotification({
      userId: recipientUser?._id || booking.user,
      bookingId: booking._id,
      type: "payment_confirmation",
      title: `Payment Received: ${booking.bookingReference}`,
      message: `Your payment of ${booking.currency} $${booking.totalPrice.toLocaleString()} for "${recipientTour?.name || "Expedition Tour"}" has been confirmed (Ref: ${paymentReference}).`,
      channel: "both",
      metadata: {
        paymentReference,
        amount: booking.totalPrice,
      },
      emailOptions: {
        recipientEmail: booking.guestEmail || recipientUser?.email || "",
        subject: `Payment Confirmed: ${booking.bookingReference}`,
        html: `<p>Payment confirmed for ${booking.bookingReference}. Reference: ${paymentReference}.</p>`,
      },
    });

    return NextResponse.json({
      status: "success",
      message: `Payment successfully reconciled for ${booking.bookingReference}.`,
      data: {
        bookingReference: booking.bookingReference,
        paymentStatus: booking.paymentStatus,
        paidAt: booking.paidAt,
        paymentReference: booking.paymentReference,
        reconciledBy: session.email,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/bookings/[id]/reconcile-payment error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to reconcile payment." },
      { status: 500 }
    );
  }
}
