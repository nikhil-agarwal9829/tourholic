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

    // Atomically find and verify user with matching unexpired token in a single atomic database operation
    const user = await UserModel.findOneAndUpdate(
      {
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: { $gt: new Date() },
      },
      {
        $set: { emailVerified: true },
        $unset: { verificationTokenHash: 1, verificationTokenExpiresAt: 1 },
      },
      { new: true }
    );

    if (!user) {
      // Check if this token was expired
      const expiredUser = await UserModel.findOne({
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: { $lte: new Date() },
      }).select("+verificationTokenExpiresAt");

      if (expiredUser) {
        return NextResponse.json(
          {
            status: "error",
            code: "TOKEN_EXPIRED",
            message: "This verification link has expired. Please request a new verification email below.",
          },
          { status: 400 }
        );
      }

      // Check if the current user session is already verified
      const currentSession = await getSession();
      if (currentSession?.emailVerified) {
        return NextResponse.json({
          status: "success",
          message: "Your email address is already verified! You can proceed to explore and book expeditions.",
          user: {
            id: currentSession.userId,
            name: currentSession.name,
            email: currentSession.email,
            emailVerified: true,
          },
        });
      }

      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_OR_USED_TOKEN",
          message: "This verification link is invalid or has already been used. If you have already verified your account, you can sign in directly.",
        },
        { status: 400 }
      );
    }

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
