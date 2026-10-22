import { describe, it, expect } from "vitest";
import { getTourBySlug, getTourDepartures, getTourReviews } from "../../lib/tours/service";
import { INDIAN_TOURS } from "../../lib/data/indian-tours";

describe("Tour Lookup & Identifier Compatibility", () => {
  it("resolves global tour by slug", async () => {
    const tour = await getTourBySlug("the-forest-hiker-and-alpine-peaks");
    expect(tour).not.toBeNull();
    expect(tour?.name).toBe("The Forest Hiker & Alpine Peaks");
  });

  it("resolves global tour by _id or fallback id", async () => {
    const tour = await getTourBySlug("tour-01");
    expect(tour).not.toBeNull();
    expect(tour?.slug).toBe("the-forest-hiker-and-alpine-peaks");
  });

  it("resolves Indian tour by slug", async () => {
    const tour = await getTourBySlug("mumbai-city-coastal-escape");
    expect(tour).not.toBeNull();
    expect(tour?.name).toBe("Mumbai City & Coastal Escape");
    expect(tour?.country).toBe("India");
  });

  it("resolves Indian tour by in-memory id", async () => {
    const tour = await getTourBySlug("in-tour-01");
    expect(tour).not.toBeNull();
    expect(tour?.name).toBe("Mumbai City & Coastal Escape");
  });

  it("handles URL-encoded slug or id correctly", async () => {
    const encoded = encodeURIComponent("mumbai-city-coastal-escape");
    const tour = await getTourBySlug(encoded);
    expect(tour).not.toBeNull();
    expect(tour?.slug).toBe("mumbai-city-coastal-escape");
  });

  it("returns null for genuinely non-existent tour", async () => {
    const tour = await getTourBySlug("completely-non-existent-tour-xyz-12345");
    expect(tour).toBeNull();
  });

  it("verifies all 12 Indian tours have valid unique slugs and names", () => {
    expect(INDIAN_TOURS.length).toBe(12);
    const slugs = new Set(INDIAN_TOURS.map((t) => t.slug));
    expect(slugs.size).toBe(12);

    const expectedNames = [
      "Mumbai City & Coastal Escape",
      "Delhi Heritage Discovery",
      "Kashmir Valley Expedition",
      "Varkala Cliff & Beach Retreat",
      "Kerala Backwaters Journey",
      "Goa Beaches & Old Goa",
      "Jaipur Royal Heritage Trail",
      "Agra Taj Mahal & Mughal Heritage",
      "Rishikesh River & Himalayan Retreat",
      "Manali Mountain Escape",
      "Varanasi Spiritual & Ganges Experience",
      "Darjeeling Himalayan Tea & Mountain Tour",
    ];

    expectedNames.forEach((name) => {
      const found = INDIAN_TOURS.find((t) => t.name === name);
      expect(found).toBeDefined();
    });
  });

  it("retrieves departures for tours reliably", async () => {
    const deps = await getTourDepartures("mumbai-city-coastal-escape");
    expect(deps.length).toBeGreaterThan(0);
    expect(["open", "limited"]).toContain(deps[0].status);
    expect(deps[0].capacity).toBeGreaterThan(0);
  });

  it("retrieves reviews or empty array safely without throwing", async () => {
    const reviews = await getTourReviews("mumbai-city-coastal-escape");
    expect(Array.isArray(reviews)).toBe(true);
  });
});
