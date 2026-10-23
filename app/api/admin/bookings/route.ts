import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { Tour as TourModel } from "@/models/Tour";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Enforce admin authorization
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Forbidden: Administrator credentials required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = (searchParams.get("search") || "").trim();
    const bookingStatus = (searchParams.get("bookingStatus") || "").trim();
    const paymentStatus = (searchParams.get("paymentStatus") || "").trim();
    const startDate = (searchParams.get("startDate") || "").trim();
    const endDate = (searchParams.get("endDate") || "").trim();
    const dateField = searchParams.get("dateField") === "departureDate" ? "departureDate" : "createdAt";
    const tourId = (searchParams.get("tourId") || "").trim();
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json(
        { status: "error", message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    // Build filter query
    const query: Record<string, unknown> = {};

    // Booking status filter
    if (bookingStatus && bookingStatus !== "all") {
      query.bookingStatus = bookingStatus;
    }

    // Payment status filter
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }

    // Tour ID filter
    if (tourId && tourId !== "all") {
      if (mongoose.Types.ObjectId.isValid(tourId)) {
        query.tour = new mongoose.Types.ObjectId(tourId);
      }
    }

    // Date range filter
    if (startDate || endDate) {
      if (dateField === "createdAt") {
        const createdAtFilter: Record<string, Date> = {};
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          createdAtFilter.$gte = s;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          createdAtFilter.$lte = e;
        }
        query.createdAt = createdAtFilter;
      } else {
        // departureDate is stored as string "YYYY-MM-DD"
        const depFilter: Record<string, string> = {};
        if (startDate) depFilter.$gte = startDate;
        if (endDate) depFilter.$lte = endDate;
        query.departureDate = depFilter;
      }
    }

    // Search query: match booking reference, guest name, guest email, or search tour names
    if (search) {
      const searchRegex = new RegExp(search, "i");

      // Find matching tour IDs to include in search
      const matchingTours = await TourModel.find({ name: searchRegex }).select("_id").lean();
      const tourIds = matchingTours.map((t) => t._id);

      query.$or = [
        { bookingReference: searchRegex },
        { guestName: searchRegex },
        { guestEmail: searchRegex },
        { tour: { $in: tourIds } },
      ];
    }

    // Sort order definition
    const sortQuery: Record<string, 1 | -1> = {};
    if (sortBy === "departureDate") {
      sortQuery.departureDate = sortOrder;
    } else if (sortBy === "totalPrice") {
      sortQuery.totalPrice = sortOrder;
    } else {
      sortQuery.createdAt = sortOrder;
    }

    const skip = (page - 1) * limit;

    const [total, bookings] = await Promise.all([
      BookingModel.countDocuments(query),
      BookingModel.find(query)
        .populate("tour", "name slug destination country imageCover price currency duration")
        .populate("user", "name email photo")
        .populate("departureSchedule", "startDate endDate capacity reservedSeats status")
        .populate("cancelledBy", "name email")
        .populate("paymentReconciledBy", "name email")
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Format safe response records handling deleted or missing references gracefully
    const formattedBookings = bookings.map((b: any) => ({
      _id: b._id.toString(),
      bookingReference: b.bookingReference,
      user: b.user
        ? {
            _id: b.user._id?.toString(),
            name: b.user.name,
            email: b.user.email,
            photo: b.user.photo,
          }
        : null,
      guestName: b.guestName || b.user?.name || "Private Explorer",
      guestEmail: b.guestEmail || b.user?.email || "N/A",
      tour: b.tour
        ? {
            _id: b.tour._id?.toString(),
            name: b.tour.name,
            slug: b.tour.slug,
            destination: b.tour.destination || "Expedition Route",
            country: b.tour.country || "",
            imageCover: b.tour.imageCover,
            price: b.tour.price,
            currency: b.currency || b.tour.currency || "USD",
            duration: b.tour.duration,
          }
        : {
            _id: "unavailable",
            name: "Archived Expedition",
            slug: "archived",
            destination: "Unknown",
            country: "",
            imageCover: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
            price: b.pricePerTraveler || 0,
            currency: b.currency || "USD",
            duration: 0,
          },
      departureSchedule: b.departureSchedule
        ? {
            _id: b.departureSchedule._id?.toString(),
            startDate: b.departureSchedule.startDate,
            endDate: b.departureSchedule.endDate,
            capacity: b.departureSchedule.capacity,
            reservedSeats: b.departureSchedule.reservedSeats,
            status: b.departureSchedule.status,
          }
        : null,
      departureDate: b.departureDate,
      travelers: b.travelers,
      pricePerTraveler: b.pricePerTraveler,
      totalPrice: b.totalPrice,
      currency: b.currency || "USD",
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      paymentDueAt: b.paymentDueAt ? new Date(b.paymentDueAt).toISOString() : null,
      paymentReference: b.paymentReference || null,
      paymentMethod: b.paymentMethod || null,
      paidAt: b.paidAt ? new Date(b.paidAt).toISOString() : null,
      paymentReconciledBy: b.paymentReconciledBy
        ? { name: b.paymentReconciledBy.name, email: b.paymentReconciledBy.email }
        : null,
      paymentReconciledAt: b.paymentReconciledAt ? new Date(b.paymentReconciledAt).toISOString() : null,
      paymentReconciliationNotes: b.paymentReconciliationNotes || null,
      cancelledAt: b.cancelledAt ? new Date(b.cancelledAt).toISOString() : null,
      cancelledBy: b.cancelledBy ? { name: b.cancelledBy.name, email: b.cancelledBy.email } : null,
      cancellationReason: b.cancellationReason || null,
      cancellationPolicySnapshot: b.cancellationPolicySnapshot || null,
      refundAmount: b.refundAmount || 0,
      refundedAt: b.refundedAt ? new Date(b.refundedAt).toISOString() : null,
      refundReason: b.refundReason || null,
      lastPaymentReminderSentAt: b.lastPaymentReminderSentAt
        ? new Date(b.lastPaymentReminderSentAt).toISOString()
        : null,
      paymentReminderCount: b.paymentReminderCount || 0,
      specialRequests: b.specialRequests || null,
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      status: "success",
      data: {
        bookings: formattedBookings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/bookings error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch bookings." },
      { status: 500 }
    );
  }
}
