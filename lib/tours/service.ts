import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Tour as TourModel } from "@/models/Tour";
import { TourDeparture as TourDepartureModel } from "@/models/TourDeparture";
import { Review as ReviewModel } from "@/models/Review";
import { SAMPLE_TOURS, SAMPLE_DEPARTURES, SAMPLE_REVIEWS } from "@/lib/data/sample-tours";
import { INDIAN_TOURS } from "@/lib/data/indian-tours";
import { Tour, TourFilterParams, TourDeparture, Review } from "@/types";
import { resolveDestinationCoordinates, normalizeDestinationQuery } from "@/lib/geo/destinations";

export interface TourQueryResult {
  tours: Tour[];
  total: number;
  page: number;
  totalPages: number;
  isLiveDatabase: boolean;
}

export async function getTours(params: TourFilterParams = {}): Promise<TourQueryResult> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(params.limit) || 9));
  const skip = (page - 1) * limit;

  const db = await connectToDatabase();

  if (db) {
    try {
      const query: Record<string, unknown> = { isPublished: true };

      if (params.search) {
        const rawSearch = params.search.trim();
        const norm = normalizeDestinationQuery(rawSearch);
        const searchRegex = { $regex: rawSearch, $options: "i" };
        const normRegex = norm ? { $regex: norm, $options: "i" } : searchRegex;

        const resolvedSearch = resolveDestinationCoordinates(rawSearch);
        if (resolvedSearch && resolvedSearch.type !== "country") {
          query.$or = [
            { destination: normRegex },
            { city: normRegex },
            { state: normRegex },
            { name: searchRegex },
            { summary: searchRegex },
          ];
        } else {
          query.$or = [
            { name: searchRegex },
            { destination: searchRegex },
            { city: searchRegex },
            { state: searchRegex },
            { country: searchRegex },
            { summary: searchRegex },
            { tags: searchRegex },
          ];
        }
      }

      if (params.category && params.category !== "all") {
        query.category = params.category;
      }

      if (params.difficulty && params.difficulty !== "all") {
        query.difficulty = params.difficulty;
      }

      if (params.destination && params.destination.trim()) {
        const rawDest = params.destination.trim();
        const norm = normalizeDestinationQuery(rawDest);
        const resolved = resolveDestinationCoordinates(rawDest);

        if (
          resolved?.type === "country" ||
          (!resolved &&
            /^(india|japan|peru|nepal|switzerland|italy|canada|turkey|tanzania|argentina|morocco|new zealand)$/i.test(
              rawDest
            ))
        ) {
          query.country = { $regex: norm || rawDest, $options: "i" };
        } else {
          const target = norm || rawDest;
          const targetRegex = { $regex: target, $options: "i" };
          query.$or = [
            { destination: targetRegex },
            { city: targetRegex },
            { state: targetRegex },
          ];
        }
      }

      if (params.minPrice || params.maxPrice) {
        query.price = {};
        if (params.minPrice) (query.price as Record<string, number>).$gte = Number(params.minPrice);
        if (params.maxPrice) (query.price as Record<string, number>).$lte = Number(params.maxPrice);
      }

      if (params.duration) {
        if (params.duration === "1-3") {
          query.duration = { $gte: 1, $lte: 3 };
        } else if (params.duration === "4-7") {
          query.duration = { $gte: 4, $lte: 7 };
        } else if (params.duration === "8+") {
          query.duration = { $gte: 8 };
        }
      }

      let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
      if (params.sort === "price-asc") sortOption = { price: 1 };
      else if (params.sort === "price-desc") sortOption = { price: -1 };
      else if (params.sort === "rating") sortOption = { ratingsAverage: -1 };
      else if (params.sort === "popular") sortOption = { ratingsQuantity: -1 };

      const [total, tours] = await Promise.all([
        TourModel.countDocuments(query),
        TourModel.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      ]);

      return {
        tours: JSON.parse(JSON.stringify(tours)),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        isLiveDatabase: true,
      };
    } catch (err) {
      console.warn("DB query fallback to sample data:", err);
    }
  }

  // Graceful fallback to rich sample tours
  let filtered = [...SAMPLE_TOURS, ...INDIAN_TOURS];

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q)
    );
  }

  if (params.category && params.category !== "all") {
    filtered = filtered.filter((t) => t.category === params.category);
  }

  if (params.difficulty && params.difficulty !== "all") {
    filtered = filtered.filter((t) => t.difficulty === params.difficulty);
  }

  if (params.destination && params.destination.trim()) {
    const rawDest = params.destination.trim();
    const norm = normalizeDestinationQuery(rawDest);
    const resolved = resolveDestinationCoordinates(rawDest);
    if (
      resolved?.type === "country" ||
      (!resolved &&
        /^(india|japan|peru|nepal|switzerland|italy|canada|turkey|tanzania|argentina|morocco|new zealand)$/i.test(
          rawDest
        ))
    ) {
      filtered = filtered.filter((t) =>
        t.country.toLowerCase().includes((norm || rawDest).toLowerCase())
      );
    } else {
      const target = (norm || rawDest).toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.destination.toLowerCase().includes(target) ||
          (t.city && t.city.toLowerCase().includes(target)) ||
          (t.state && t.state.toLowerCase().includes(target))
      );
    }
  }

  if (params.minPrice) {
    filtered = filtered.filter((t) => t.price >= Number(params.minPrice));
  }

  if (params.maxPrice) {
    filtered = filtered.filter((t) => t.price <= Number(params.maxPrice));
  }

  if (params.duration) {
    if (params.duration === "1-3") filtered = filtered.filter((t) => t.duration >= 1 && t.duration <= 3);
    else if (params.duration === "4-7") filtered = filtered.filter((t) => t.duration >= 4 && t.duration <= 7);
    else if (params.duration === "8+") filtered = filtered.filter((t) => t.duration >= 8);
  }

  if (params.sort === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (params.sort === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (params.sort === "rating") {
    filtered.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
  } else if (params.sort === "popular") {
    filtered.sort((a, b) => b.ratingsQuantity - a.ratingsQuantity);
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = filtered.length;
  const paginatedTours = filtered.slice(skip, skip + limit);

  return {
    tours: paginatedTours,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    isLiveDatabase: false,
  };
}

export async function getTourBySlug(slugOrId: string): Promise<Tour | null> {
  if (!slugOrId) return null;
  const decoded = decodeURIComponent(slugOrId).trim();
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(decoded);

  const db = await connectToDatabase();
  if (db) {
    try {
      let tour = null;
      if (isMongoId) {
        tour = await TourModel.findById(decoded).lean();
        if (!tour) {
          tour = await TourModel.findOne({ slug: decoded }).lean();
        }
      } else {
        tour = await TourModel.findOne({ slug: decoded }).lean();
        if (!tour) {
          // Case-insensitive fallback
          tour = await TourModel.findOne({
            slug: { $regex: new RegExp(`^${decoded}$`, "i") },
          }).lean();
        }
      }

      if (tour) {
        return JSON.parse(JSON.stringify(tour));
      }
    } catch (err) {
      console.warn("DB getTourBySlug fallback:", err);
    }
  }

  const allFallbackTours = [...SAMPLE_TOURS, ...INDIAN_TOURS];
  const sample = allFallbackTours.find(
    (t) =>
      t.slug === decoded ||
      t.slug.toLowerCase() === decoded.toLowerCase() ||
      t._id === decoded ||
      (t as { id?: string }).id === decoded
  );
  return sample || null;
}

export async function getTourDepartures(tourIdOrSlug: string): Promise<TourDeparture[]> {
  if (!tourIdOrSlug) return [];
  const decoded = decodeURIComponent(tourIdOrSlug).trim();
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(decoded);

  const db = await connectToDatabase();
  if (db) {
    try {
      let tourObjId = decoded;
      if (!isMongoId) {
        const found = await TourModel.findOne({
          $or: [
            { slug: decoded },
            { slug: { $regex: new RegExp(`^${decoded}$`, "i") } },
          ],
        }).select("_id").lean();
        if (found) tourObjId = (found._id as object).toString();
      }

      if (/^[0-9a-fA-F]{24}$/.test(tourObjId)) {
        const departures = await TourDepartureModel.find({
          tour: new mongoose.Types.ObjectId(tourObjId),
        }).sort({ startDate: 1 }).lean();
        if (departures.length > 0) {
          return JSON.parse(JSON.stringify(departures));
        }
      }
    } catch (err) {
      console.warn("DB departures fallback:", err);
    }
  }

  const allFallbackTours = [...SAMPLE_TOURS, ...INDIAN_TOURS];
  const tour = allFallbackTours.find(
    (t) =>
      t.slug === decoded ||
      t.slug.toLowerCase() === decoded.toLowerCase() ||
      t._id === decoded ||
      (t as { id?: string }).id === decoded
  );
  if (!tour) return [];

  const sampleDeps = SAMPLE_DEPARTURES.filter(
    (d) => d.tour === tour._id || d.tour === (tour as { id?: string }).id
  );
  if (sampleDeps.length > 0) return sampleDeps;

  // Realistic future departures for tours without stored departures
  return [
    {
      _id: `dep-${tour._id}-1`,
      tour: tour._id,
      startDate: "2026-06-15",
      endDate: "2026-06-22",
      capacity: tour.maxGroupSize || 12,
      reservedSeats: 4,
      status: "open",
    },
    {
      _id: `dep-${tour._id}-2`,
      tour: tour._id,
      startDate: "2026-07-10",
      endDate: "2026-07-17",
      capacity: tour.maxGroupSize || 12,
      reservedSeats: 7,
      status: "open",
    },
    {
      _id: `dep-${tour._id}-3`,
      tour: tour._id,
      startDate: "2026-08-05",
      endDate: "2026-08-12",
      capacity: tour.maxGroupSize || 12,
      reservedSeats: 2,
      status: "open",
    },
  ];
}

export async function getTourReviews(tourIdOrSlug: string): Promise<Review[]> {
  if (!tourIdOrSlug) return [];
  const decoded = decodeURIComponent(tourIdOrSlug).trim();
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(decoded);

  const db = await connectToDatabase();
  if (db) {
    try {
      let tourObjId = decoded;
      if (!isMongoId) {
        const found = await TourModel.findOne({
          $or: [
            { slug: decoded },
            { slug: { $regex: new RegExp(`^${decoded}$`, "i") } },
          ],
        }).select("_id").lean();
        if (found) tourObjId = (found._id as object).toString();
      }

      if (/^[0-9a-fA-F]{24}$/.test(tourObjId)) {
        const reviews = await ReviewModel.find({
          tour: new mongoose.Types.ObjectId(tourObjId),
        })
          .populate("user", "name photo")
          .sort({ createdAt: -1 })
          .lean();
        if (reviews.length > 0) {
          return JSON.parse(JSON.stringify(reviews));
        }
      }
    } catch (err) {
      console.warn("DB reviews fallback:", err);
    }
  }

  const allFallbackTours = [...SAMPLE_TOURS, ...INDIAN_TOURS];
  const tour = allFallbackTours.find(
    (t) =>
      t.slug === decoded ||
      t.slug.toLowerCase() === decoded.toLowerCase() ||
      t._id === decoded ||
      (t as { id?: string }).id === decoded
  );
  if (!tour) return [];
  return SAMPLE_REVIEWS.filter(
    (r) => r.tour === tour._id || r.tour === (tour as { id?: string }).id
  );
}
