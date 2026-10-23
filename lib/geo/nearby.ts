import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Tour as TourModel } from "@/models/Tour";
import { SAMPLE_TOURS } from "@/lib/data/sample-tours";
import { INDIAN_TOURS } from "@/lib/data/indian-tours";
import { Tour } from "@/types";
import { calculateDistanceKm } from "./distance";

export interface NearbySearchOptions {
  coordinates: [number, number]; // [longitude, latitude]
  searchedDestination?: string;
  category?: string;
  difficulty?: string;
  limit?: number;
  initialRadiusKm?: number;
  maxRadiusKm?: number;
}

export interface NearbySearchResult {
  tours: (Tour & { distanceKm: number })[];
  tierRadiusKm: number;
  totalFound: number;
  isLiveDatabase: boolean;
}

export interface BestForYouOptions {
  limit?: number;
  preferredCategories?: string[];
  preferredCountries?: string[];
  excludeTourIds?: string[];
}

// Configurable distance tiers in kilometers
export const DISTANCE_TIERS_KM = [100, 250, 500];

/**
 * Searches for nearby expeditions using MongoDB 2dsphere $geoNear aggregation,
 * expanding through configured distance tiers (100km -> 250km -> 500km).
 */
export async function getNearbyTours(
  options: NearbySearchOptions
): Promise<NearbySearchResult> {
  const {
    coordinates,
    searchedDestination = "",
    category,
    difficulty,
    limit = 6,
    maxRadiusKm = 500,
  } = options;

  const db = await connectToDatabase();
  const normalizedDest = searchedDestination.trim().toLowerCase();

  let lastLiveResult: NearbySearchResult | null = null;
  const minDesired = Math.min(4, limit);

  // Tiered search: 100km -> 250km -> 500km
  for (const tierKm of DISTANCE_TIERS_KM) {
    if (tierKm > maxRadiusKm) break;

    const maxDistanceMeters = tierKm * 1000;

    if (db) {
      try {
        const queryFilter: Record<string, unknown> = {
          isPublished: true,
        };

        if (category && category !== "all") {
          queryFilter.category = category;
        }

        if (difficulty && difficulty !== "all") {
          queryFilter.difficulty = difficulty;
        }

        // Exclude exact matches from nearby results if already searched
        if (normalizedDest) {
          queryFilter.$and = [
            { destination: { $not: new RegExp(`^${normalizedDest}$`, "i") } },
            { city: { $not: new RegExp(`^${normalizedDest}$`, "i") } },
            { state: { $not: new RegExp(`^${normalizedDest}$`, "i") } },
          ];
        }

        // MongoDB $geoNear aggregation pipeline
        const pipeline: mongoose.PipelineStage[] = [
          {
            $geoNear: {
              key: "location",
              near: {
                type: "Point",
                coordinates: coordinates, // [longitude, latitude]
              },
              distanceField: "distanceMeters",
              maxDistance: maxDistanceMeters,
              spherical: true,
              query: queryFilter,
            },
          },
          {
            $sort: {
              distanceMeters: 1,
              ratingsAverage: -1,
              ratingsQuantity: -1,
            },
          },
          { $limit: limit },
        ];

        const results = await TourModel.aggregate(pipeline);

        if (results && results.length > 0) {
          const formattedTours = results.map((doc) => {
            const tour = JSON.parse(JSON.stringify(doc));
            const distanceKm = Math.max(1, Math.round(doc.distanceMeters / 1000));
            return {
              ...tour,
              distanceKm,
            };
          });

          const currentResult: NearbySearchResult = {
            tours: formattedTours,
            tierRadiusKm: tierKm,
            totalFound: formattedTours.length,
            isLiveDatabase: true,
          };

          // If we found enough tours or reached max tier, return immediately
          if (
            formattedTours.length >= minDesired ||
            tierKm === maxRadiusKm ||
            tierKm >= DISTANCE_TIERS_KM[DISTANCE_TIERS_KM.length - 1]
          ) {
            return currentResult;
          }

          lastLiveResult = currentResult;
        }
      } catch (err) {
        console.warn(`MongoDB $geoNear attempt failed at tier ${tierKm}km:`, err);
      }
    }
  }

  if (lastLiveResult) {
    return lastLiveResult;
  }

  // Graceful in-memory fallback using Haversine distance
  const allFallback = [...SAMPLE_TOURS, ...INDIAN_TOURS];
  let lastFallbackResult: NearbySearchResult | null = null;

  for (const tierKm of DISTANCE_TIERS_KM) {
    if (tierKm > maxRadiusKm) break;

    const candidates: (Tour & { distanceKm: number })[] = [];

    for (const tour of allFallback) {
      if (tour.isPublished === false) continue;
      if (category && category !== "all" && tour.category !== category) continue;
      if (difficulty && difficulty !== "all" && tour.difficulty !== difficulty) continue;

      // Exclude exact destination match
      if (normalizedDest) {
        if (
          tour.destination.toLowerCase() === normalizedDest ||
          tour.city?.toLowerCase() === normalizedDest ||
          tour.state?.toLowerCase() === normalizedDest
        ) {
          continue;
        }
      }

      const tourCoords =
        tour.location?.coordinates || tour.startLocation?.coordinates;
      if (!tourCoords || tourCoords.length !== 2) continue;

      const distKm = calculateDistanceKm(coordinates, tourCoords as [number, number]);
      if (distKm <= tierKm) {
        candidates.push({
          ...tour,
          distanceKm: Math.max(1, distKm),
        });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        if (a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
        return b.ratingsAverage - a.ratingsAverage;
      });

      const currentResult: NearbySearchResult = {
        tours: candidates.slice(0, limit),
        tierRadiusKm: tierKm,
        totalFound: candidates.length,
        isLiveDatabase: false,
      };

      if (
        candidates.length >= minDesired ||
        tierKm === maxRadiusKm ||
        tierKm >= DISTANCE_TIERS_KM[DISTANCE_TIERS_KM.length - 1]
      ) {
        return currentResult;
      }

      lastFallbackResult = currentResult;
    }
  }

  if (lastFallbackResult) {
    return lastFallbackResult;
  }

  return {
    tours: [],
    tierRadiusKm: maxRadiusKm,
    totalFound: 0,
    isLiveDatabase: Boolean(db),
  };
}

