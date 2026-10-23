import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Booking as BookingModel } from "@/models/Booking";
import { generateCsv } from "@/lib/utils/csv";
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
    const type = searchParams.get("type") || "bookings";
    const bookingStatus = searchParams.get("bookingStatus");
    const paymentStatus = searchParams.get("paymentStatus");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const dateField = searchParams.get("dateField") === "departureDate" ? "departureDate" : "createdAt";
    const tourId = searchParams.get("tourId");

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { status: "error", message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    const matchFilter: Record<string, unknown> = {};

    if (bookingStatus && bookingStatus !== "all") {
      matchFilter.bookingStatus = bookingStatus;
    }
    if (paymentStatus && paymentStatus !== "all") {
      matchFilter.paymentStatus = paymentStatus;
    }
    if (tourId && tourId !== "all" && mongoose.Types.ObjectId.isValid(tourId)) {
      matchFilter.tour = new mongoose.Types.ObjectId(tourId);
    }

    if (startDate || endDate) {
      if (dateField === "createdAt") {
        const d: Record<string, Date> = {};
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          d.$gte = s;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          d.$lte = e;
        }
        matchFilter.createdAt = d;
      } else {
        const d: Record<string, string> = {};
        if (startDate) d.$gte = startDate;
        if (endDate) d.$lte = endDate;
        matchFilter.departureDate = d;
      }
    }

    let csvContent = "";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (type === "bookings") {
      const records = await BookingModel.find(matchFilter)
        .populate("tour", "name destination country")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean();

      const headers = [
        "Booking Reference",
        "Customer Name",
        "Customer Email",
        "Tour Name",
        "Destination",
        "Departure Date",
        "Guests",
        "Currency",
        "Total Amount",
        "Booking Status",
        "Payment Status",
        "Payment Deadline",
        "Created At",
      ];

      const rows = records.map((b: any) => [
        b.bookingReference,
        b.guestName || b.user?.name || "N/A",
        b.guestEmail || b.user?.email || "N/A",
        b.tour?.name || "Archived Tour",
        b.tour?.destination || "N/A",
        b.departureDate,
        b.travelers,
        b.currency || "USD",
        b.totalPrice,
        b.bookingStatus,
        b.paymentStatus,
        b.paymentDueAt ? new Date(b.paymentDueAt).toISOString().slice(0, 10) : "N/A",
        b.createdAt ? new Date(b.createdAt).toISOString() : "N/A",
      ]);

      csvContent = generateCsv(headers, rows);
    } else if (type === "payments") {
      const records = await BookingModel.find(matchFilter)
        .populate("tour", "name")
        .populate("user", "name email")
        .populate("paymentReconciledBy", "name email")
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean();

      const headers = [
        "Booking Reference",
        "Customer Email",
        "Tour Name",
        "Total Amount",
        "Currency",
        "Payment Status",
        "Paid At",
        "Payment Reference",
        "Payment Method",
        "Reconciled By",
        "Reconciliation Notes",
      ];

      const rows = records.map((b: any) => [
        b.bookingReference,
        b.guestEmail || b.user?.email || "N/A",
        b.tour?.name || "Archived Tour",
        b.totalPrice,
        b.currency || "USD",
        b.paymentStatus,
        b.paidAt ? new Date(b.paidAt).toISOString() : "Unpaid",
        b.paymentReference || "N/A",
        b.paymentMethod || "N/A",
        b.paymentReconciledBy?.email || "N/A",
        b.paymentReconciliationNotes || "",
      ]);

      csvContent = generateCsv(headers, rows);
    } else if (type === "cancellations") {
      const cancellationFilter = { ...matchFilter, bookingStatus: "cancelled" };
      const records = await BookingModel.find(cancellationFilter as any)
        .populate("tour", "name")
        .populate("user", "name email")
        .populate("cancelledBy", "name email")
        .sort({ cancelledAt: -1 })
        .limit(1000)
        .lean();

      const headers = [
        "Booking Reference",
        "Customer Email",
        "Tour Name",
        "Departure Date",
        "Total Amount",
        "Currency",
        "Payment Status",
        "Cancelled At",
        "Cancelled By",
        "Cancellation Reason",
      ];

      const rows = records.map((b: any) => [
        b.bookingReference,
        b.guestEmail || b.user?.email || "N/A",
        b.tour?.name || "Archived Tour",
        b.departureDate,
        b.totalPrice,
        b.currency || "USD",
        b.paymentStatus,
        b.cancelledAt ? new Date(b.cancelledAt).toISOString() : "N/A",
        b.cancelledBy?.email || "Administrator",
        b.cancellationReason || "No reason specified",
      ]);

      csvContent = generateCsv(headers, rows);
    } else if (type === "revenue") {
      // Aggregation summary
      const [agg] = await BookingModel.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            grossBookingValue: {
              $sum: { $cond: [{ $ne: ["$bookingStatus", "cancelled"] }, "$totalPrice", 0] },
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
                  "$totalPrice",
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
            cancelledValue: {
              $sum: { $cond: [{ $eq: ["$bookingStatus", "cancelled"] }, "$totalPrice", 0] },
            },
          },
        },
      ]);

      const headers = ["Financial Metric", "Value", "Currency", "Calculation Policy"];
      const rows = [
        ["Total Booking Value", agg?.grossBookingValue || 0, "USD", "Eligible non-cancelled bookings"],
        ["Collected Revenue", agg?.collectedRevenue || 0, "USD", "Verified paid payments less refunds"],
        ["Outstanding Amount", agg?.outstandingAmount || 0, "USD", "Pending/Unpaid non-cancelled reservations"],
        ["Cancelled Booking Value", agg?.cancelledValue || 0, "USD", "Cancelled reservations separated from revenue"],
        ["Total Reservations Count", agg?.totalBookings || 0, "Count", "Total bookings matching filter"],
      ];

      csvContent = generateCsv(headers, rows);
    } else {
      return NextResponse.json({ status: "error", message: "Invalid export type" }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="touroholic-${type}-report-${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/export error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to generate CSV export." },
      { status: 500 }
    );
  }
}
