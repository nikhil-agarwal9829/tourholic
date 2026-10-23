import { describe, it, expect } from "vitest";
import {
  resolveDestinationCoordinates,
  normalizeDestinationQuery,
  KNOWN_DESTINATIONS,
} from "../../lib/geo/destinations";
import { calculateDistanceKm, calculateDistanceMeters, formatDistance } from "../../lib/geo/distance";
import { getNearbyTours, getBestForYouTours, DISTANCE_TIERS_KM } from "../../lib/geo/nearby";
import { INDIAN_TOURS } from "../../lib/data/indian-tours";
import { SAMPLE_TOURS } from "../../lib/data/sample-tours";
import { sanitizeCloudinaryError } from "../../lib/images/cloudinary";

describe("Touroholic Geospatial Recommendations & 2dsphere System", () => {
  describe("GeoJSON Coordinate Order & Standards", () => {
    it("ensures all known destinations follow strictly [longitude, latitude] GeoJSON format", () => {
      for (const dest of KNOWN_DESTINATIONS) {
        expect(dest.coordinates).toHaveLength(2);
        const [lng, lat] = dest.coordinates;
        // Longitude: -180 to 180
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        // Latitude: -90 to 90
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }
    });

    it("verifies Indian tours have valid GeoJSON coordinates [longitude, latitude]", () => {
      for (const tour of INDIAN_TOURS) {
        const coords = tour.location?.coordinates || tour.startLocation?.coordinates;
        expect(coords).toBeDefined();
        expect(coords).toHaveLength(2);
        const [lng, lat] = coords!;
        // India bounds approximately: Longitude 68°E to 98°E, Latitude 8°N to 38°N
        expect(lng).toBeGreaterThanOrEqual(68);
        expect(lng).toBeLessThanOrEqual(98);
        expect(lat).toBeGreaterThanOrEqual(8);
        expect(lat).toBeLessThanOrEqual(38);
      }
    });

    it("accurately computes Haversine distance between Haryana and nearby destinations", () => {
      const haryanaCoords: [number, number] = [76.0856, 29.0588]; // [lng, lat]
      const delhiCoords: [number, number] = [77.2090, 28.6139];   // [lng, lat]
      const jaipurCoords: [number, number] = [75.7873, 26.9124];  // [lng, lat]
      const agraCoords: [number, number] = [78.0081, 27.1767];    // [lng, lat]

      const distDelhi = calculateDistanceKm(haryanaCoords, delhiCoords);
      const distJaipur = calculateDistanceKm(haryanaCoords, jaipurCoords);
      const distAgra = calculateDistanceKm(haryanaCoords, agraCoords);

      // Haryana center to Delhi is ~120 km
      expect(distDelhi).toBeGreaterThan(100);
      expect(distDelhi).toBeLessThan(140);

      // Haryana center to Jaipur is ~230-260 km
      expect(distJaipur).toBeGreaterThan(200);
      expect(distJaipur).toBeLessThan(270);

      // Haryana center to Agra is ~260-300 km
      expect(distAgra).toBeGreaterThan(260);
      expect(distAgra).toBeLessThan(310);

      // Delhi must be closer than Jaipur, and Jaipur closer than Agra
      expect(distDelhi).toBeLessThan(distJaipur);
      expect(distJaipur).toBeLessThan(distAgra);

      expect(formatDistance(distDelhi)).toBe("120 km");
    });
  });

  describe("Destination Normalization & Resolution", () => {
    it("normalizes destination queries by stripping punctuation and country suffixes", () => {
      expect(normalizeDestinationQuery("Haryana, India")).toBe("haryana");
      expect(normalizeDestinationQuery("  New Delhi, INDIA  ")).toBe("new delhi");
      expect(normalizeDestinationQuery("Jaipur, Rajasthan, India")).toBe("jaipur rajasthan");
      expect(normalizeDestinationQuery("")).toBe("");
    });

    it("resolves 'Haryana, India' to representative coordinates [76.0856, 29.0588]", () => {
      const resolved = resolveDestinationCoordinates("Haryana, India");
      expect(resolved).not.toBeNull();
      expect(resolved?.name).toBe("Haryana");
      expect(resolved?.type).toBe("state");
      expect(resolved?.coordinates).toEqual([76.0856, 29.0588]);
    });

    it("handles missing destinations and invalid search queries gracefully", () => {
      expect(resolveDestinationCoordinates("")).toBeNull();
      expect(resolveDestinationCoordinates("Nonexistent Atlantis 9999")).toBeNull();
    });
  });

  describe("Haryana Nearby Tour Recommendations", () => {
    it("confirms there are 0 exact tours seeded directly inside Haryana", () => {
      const haryanaTours = INDIAN_TOURS.filter(
        (t) =>
          t.destination.toLowerCase().includes("haryana") ||
          t.city?.toLowerCase().includes("haryana") ||
          t.state?.toLowerCase().includes("haryana")
      );
      expect(haryanaTours).toHaveLength(0);
    });

    it("returns nearby Delhi, Jaipur, Rishikesh, and Agra tours for Haryana search", async () => {
      const haryanaCoords: [number, number] = [76.0856, 29.0588];

      const nearbyResult = await getNearbyTours({
        coordinates: haryanaCoords,
        searchedDestination: "Haryana",
        limit: 6,
        maxRadiusKm: 500,
      });

      expect(nearbyResult.tours.length).toBeGreaterThanOrEqual(3);

      const destinationsFound = nearbyResult.tours.map((t) => t.destination.toLowerCase());
      // Expect Delhi, Jaipur, Agra or Rishikesh to be among nearby destinations
      expect(destinationsFound.some((d) => d.includes("delhi"))).toBe(true);
      expect(destinationsFound.some((d) => d.includes("jaipur"))).toBe(true);

      // Verify tours are sorted primarily by distance
      for (let i = 0; i < nearbyResult.tours.length - 1; i++) {
        expect(nearbyResult.tours[i].distanceKm).toBeLessThanOrEqual(
          nearbyResult.tours[i + 1].distanceKm
        );
      }

      // First tour (Delhi) must be closer than Jaipur
      const delhiTour = nearbyResult.tours.find((t) => t.city?.toLowerCase().includes("delhi"));
      const jaipurTour = nearbyResult.tours.find((t) => t.city?.toLowerCase().includes("jaipur"));
      if (delhiTour && jaipurTour) {
        expect(delhiTour.distanceKm).toBeLessThan(jaipurTour.distanceKm);
      }
    });

    it("expands radius through tiers: 100km -> 250km -> 500km", async () => {
      const haryanaCoords: [number, number] = [76.0856, 29.0588];

      // Tier 1 (100km max): no tours are within 100km of central Haryana
      const tier1Result = await getNearbyTours({
        coordinates: haryanaCoords,
        searchedDestination: "Haryana",
        maxRadiusKm: 100,
      });
      expect(tier1Result.tours).toHaveLength(0);

      // Tier 2 (250km max): Delhi (~120km) and Jaipur (~240km) become visible
      const tier2Result = await getNearbyTours({
        coordinates: haryanaCoords,
        searchedDestination: "Haryana",
        maxRadiusKm: 250,
      });
      expect(tier2Result.tours.length).toBeGreaterThan(0);
      expect(tier2Result.tours.every((t) => t.distanceKm <= 250)).toBe(true);

      // Tier 3 (500km max): Agra (~284km) and Manali (~369km) become visible
      const tier3Result = await getNearbyTours({
        coordinates: haryanaCoords,
        searchedDestination: "Haryana",
        maxRadiusKm: 500,
      });
      expect(tier3Result.tours.length).toBeGreaterThan(tier2Result.tours.length);
      expect(tier3Result.tours.every((t) => t.distanceKm <= 500)).toBe(true);
    });

    it("excludes far-away tours exceeding maximum radius (e.g. Varkala, Kerala > 2000 km)", async () => {
      const haryanaCoords: [number, number] = [76.0856, 29.0588];
      const result = await getNearbyTours({
        coordinates: haryanaCoords,
        searchedDestination: "Haryana",
        maxRadiusKm: 500,
      });

      const foundCities = result.tours.map((t) => t.city?.toLowerCase());
      expect(foundCities).not.toContain("varkala");
      expect(foundCities).not.toContain("alappuzha");
    });

    it("excludes unpublished tours from nearby recommendations", async () => {
      const haryanaCoords: [number, number] = [76.0856, 29.0588];
      const result = await getNearbyTours({
        coordinates: haryanaCoords,
        searchedDestination: "Haryana",
        maxRadiusKm: 500,
      });

      for (const tour of result.tours) {
        expect(tour.isPublished).not.toBe(false);
      }
    });

    it("ensures each nearby tour has a valid slug for detail page linking", async () => {
      const haryanaCoords: [number, number] = [76.0856, 29.0588];
      const result = await getNearbyTours({
        coordinates: haryanaCoords,
        searchedDestination: "Haryana",
        maxRadiusKm: 500,
      });

      for (const tour of result.tours) {
        expect(tour.slug).toBeTruthy();
        expect(tour.slug).toMatch(/^[a-z0-9-]+$/);
      }
    });
  });

  describe("Best for You Recommendations (Genuine Ratings & Tie-Breaking)", () => {
    it("ranks tours primarily by genuine rating and secondarily by review count", async () => {
      const bestTours = await getBestForYouTours({ limit: 6 });

      expect(bestTours.length).toBeGreaterThan(0);

      // Verify that rated tours come before unrated tours
      for (let i = 0; i < bestTours.length - 1; i++) {
        const current = bestTours[i];
        const next = bestTours[i + 1];
        if (current.ratingsAverage === next.ratingsAverage) {
          expect(current.ratingsQuantity).toBeGreaterThanOrEqual(next.ratingsQuantity);
        } else {
          expect(current.ratingsAverage).toBeGreaterThanOrEqual(next.ratingsAverage);
        }
      }
    });

    it("does not fabricate ratings for tours with 0 reviews", async () => {
      const bestTours = await getBestForYouTours({ limit: 20 });
      const unreviewedTours = bestTours.filter((t) => t.ratingsQuantity === 0);

      for (const tour of unreviewedTours) {
        expect(tour.ratingsAverage).toBe(0);
        expect(tour.ratingsQuantity).toBe(0);
      }
    });

    it("supports excluding already-displayed nearby tour IDs to avoid duplicates", async () => {
      const firstTourId = SAMPLE_TOURS[0]._id;
      const bestTours = await getBestForYouTours({
        limit: 5,
        excludeTourIds: [firstTourId],
      });

      const ids = bestTours.map((t) => t._id);
      expect(ids).not.toContain(firstTourId);
    });
  });

  describe("Cloudinary Credential Error Sanitization", () => {
    it("redacts Cloudinary API keys and raw numbers from error messages", () => {
      const rawError = "Invalid api_key 524232337551176";
      const sanitized = sanitizeCloudinaryError(rawError);

      expect(sanitized).not.toContain("524232337551176");
      expect(sanitized).toContain("Invalid API credentials configured on server");
    });

    it("redacts secret tokens and sensitive query strings", () => {
      const tokenError = "Upload failed with secret=BYuHp7iWRF-FxLf9jOE4CK1ZIAs";
      const sanitized = sanitizeCloudinaryError(tokenError);

      expect(sanitized).not.toContain("BYuHp7iWRF");
      expect(sanitized).not.toContain("FxLf9jOE4CK1ZIAs");
    });

    it("returns safe operational error for generic errors", () => {
      const genericError = new Error("Network timeout connecting to api.cloudinary.com");
      const sanitized = sanitizeCloudinaryError(genericError);

      expect(sanitized).toContain("Network timeout");
    });
  });
});
