import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User as UserModel } from "@/models/User";
import { verifyPassword, signToken } from "@/lib/auth/jwt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          status: "error",
          message: validated.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const db = await connectToDatabase();

    if (!db) {
      // In development demo mode: allow convenient login for demo accounts or any test input
      const isAdmin = email.includes("admin");
      const demoUser = {
        userId: isAdmin ? "demo-admin-id" : "demo-user-id",
        email,
        name: isAdmin ? "Victoria Sterling (Admin)" : "Marcus Thorne",
        role: (isAdmin ? "admin" : "user") as "user" | "admin",
      };

      const token = signToken(demoUser);
      const response = NextResponse.json({
        status: "success",
        message: "Logged in successfully (Demo Mode)",
        user: demoUser,
        isDemoMode: true,
      });

      response.cookies.set("touroholic_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    const user = await UserModel.findOne({ email }).select("+passwordHash");

    if (!user || !user.active) {
      return NextResponse.json(
        { status: "error", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { status: "error", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: (user._id as object).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = signToken(sessionPayload);
    const response = NextResponse.json({
      status: "success",
      message: "Logged in successfully",
      user: sessionPayload,
    });

    response.cookies.set("touroholic_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to authenticate" },
      { status: 500 }
    );
  }
}
