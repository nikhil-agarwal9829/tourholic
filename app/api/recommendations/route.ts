import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getGroupedRecommendations } from "@/lib/recommendations/deterministic-service";
import { TravelPreferences } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Check if user is authenticated to read their saved travel preferences
    let userPreferences: TravelPreferences | undefined = undefined;
    const session = await getSession();

    if (session?.userId) {
      await connectToDatabase();
      const user = await User.findById(session.userId).select("travelPreferences").lean();
      if (user?.travelPreferences) {
        userPreferences = user.travelPreferences;
      }
    }

    // 2. Query parameters can supplement or test preferences
    const queryDest = searchParams.get("destination");
    const queryCountry = searchParams.get("country");
    const queryCategory = searchParams.get("category");
    const queryBudget = searchParams.get("budget");
    const queryDuration = searchParams.get("duration");

    if (queryDest || queryCountry || queryCategory || queryBudget || queryDuration) {
      userPreferences = {
        ...userPreferences,
        preferredDestinations: queryDest
          ? [queryDest, ...(userPreferences?.preferredDestinations || [])]
          : userPreferences?.preferredDestinations,
        preferredCountries: queryCountry
          ? [queryCountry, ...(userPreferences?.preferredCountries || [])]
          : userPreferences?.preferredCountries,
        preferredCategories: queryCategory
          ? [queryCategory, ...(userPreferences?.preferredCategories || [])]
          : userPreferences?.preferredCategories,
        maxBudget: queryBudget ? Number(queryBudget) : userPreferences?.maxBudget,
        preferredDuration: queryDuration ? Number(queryDuration) : userPreferences?.preferredDuration,
        onboardingCompleted: true,
      };
    }

    // 3. Compute deterministic rule-based recommendations
    const results = await getGroupedRecommendations(userPreferences, 12);

    return NextResponse.json({
      status: "success",
      data: results,
    });
  } catch (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
