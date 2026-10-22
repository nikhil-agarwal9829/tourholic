import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { User as UserModel } from "@/models/User";
import "@/models/Tour"; // Ensure Tour model is registered for populate

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { status: "unauthenticated", message: "Please sign in to view your bookings.", data: [] },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();

    if (db) {
      // Find the user's ObjectId
      let userDoc = null;
      if (session.userId.match(/^[0-9a-fA-F]{24}$/)) {
        userDoc = await UserModel.findById(session.userId);
      }
      if (!userDoc && session.email) {
        userDoc = await UserModel.findOne({ email: session.email });
      }

      if (userDoc) {
        const bookings = await BookingModel.find({ user: userDoc._id })
          .populate("tour", "name slug imageCover price duration destination currency")
          .sort({ createdAt: -1 })
          .lean();

        return NextResponse.json({
          status: "success",
          data: JSON.parse(JSON.stringify(bookings)),
        });
      }
    }

    // Demo store fallback for when MongoDB is not connected
    const globalBookings = ((global.demoBookings || []) as Array<Record<string, unknown>>).filter(
      (b) => b.user === session.userId || b.guestEmail === session.email
    );

    return NextResponse.json({
      status: "success",
      data: globalBookings,
    });
  } catch (error) {
    console.error("GET /api/bookings/my error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
