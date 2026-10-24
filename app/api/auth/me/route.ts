import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User as UserModel } from "@/models/User";
import "@/models/Tour"; // Ensure Tour schema is registered for favoriteTours population

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { status: "unauthenticated", user: null },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    if (db && session.userId && session.userId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        const userDoc = await UserModel.findById(session.userId)
          .select("-passwordHash")
          .populate("favoriteTours", "name slug imageCover price duration ratingsAverage")
          .lean();

        if (userDoc) {
          return NextResponse.json({
            status: "success",
            user: {
              ...userDoc,
              emailVerified: Boolean(userDoc.emailVerified ?? (userDoc.role === "admin")),
            },
          });
        }
      } catch (dbErr) {
        console.warn("Could not fetch full userDoc in /api/auth/me, falling back to session:", dbErr);
      }
    }

    // Session fallback ensures authenticated users are never unexpectedly logged out
    return NextResponse.json({
      status: "success",
      user: {
        _id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        emailVerified: Boolean(session.emailVerified ?? (session.role === "admin")),
        favoriteTours: [],
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
