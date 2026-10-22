import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Tour as TourModel } from "@/models/Tour";
import { Booking as BookingModel } from "@/models/Booking";
import { User as UserModel } from "@/models/User";
import { TourDeparture as TourDepartureModel } from "@/models/TourDeparture";
import { SAMPLE_TOURS } from "@/lib/data/sample-tours";
import { z } from "zod";
import crypto from "crypto";

const createBookingSchema = z.object({
  tourId: z.string().min(1, "Tour ID is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  travelers: z.number().int().min(1, "At least 1 traveler is required").max(30),
  guestName: z.string().min(2, "Traveler name is required"),
  guestEmail: z.string().email("Valid email is required"),
  paymentMethod: z.string().default("pay_later"),
  specialRequests: z.string().optional(),
});

declare global {
  // eslint-disable-next-line no-var
  var demoBookings: Record<string, unknown>[] | undefined;
}

if (!global.demoBookings) {
  global.demoBookings = [];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // 1. Authentication check: User must be signed in to book
    if (!session || !session.userId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Authentication required. Please sign in to confirm an expedition booking.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createBookingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          status: "error",
          message: validated.error.issues[0]?.message || "Validation failed",
          errors: validated.error.issues,
        },
        { status: 400 }
      );
    }

    const { tourId, departureDate, travelers, guestName, guestEmail, specialRequests } = validated.data;
    const db = await connectToDatabase();

    // 2. Departure date validation
    const depDateObj = new Date(departureDate);
    if (isNaN(depDateObj.getTime())) {
      return NextResponse.json(
        { status: "error", message: "Invalid departure date format." },
        { status: 400 }
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (depDateObj < today) {
      return NextResponse.json(
        {
          status: "error",
          message: "Selected departure date has already passed. Please choose an upcoming departure.",
        },
        { status: 400 }
      );
    }

    // 3. Payment deadline calculation (configurable via PAYMENT_DUE_DAYS, default: 3 days)
    const paymentDueDays = Number(process.env.PAYMENT_DUE_DAYS) || 3;
    const paymentDueAt = new Date(Date.now() + paymentDueDays * 24 * 60 * 60 * 1000);

    // 4. Generate unique human-readable booking reference
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const bookingReference = `TRH-2026-${randomSuffix}`;

    if (db) {
      // Resolve user in MongoDB
      let userDoc = null;
      if (session.userId.match(/^[0-9a-fA-F]{24}$/)) {
        userDoc = await UserModel.findById(session.userId);
      }
      if (!userDoc && session.email) {
        userDoc = await UserModel.findOne({ email: session.email });
      }

      if (!userDoc) {
        return NextResponse.json(
          {
            status: "error",
            message: "User account could not be found. Please log in again.",
          },
          { status: 401 }
        );
      }

      // Find the tour
      let tour = null;
      if (tourId.match(/^[0-9a-fA-F]{24}$/)) {
        tour = await TourModel.findById(tourId);
      }
      if (!tour) {
        tour = await TourModel.findOne({ slug: tourId });
      }

      if (!tour) {
        return NextResponse.json({ status: "error", message: "Expedition tour not found" }, { status: 404 });
      }

      // Check group size limit
      if (tour.maxGroupSize && travelers > tour.maxGroupSize) {
        return NextResponse.json(
          {
            status: "error",
            message: `Group size exceeds maximum allowed of ${tour.maxGroupSize} guests for this expedition.`,
          },
          { status: 400 }
        );
      }

      // Check capacity on departure schedule if recorded
      const departure = await TourDepartureModel.findOne({
        tour: tour._id,
        startDate: departureDate,
      });

      if (departure) {
        if (departure.status === "sold_out" || departure.reservedSeats + travelers > departure.capacity) {
          return NextResponse.json(
            {
              status: "error",
              message: `This departure is sold out or does not have enough remaining seats (${Math.max(
                0,
                departure.capacity - departure.reservedSeats
              )} available).`,
            },
            { status: 400 }
          );
        }
      }

      // 5. Prevent duplicate bookings (requests made within the last 60 seconds with same user, tour, and date)
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      const duplicate = await BookingModel.findOne({
        user: userDoc._id,
        tour: tour._id,
        departureDate,
        createdAt: { $gte: sixtySecondsAgo },
      }).populate("tour", "name price slug imageCover currency");

      if (duplicate) {
        return NextResponse.json(
          {
            status: "error",
            message: "A reservation for this expedition and departure was just placed. Please inspect My Bookings to prevent double reservations.",
            data: duplicate,
          },
          { status: 409 }
        );
      }

      // 6. Trusted server-side price calculation
      const pricePerTraveler = tour.price;
      const totalPrice = pricePerTraveler * travelers;

      // Reserve seats on departure schedule atomically
      if (departure) {
        departure.reservedSeats += travelers;
        if (departure.reservedSeats >= departure.capacity) {
          departure.status = "sold_out";
        }
        await departure.save();
      }

      // 7. Persist booking to MongoDB
      const booking = await BookingModel.create({
        bookingReference,
        user: userDoc._id,
        tour: tour._id,
        departureSchedule: departure?._id,
        departureDate,
        travelers,
        pricePerTraveler,
        totalPrice,
        currency: tour.currency || "USD",
        bookingStatus: "confirmed",
        paymentStatus: "unpaid",
        paymentDueAt,
        guestName: guestName.trim() || userDoc.name,
        guestEmail: guestEmail.trim().toLowerCase() || userDoc.email,
        specialRequests,
      });

      const populatedBooking = await BookingModel.findById(booking._id)
        .populate("tour", "name price slug imageCover currency duration destination")
        .populate("user", "name email")
        .lean();

      return NextResponse.json(
        {
          status: "success",
          message: "Expedition booking confirmed successfully",
          data: populatedBooking,
        },
        { status: 201 }
      );
    }

    // Development demo fallback
    const matchedTour =
      SAMPLE_TOURS.find((t) => t._id === tourId || t.slug === tourId) || SAMPLE_TOURS[0];
    const pricePerTraveler = matchedTour.price;
    const totalPrice = pricePerTraveler * travelers;

    const demoBooking = {
      _id: `booking-${Date.now()}`,
      bookingReference,
      tour: matchedTour,
      user: session.userId,
      departureDate,
      travelers,
      pricePerTraveler,
      totalPrice,
      currency: matchedTour.currency || "USD",
      bookingStatus: "confirmed",
      paymentStatus: "unpaid",
      paymentDueAt: paymentDueAt.toISOString(),
      guestName,
      guestEmail,
      specialRequests,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemoMode: true,
    };

    if (!global.demoBookings) {
      global.demoBookings = [];
    }
    global.demoBookings.unshift(demoBooking);

    return NextResponse.json(
      {
        status: "success",
        message: "Expedition booking confirmed successfully (Demo Mode)",
        data: demoBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process expedition booking" },
      { status: 500 }
    );
  }
}
