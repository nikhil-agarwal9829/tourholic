import { NextRequest, NextResponse } from "next/server";
import { getNearbyTours } from "@/lib/geo/nearby";
import { resolveDestinationCoordinates } from "@/lib/geo/destinations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const destination = searchParams.get("destination");
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const category = searchParams.get("category") || undefined;
    const difficulty = searchParams.get("difficulty") || undefined;
    const limit = Math.max(1, Math.min(24, Number(searchParams.get("limit")) || 6));
    const maxRadiusKm = Math.max(10, Math.min(2000, Number(searchParams.get("maxRadiusKm")) || 500));

    let coordinates: [number, number] | null = null;
    let resolvedName: string | undefined = undefined;

    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json(
          { status: "error", message: "Invalid latitude or longitude coordinates." },
          { status: 400 }
        );
      }
      // GeoJSON coordinate order: [longitude, latitude]
      coordinates = [lng, lat];
    } else if (destination) {
      const resolved = resolveDestinationCoordinates(destination);
      if (resolved) {
        coordinates = resolved.coordinates;
        resolvedName = resolved.name;
      } else {
        return NextResponse.json(
          {
            status: "error",
            message: `Could not resolve destination "${destination}" to coordinates.`,
            notFound: true,
          },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        {
          status: "error",
          message: "Please provide either 'destination' or 'lat' and 'lng' query parameters.",
        },
        { status: 400 }
      );
    }

    const result = await getNearbyTours({
      coordinates,
      searchedDestination: resolvedName || destination || undefined,
      category,
      difficulty,
      limit,
      maxRadiusKm,
    });

    return NextResponse.json({
      status: "success",
      data: result.tours,
      meta: {
        total: result.totalFound,
        tierRadiusKm: result.tierRadiusKm,
        coordinates,
        resolvedDestination: resolvedName || null,
        isLiveDatabase: result.isLiveDatabase,
      },
    });
  } catch (error) {
    console.error("GET /api/tours/nearby error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to calculate nearby tour recommendations" },
      { status: 500 }
    );
  }
}
