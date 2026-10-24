import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User as UserModel } from "@/models/User";
import { Notification as NotificationModel } from "@/models/Notification";
import { getSession } from "@/lib/auth/jwt";
import { sendVerificationEmail } from "@/lib/notifications/email-service";

const COOLDOWN_SECONDS = 120; // 2 minutes rate limit

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

    // If email is not passed in body, try to get from current session
    const currentSession = await getSession();
    if (!email && currentSession?.email) {
      email = currentSession.email.trim().toLowerCase();
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        {
          status: "error",
          message: "A valid email address is required to resend verification.",
        },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        {
          status: "error",
          message: "Database service temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    const user = await UserModel.findOne({ email }).select(
      "+verificationTokenHash +verificationTokenExpiresAt +lastVerificationEmailSentAt"
    );

    // Prevent user enumeration: Return generic success if account does not exist
    if (!user) {
      return NextResponse.json({
        status: "success",
        message: "If an unverified account is associated with this email, a verification link has been sent.",
        cooldownRemainingSeconds: COOLDOWN_SECONDS,
      });
    }

    // If user is already verified, inform them gently
    if (user.emailVerified) {
      return NextResponse.json({
        status: "info",
        message: "Your email address is already verified. You can proceed with booking your expedition.",
        alreadyVerified: true,
      });
    }

    // Rate limiting cooldown check
    if (user.lastVerificationEmailSentAt) {
      const secondsSinceLast = Math.floor(
        (Date.now() - new Date(user.lastVerificationEmailSentAt).getTime()) / 1000
      );
      if (secondsSinceLast < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - secondsSinceLast;
        return NextResponse.json(
          {
            status: "error",
            code: "RATE_LIMITED",
            message: `Please wait ${remaining} second${remaining === 1 ? "" : "s"} before requesting another verification email.`,
            cooldownRemainingSeconds: remaining,
          },
          { status: 429 }
        );
      }
    }

    // Invalidate previous token and generate fresh cryptographically secure token
    const rawVerificationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawVerificationToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const now = new Date();

    user.verificationTokenHash = tokenHash;
    user.verificationTokenExpiresAt = expiresAt;
    user.lastVerificationEmailSentAt = now;
    await user.save();

    // Send email via Brevo
    let emailDeliveryStatus: "sent" | "failed" | "skipped" = "skipped";
    let providerMessageId: string | undefined;
    let deliveryError: string | undefined;

    try {
      const emailResult = await sendVerificationEmail({
        toEmail: user.email,
        userName: user.name,
        verificationToken: rawVerificationToken,
      });

      if (emailResult.status === "sent") {
        emailDeliveryStatus = "sent";
        providerMessageId = emailResult.messageId;
      } else if (emailResult.status === "failed") {
        emailDeliveryStatus = "failed";
        deliveryError = emailResult.error;
      } else {
        emailDeliveryStatus = "skipped";
        deliveryError = emailResult.error;
      }
    } catch (err: unknown) {
      emailDeliveryStatus = "failed";
      deliveryError = err instanceof Error ? err.message : "Failed to contact email provider";
    }

    // Record notification audit
    try {
      await NotificationModel.create({
        user: user._id,
        type: "email_verification",
        title: "Verify your email address (Resend)",
        message: "A new verification email has been dispatched to your email address.",
        read: false,
        channel: "email",
        emailDeliveryStatus:
          emailDeliveryStatus === "sent"
            ? "sent"
            : emailDeliveryStatus === "failed"
            ? "failed"
            : "skipped_no_provider",
        emailDeliveryError: deliveryError,
        providerMessageId,
        attemptCount: 1,
        lastAttemptAt: now,
        errorSummary: deliveryError,
      });
    } catch (notifErr) {
      console.error("Failed to log resend notification:", notifErr);
    }

    if (emailDeliveryStatus === "sent") {
      return NextResponse.json({
        status: "success",
        message: "A new verification email has been sent. Please check your inbox and spam folder.",
        cooldownRemainingSeconds: COOLDOWN_SECONDS,
      });
    } else {
      return NextResponse.json(
        {
          status: "error",
          code: "EMAIL_DISPATCH_FAILED",
          message:
            deliveryError ||
            "Unable to deliver verification email at this moment. Please check your network or try again shortly.",
          cooldownRemainingSeconds: 30,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("POST /api/auth/resend-verification error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to resend verification email." },
      { status: 500 }
    );
  }
}
