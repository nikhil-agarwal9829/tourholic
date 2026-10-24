import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { TourDeparture as TourDepartureModel } from "@/models/TourDeparture";
import { sendCancellationNotification } from "@/lib/notifications/service";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession();
    const db = await connectToDatabase();

    if (db && session) {
      const booking = await BookingModel.findById(id).populate("tour", "name destination");
      if (!booking) {
        return NextResponse.json({ status: "error", message: "Booking not found" }, { status: 404 });
      }

      // Check ownership or admin
      if (booking.user.toString() !== session.userId && session.role !== "admin") {
        return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
      }

      if (booking.bookingStatus === "cancelled") {
        return NextResponse.json({
          status: "success",
          message: "This booking is already cancelled.",
          data: booking,
        });
      }

      // Release reserved seats if schedule exists
      if (booking.departureSchedule) {
        try {
          const departure = await TourDepartureModel.findById(booking.departureSchedule);
          if (departure) {
            departure.reservedSeats = Math.max(0, departure.reservedSeats - booking.travelers);
            if (departure.status === "sold_out") {
              departure.status = departure.reservedSeats >= departure.capacity * 0.8 ? "limited" : "open";
            }
            await departure.save();
          }
        } catch (seatErr) {
          console.error("Failed to release seats on cancellation:", seatErr);
        }
      }

      booking.bookingStatus = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancellationReason = "Cancelled by traveler via portal";
      await booking.save();

      // Dispatch customer cancellation email safely (never rollback successful cancellation)
      try {
        await sendCancellationNotification({
          userId: booking.user,
          bookingId: booking._id,
          customerName: booking.guestName || session.name || "Valued Explorer",
          customerEmail: booking.guestEmail || session.email,
          bookingReference: booking.bookingReference,
          tourName: (booking.tour as any)?.name || "Expedition Tour",
          departureDate: booking.departureDate,
          totalPrice: booking.totalPrice,
          currency: booking.currency || "USD",
          cancellationReason: booking.cancellationReason,
          isPaid: booking.paymentStatus === "paid",
        });
      } catch (notifErr) {
        console.error("Non-fatal cancellation email dispatch error:", notifErr);
      }

      return NextResponse.json({
        status: "success",
        message: "Booking has been cancelled.",
        data: booking,
      });
    }

    // In-memory demo store
    const globalBookings = (global.demoBookings || []) as Array<Record<string, unknown>>;
    const found = globalBookings.find((b) => b._id === id || b.bookingReference === id);
    if (found) {
      found.bookingStatus = "cancelled";
    }

    return NextResponse.json({
      status: "success",
      message: "Booking has been cancelled (Demo Mode).",
    });
  } catch (error) {
    console.error("POST /api/bookings/[id]/cancel error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
