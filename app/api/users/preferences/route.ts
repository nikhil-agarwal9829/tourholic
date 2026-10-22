import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/jwt";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { status: "error", message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select("travelPreferences").lean();

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        travelPreferences: user.travelPreferences || { onboardingCompleted: false },
      },
    });
  } catch (error) {
    console.error("GET /api/users/preferences error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch travel preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { status: "error", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Sanitize and validate inputs
    const travelPreferences = {
      homeCountry: typeof body.homeCountry === "string" ? body.homeCountry.trim() : undefined,
      homeCity: typeof body.homeCity === "string" ? body.homeCity.trim() : undefined,
      preferredCountries: Array.isArray(body.preferredCountries)
        ? body.preferredCountries.filter((c: unknown) => typeof c === "string" && c.trim())
        : [],
      preferredDestinations: Array.isArray(body.preferredDestinations)
        ? body.preferredDestinations.filter((d: unknown) => typeof d === "string" && d.trim())
        : [],
      preferredCategories: Array.isArray(body.preferredCategories)
        ? body.preferredCategories.filter((cat: unknown) => typeof cat === "string" && cat.trim())
        : [],
      destinationScope: ["india", "international", "both"].includes(body.destinationScope)
        ? body.destinationScope
        : "both",
      minBudget: typeof body.minBudget === "number" && body.minBudget >= 0 ? body.minBudget : undefined,
      maxBudget: typeof body.maxBudget === "number" && body.maxBudget >= 0 ? body.maxBudget : undefined,
      preferredDuration:
        typeof body.preferredDuration === "number" && body.preferredDuration >= 1
          ? body.preferredDuration
          : undefined,
      preferredTravelMonth:
        typeof body.preferredTravelMonth === "number" &&
        body.preferredTravelMonth >= 1 &&
        body.preferredTravelMonth <= 12
          ? body.preferredTravelMonth
          : undefined,
      onboardingCompleted: Boolean(body.onboardingCompleted ?? true),
    };

    await connectToDatabase();
    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { $set: { travelPreferences } },
      { returnDocument: "after", runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Travel preferences updated successfully",
      data: {
        travelPreferences: updatedUser.travelPreferences,
      },
    });
  } catch (error) {
    console.error("PUT /api/users/preferences error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update travel preferences" },
      { status: 500 }
    );
  }
}
