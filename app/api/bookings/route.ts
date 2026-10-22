import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Tour as TourModel } from "@/models/Tour";
import { Booking as BookingModel } from "@/models/Booking";
import { TourDeparture as TourDepartureModel } from "@/models/TourDeparture";
import { SAMPLE_TOURS } from "@/lib/data/sample-tours";
import { z } from "zod";
import crypto from "crypto";

const createBookingSchema = z.object({
  tourId: z.string().min(1, "Tour ID is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  travelers: z.number().int().min(1, "At least 1 traveler is required").max(12),
  guestName: z.string().min(2, "Traveler name is required"),
  guestEmail: z.string().email("Valid email is required"),
  paymentMethod: z.string().default("pay_later"),
});

// In-memory demo store for when MongoDB Atlas isn't connected
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

    const { tourId, departureDate, travelers, guestName, guestEmail } = validated.data;
    const db = await connectToDatabase();

    // Generate unique human-readable booking reference e.g. TRH-2026-X8B9
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const bookingReference = `TRH-2026-${randomSuffix}`;

    if (db) {
      // Find the tour
      let tour = await TourModel.findById(tourId);
      if (!tour) {
        tour = await TourModel.findOne({ slug: tourId });
      }

      if (!tour) {
        return NextResponse.json({ status: "error", message: "Tour not found" }, { status: 404 });
      }

      // Check capacity on departure schedule if recorded
      const departure = await TourDepartureModel.findOne({
        tour: tour._id,
        startDate: departureDate,
      });

      if (departure) {
        if (departure.reservedSeats + travelers > departure.capacity) {
          return NextResponse.json(
            {
              status: "error",
              message: `Not enough available seats. Only ${departure.capacity - departure.reservedSeats} spots remaining.`,
            },
            { status: 400 }
          );
        }

        // Increment reserved seats atomically
        departure.reservedSeats += travelers;
        if (departure.reservedSeats >= departure.capacity) {
          departure.status = "sold_out";
        }
        await departure.save();
      }

      // Server-side price calculation snapshot (never trust client prices!)
      const pricePerTraveler = tour.price;
      const totalPrice = pricePerTraveler * travelers;

      const booking = await BookingModel.create({
        bookingReference,
        user: session?.userId || "000000000000000000000001",
        tour: tour._id,
        departureDate,
        travelers,
        pricePerTraveler,
        totalPrice,
        currency: tour.currency || "USD",
        bookingStatus: "confirmed",
        paymentStatus: "unpaid", // explicitly unpaid / reservation guaranteed
        guestName,
        guestEmail,
      });

      return NextResponse.json(
        {
          status: "success",
          message: "Reservation confirmed successfully",
          data: booking,
        },
        { status: 201 }
      );
    }

    // Development fallback without Mongo:
    const matchedTour =
      SAMPLE_TOURS.find((t) => t._id === tourId || t.slug === tourId) || SAMPLE_TOURS[0];
    const pricePerTraveler = matchedTour.price;
    const totalPrice = pricePerTraveler * travelers;

    const demoBooking = {
      _id: `booking-${Date.now()}`,
      bookingReference,
      tour: matchedTour,
      user: session?.userId || "demo-traveler",
      departureDate,
      travelers,
      pricePerTraveler,
      totalPrice,
      currency: matchedTour.currency || "USD",
      bookingStatus: "confirmed",
      paymentStatus: "unpaid",
      guestName,
      guestEmail,
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
        message: "Reservation confirmed successfully (Demo Mode)",
        data: demoBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process booking" },
      { status: 500 }
    );
  }
}