/**
 * Retrieves the highest-rated expeditions based on genuine review averages and review count.
 * Used for the "Best for You" section when no nearby tours exist or alongside nearby recommendations.
 */
export async function getBestForYouTours(
  options: BestForYouOptions = {}
): Promise<Tour[]> {
  const {
    limit = 4,
    preferredCategories = [],
    preferredCountries = [],
    excludeTourIds = [],
  } = options;

  const db = await connectToDatabase();

  if (db) {
    try {
      const filter: Record<string, unknown> = {
        isPublished: true,
      };

      if (excludeTourIds.length > 0) {
        filter._id = {
          $nin: excludeTourIds.map((id) =>
            mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id
          ),
        };
      }

      // Sort primarily by real rating, secondarily by review count
      const tours = await TourModel.find(filter)
        .sort({ ratingsAverage: -1, ratingsQuantity: -1, createdAt: -1 })
        .limit(limit * 2)
        .lean();

      if (tours.length > 0) {
        const parsedTours: Tour[] = JSON.parse(JSON.stringify(tours));

        // Prioritize preferred categories or countries if provided by signed-in traveler
        if (preferredCategories.length > 0 || preferredCountries.length > 0) {
          parsedTours.sort((a, b) => {
            const aCatMatch = preferredCategories.includes(a.category) ? 1 : 0;
            const bCatMatch = preferredCategories.includes(b.category) ? 1 : 0;
            const aCountryMatch = preferredCountries.includes(a.country) ? 1 : 0;
            const bCountryMatch = preferredCountries.includes(b.country) ? 1 : 0;

            const aScore = aCatMatch + aCountryMatch;
            const bScore = bCatMatch + bCountryMatch;

            if (aScore !== bScore) return bScore - aScore;
            return b.ratingsAverage - a.ratingsAverage;
          });
        }

        return parsedTours.slice(0, limit);
      }
    } catch (err) {
      console.warn("MongoDB BestForYou query failed, falling back to sample tours:", err);
    }
  }

  // In-memory fallback
  const allFallback = [...SAMPLE_TOURS, ...INDIAN_TOURS].filter(
    (t) => t.isPublished !== false && !excludeTourIds.includes(t._id)
  );

  allFallback.sort((a, b) => {
    if (b.ratingsAverage !== a.ratingsAverage) {
      return b.ratingsAverage - a.ratingsAverage;
    }
    return b.ratingsQuantity - a.ratingsQuantity;
  });

  return allFallback.slice(0, limit);
}
