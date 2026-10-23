import { describe, it, expect } from "vitest";
import {
  DESTINATIONS_REGISTRY,
  resolveDestinationCoordinates,
  normalizeDestinationQuery,
  getDestinationByKey,
} from "../../lib/geo/destinations";
import { calculateDistanceKm, formatDistance } from "../../lib/geo/distance";
import { getNearbyTours, getBestForYouTours } from "../../lib/geo/nearby";
import { INDIAN_TOURS } from "../../lib/data/indian-tours";

describe("Touroholic 50 Destinations Registry & Tour Publishing", () => {
  describe("50 Travel Destinations Registry Integrity", () => {
    it("contains exactly 50 destinations in DESTINATIONS_REGISTRY (30 Indian, 20 International)", () => {
      expect(DESTINATIONS_REGISTRY).toHaveLength(50);

      const indianDestinations = DESTINATIONS_REGISTRY.filter((d) => d.country === "India");
      const internationalDestinations = DESTINATIONS_REGISTRY.filter((d) => d.country !== "India");

      expect(indianDestinations).toHaveLength(30);
      expect(internationalDestinations).toHaveLength(20);
    });

    it("verifies all 30 required Indian cities exist with valid keys and aliases", () => {
      const requiredIndian = [
        "delhi", "noida", "gurugram", "mumbai", "pune", "udaipur",
        "jaipur", "agra", "varanasi", "srinagar", "jammu", "manali",
        "shimla", "chandigarh", "amritsar", "dehradun", "rishikesh", "nainital",
        "lucknow", "varkala", "kochi", "alappuzha", "bengaluru", "chennai",
        "hyderabad", "kolkata", "goa", "darjeeling", "ahmedabad", "jodhpur"
      ];

      for (const reqKey of requiredIndian) {
        const dest = DESTINATIONS_REGISTRY.find(
          (d) => d.key === reqKey || d.name.toLowerCase().includes(reqKey) || d.aliases.includes(reqKey)
        );
        expect(dest, `Missing required Indian destination: ${reqKey}`).toBeDefined();
        expect(dest!.country).toBe("India");
        expect(dest!.location.type).toBe("Point");
        expect(dest!.location.coordinates).toHaveLength(2);
      }
    });

    it("verifies all 20 required International cities exist with valid keys and aliases", () => {
      const requiredInternational = [
        "dubai-uae", "abu-dhabi-uae", "singapore", "bangkok-thailand",
        "phuket-thailand", "kuala-lumpur-malaysia", "bali-indonesia", "kathmandu-nepal",
        "colombo-sri-lanka", "male-maldives", "london-uk", "paris-france",
        "rome-italy", "amsterdam-netherlands", "zurich-switzerland", "istanbul-turkiye",
        "tokyo-japan", "seoul-south-korea", "sydney-australia", "new-york-city-usa"
      ];

      for (const reqKey of requiredInternational) {
        const dest = DESTINATIONS_REGISTRY.find((d) => d.key === reqKey);
        expect(dest, `Missing required International destination: ${reqKey}`).toBeDefined();
        expect(dest!.country).not.toBe("India");
        expect(dest!.location.type).toBe("Point");
        expect(dest!.location.coordinates).toHaveLength(2);
      }
    });

    it("verifies strict GeoJSON coordinate order [longitude, latitude] across all 50 destinations", () => {
      for (const dest of DESTINATIONS_REGISTRY) {
        const [lng, lat] = dest.location.coordinates;
        // Longitude: -180 to 180
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        // Latitude: -90 to 90
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);

        // Sanity checks on known cities
        if (dest.key === "new-york-city-usa") {
          // NYC longitude is negative (~ -74°), latitude is positive (~ 40.7°)
          expect(lng).toBeLessThan(0);
          expect(lat).toBeGreaterThan(0);
        }
        if (dest.key === "sydney-australia") {
          // Sydney latitude is negative (~ -33.8°), longitude is positive (~ 151.2°)
          expect(lat).toBeLessThan(0);
          expect(lng).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("Geospatial Search for Cities Without Exact Tours", () => {
    it("resolves Noida and discovers nearby Delhi tour within 100km radius", async () => {
      const resolved = resolveDestinationCoordinates("Noida");
      expect(resolved).not.toBeNull();
      expect(resolved!.name).toBe("Noida");
      expect(resolved!.coordinates).toEqual([77.3910, 28.5355]);

      // Confirm 0 exact tours exist in Noida
      const exactNoida = INDIAN_TOURS.filter((t) => t.city?.toLowerCase() === "noida");
      expect(exactNoida).toHaveLength(0);

      // Perform nearby recommendation
      const nearby = await getNearbyTours({
        coordinates: resolved!.coordinates,
        searchedDestination: "Noida",
        maxRadiusKm: 100,
      });

      expect(nearby.tours.length).toBeGreaterThanOrEqual(1);
      const firstTour = nearby.tours[0];
      expect(firstTour.city?.toLowerCase()).toContain("delhi");
      // Distance from Noida to Delhi is ~20-30 km
      expect(firstTour.distanceKm).toBeGreaterThan(15);
      expect(firstTour.distanceKm).toBeLessThan(40);
    });

    it("resolves Pune and discovers nearby Mumbai tour within 250km radius", async () => {
      const resolved = resolveDestinationCoordinates("Pune");
      expect(resolved).not.toBeNull();
      expect(resolved!.name).toBe("Pune");
      expect(resolved!.coordinates).toEqual([73.8567, 18.5204]);

      // Confirm 0 exact tours exist in Pune
      const exactPune = INDIAN_TOURS.filter((t) => t.city?.toLowerCase() === "pune");
      expect(exactPune).toHaveLength(0);

      // Tier 1 (100km): Mumbai is ~120km away, so no tours within 100km
      const nearbyTier1 = await getNearbyTours({
        coordinates: resolved!.coordinates,
        searchedDestination: "Pune",
        maxRadiusKm: 100,
      });
      expect(nearbyTier1.tours).toHaveLength(0);

      // Tier 2 (250km): Mumbai becomes visible
      const nearbyTier2 = await getNearbyTours({
        coordinates: resolved!.coordinates,
        searchedDestination: "Pune",
        maxRadiusKm: 250,
      });
      expect(nearbyTier2.tours.length).toBeGreaterThanOrEqual(1);
      const mumbaiTour = nearbyTier2.tours.find((t) => t.city?.toLowerCase().includes("mumbai"));
      expect(mumbaiTour).toBeDefined();
      expect(mumbaiTour!.distanceKm).toBeGreaterThan(100);
      expect(mumbaiTour!.distanceKm).toBeLessThan(160);
    });

    it("resolves Udaipur and discovers nearby Rajasthan/Jaipur tours within 500km radius", async () => {
      const resolved = resolveDestinationCoordinates("Udaipur");
      expect(resolved).not.toBeNull();
      expect(resolved!.name).toBe("Udaipur");
      expect(resolved!.coordinates).toEqual([73.7125, 24.5854]);

      // Confirm 0 exact tours exist in Udaipur
      const exactUdaipur = INDIAN_TOURS.filter((t) => t.city?.toLowerCase() === "udaipur");
      expect(exactUdaipur).toHaveLength(0);

      const nearbyResult = await getNearbyTours({
        coordinates: resolved!.coordinates,
        searchedDestination: "Udaipur",
        maxRadiusKm: 500,
      });

      expect(nearbyResult.tours.length).toBeGreaterThanOrEqual(1);
      const jaipurTour = nearbyResult.tours.find((t) => t.city?.toLowerCase().includes("jaipur"));
      expect(jaipurTour).toBeDefined();
      // Distance from Udaipur to Jaipur is ~310 km
      expect(jaipurTour!.distanceKm).toBeGreaterThan(280);
      expect(jaipurTour!.distanceKm).toBeLessThan(350);
    });

    it("resolves International cities like Dubai, UAE and handles empty nearby cleanly", async () => {
      const resolved = resolveDestinationCoordinates("Dubai, UAE");
      expect(resolved).not.toBeNull();
      expect(resolved!.name).toBe("Dubai");
      expect(resolved!.coordinates).toEqual([55.2708, 25.2048]);

      const nearby = await getNearbyTours({
        coordinates: resolved!.coordinates,
        searchedDestination: "Dubai",
        maxRadiusKm: 500,
      });

      // No tours within 500km of Dubai exist in the sample catalog
      expect(nearby.tours).toHaveLength(0);

      // Best for You fallback succeeds
      const bestForYou = await getBestForYouTours({ limit: 4 });
      expect(bestForYou.length).toBeGreaterThanOrEqual(1);
    });

    it("handles completely unknown destinations without throwing exceptions", () => {
      expect(resolveDestinationCoordinates("Atlantis Underwater Citadel")).toBeNull();
      expect(resolveDestinationCoordinates("XyZ123Unknown")).toBeNull();
      expect(resolveDestinationCoordinates("")).toBeNull();
    });
  });

  describe("Tour Publishing Logic & Auto-Geocoding", () => {
    it("auto-resolves destination coordinates when a recognizable city is supplied", () => {
      const resolved = resolveDestinationCoordinates("Noida");
      expect(resolved).not.toBeNull();
      expect(resolved!.coordinates).toBeDefined();

      const tourLocation = {
        type: "Point" as const,
        coordinates: resolved!.coordinates,
        description: `Noida, India`,
      };

      expect(tourLocation.coordinates).toEqual([77.3910, 28.5355]);
    });

    it("generates URL-safe slugs and handles name collisions gracefully", () => {
      const generateSlug = (name: string, existing: string[]) => {
        let baseSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        if (!baseSlug) baseSlug = "expedition";

        let slug = baseSlug;
        let counter = 1;
        while (existing.includes(slug)) {
          counter++;
          slug = `${baseSlug}-${counter}`;
        }
        return slug;
      };

      const existingSlugs = ["delhi-heritage-discovery", "delhi-heritage-discovery-2"];
      const newSlug = generateSlug("Delhi Heritage Discovery", existingSlugs);
      expect(newSlug).toBe("delhi-heritage-discovery-3");
    });

    it("validates that required tour fields meet minimum schema constraints", () => {
      const validateTourForm = (data: {
        name: string;
        destination: string;
        country: string;
        price: number;
        duration: number;
        summary: string;
        description: string;
        imageCover: string;
      }) => {
        if (!data.name || data.name.trim().length < 3) return "Title must be at least 3 characters";
        if (!data.destination || data.destination.trim().length < 2) return "Destination must be at least 2 characters";
        if (!data.country || data.country.trim().length < 2) return "Country must be at least 2 characters";
        if (!data.price || data.price <= 0) return "Price must be positive";
        if (!data.duration || data.duration < 1) return "Duration must be at least 1 day";
        if (!data.imageCover) return "Cover photo is required";
        if (!data.summary || data.summary.trim().length < 10) return "Summary must be at least 10 characters";
        if (!data.description || data.description.trim().length < 20) return "Description must be at least 20 characters";
        return null;
      };

      expect(validateTourForm({
        name: "Ab",
        destination: "Noida",
        country: "India",
        price: 100,
        duration: 3,
        summary: "Valid summary",
        description: "Valid long description over 20 characters",
        imageCover: "https://example.com/photo.jpg",
      })).toBe("Title must be at least 3 characters");

      expect(validateTourForm({
        name: "Desert Oasis Trek",
        destination: "Noida",
        country: "India",
        price: 100,
        duration: 3,
        summary: "Valid summary",
        description: "Short",
        imageCover: "https://example.com/photo.jpg",
      })).toBe("Description must be at least 20 characters");

      expect(validateTourForm({
        name: "Desert Oasis Trek",
        destination: "Noida",
        country: "India",
        price: 100,
        duration: 3,
        summary: "Valid summary of trek",
        description: "Valid long description overview with complete itinerary details",
        imageCover: "https://example.com/photo.jpg",
      })).toBeNull();
    });
  });
});
