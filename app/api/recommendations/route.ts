import { NextRequest, NextResponse } from "next/server";
import { getRecommendedTours } from "@/lib/recommendations/engine";
import { getTours } from "@/lib/tours/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const preferences = {
      destination: searchParams.get("destination") || undefined,
      maxBudget: searchParams.get("budget") ? Number(searchParams.get("budget")) : undefined,
      category: searchParams.get("category") || undefined,
      difficulty: searchParams.get("difficulty") || undefined,
      duration: searchParams.get("duration") ? Number(searchParams.get("duration")) : undefined,
    };

    // Fetch published tours
    const { tours } = await getTours({ limit: 50 });
    const recommendations = getRecommendedTours(tours, preferences, 6);

    return NextResponse.json({
      status: "success",
      data: recommendations,
    });
  } catch (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
