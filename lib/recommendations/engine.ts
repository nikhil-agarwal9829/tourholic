import { Tour, RecommendationResult } from "@/types";

export interface UserPreferences {
  destination?: string;
  maxBudget?: number;
  category?: string;
  difficulty?: string;
  duration?: number;
  favoriteTourIds?: string[];
  pastBookedTourIds?: string[];
}

/**
 * Pure, explainable rule-based recommendation engine.
 * Scores and ranks candidate tours against user preferences and platform quality signals.
 */
export function getRecommendedTours(
  tours: Tour[],
  preferences?: UserPreferences,
  limit: number = 6
): RecommendationResult[] {
  const publishedTours = tours.filter((t) => t.isPublished);

  const scoredTours: RecommendationResult[] = publishedTours.map((tour) => {
    let score = 0;
    const priorityReasons: string[] = [];
    const qualityReasons: string[] = [];

    // Preference matching
    if (preferences) {
      // 1. Destination matching
      if (preferences.destination && preferences.destination.trim()) {
        const query = preferences.destination.toLowerCase();
        if (
          tour.destination.toLowerCase().includes(query) ||
          tour.country.toLowerCase().includes(query) ||
          tour.name.toLowerCase().includes(query)
        ) {
          score += 100;
          priorityReasons.push(`Matches your target destination: ${tour.destination}`);
        }
      }

      // 2. Budget criteria
      if (preferences.maxBudget && preferences.maxBudget > 0) {
        if (tour.price <= preferences.maxBudget) {
          score += 80;
          priorityReasons.push(`Within your $${preferences.maxBudget} budget`);
        } else if (tour.price <= preferences.maxBudget * 1.15) {
          score += 20;
          priorityReasons.push("Close to your budget preference");
        } else {
          score -= 50; // penalty for exceeding budget
        }
      }

      // 3. Category matching
      if (preferences.category && preferences.category !== "all") {
        if (tour.category.toLowerCase() === preferences.category.toLowerCase()) {
          score += 70;
          priorityReasons.push(`Matches your interest in ${tour.category} journeys`);
        }
      }

      // 4. Difficulty matching
      if (preferences.difficulty && preferences.difficulty !== "all") {
        if (tour.difficulty === preferences.difficulty) {
          score += 35;
          priorityReasons.push(`Matches your preferred ${tour.difficulty} pace`);
        }
      }

      // 5. Duration matching
      if (preferences.duration) {
        const diff = Math.abs(tour.duration - preferences.duration);
        if (diff === 0) {
          score += 30;
          priorityReasons.push(`Exact duration match (${tour.duration} days)`);
        } else if (diff <= 2) {
          score += 15;
          priorityReasons.push(`Ideal duration fit (${tour.duration} days)`);
        }
      }

      // 6. Affinity to saved or booked tours
      if (
        preferences.favoriteTourIds?.includes(tour._id) ||
        preferences.pastBookedTourIds?.includes(tour._id)
      ) {
        score += 30;
        priorityReasons.push("Related to tours you saved in your wishlist");
      }
    }

    // Platform quality signals
    if (tour.featured) {
      score += 15;
      qualityReasons.push("Featured curator's choice");
    }

    if (tour.ratingsAverage >= 4.9) {
      score += 20;
      qualityReasons.push(`Top-rated expedition (${tour.ratingsAverage}★ out of 5)`);
    } else if (tour.ratingsAverage >= 4.8) {
      score += 10;
      qualityReasons.push("Highly rated by travelers");
    }

    if (tour.ratingsQuantity >= 50) {
      score += 10;
      qualityReasons.push("High community popularity");
    }

    // Combine reasons, with priority user-match reasons appearing first
    const combinedReasons = [...priorityReasons, ...qualityReasons];
    if (combinedReasons.length === 0) {
      combinedReasons.push("Popular discovery picked for you");
    }

    return {
      tour,
      score,
      reasons: combinedReasons.slice(0, 3),
    };
  });

  return scoredTours.sort((a, b) => b.score - a.score).slice(0, limit);
}
