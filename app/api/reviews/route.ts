import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Review as ReviewModel } from "@/models/Review";
import { Tour as TourModel } from "@/models/Tour";
import { SAMPLE_REVIEWS } from "@/lib/data/sample-tours";
import { z } from "zod";

const createReviewSchema = z.object({
  tourId: z.string().min(1, "Tour ID is required"),
  rating: z.number().min(1).max(5),
  review: z.string().min(5, "Review must be at least 5 characters").max(1000),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get("tourId");

    const db = await connectToDatabase();
    if (db && tourId && tourId.match(/^[0-9a-fA-F]{24}$/)) {
      const reviews = await ReviewModel.find({ tour: tourId })
        .populate("user", "name photo")
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ status: "success", data: reviews });
    }

    const filtered = tourId
      ? SAMPLE_REVIEWS.filter((r) => r.tour === tourId)
      : SAMPLE_REVIEWS;

    return NextResponse.json({ status: "success", data: filtered });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { status: "error", message: "You must be logged in to leave a review" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createReviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          status: "error",
          message: validated.error.issues[0]?.message || "Invalid review data",
        },
        { status: 400 }
      );
    }

    const { tourId, rating, review } = validated.data;
    const db = await connectToDatabase();

    if (db && session.userId.match(/^[0-9a-fA-F]{24}$/)) {
      // Check for duplicate review
      const existing = await ReviewModel.findOne({ tour: tourId, user: session.userId });
      if (existing) {
        return NextResponse.json(
          { status: "error", message: "You have already reviewed this tour." },
          { status: 409 }
        );
      }

      const newReview = await ReviewModel.create({
        tour: tourId,
        user: session.userId,
        rating,
        review,
      });

      // Recalculate average rating & ratingsQuantity for tour
      const stats = await ReviewModel.aggregate([
        { $match: { tour: newReview.tour } },
        {
          $group: {
            _id: "$tour",
            nRating: { $sum: 1 },
            avgRating: { $avg: "$rating" },
          },
        },
      ]);

      if (stats.length > 0) {
        await TourModel.findByIdAndUpdate(tourId, {
          ratingsQuantity: stats[0].nRating,
          ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
        });
      }

      return NextResponse.json(
        { status: "success", message: "Review posted successfully", data: newReview },
        { status: 201 }
      );
    }

    // Demo response
    const mockReview = {
      _id: `rev-${Date.now()}`,
      tour: tourId,
      user: {
        _id: session.userId,
        name: session.name,
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      },
      rating,
      review,
      createdAt: new Date().toISOString(),
      isDemoMode: true,
    };

    return NextResponse.json(
      { status: "success", message: "Review posted successfully (Demo Mode)", data: mockReview },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/reviews error:", error);
    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json(
        { status: "error", message: "You have already reviewed this tour." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { status: "error", message: "Failed to submit review" },
      { status: 500 }
    );
  }
}
