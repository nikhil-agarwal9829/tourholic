import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Tour as TourModel } from "@/models/Tour";
import { Booking as BookingModel } from "@/models/Booking";
import { User as UserModel } from "@/models/User";
import { SAMPLE_TOURS } from "@/lib/data/sample-tours";

export async function GET() {
  try {
    const session = await getSession();

    // Enforce server-side admin role check
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Forbidden. Administrator privileges required." },
        { status: 403 }
      );
    }

    const db = await connectToDatabase();

    if (db) {
      const [totalTours, totalBookings, totalUsers, bookings] = await Promise.all([
        TourModel.countDocuments(),
        BookingModel.countDocuments(),
        UserModel.countDocuments(),
        BookingModel.find()
          .populate("tour", "name price slug imageCover currency")
          .populate("user", "name email photo")
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
      ]);

      // Calculate gross booking volume from non-cancelled bookings
      const revenueAgg = await BookingModel.aggregate([
        { $match: { bookingStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, grossBookingValue: { $sum: "$totalPrice" } } },
      ]);

      const totalRevenue = revenueAgg[0]?.grossBookingValue || 0;

      // Format bookings for clean consumption by admin dashboard
      const formattedBookings = bookings.map((b: any) => ({
        _id: b._id.toString(),
        bookingReference: b.bookingReference,
        guestName: b.guestName || b.user?.name || "Registered Explorer",
        guestEmail: b.guestEmail || b.user?.email || "",
        tour: {
          name: b.tour?.name || "Private Expedition",
          price: b.pricePerTraveler || b.tour?.price || 0,
          currency: b.currency || b.tour?.currency || "USD",
        },
        totalPrice: b.totalPrice,
        currency: b.currency || "USD",
        travelers: b.travelers,
        departureDate: b.departureDate,
        bookingStatus: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        paymentDueAt: b.paymentDueAt ? new Date(b.paymentDueAt).toISOString() : undefined,
        createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      }));

      return NextResponse.json({
        status: "success",
        data: {
          totalTours,
          totalBookings,
          totalUsers,
          totalRevenue,
          recentBookings: formattedBookings,
          isAdmin: true,
        },
      });
    }

    // Demo store fallback for local development without Mongo
    const globalBookings = (global.demoBookings || []) as Array<Record<string, unknown>>;
    const totalRevenue = globalBookings.reduce(
      (sum: number, b: any) => (b.bookingStatus !== "cancelled" ? sum + (b.totalPrice || 0) : sum),
      0
    );

    return NextResponse.json({
      status: "success",
      data: {
        totalTours: SAMPLE_TOURS.length,
        totalBookings: globalBookings.length,
        totalUsers: 3,
        totalRevenue,
        recentBookings: globalBookings,
        isAdmin: true,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
