import { connectToDatabase } from "@/lib/db/mongodb";
import { Tour as TourModel } from "@/models/Tour";
import { SAMPLE_TOURS } from "@/lib/data/sample-tours";
import { INDIAN_TOURS } from "@/lib/data/indian-tours";
import { Tour, TravelPreferences, RecommendationResult } from "@/types";

export interface GroupedRecommendations {
  personalized: RecommendationResult[];
  hasPreferences: boolean;
  topRated: Tour[];
  exploreIndia: Tour[];
  exploreMore: Tour[];
  targetDestinationMessage?: string;
}

/**
 * Normalizes text for reliable case-insensitive comparison.
 */
function normalize(str?: string): string {
  return (str || "").trim().toLowerCase();
}

/**
 * Deterministic, rule-based recommendation service.
 * Pure MongoDB queries, user preference matching, and deterministic sorting.
 * ZERO AI, LLMs, embeddings, or external machine learning APIs.
 */
export async function getGroupedRecommendations(
  preferences?: TravelPreferences,
  limitPerSection: number = 6
): Promise<GroupedRecommendations> {
  let allTours: Tour[] = [];

  try {
    const db = await connectToDatabase();
    if (db) {
      const rawTours = await TourModel.find({ isPublished: true }).lean();
      if (rawTours && rawTours.length > 0) {
        allTours = JSON.parse(JSON.stringify(rawTours));
      }
    }
  } catch (err) {
    console.warn("DB query fallback in recommendation service:", err);
  }

  if (allTours.length === 0) {
    allTours = [...SAMPLE_TOURS, ...INDIAN_TOURS];
  }

  // Determine if user has provided actionable travel preferences
  const hasDestinationPref = Boolean(
    (preferences?.preferredDestinations && preferences.preferredDestinations.length > 0) ||
    (preferences?.preferredCountries && preferences.preferredCountries.length > 0)
  );
  const hasCategoryPref = Boolean(
    preferences?.preferredCategories && preferences.preferredCategories.length > 0
  );
  const hasBudgetPref = Boolean(preferences?.maxBudget && preferences.maxBudget > 0);
  const hasDurationPref = Boolean(preferences?.preferredDuration && preferences.preferredDuration > 0);

  const hasPreferences = hasDestinationPref || hasCategoryPref || hasBudgetPref || hasDurationPref;

  // 2. Score & Rank Personalized Recommendations
  let personalized: RecommendationResult[] = [];
  let targetDestinationMessage: string | undefined = undefined;

  if (hasPreferences && preferences) {
    const prefDestinations = (preferences.preferredDestinations || []).map(normalize);
    const prefCountries = (preferences.preferredCountries || []).map(normalize);
    const prefCategories = (preferences.preferredCategories || []).map(normalize);
    const maxBudget = preferences.maxBudget;
    const prefDuration = preferences.preferredDuration;

    const scored = allTours.map((tour) => {
      let score = 0;
      const reasons: string[] = [];
      const tourCity = normalize(tour.city);
      const tourState = normalize(tour.state);
      const tourDest = normalize(tour.destination);
      const tourCountry = normalize(tour.country);
      const tourCat = normalize(tour.category);
      const tourTags = (tour.tags || []).map(normalize);

      // Rule 1: Exact Destination City / Region Match (Highest Priority)
      let destinationMatched = false;
      for (const dest of prefDestinations) {
        if (!dest) continue;
        if (
          (tourCity && (tourCity === dest || dest.includes(tourCity) || tourCity.includes(dest))) ||
          (tourDest && (tourDest.includes(dest) || dest.includes(tourDest))) ||
          (tourTags.length > 0 && tourTags.includes(dest))
        ) {
          score += 120;
          reasons.push(`Matches your selected destination: ${tour.city || tour.destination}`);
          destinationMatched = true;
          break;
        } else if (tourState && (tourState === dest || dest.includes(tourState) || tourState.includes(dest))) {
          score += 90;
          reasons.push(`Located in your preferred region: ${tour.state}`);
          destinationMatched = true;
          break;
        }
      }

      // Rule 2: Country Match
      let countryMatched = false;
      for (const c of prefCountries) {
        if (!c) continue;
        if (tourCountry === c || tourCountry.includes(c) || c.includes(tourCountry)) {
          score += 60;
          if (!destinationMatched) {
            reasons.push(`Located in your preferred country: ${tour.country}`);
          }
          countryMatched = true;
          break;
        }
      }

      // If user specified India as destination scope
      if (preferences.destinationScope === "india" && tourCountry === "india") {
        score += 30;
      }

      // Rule 3: Category Match
      for (const cat of prefCategories) {
        if (!cat) continue;
        if (
          tourCat === cat ||
          (cat === "beach" && (tourCat === "beaches" || tourCat === "relaxation")) ||
          (cat === "cultural" && tourCat === "heritage") ||
          (cat === "heritage" && tourCat === "cultural") ||
          tourTags.includes(cat)
        ) {
          score += 50;
          reasons.push(`Matches your interest in ${tour.category} journeys`);
          break;
        }
      }

      // Rule 4: Budget Constraints
      if (maxBudget && maxBudget > 0) {
        if (tour.price <= maxBudget) {
          score += 35;
          reasons.push(`Within your $${maxBudget} budget`);
        } else if (tour.price <= maxBudget * 1.15) {
          score += 10;
        } else if (tour.price > maxBudget * 1.4) {
          score -= 40; // Penalty for heavily exceeding budget
        }
      }

      // Rule 5: Duration Fit
      if (prefDuration && prefDuration > 0) {
        const diff = Math.abs(tour.duration - prefDuration);
        if (diff === 0) {
          score += 25;
          reasons.push(`Exact duration fit (${tour.duration} days)`);
        } else if (diff <= 2) {
          score += 15;
        }
      }

      // Rule 6: Platform Quality Signals (Real Reviews & Ratings)
      if (tour.ratingsAverage >= 4.8 && tour.ratingsQuantity >= 2) {
        score += 20;
        reasons.push(`Highly rated by travelers (${tour.ratingsAverage}★)`);
      } else if (tour.ratingsAverage >= 4.5 && tour.ratingsQuantity >= 2) {
        score += 10;
      }

      if (tour.featured) {
        score += 10;
      }

      // If destination preference was specified, require either destination or country match
      const isEligible = !hasDestinationPref || destinationMatched || countryMatched;

      return {
        tour,
        score: isEligible ? score : 0,
        reasons: reasons.slice(0, 3),
      };
    });

    // Filter to tours with meaningful positive match score
    const matching = scored
      .filter((s) => s.score >= 50)
      .sort((a, b) => {
        // Sort primarily by score, tie-break by ratingsAverage and ratingsQuantity
        if (b.score !== a.score) return b.score - a.score;
        if (b.tour.ratingsAverage !== a.tour.ratingsAverage) {
          return b.tour.ratingsAverage - a.tour.ratingsAverage;
        }
        return b.tour.ratingsQuantity - a.tour.ratingsQuantity;
      });

    personalized = matching.slice(0, limitPerSection);

    // If destination was requested but no matching tours exist
    if (hasDestinationPref && personalized.length === 0) {
      const requestedDests = (preferences.preferredDestinations || []).join(", ");
      targetDestinationMessage = `No tours currently available for "${requestedDests}". Try selecting another region or destination.`;
    }
  }

  // If user has NO preferences, provide deterministic curated recommendations
  if (personalized.length === 0 && !hasPreferences) {
    personalized = allTours
      .filter((t) => t.featured || t.ratingsAverage >= 4.5)
      .sort((a, b) => b.ratingsAverage - a.ratingsAverage || b.ratingsQuantity - a.ratingsQuantity)
      .slice(0, limitPerSection)
      .map((tour) => ({
        tour,
        score: 100,
        reasons: [
          tour.ratingsQuantity >= 2
            ? `Top-rated expedition (${tour.ratingsAverage}★)`
            : "Handpicked curator's choice",
        ],
      }));
  }

  // 3. Top Rated Expeditions (Calculated from real reviews, threshold: ratingsQuantity >= 2)
  const topRated = allTours
    .filter((t) => (t.ratingsQuantity || 0) >= 2 && (t.ratingsAverage || 0) >= 4.5)
    .sort((a, b) => {
      if (b.ratingsAverage !== a.ratingsAverage) {
        return b.ratingsAverage - a.ratingsAverage;
      }
      return b.ratingsQuantity - a.ratingsQuantity;
    })
    .slice(0, limitPerSection);

  // 4. Explore India Collection (Dedicated Indian Tours)
  const exploreIndia = allTours
    .filter((t) => normalize(t.country) === "india")
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  // 5. Explore More / Discover All (Exclude tours already shown to reduce duplication)
  const shownIds = new Set([
    ...personalized.map((p) => p.tour._id),
    ...topRated.map((t) => t._id),
    ...exploreIndia.map((t) => t._id),
  ]);

  const exploreMore = allTours
    .filter((t) => !shownIds.has(t._id))
    .slice(0, limitPerSection);

  return {
    personalized,
    hasPreferences,
    topRated,
    exploreIndia,
    exploreMore: exploreMore.length > 0 ? exploreMore : allTours.slice(0, limitPerSection),
    targetDestinationMessage,
  };
}
