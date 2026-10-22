import { connectToDatabase } from "@/lib/db/mongodb";
import { Tour as TourModel } from "@/models/Tour";
import { TourDeparture as TourDepartureModel } from "@/models/TourDeparture";
import { Review as ReviewModel } from "@/models/Review";
import { SAMPLE_TOURS, SAMPLE_DEPARTURES, SAMPLE_REVIEWS } from "@/lib/data/sample-tours";
import { Tour, TourFilterParams, TourDeparture, Review } from "@/types";

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
        query.$or = [
          { name: { $regex: params.search, $options: "i" } },
          { destination: { $regex: params.search, $options: "i" } },
          { country: { $regex: params.search, $options: "i" } },
          { summary: { $regex: params.search, $options: "i" } },
        ];
      }

      if (params.category && params.category !== "all") {
        query.category = params.category;
      }

      if (params.difficulty && params.difficulty !== "all") {
        query.difficulty = params.difficulty;
      }

      if (params.destination && params.destination.trim()) {
        query.destination = { $regex: params.destination, $options: "i" };
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

      if (tours.length > 0) {
        return {
          tours: JSON.parse(JSON.stringify(tours)),
          total,
          page,
          totalPages: Math.ceil(total / limit),
          isLiveDatabase: true,
        };
      }
    } catch (err) {
      console.warn("DB query fallback to sample data:", err);
    }
  }

  // Graceful fallback to rich sample tours
  let filtered = [...SAMPLE_TOURS];

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
    const q = params.destination.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.destination.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q)
    );
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

export async function getTourBySlug(slug: string): Promise<Tour | null> {
  const db = await connectToDatabase();
  if (db) {
    try {
      const tour = await TourModel.findOne({ slug }).lean();
      if (tour) {
        return JSON.parse(JSON.stringify(tour));
      }
    } catch (err) {
      console.warn("DB getTourBySlug fallback:", err);
    }
  }

  const sample = SAMPLE_TOURS.find((t) => t.slug === slug);
  return sample || null;
}

export async function getTourDepartures(tourIdOrSlug: string): Promise<TourDeparture[]> {
  const db = await connectToDatabase();
  if (db) {
    try {
      // Find tour first if slug passed
      let tourObjId = tourIdOrSlug;
      if (!tourIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
        const found = await TourModel.findOne({ slug: tourIdOrSlug }).select("_id").lean();
        if (found) tourObjId = (found._id as object).toString();
      }
      const departures = await TourDepartureModel.find({ tour: tourObjId }).sort({ startDate: 1 }).lean();
      if (departures.length > 0) {
        return JSON.parse(JSON.stringify(departures));
      }
    } catch (err) {
      console.warn("DB departures fallback:", err);
    }
  }

  const tour = SAMPLE_TOURS.find((t) => t.slug === tourIdOrSlug || t._id === tourIdOrSlug);
  if (!tour) return [];
  return SAMPLE_DEPARTURES.filter((d) => d.tour === tour._id);
}

export async function getTourReviews(tourIdOrSlug: string): Promise<Review[]> {
  const db = await connectToDatabase();
  if (db) {
    try {
      let tourObjId = tourIdOrSlug;
      if (!tourIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
        const found = await TourModel.findOne({ slug: tourIdOrSlug }).select("_id").lean();
        if (found) tourObjId = (found._id as object).toString();
      }
      const reviews = await ReviewModel.find({ tour: tourObjId })
        .populate("user", "name photo")
        .sort({ createdAt: -1 })
        .lean();
      if (reviews.length > 0) {
        return JSON.parse(JSON.stringify(reviews));
      }
    } catch (err) {
      console.warn("DB reviews fallback:", err);
    }
  }

  const tour = SAMPLE_TOURS.find((t) => t.slug === tourIdOrSlug || t._id === tourIdOrSlug);
  if (!tour) return [];
  return SAMPLE_REVIEWS.filter((r) => r.tour === tour._id);
}
