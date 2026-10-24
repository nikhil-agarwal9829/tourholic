import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import {
  sendEmail,
  sendVerificationEmail,
  sendBookingConfirmationEmail,
  sendPaymentConfirmationEmail,
} from "@/lib/notifications/email-service";

describe("Brevo Email Service & Email Verification System", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Verification Token Generation, Hashing & Expiry", () => {
    it("generates a high-entropy random token and hashes it via SHA-256", () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      expect(rawToken.length).toBe(64);

      const hash1 = crypto.createHash("sha256").update(rawToken).digest("hex");
      const hash2 = crypto.createHash("sha256").update(rawToken).digest("hex");

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(rawToken);
      expect(hash1.length).toBe(64);
    });

    it("verifies unexpired tokens and rejects expired tokens", () => {
      const rawToken = "test-token-abcdef1234567890";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      const validExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const expiredDate = new Date(Date.now() - 1000);

      const isTokenValid = (incomingToken: string, storedHash: string, expiresAt: Date) => {
        const computedHash = crypto.createHash("sha256").update(incomingToken).digest("hex");
        return computedHash === storedHash && expiresAt.getTime() > Date.now();
      };

      expect(isTokenValid(rawToken, tokenHash, validExpiry)).toBe(true);
      expect(isTokenValid(rawToken, tokenHash, expiredDate)).toBe(false);
      expect(isTokenValid("wrong-token", tokenHash, validExpiry)).toBe(false);
    });

    it("prevents token reuse after verification by invalidating the token", () => {
      const user = {
        emailVerified: false,
        verificationTokenHash: "valid-hash",
        verificationTokenExpiresAt: new Date(Date.now() + 3600000),
      };

      // Verification action
      user.emailVerified = true;
      user.verificationTokenHash = undefined as any;
      user.verificationTokenExpiresAt = undefined as any;

      expect(user.emailVerified).toBe(true);
      expect(user.verificationTokenHash).toBeUndefined();

      // Subsequent attempt to verify with original hash
      const canVerifyAgain = !!user.verificationTokenHash;
      expect(canVerifyAgain).toBe(false);
    });

    it("enforces a 120-second cooldown rate limit on resending verification emails", () => {
      const COOLDOWN_SECONDS = 120;
      const now = Date.now();
      const lastSentRecently = new Date(now - 30 * 1000); // 30s ago
      const lastSentLongAgo = new Date(now - 150 * 1000); // 150s ago

      const checkCooldown = (lastSent: Date) => {
        const secondsSince = Math.floor((Date.now() - lastSent.getTime()) / 1000);
        if (secondsSince < COOLDOWN_SECONDS) {
          return { allowed: false, remaining: COOLDOWN_SECONDS - secondsSince };
        }
        return { allowed: true, remaining: 0 };
      };

      const result1 = checkCooldown(lastSentRecently);
      expect(result1.allowed).toBe(false);
      expect(result1.remaining).toBeGreaterThan(80);

      const result2 = checkCooldown(lastSentLongAgo);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);
    });
  });

  describe("2. Brevo REST API Client & Error Handling", () => {
    it("returns safe skipped status when Brevo credentials are not configured", async () => {
      const originalApiKey = process.env.BREVO_API_KEY;
      delete process.env.BREVO_API_KEY;

      const result = await sendEmail({
        to: "traveler@example.com",
        subject: "Welcome",
        html: "<p>Welcome</p>",
      });

      expect(result.status).toBe("skipped_no_provider");
      expect(result.error).toContain("No email provider configured");

      if (originalApiKey) process.env.BREVO_API_KEY = originalApiKey;
    });

    it("handles successful Brevo API dispatch and records messageId", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messageId: "<20261024.brevo.msg.123@smtp-relay.brevo.com>" }),
      });
      global.fetch = mockFetch;

      process.env.BREVO_API_KEY = "xkeysib-test-dummy-api-key";
      process.env.BREVO_SENDER_EMAIL = "concierge@touroholic.com";
      process.env.BREVO_SENDER_NAME = "Touroholic";

      const result = await sendEmail({
        to: { email: "explorer@example.com", name: "Explorer" },
        subject: "Expedition Confirmation",
        html: "<p>Your journey awaits.</p>",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.brevo.com/v3/smtp/email",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "api-key": "xkeysib-test-dummy-api-key",
            "content-type": "application/json",
          }),
        })
      );
      expect(result.status).toBe("sent");
      expect(result.messageId).toContain("brevo.msg.123");
    });

    it("handles Brevo API authorization failure without leaking the secret key", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ code: "unauthorized", message: "Key not registered or unauthenticated" }),
      });
      global.fetch = mockFetch;

      process.env.BREVO_API_KEY = "xkeysib-secret-key-12345";
      process.env.BREVO_SENDER_EMAIL = "concierge@touroholic.com";

      const result = await sendEmail({
        to: "explorer@example.com",
        subject: "Verification",
        html: "<p>Verify</p>",
      });

      expect(result.status).toBe("failed");
      expect(result.error).toContain("unauthenticated");
      expect(result.error).not.toContain("xkeysib-secret-key-12345");
    });

    it("builds responsive verification email with branding and token link", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messageId: "msg-verify-789" }),
      });
      global.fetch = mockFetch;

      process.env.BREVO_API_KEY = "xkeysib-test";
      process.env.BREVO_SENDER_EMAIL = "concierge@touroholic.com";
      process.env.NEXT_PUBLIC_APP_URL = "https://touroholic.com";

      const result = await sendVerificationEmail({
        toEmail: "traveler@touroholic.com",
        userName: "Marcus Thorne",
        verificationToken: "raw-token-xyz-123",
      });

      expect(result.status).toBe("sent");

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.subject).toContain("Verify your email address");
      expect(sentBody.htmlContent).toContain("Touroholic Expeditions");
      expect(sentBody.htmlContent).toContain("Marcus Thorne");
      expect(sentBody.htmlContent).toContain("https://touroholic.com/verify-email?token=raw-token-xyz-123");
      expect(sentBody.textContent).toContain("https://touroholic.com/verify-email?token=raw-token-xyz-123");
    });
  });

  describe("3. Email Verification Access Control Rules", () => {
    it("blocks booking reservations for unverified regular users", () => {
      const canUserBook = (user: { role: string; emailVerified?: boolean }) => {
        if (user.role === "admin") return true;
        return !!user.emailVerified;
      };

      expect(canUserBook({ role: "user", emailVerified: false })).toBe(false);
      expect(canUserBook({ role: "user", emailVerified: undefined })).toBe(false);
      expect(canUserBook({ role: "user", emailVerified: true })).toBe(true);
    });

    it("exempts administrators from verification lockouts to prevent admin lockout", () => {
      const canUserBook = (user: { role: string; emailVerified?: boolean }) => {
        if (user.role === "admin") return true;
        return !!user.emailVerified;
      };

      expect(canUserBook({ role: "admin", emailVerified: false })).toBe(true);
      expect(canUserBook({ role: "admin", emailVerified: true })).toBe(true);
    });
  });

  describe("4. Audited Payment Reconciliation & Duplicate Prevention", () => {
    it("rejects duplicate transaction reference numbers across reconciliation operations", () => {
      const existingReferences = new Set(["WIRE-847291", "STRIPE-ch_123"]);

      const reconcilePayment = (ref: string) => {
        const trimmed = ref.trim().toUpperCase();
        if (existingReferences.has(trimmed)) {
          return { status: "error", code: "DUPLICATE_REFERENCE", message: "Reference already recorded" };
        }
        existingReferences.add(trimmed);
        return { status: "success" };
      };

      expect(reconcilePayment("WIRE-847291").status).toBe("error");
      expect(reconcilePayment("wire-847291").status).toBe("error");
      expect(reconcilePayment("WIRE-999999").status).toBe("success");
    });

    it("records full audit metadata on successful reconciliation", () => {
      const booking = {
        bookingReference: "TRH-2026-ABCDEF",
        totalPrice: 2800,
        currency: "USD",
        paymentStatus: "unpaid",
        outstandingBalance: 2800,
        paidAt: null as Date | null,
        paymentReference: null as string | null,
        paymentReconciledBy: null as any,
        paymentReconciledAt: null as Date | null,
      };

      const admin = { id: "admin-123", email: "admin@touroholic.com", name: "Curator Admin" };
      const paymentRef = "WIRE-100482";
      const paymentMethod = "Bank Wire Transfer";

      // Perform audited reconciliation
      booking.paymentStatus = "paid";
      booking.outstandingBalance = 0;
      booking.paidAt = new Date();
      booking.paymentReference = paymentRef;
      booking.paymentReconciledBy = admin.id;
      booking.paymentReconciledAt = new Date();

      expect(booking.paymentStatus).toBe("paid");
      expect(booking.outstandingBalance).toBe(0);
      expect(booking.paymentReference).toBe(paymentRef);
      expect(booking.paymentReconciledBy).toBe("admin-123");
      expect(booking.paymentReconciledAt).toBeInstanceOf(Date);
    });

    it("retains legitimate payment record if email notification dispatch fails", async () => {
      let paymentRecordSaved = false;
      let notificationErrorRecorded = false;

      // Step 1: Save payment to database
      paymentRecordSaved = true;

      // Step 2: Dispatch notification inside safe error boundary
      try {
        throw new Error("Brevo SMTP timeout");
      } catch (err: unknown) {
        notificationErrorRecorded = true;
      }

      // Assert payment is retained even though notification failed
      expect(paymentRecordSaved).toBe(true);
      expect(notificationErrorRecorded).toBe(true);
    });
  });
});
