import { describe, it, expect, vi, beforeEach } from "vitest";
import { sanitizeCsvField, generateCsv } from "@/lib/utils/csv";
import { sendEmail, buildPaymentReminderEmail, buildCancellationEmail } from "@/lib/notifications/email-service";

describe("Admin Operations & Revenue Analytics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. CSV Export Security & Formula Injection Sanitization", () => {
    it("escapes formula injection characters (=, +, -, @, \\t, \\r) by prepending a single quote", () => {
      expect(sanitizeCsvField("=SUM(A1:B10)")).toBe("'=SUM(A1:B10)");
      expect(sanitizeCsvField("+123456789")).toBe("'+123456789");
      expect(sanitizeCsvField("-cmd.exe /c calc")).toBe("'-cmd.exe /c calc");
      expect(sanitizeCsvField("@malicious_url")).toBe("'@malicious_url");
      expect(sanitizeCsvField("\tTabPrefixed")).toBe("'\tTabPrefixed");
    });

    it("handles ordinary text, numbers, null, and undefined safely", () => {
      expect(sanitizeCsvField("Expedition Alpha")).toBe("Expedition Alpha");
      expect(sanitizeCsvField(1200)).toBe("1200");
      expect(sanitizeCsvField(null)).toBe("");
      expect(sanitizeCsvField(undefined)).toBe("");
    });

    it("wraps and escapes values containing commas, double quotes, and newlines", () => {
      const withComma = sanitizeCsvField("Paris, France");
      expect(withComma).toBe('"Paris, France"');

      const withQuotes = sanitizeCsvField('Special "VIP" Guest');
      expect(withQuotes).toBe('"Special ""VIP"" Guest"');

      const withNewline = sanitizeCsvField("Line1\nLine2");
      expect(withNewline).toBe('"Line1\nLine2"');
    });

    it("generates well-formed CSV with sanitized headers and rows", () => {
      const headers = ["Reference", "Customer", "Amount"];
      const rows = [
        ["=REF1", "Alice, Traveler", 1500],
        ["REF2", "Bob", 2000],
      ];
      const csv = generateCsv(headers, rows);
      expect(csv).toContain("Reference,Customer,Amount");
      expect(csv).toContain("'=REF1,\"Alice, Traveler\",1500");
      expect(csv).toContain("REF2,Bob,2000");
    });
  });

  describe("2. Booking Cancellation Rules & Availability Handling", () => {
    it("allows cancellation for confirmed or pending bookings", () => {
      const canCancel = (status: string) => status !== "cancelled" && status !== "completed";

      expect(canCancel("confirmed")).toBe(true);
      expect(canCancel("pending")).toBe(true);
      expect(canCancel("cancelled")).toBe(false);
      expect(canCancel("completed")).toBe(false);
    });

    it("requires a minimum cancellation reason length", () => {
      const validateReason = (reason: string) => reason && reason.trim().length >= 3;

      expect(validateReason("")).toBeFalsy();
      expect(validateReason("no")).toBeFalsy();
      expect(validateReason("Customer requested medical reschedule")).toBeTruthy();
    });

    it("restores departure reserved seats and transitions sold_out status to open/limited", () => {
      const departure = {
        capacity: 10,
        reservedSeats: 10,
        status: "sold_out" as "open" | "limited" | "sold_out",
      };

      const travelersToRelease = 2;
      departure.reservedSeats = Math.max(0, departure.reservedSeats - travelersToRelease);

      if (departure.status === "sold_out" && departure.reservedSeats < departure.capacity) {
        departure.status = departure.reservedSeats >= departure.capacity * 0.8 ? "limited" : "open";
      }

      expect(departure.reservedSeats).toBe(8);
      expect(departure.status).toBe("limited"); // 8/10 is 80% boundary -> limited
    });
  });

  describe("3. Payment Reminder Eligibility & Cooldown Policy", () => {
    const COOLDOWN_HOURS = 24;

    const isReminderEligible = (booking: {
      bookingStatus: string;
      paymentStatus: string;
    }) => {
      if (booking.bookingStatus === "cancelled" || booking.bookingStatus === "completed") {
        return { eligible: false, reason: "Booking is cancelled or completed" };
      }
      if (booking.paymentStatus === "paid") {
        return { eligible: false, reason: "Booking is already paid" };
      }
      if (booking.paymentStatus === "refunded") {
        return { eligible: false, reason: "Booking is already refunded" };
      }
      return { eligible: true };
    };

    const isCooldownActive = (lastSentAt: Date | null, now: Date) => {
      if (!lastSentAt) return false;
      const cooldownMs = COOLDOWN_HOURS * 3600 * 1000;
      return now.getTime() - lastSentAt.getTime() < cooldownMs;
    };

    it("allows reminders only for unpaid or pending reservations", () => {
      expect(isReminderEligible({ bookingStatus: "confirmed", paymentStatus: "unpaid" }).eligible).toBe(true);
      expect(isReminderEligible({ bookingStatus: "confirmed", paymentStatus: "pending" }).eligible).toBe(true);
      expect(isReminderEligible({ bookingStatus: "confirmed", paymentStatus: "paid" }).eligible).toBe(false);
      expect(isReminderEligible({ bookingStatus: "cancelled", paymentStatus: "unpaid" }).eligible).toBe(false);
      expect(isReminderEligible({ bookingStatus: "completed", paymentStatus: "unpaid" }).eligible).toBe(false);
    });

    it("enforces a strict 24-hour cooldown between reminder attempts", () => {
      const now = new Date("2026-10-23T12:00:00Z");
      const sent2HoursAgo = new Date("2026-10-23T10:00:00Z");
      const sent25HoursAgo = new Date("2026-10-22T11:00:00Z");

      expect(isCooldownActive(sent2HoursAgo, now)).toBe(true);
      expect(isCooldownActive(sent25HoursAgo, now)).toBe(false);
      expect(isCooldownActive(null, now)).toBe(false);
    });
  });

  describe("4. Financial Revenue Calculation Policy", () => {
    const mockBookings = [
      { bookingReference: "TRH-1", totalPrice: 1000, bookingStatus: "confirmed", paymentStatus: "paid", refundAmount: 0 },
      { bookingReference: "TRH-2", totalPrice: 2000, bookingStatus: "confirmed", paymentStatus: "unpaid", refundAmount: 0 },
      { bookingReference: "TRH-3", totalPrice: 1500, bookingStatus: "cancelled", paymentStatus: "unpaid", refundAmount: 0 },
      { bookingReference: "TRH-4", totalPrice: 3000, bookingStatus: "confirmed", paymentStatus: "paid", refundAmount: 500 },
      { bookingReference: "TRH-5", totalPrice: 1200, bookingStatus: "completed", paymentStatus: "paid", refundAmount: 0 },
    ];

    it("calculates Total Booking Value strictly excluding cancelled reservations", () => {
      const totalBookingValue = mockBookings
        .filter((b) => b.bookingStatus !== "cancelled")
        .reduce((sum, b) => sum + b.totalPrice, 0);

      expect(totalBookingValue).toBe(1000 + 2000 + 3000 + 1200); // 7200
    });

    it("calculates Collected Revenue strictly from verified paid bookings less refunds", () => {
      const collectedRevenue = mockBookings
        .filter((b) => b.paymentStatus === "paid" && b.bookingStatus !== "cancelled")
        .reduce((sum, b) => sum + (b.totalPrice - b.refundAmount), 0);

      // TRH-1 (1000) + TRH-4 (3000 - 500 = 2500) + TRH-5 (1200) = 4700
      expect(collectedRevenue).toBe(4700);
    });

    it("calculates Outstanding Amount for unpaid and pending non-cancelled reservations", () => {
      const outstanding = mockBookings
        .filter((b) => (b.paymentStatus === "unpaid" || b.paymentStatus === "pending") && b.bookingStatus !== "cancelled")
        .reduce((sum, b) => sum + b.totalPrice, 0);

      expect(outstanding).toBe(2000); // TRH-2
    });

    it("tracks Cancelled Booking Value separately rather than counting as revenue", () => {
      const cancelledValue = mockBookings
        .filter((b) => b.bookingStatus === "cancelled")
        .reduce((sum, b) => sum + b.totalPrice, 0);

      expect(cancelledValue).toBe(1500); // TRH-3
    });

    it("computes Average Booking Value over non-cancelled reservations", () => {
      const nonCancelled = mockBookings.filter((b) => b.bookingStatus !== "cancelled");
      const totalValue = nonCancelled.reduce((sum, b) => sum + b.totalPrice, 0);
      const avg = totalValue / nonCancelled.length;

      expect(avg).toBe(7200 / 4); // 1800
    });
  });

  describe("5. Notification System & Email Provider Abstraction", () => {
    it("reports skipped_no_provider when no email credentials exist", async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_PROVIDER;

      const result = await sendEmail({
        to: "explorer@example.com",
        subject: "Test Reminder",
        html: "<p>Hello</p>",
      });

      expect(result.status).toBe("skipped_no_provider");
      expect(result.provider).toBe("none");
      expect(result.error).toContain("No email provider configured");
    });

    it("builds payment reminder email with exact deadline, booking reference, and secure url", () => {
      const email = buildPaymentReminderEmail({
        customerName: "Eleanor Vance",
        bookingReference: "TRH-2026-ABC123",
        tourName: "Himalayan High Passes",
        departureDate: "2026-11-15",
        amountDue: 2400,
        currency: "USD",
        paymentDueAt: new Date("2026-11-01T18:00:00Z"),
        bookingUrl: "https://tourholic.vercel.app/my-bookings",
      });

      expect(email.subject).toContain("TRH-2026-ABC123");
      expect(email.html).toContain("Eleanor Vance");
      expect(email.html).toContain("Himalayan High Passes");
      expect(email.html).toContain("$2,400");
      expect(email.html).toContain("https://tourholic.vercel.app/my-bookings");
    });

    it("builds cancellation email explaining reasons and refund guidance", () => {
      const email = buildCancellationEmail({
        customerName: "Marcus Sterling",
        bookingReference: "TRH-2026-XYZ999",
        tourName: "Kerala Backwaters & Spice Trails",
        departureDate: "2026-12-05",
        totalPrice: 1800,
        currency: "USD",
        cancellationReason: "Severe weather route closure",
        isPaid: true,
      });

      expect(email.subject).toContain("Reservation Cancelled: Expedition TRH-2026-XYZ999");
      expect(email.html).toContain("Severe weather route closure");
      expect(email.html).toContain("manual refund reconciliation");
    });
  });

  describe("6. Resilient Handling of Missing References", () => {
    it("safely provides fallback defaults when related User or Tour are deleted", () => {
      const rawBooking: any = {
        bookingReference: "TRH-DELETED-TEST",
        user: null,
        tour: null,
        guestName: "Direct Traveler",
        guestEmail: "direct@example.com",
        totalPrice: 950,
      };

      const customerName = rawBooking.guestName || rawBooking.user?.name || "Private Explorer";
      const customerEmail = rawBooking.guestEmail || rawBooking.user?.email || "N/A";
      const tourName = rawBooking.tour?.name || "Archived Expedition";

      expect(customerName).toBe("Direct Traveler");
      expect(customerEmail).toBe("direct@example.com");
      expect(tourName).toBe("Archived Expedition");
    });
  });
});
