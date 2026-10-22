import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getSession();
    const db = await connectToDatabase();

    if (db && session) {
      const booking = await BookingModel.findById(id);
      if (!booking) {
        return NextResponse.json({ status: "error", message: "Booking not found" }, { status: 404 });
      }

      // Check ownership or admin
      if (booking.user.toString() !== session.userId && session.role !== "admin") {
        return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
      }

      booking.bookingStatus = "cancelled";
      await booking.save();

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
