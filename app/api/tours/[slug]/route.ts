import { NextRequest, NextResponse } from "next/server";
import { getTourBySlug, getTourDepartures, getTourReviews } from "@/lib/tours/service";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const tour = await getTourBySlug(slug);

    if (!tour) {
      return NextResponse.json(
        { status: "error", message: "Tour not found" },
        { status: 404 }
      );
    }

    const [departures, reviews] = await Promise.all([
      getTourDepartures(slug),
      getTourReviews(slug),
    ]);

    return NextResponse.json({
      status: "success",
      data: {
        tour,
        departures,
        reviews,
      },
    });
  } catch (error) {
    console.error("GET /api/tours/[slug] error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
