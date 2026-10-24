import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { Payment as PaymentModel } from "@/models/Payment";
import { AuditLog as AuditLogModel } from "@/models/AuditLog";
import { sendPaymentConfirmationNotification } from "@/lib/notifications/service";
import mongoose from "mongoose";
import { z } from "zod";

const reconcileSchema = z.object({
  paymentReference: z
    .string()
    .min(3, "Payment reference or transaction ID is required (min 3 chars)")
    .max(100),
  paymentMethod: z.string().min(2, "Payment method is required"),
  notes: z
    .string()
    .min(5, "Reconciliation audit note is required (min 5 chars) explaining verification source"),
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
    const cleanRef = paymentReference.trim();

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

    if (booking.bookingStatus === "cancelled") {
      return NextResponse.json(
        { status: "error", message: "Cannot reconcile payment on a cancelled reservation." },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json(
        { status: "error", message: "Booking is already marked as fully paid." },
        { status: 400 }
      );
    }

    // 1. Prevent duplicate transaction references
    const [existingPayment, existingBookingWithRef] = await Promise.all([
      PaymentModel.findOne({ paymentReference: cleanRef }).lean(),
      BookingModel.findOne({
        paymentReference: cleanRef,
        _id: { $ne: booking._id },
      }).lean(),
    ]);

    if (existingPayment || existingBookingWithRef) {
      return NextResponse.json(
        {
          status: "error",
          message: `Duplicate transaction reference: A verified payment with reference "${cleanRef}" has already been recorded for booking ${
            existingPayment?.bookingReference || existingBookingWithRef?.bookingReference || ""
          }.`,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const adminObjectId = mongoose.Types.ObjectId.isValid(session.userId)
      ? new mongoose.Types.ObjectId(session.userId)
      : booking.user;

    const recipientUser = booking.user as any;
    const recipientTour = booking.tour as any;
    const targetUserId = recipientUser?._id || booking.user;

    // 2. Save Payment record to MongoDB
    const paymentDoc = await PaymentModel.create({
      booking: booking._id,
      bookingReference: booking.bookingReference,
      user: targetUserId,
      amount: booking.totalPrice,
      currency: booking.currency || "USD",
      paymentMethod: paymentMethod.trim(),
      paymentReference: cleanRef,
      status: "completed",
      reconciledBy: adminObjectId,
      reconciledAt: now,
      notes: notes.trim(),
    });

    // 3. Update the booking's payment status and outstanding balance
    booking.paymentStatus = "paid";
    booking.outstandingBalance = 0;
    booking.paidAt = now;
    booking.paymentReference = cleanRef;
    booking.paymentMethod = paymentMethod.trim();
    booking.paymentReconciledBy = adminObjectId as mongoose.Types.ObjectId;
    booking.paymentReconciledAt = now;
    booking.paymentReconciliationNotes = notes.trim();

    await booking.save();

    // 4. Record Audit Log
    const clientIp =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    await AuditLogModel.create({
      actorId: adminObjectId,
      actorEmail: session.email,
      actorRole: session.role,
      action: "payment_reconciliation",
      targetType: "Booking",
      targetId: booking._id.toString(),
      targetReference: booking.bookingReference,
      details: {
        paymentId: paymentDoc._id.toString(),
        paymentReference: cleanRef,
        paymentMethod: paymentMethod.trim(),
        amountReconciled: booking.totalPrice,
        currency: booking.currency,
        notes: notes.trim(),
      },
      ipAddress: clientIp,
    });

    // 5. Notify customer safely without failing the payment transaction
    let notificationError: string | undefined;
    try {
      await sendPaymentConfirmationNotification({
        userId: targetUserId,
        bookingId: booking._id,
        customerName: booking.guestName || recipientUser?.name,
        customerEmail: booking.guestEmail || recipientUser?.email || "",
        bookingReference: booking.bookingReference,
        tourName: recipientTour?.name || "Expedition Tour",
        amountReceived: booking.totalPrice,
        currency: booking.currency || "USD",
        paymentReference: cleanRef,
        paymentMethod: paymentMethod.trim(),
        reconciledAt: now,
      });
    } catch (notifErr: unknown) {
      notificationError = notifErr instanceof Error ? notifErr.message : "Notification delivery failure";
      console.warn("Payment confirmation notification failed, but payment was retained:", notifErr);
    }

    return NextResponse.json({
      status: "success",
      message: `Payment successfully reconciled for ${booking.bookingReference}.`,
      data: {
        bookingReference: booking.bookingReference,
        paymentStatus: booking.paymentStatus,
        outstandingBalance: 0,
        paidAt: booking.paidAt,
        paymentReference: booking.paymentReference,
        reconciledBy: session.email,
        paymentId: paymentDoc._id.toString(),
        notificationError,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/bookings/[id]/reconcile-payment error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to reconcile payment. Server error occurred." },
      { status: 500 }
    );
  }
}
