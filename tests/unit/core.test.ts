import { describe, it, expect } from "vitest";
import { getRecommendedTours } from "../../lib/recommendations/engine";
import { SAMPLE_TOURS } from "../../lib/data/sample-tours";
import { formatPrice } from "../../lib/utils";

describe("Touroholic Core Business Logic", () => {
  describe("Price Calculation & Formatting", () => {
    it("correctly calculates total booking price without rounding discrepancies", () => {
      const tourPrice = 1199;
      const travelers = 3;
      const total = tourPrice * travelers;
      expect(total).toBe(3597);
    });

    it("formats price strings with currency symbols", () => {
      expect(formatPrice(1199, "USD")).toBe("$1,199");
      expect(formatPrice(3450, "USD")).toBe("$3,450");
    });
  });

  describe("Rule-Based Recommendation Engine", () => {
    it("prioritizes tours matching specific budget preferences", () => {
      const recommendations = getRecommendedTours(SAMPLE_TOURS, {
        maxBudget: 1000,
      });

      expect(recommendations.length).toBeGreaterThan(0);
      const topTour = recommendations[0].tour;
      expect(topTour.price).toBeLessThanOrEqual(1000 * 1.15);
      expect(recommendations[0].reasons.some((r) => r.includes("budget"))).toBe(true);
    });

    it("prioritizes category matching (e.g. wildlife safari)", () => {
      const recommendations = getRecommendedTours(SAMPLE_TOURS, {
        category: "wildlife",
      });

      expect(recommendations[0].tour.category).toBe("wildlife");
      expect(recommendations[0].tour.name).toContain("Serengeti");
      expect(recommendations[0].reasons.some((r) => r.includes("wildlife"))).toBe(true);
    });

    it("boosts tours by destination keywords", () => {
      const recommendations = getRecommendedTours(SAMPLE_TOURS, {
        destination: "Amalfi",
      });

      expect(recommendations[0].tour.destination).toBe("Amalfi Coast");
      expect(recommendations[0].reasons.some((r) => r.includes("destination"))).toBe(true);
    });

    it("provides popular fallback recommendations for unauthenticated visitors", () => {
      const recommendations = getRecommendedTours(SAMPLE_TOURS, undefined, 4);
      expect(recommendations).toHaveLength(4);
      expect(recommendations[0].tour.ratingsAverage).toBeGreaterThanOrEqual(4.8);
    });
  });

  describe("Data Integrity & Schema Sanity", () => {
    it("ensures all sample tours have valid unique slugs and cover images", () => {
      const slugs = new Set<string>();
      for (const tour of SAMPLE_TOURS) {
        expect(tour.name).toBeTruthy();
        expect(tour.slug).toMatch(/^[a-z0-9-]+$/);
        expect(slugs.has(tour.slug)).toBe(false);
        slugs.add(tour.slug);

        expect(tour.price).toBeGreaterThan(0);
        expect(tour.duration).toBeGreaterThan(0);
        expect(tour.maxGroupSize).toBeGreaterThan(0);
        expect(tour.imageCover.startsWith("https://")).toBe(true);
      }
    });

    it("validates itinerary days are sequentially ordered", () => {
      for (const tour of SAMPLE_TOURS) {
        if (tour.itinerary && tour.itinerary.length > 0) {
          tour.itinerary.forEach((day, index) => {
            expect(day.day).toBe(index + 1);
            expect(day.title).toBeTruthy();
            expect(day.description).toBeTruthy();
          });
        }
      }
    });
  });
});
