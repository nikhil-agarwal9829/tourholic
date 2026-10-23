import { NextRequest, NextResponse } from "next/server";
import { getBestForYouTours } from "@/lib/geo/nearby";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = Math.max(1, Math.min(24, Number(searchParams.get("limit")) || 6));
    const category = searchParams.get("category");
    const country = searchParams.get("country");
    const excludeParam = searchParams.get("exclude");
    const excludeTourIds = excludeParam ? excludeParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

    let preferredCategories: string[] = category ? [category] : [];
    let preferredCountries: string[] = country ? [country] : [];

    // Check signed-in user travel preferences if available
    const session = await getSession();
    if (session?.userId) {
      await connectToDatabase();
      const user = await User.findById(session.userId).select("travelPreferences").lean();
      if (user?.travelPreferences) {
        if (!category && user.travelPreferences.preferredCategories) {
          preferredCategories = user.travelPreferences.preferredCategories;
        }
        if (!country && user.travelPreferences.preferredCountries) {
          preferredCountries = user.travelPreferences.preferredCountries;
        }
      }
    }

    const tours = await getBestForYouTours({
      limit,
      preferredCategories,
      preferredCountries,
      excludeTourIds,
    });

    return NextResponse.json({
      status: "success",
      data: tours,
      meta: {
        total: tours.length,
        hasPreferences: preferredCategories.length > 0 || preferredCountries.length > 0,
      },
    });
  } catch (error) {
    console.error("GET /api/tours/best-rated error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch top-rated tour recommendations" },
      { status: 500 }
    );
  }
}
