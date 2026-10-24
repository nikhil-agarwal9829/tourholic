import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User as UserModel } from "@/models/User";
import { Notification as NotificationModel } from "@/models/Notification";
import { hashPassword, signToken } from "@/lib/auth/jwt";
import { sendVerificationEmail } from "@/lib/notifications/email-service";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          status: "error",
          message: validated.error.issues[0]?.message || "Validation error",
          errors: validated.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;
    const db = await connectToDatabase();

    if (!db) {
      // In development demo mode without Mongo Atlas credentials:
      const demoUser = {
        userId: "demo-user-" + Date.now(),
        email,
        name,
        role: "user" as const,
        emailVerified: false,
      };
      const token = signToken(demoUser);

      const response = NextResponse.json(
        {
          status: "success",
          message: "Registration successful. Please verify your email address to book expeditions.",
          user: demoUser,
          isDemoMode: true,
          emailVerificationSent: false,
        },
        { status: 201 }
      );

      response.cookies.set("touroholic_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { status: "error", message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Generate single-use cryptographic token and store only the SHA-256 hash
    const rawVerificationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawVerificationToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
    const now = new Date();

    const newUser = await UserModel.create({
      name,
      email,
      passwordHash,
      role: "user",
      active: true,
      emailVerified: false,
      verificationTokenHash: tokenHash,
      verificationTokenExpiresAt: expiresAt,
      lastVerificationEmailSentAt: now,
    });

    // Send verification email via Brevo transactional service
    let emailDeliveryStatus: "sent" | "failed" | "skipped" = "skipped";
    let providerMessageId: string | undefined;
    let deliveryError: string | undefined;

    try {
      const emailResult = await sendVerificationEmail({
        toEmail: newUser.email,
        userName: newUser.name,
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
      deliveryError = err instanceof Error ? err.message : "Error contacting email provider";
    }

    // Persist notification record for audit trail
    try {
      await NotificationModel.create({
        user: newUser._id,
        type: "email_verification",
        title: "Verify your email address",
        message: "A verification email has been dispatched to your email address.",
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
      console.error("Failed to persist email_verification notification record:", notifErr);
    }

    const sessionPayload = {
      userId: (newUser._id as object).toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      emailVerified: false,
    };

    const token = signToken(sessionPayload);

    const message =
      emailDeliveryStatus === "sent"
        ? "Account created successfully! A verification email has been sent. Please check your inbox to activate your account."
        : "Account created successfully! Please verify your email before booking expeditions. You can resend the link anytime from your profile.";

    const response = NextResponse.json(
      {
        status: "success",
        message,
        user: sessionPayload,
        emailVerificationSent: emailDeliveryStatus === "sent",
      },
      { status: 201 }
    );

    response.cookies.set("touroholic_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to create account" },
      { status: 500 }
    );
  }
}
