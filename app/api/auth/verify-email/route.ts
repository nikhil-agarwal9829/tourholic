import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User as UserModel } from "@/models/User";
import { getSession, signToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  return handleVerification(request);
}

export async function POST(request: NextRequest) {
  return handleVerification(request);
}

async function handleVerification(request: NextRequest) {
  try {
    let rawToken: string | null = null;

    if (request.method === "GET") {
      const { searchParams } = new URL(request.url);
      rawToken = searchParams.get("token");
    } else {
      const body = await request.json().catch(() => ({}));
      rawToken = body.token || null;
    }

    if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length < 10) {
      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_TOKEN",
          message: "A valid verification token must be provided.",
        },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        {
          status: "error",
          code: "DATABASE_UNAVAILABLE",
          message: "Database connection unavailable.",
        },
        { status: 503 }
      );
    }

    // Hash the incoming raw token using SHA-256
    const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");

    // Atomically find user with matching unexpired token
    const user = await UserModel.findOne({
      verificationTokenHash: tokenHash,
      verificationTokenExpiresAt: { $gt: new Date() },
    }).select("+verificationTokenHash +verificationTokenExpiresAt");

    if (!user) {
      // Check if this token was already used or expired
      const expiredOrUsed = await UserModel.findOne({
        verificationTokenHash: tokenHash,
      }).select("+verificationTokenHash +verificationTokenExpiresAt");

      if (expiredOrUsed) {
        return NextResponse.json(
          {
            status: "error",
            code: "TOKEN_EXPIRED",
            message: "This verification link has expired. Please request a new verification email.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_TOKEN",
          message: "The verification link is invalid or has already been used.",
        },
        { status: 400 }
      );
    }

    // Atomically update user to verified state and invalidate the token
    user.emailVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    // Check existing session; if present or matching, update the cookie with emailVerified: true
    const currentSession = await getSession();
    const response = NextResponse.json({
      status: "success",
      message: "Your email address has been successfully verified! You can now book expeditions.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        emailVerified: true,
      },
    });

    if (currentSession && (currentSession.userId === user._id.toString() || currentSession.email === user.email)) {
      const refreshedPayload = {
        ...currentSession,
        emailVerified: true,
      };
      const newToken = signToken(refreshedPayload);
      response.cookies.set("touroholic_session", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      {
        status: "error",
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while verifying your email.",
      },
      { status: 500 }
    );
  }
}
