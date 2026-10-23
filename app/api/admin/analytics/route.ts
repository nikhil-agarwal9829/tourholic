import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Forbidden: Administrator privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const dateField = searchParams.get("dateField") === "departureDate" ? "departureDate" : "createdAt";
    const tourId = searchParams.get("tourId");
    const destination = searchParams.get("destination");
    const bookingStatus = searchParams.get("bookingStatus");
    const paymentStatus = searchParams.get("paymentStatus");

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { status: "error", message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    // Determine date boundaries
    const now = new Date();
    let startBoundary: Date | null = null;
    let endBoundary: Date = new Date(now);

    if (period === "today") {
      startBoundary = new Date(now);
      startBoundary.setHours(0, 0, 0, 0);
    } else if (period === "7d") {
      startBoundary = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      startBoundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === "this_month") {
      startBoundary = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "last_month") {
      startBoundary = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endBoundary = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === "this_year") {
      startBoundary = new Date(now.getFullYear(), 0, 1);
    } else if (period === "custom") {
      if (startDateParam) startBoundary = new Date(startDateParam);
      if (endDateParam) {
        endBoundary = new Date(endDateParam);
        endBoundary.setHours(23, 59, 59, 999);
      }
    }
    // "all" leaves startBoundary as null

    // Base match filter
    const matchFilter: Record<string, unknown> = {};

    if (startBoundary || endBoundary) {
      if (dateField === "createdAt") {
        const dateSub: Record<string, Date> = {};
        if (startBoundary) dateSub.$gte = startBoundary;
        if (endBoundary) dateSub.$lte = endBoundary;
        matchFilter.createdAt = dateSub;
      } else {
        const startStr = startBoundary ? startBoundary.toISOString().slice(0, 10) : "";
        const endStr = endBoundary ? endBoundary.toISOString().slice(0, 10) : "";
        const dateSub: Record<string, string> = {};
        if (startStr) dateSub.$gte = startStr;
        if (endStr) dateSub.$lte = endStr;
        matchFilter.departureDate = dateSub;
      }
    }

    if (tourId && tourId !== "all" && mongoose.Types.ObjectId.isValid(tourId)) {
      matchFilter.tour = new mongoose.Types.ObjectId(tourId);
    }

    if (bookingStatus && bookingStatus !== "all") {
      matchFilter.bookingStatus = bookingStatus;
    }

    if (paymentStatus && paymentStatus !== "all") {
      matchFilter.paymentStatus = paymentStatus;
    }

    // 1. Overall Metrics Aggregation
    const [overview] = await BookingModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalBookingValue: {
            $sum: {
              $cond: [{ $ne: ["$bookingStatus", "cancelled"] }, "$totalPrice", 0],
            },
          },
          collectedRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$paymentStatus", "paid"] },
                    { $ne: ["$bookingStatus", "cancelled"] },
                  ],
                },
                { $subtract: ["$totalPrice", { $ifNull: ["$refundAmount", 0] }] },
                0,
              ],
            },
          },
          outstandingAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$paymentStatus", ["unpaid", "pending"]] },
                    { $ne: ["$bookingStatus", "cancelled"] },
                  ],
                },
                "$totalPrice",
                0,
              ],
            },
          },
          cancelledBookingValue: {
            $sum: {
              $cond: [{ $eq: ["$bookingStatus", "cancelled"] }, "$totalPrice", 0],
            },
          },
          refundTotals: {
            $sum: { $ifNull: ["$refundAmount", 0] },
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ["$bookingStatus", "confirmed"] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ["$bookingStatus", "cancelled"] }, 1, 0] },
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ["$bookingStatus", "completed"] }, 1, 0] },
          },
          unpaidBookings: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, 1, 0] },
          },
          paidBookings: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
          },
          nonCancelledCount: {
            $sum: { $cond: [{ $ne: ["$bookingStatus", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]);

    const totalBookingValue = overview?.totalBookingValue || 0;
    const nonCancelledCount = overview?.nonCancelledCount || 0;
    const averageBookingValue = nonCancelledCount > 0 ? Math.round(totalBookingValue / nonCancelledCount) : 0;

    const metrics = {
      totalBookingValue,
      collectedRevenue: overview?.collectedRevenue || 0,
      outstandingAmount: overview?.outstandingAmount || 0,
      cancelledBookingValue: overview?.cancelledBookingValue || 0,
      refundTotals: overview?.refundTotals || 0,
      totalBookings: overview?.totalBookings || 0,
      confirmedBookings: overview?.confirmedBookings || 0,
      cancelledBookings: overview?.cancelledBookings || 0,
      unpaidBookings: overview?.unpaidBookings || 0,
      paidBookings: overview?.paidBookings || 0,
      pendingBookings: overview?.pendingBookings || 0,
      completedBookings: overview?.completedBookings || 0,
      averageBookingValue,
      currency: "USD",
    };

    // 2. Time-series aggregation (by day or month based on range)
    const isLongRange = period === "this_year" || period === "all";
    const dateFormat = isLongRange ? "%Y-%m" : "%Y-%m-%d";

    const timeSeries = await BookingModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: dateField === "departureDate" ? { $dateFromString: { dateString: "$departureDate" } } : "$createdAt",
            },
          },
          date: {
            $first: {
              $dateToString: {
                format: dateFormat,
                date: dateField === "departureDate" ? { $dateFromString: { dateString: "$departureDate" } } : "$createdAt",
              },
            },
          },
          collectedRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$paymentStatus", "paid"] },
                    { $ne: ["$bookingStatus", "cancelled"] },
                  ],
                },
                { $subtract: ["$totalPrice", { $ifNull: ["$refundAmount", 0] }] },
                0,
              ],
            },
          },
          totalBookings: { $sum: 1 },
          bookingValue: {
            $sum: {
              $cond: [{ $ne: ["$bookingStatus", "cancelled"] }, "$totalPrice", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Revenue by Tour (Top 10)
    const revenueByTour = await BookingModel.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "tours",
          localField: "tour",
          foreignField: "_id",
          as: "tourDoc",
        },
      },
      { $unwind: { path: "$tourDoc", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$tour",
          tourName: { $first: { $ifNull: ["$tourDoc.name", "Unknown Expedition"] } },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$paymentStatus", "paid"] },
                    { $ne: ["$bookingStatus", "cancelled"] },
                  ],
                },
                "$totalPrice",
                0,
              ],
            },
          },
          totalValue: {
            $sum: {
              $cond: [{ $ne: ["$bookingStatus", "cancelled"] }, "$totalPrice", 0],
            },
          },
          bookingsCount: { $sum: 1 },
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
    ]);

    // 4. Revenue by Destination
    const revenueByDestination = await BookingModel.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "tours",
          localField: "tour",
          foreignField: "_id",
          as: "tourDoc",
        },
      },
      { $unwind: { path: "$tourDoc", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$tourDoc.destination", "Other Routes"] },
          destination: { $first: { $ifNull: ["$tourDoc.destination", "Other Routes"] } },
          country: { $first: { $ifNull: ["$tourDoc.country", "International"] } },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$paymentStatus", "paid"] },
                    { $ne: ["$bookingStatus", "cancelled"] },
                  ],
                },
                "$totalPrice",
                0,
              ],
            },
          },
          totalValue: {
            $sum: {
              $cond: [{ $ne: ["$bookingStatus", "cancelled"] }, "$totalPrice", 0],
            },
          },
          bookingsCount: { $sum: 1 },
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
    ]);

    // 5. Payment Status Breakdown
    const paymentStatusBreakdown = await BookingModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$paymentStatus",
          status: { $first: "$paymentStatus" },
          count: { $sum: 1 },
          amount: { $sum: "$totalPrice" },
        },
      },
    ]);

    // 6. Booking Status Breakdown
    const bookingStatusBreakdown = await BookingModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$bookingStatus",
          status: { $first: "$bookingStatus" },
          count: { $sum: 1 },
          amount: { $sum: "$totalPrice" },
        },
      },
    ]);

    return NextResponse.json({
      status: "success",
      data: {
        filterPeriod: period,
        dateField,
        dateRange: {
          start: startBoundary ? startBoundary.toISOString() : null,
          end: endBoundary ? endBoundary.toISOString() : null,
        },
        metrics,
        charts: {
          timeSeries,
          revenueByTour,
          revenueByDestination,
          paymentStatusBreakdown,
          bookingStatusBreakdown,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to generate financial analytics." },
      { status: 500 }
    );
  }
}
