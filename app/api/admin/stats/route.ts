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
    // Allow viewing stats in demo if not logged in or if admin
    const isAdmin = session?.role === "admin";

    const db = await connectToDatabase();

    if (db) {
      const [totalTours, totalBookings, totalUsers, bookings] = await Promise.all([
        TourModel.countDocuments(),
        BookingModel.countDocuments(),
        UserModel.countDocuments(),
        BookingModel.find()
          .populate("tour", "name price")
          .populate("user", "name email")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

      const revenueAgg = await BookingModel.aggregate([
        { $match: { bookingStatus: { $ne: "cancelled" } } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
      ]);

      const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

      return NextResponse.json({
        status: "success",
        data: {
          totalTours,
          totalBookings,
          totalUsers,
          totalRevenue,
          recentBookings: bookings,
          isAdmin,
        },
      });
    }

    // Demo stats fallback
    return NextResponse.json({
      status: "success",
      data: {
        totalTours: SAMPLE_TOURS.length,
        totalBookings: 18,
        totalUsers: 42,
        totalRevenue: 34850,
        recentBookings: [
          {
            _id: "demo-b-1",
            bookingReference: "TRH-2026-BANFF8",
            guestName: "Marcus Thorne",
            guestEmail: "marcus@example.com",
            tour: { name: "The Forest Hiker & Alpine Peaks", price: 1199 },
            totalPrice: 2398,
            travelers: 2,
            departureDate: "2026-06-15",
            bookingStatus: "confirmed",
            paymentStatus: "unpaid",
            createdAt: "2026-03-01T10:00:00Z",
          },
          {
            _id: "demo-b-2",
            bookingReference: "TRH-2026-AMALFI3",
            guestName: "Elena Rostova",
            guestEmail: "elena@example.com",
            tour: { name: "Amalfi Coastline & Cliffside Villages", price: 1850 },
            totalPrice: 1850,
            travelers: 1,
            departureDate: "2026-05-20",
            bookingStatus: "confirmed",
            paymentStatus: "paid",
            createdAt: "2026-03-02T15:30:00Z",
          },
          {
            _id: "demo-b-3",
            bookingReference: "TRH-2026-SEREN4",
            guestName: "David Miller",
            guestEmail: "david@example.com",
            tour: { name: "Serengeti Great Migration Safari", price: 3450 },
            totalPrice: 6900,
            travelers: 2,
            departureDate: "2026-07-15",
            bookingStatus: "confirmed",
            paymentStatus: "unpaid",
            createdAt: "2026-03-03T11:15:00Z",
          },
        ],
        isAdmin,
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
