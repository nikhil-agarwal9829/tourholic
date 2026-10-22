import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User as UserModel } from "@/models/User";
import { hashPassword, signToken } from "@/lib/auth/jwt";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").toLowerCase(),
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
      // provide a secure demo token session so testing is friction-free
      const demoUser = {
        userId: "demo-user-" + Date.now(),
        email,
        name,
        role: "user" as const,
      };
      const token = signToken(demoUser);

      const response = NextResponse.json(
        {
          status: "success",
          message: "Registration successful (Demo Mode)",
          user: demoUser,
          isDemoMode: true,
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
    const newUser = await UserModel.create({
      name,
      email,
      passwordHash,
      role: "user",
      active: true,
    });

    const sessionPayload = {
      userId: (newUser._id as object).toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const token = signToken(sessionPayload);

    const response = NextResponse.json(
      {
        status: "success",
        message: "Account created successfully",
        user: sessionPayload,
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
