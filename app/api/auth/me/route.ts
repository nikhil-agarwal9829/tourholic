import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User as UserModel } from "@/models/User";

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
      const userDoc = await UserModel.findById(session.userId)
        .select("-passwordHash")
        .populate("favoriteTours", "name slug imageCover price duration ratingsAverage")
        .lean();

      if (userDoc) {
        return NextResponse.json({
          status: "success",
          user: userDoc,
        });
      }
    }

    // Demo/session fallback
    return NextResponse.json({
      status: "success",
      user: {
        _id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
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
