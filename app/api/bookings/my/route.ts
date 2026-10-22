import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { SAMPLE_TOURS } from "@/lib/data/sample-tours";

export async function GET() {
  try {
    const session = await getSession();
    const db = await connectToDatabase();

    if (db && session && session.userId.match(/^[0-9a-fA-F]{24}$/)) {
      const bookings = await BookingModel.find({ user: session.userId })
        .populate("tour", "name slug imageCover price duration destination")
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({
        status: "success",
        data: JSON.parse(JSON.stringify(bookings)),
      });
    }

    // Demo store fallback
    const globalBookings = (global.demoBookings || []) as Array<Record<string, unknown>>;

    if (globalBookings.length > 0) {
      return NextResponse.json({
        status: "success",
        data: globalBookings,
      });
    }

    // Sample booking if nothing created yet
    const fallbackBooking = [
      {
        _id: "demo-booking-01",
        bookingReference: "TRH-2026-BANFF8",
        tour: SAMPLE_TOURS[0],
        departureDate: "2026-06-15",
        travelers: 2,
        pricePerTraveler: 1199,
        totalPrice: 2398,
        currency: "USD",
        bookingStatus: "confirmed",
        paymentStatus: "unpaid",
        guestName: session?.name || "Marcus Thorne",
        guestEmail: session?.email || "traveler@touroholic.com",
        createdAt: "2026-03-01T10:00:00Z",
        updatedAt: "2026-03-01T10:00:00Z",
      },
    ];

    return NextResponse.json({
      status: "success",
      data: fallbackBooking,
    });
  } catch (error) {
    console.error("GET /api/bookings/my error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
