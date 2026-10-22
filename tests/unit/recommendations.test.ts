import { describe, it, expect } from "vitest";
import { INDIAN_TOURS } from "../../lib/data/indian-tours";
import { SAMPLE_TOURS } from "../../lib/data/sample-tours";
import { getGroupedRecommendations } from "../../lib/recommendations/deterministic-service";
import { TravelPreferences } from "../../types";

describe("Touroholic Deterministic Recommendation Engine (No AI)", () => {
  describe("Indian Tours Data Integrity", () => {
    it("contains exactly 12 realistic Indian tour packages", () => {
      expect(INDIAN_TOURS).toHaveLength(12);
    });

    it("verifies all 12 Indian tours have valid unique slugs, states, cities, and country set to India", () => {
      const slugs = new Set<string>();
      const expectedCities = [
        "mumbai",
        "new delhi",
        "srinagar",
        "varkala",
        "alappuzha",
        "panaji",
        "jaipur",
        "agra",
        "rishikesh",
        "manali",
        "varanasi",
        "darjeeling",
      ];

      for (const tour of INDIAN_TOURS) {
        expect(tour.name).toBeTruthy();
        expect(tour.slug).toMatch(/^[a-z0-9-]+$/);
        expect(slugs.has(tour.slug)).toBe(false);
        slugs.add(tour.slug);

        expect(tour.country).toBe("India");
        expect(tour.state).toBeTruthy();
        expect(tour.city).toBeTruthy();
        expect(expectedCities).toContain(tour.city!.toLowerCase());

        expect(tour.duration).toBeGreaterThan(0);
        expect(tour.price).toBeGreaterThan(0);
        expect(tour.currency).toBe("USD");
        expect(tour.imageCover.startsWith("https://")).toBe(true);
      }
    });

    it("ensures newly seeded Indian tours have zero fake reviews or fabricated ratings", () => {
      for (const tour of INDIAN_TOURS) {
        expect(tour.ratingsAverage).toBe(0);
        expect(tour.ratingsQuantity).toBe(0);
      }
    });
  });

  describe("Deterministic Recommendation Matching Rules", () => {
    it("prioritizes exact city and destination matches (e.g. Mumbai)", async () => {
      const prefs: TravelPreferences = {
        preferredDestinations: ["Mumbai"],
        preferredCountries: ["India"],
        onboardingCompleted: true,
      };

      const result = await getGroupedRecommendations(prefs, 6);
      expect(result.personalized.length).toBeGreaterThan(0);
      const topTour = result.personalized[0].tour;

      expect(topTour.city?.toLowerCase()).toBe("mumbai");
      expect(topTour.slug).toBe("mumbai-city-coastal-escape");
      expect(result.personalized[0].reasons.some((r) => r.includes("Mumbai"))).toBe(true);
    });

    it("prioritizes Kashmir destination matches", async () => {
      const prefs: TravelPreferences = {
        preferredDestinations: ["Kashmir"],
        preferredCountries: ["India"],
        onboardingCompleted: true,
      };

      const result = await getGroupedRecommendations(prefs, 6);
      const topTour = result.personalized[0].tour;
      expect(topTour.destination.toLowerCase()).toContain("kashmir");
      expect(topTour.slug).toBe("kashmir-valley-expedition");
    });

    it("prioritizes Kerala and Varkala destinations", async () => {
      const prefs: TravelPreferences = {
        preferredDestinations: ["Varkala", "Kerala"],
        preferredCountries: ["India"],
        onboardingCompleted: true,
      };

      const result = await getGroupedRecommendations(prefs, 6);
      const destinations = result.personalized.map((p) => p.tour.destination);
      expect(destinations.some((d) => d.includes("Varkala") || d.includes("Kerala"))).toBe(true);
    });

    it("prioritizes Delhi destination matches", async () => {
      const prefs: TravelPreferences = {
        preferredDestinations: ["Delhi"],
        onboardingCompleted: true,
      };

      const result = await getGroupedRecommendations(prefs, 6);
      expect(result.personalized[0].tour.city?.toLowerCase()).toContain("delhi");
    });

    it("matches broad country preference (e.g. India)", async () => {
      const prefs: TravelPreferences = {
        preferredCountries: ["India"],
        destinationScope: "india",
        onboardingCompleted: true,
      };

      const result = await getGroupedRecommendations(prefs, 6);
      expect(result.personalized.length).toBeGreaterThan(0);
      for (const item of result.personalized) {
        expect(item.tour.country).toBe("India");
      }
    });

    it("matches category preferences (e.g. nature, heritage, spiritual)", async () => {
      const prefs: TravelPreferences = {
        preferredCategories: ["heritage"],
        onboardingCompleted: true,
      };

      const result = await getGroupedRecommendations(prefs, 6);
      expect(result.personalized.length).toBeGreaterThan(0);
      const topTour = result.personalized[0].tour;
      expect(["heritage", "cultural"]).toContain(topTour.category);
      expect(result.personalized[0].reasons.some((r) => r.toLowerCase().includes("heritage") || r.toLowerCase().includes("cultural"))).toBe(true);
    });

    it("respects budget constraints by penalizing tours that heavily exceed budget", async () => {
      const prefs: TravelPreferences = {
        maxBudget: 350,
        preferredCountries: ["India"],
        onboardingCompleted: true,
      };

      const result = await getGroupedRecommendations(prefs, 6);
      expect(result.personalized.length).toBeGreaterThan(0);
      const topTour = result.personalized[0].tour;
      expect(topTour.price).toBeLessThanOrEqual(350 * 1.15);
    });

    it("handles non-matching destination honestly without returning false matches", async () => {
      const prefs: TravelPreferences = {
        preferredDestinations: ["Antarctica"],
        onboardingCompleted: true,
      };

      const result = await getGroupedRecommendations(prefs, 6);
      expect(result.targetDestinationMessage).toBeDefined();
      expect(result.targetDestinationMessage).toContain("Antarctica");
    });

    it("provides curated recommendations for new users without preferences", async () => {
      const result = await getGroupedRecommendations(undefined, 6);
      expect(result.hasPreferences).toBe(false);
      expect(result.personalized.length).toBeGreaterThan(0);
    });

    it("segregates Top Rated Expeditions based strictly on genuine review threshold", async () => {
      const result = await getGroupedRecommendations(undefined, 6);
      for (const tour of result.topRated) {
        expect(tour.ratingsQuantity).toBeGreaterThanOrEqual(2);
        expect(tour.ratingsAverage).toBeGreaterThanOrEqual(4.5);
      }
    });

    it("populates the dedicated Explore India section with all 12 Indian tours", async () => {
      const result = await getGroupedRecommendations(undefined, 20);
      expect(result.exploreIndia.length).toBe(12);
      for (const tour of result.exploreIndia) {
        expect(tour.country).toBe("India");
      }
    });
  });
});
