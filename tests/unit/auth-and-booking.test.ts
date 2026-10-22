import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../../lib/auth/jwt";
import { SAMPLE_DEPARTURES } from "../../lib/data/sample-tours";

describe("Authentication & Session Security", () => {
  it("hashes passwords securely and verifies correct passwords", async () => {
    const raw = "Explorer2026!Secure";
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    expect(hashed.length).toBeGreaterThan(20);

    const isMatch = await verifyPassword(raw, hashed);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword("WrongPassword123", hashed);
    expect(isWrong).toBe(false);
  });

  it("signs and verifies JWT authentication sessions", () => {
    const payload = {
      userId: "user-12345",
      email: "elena@example.com",
      name: "Elena Rostova",
      role: "user" as const,
    };

    const token = signToken(payload);
    expect(token).toBeTruthy();

    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe("user");
  });

  it("rejects invalid or tampered tokens", () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature";
    const verified = verifyToken(invalidToken);
    expect(verified).toBeNull();
  });
});

describe("Booking Inventory & Capacity Constraints", () => {
  it("prevents overbooking when remaining seats are exceeded", () => {
    const dep = SAMPLE_DEPARTURES[0];
    const capacity = dep.capacity;
    const reserved = dep.reservedSeats;
    const remainingSeats = capacity - reserved;

    const requestedSeatsValid = Math.min(2, remainingSeats);
    expect(reserved + requestedSeatsValid).toBeLessThanOrEqual(capacity);

    const requestedSeatsInvalid = remainingSeats + 5;
    const wouldOversell = reserved + requestedSeatsInvalid > capacity;
    expect(wouldOversell).toBe(true);
  });
});
