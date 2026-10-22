import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User as UserModel } from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/auth/jwt";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { status: "error", message: validated.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { name, currentPassword, newPassword } = validated.data;
    const db = await connectToDatabase();

    if (db && session.userId.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await UserModel.findById(session.userId).select("+passwordHash");
      if (!user) {
        return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
      }

      if (name) user.name = name;

      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { status: "error", message: "Current password is required to set a new password." },
            { status: 400 }
          );
        }

        const isMatch = await verifyPassword(currentPassword, user.passwordHash);
        if (!isMatch) {
          return NextResponse.json(
            { status: "error", message: "Current password is incorrect." },
            { status: 400 }
          );
        }

        user.passwordHash = await hashPassword(newPassword);
      }

      await user.save();
      return NextResponse.json({
        status: "success",
        message: "Profile updated successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Profile updated successfully (Demo Mode)",
      user: {
        _id: session.userId,
        name: name || session.name,
        email: session.email,
        role: session.role,
      },
    });
  } catch (error) {
    console.error("PATCH /api/users/me error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
