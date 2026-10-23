import { NextRequest, NextResponse } from "next/server";
import { getTours } from "@/lib/tours/service";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Tour as TourModel } from "@/models/Tour";
import { getSession } from "@/lib/auth/jwt";
import { z } from "zod";

const createTourSchema = z.object({
  name: z.string().min(3).max(100),
  summary: z.string().min(10),
  description: z.string().min(20),
  category: z.enum(["adventure", "nature", "cultural", "beaches", "getaway", "wildlife"]),
  duration: z.number().min(1),
  maxGroupSize: z.number().min(1),
  difficulty: z.enum(["easy", "medium", "difficult"]),
  price: z.number().min(1),
  destination: z.string().min(2),
  country: z.string().min(2),
  imageCover: z.string().url("Valid image URL is required"),
  coverImagePublicId: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  included: z.array(z.string()).optional(),
  excluded: z.array(z.string()).optional(),
});

import { resolveDestinationCoordinates } from "@/lib/geo/destinations";
import { getNearbyTours, getBestForYouTours } from "@/lib/geo/nearby";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      search: searchParams.get("search") || undefined,
      destination: searchParams.get("destination") || undefined,
      category: searchParams.get("category") || undefined,
      difficulty: searchParams.get("difficulty") || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      duration: searchParams.get("duration") || undefined,
      sort: (searchParams.get("sort") as "price-asc" | "price-desc" | "rating" | "popular" | "newest") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 9,
    };

    const result = await getTours(params);

    let nearby: any[] = [];
    let bestForYou: any[] = [];
    let resolvedDestination = null;

    const searchedDest = (params.destination || params.search || "").trim();
    if (result.total === 0 && searchedDest) {
      resolvedDestination = resolveDestinationCoordinates(searchedDest);

      if (resolvedDestination) {
        const nearbyResult = await getNearbyTours({
          coordinates: resolvedDestination.coordinates,
          searchedDestination: resolvedDestination.name,
          category: params.category,
          difficulty: params.difficulty,
          limit: 6,
        });
        nearby = nearbyResult.tours;

        const excludeIds = nearby.map((t) => (t._id ? String(t._id) : "")).filter(Boolean);
        bestForYou = await getBestForYouTours({
          limit: 6,
          excludeTourIds: excludeIds,
        });
      } else {
        bestForYou = await getBestForYouTours({ limit: 6 });
      }
    }

    return NextResponse.json({
      status: "success",
      data: result.tours,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        isLiveDatabase: result.isLiveDatabase,
      },
      noExactMatch: result.total === 0 && Boolean(searchedDest),
      searchedDestination: searchedDest || null,
      resolvedDestination,
      nearby,
      bestForYou,
    });
  } catch (error) {
    console.error("GET /api/tours error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch tours" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let requestBody: unknown = null;
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    requestBody = body;
    const validated = createTourSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { status: "error", message: "Validation error", errors: validated.error.issues },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection unavailable. Please configure MONGODB_URI to persist tours.",
        },
        { status: 503 }
      );
    }

    const slug = validated.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newTour = await TourModel.create({
      ...validated.data,
      slug,
      isPublished: true,
      itinerary: [],
      images: [validated.data.imageCover],
    });

    return NextResponse.json({ status: "success", data: newTour }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/tours error:", error);

    // Asset cleanup: if cover image was uploaded but tour creation failed, clean up Cloudinary asset
    if (typeof requestBody === "object" && requestBody !== null && "coverImagePublicId" in requestBody) {
      const publicId = (requestBody as { coverImagePublicId?: string }).coverImagePublicId;
      if (publicId) {
        try {
          const { deleteImage } = await import("@/lib/images/cloudinary");
          await deleteImage(publicId);
        } catch (cleanupErr) {
          console.warn("Failed to delete orphaned Cloudinary asset:", cleanupErr);
        }
      }
    }

    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json(
        { status: "error", message: "A tour with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { status: "error", message: "Failed to create tour" },
      { status: 500 }
    );
  }
}
