import { NextRequest, NextResponse } from "next/server";
import { uploadImage, deleteImage, sanitizeCloudinaryError } from "@/lib/images/cloudinary";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Tour as TourModel } from "@/models/Tour";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Administrator authorization required to upload expedition assets." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { status: "error", message: "No image file provided." },
        { status: 400 }
      );
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { status: "error", message: "Image exceeds maximum allowed size of 10MB." },
        { status: 400 }
      );
    }

    // Validate mime type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { status: "error", message: "Only JPEG, PNG, WebP, and AVIF images are permitted." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImage(buffer, "touroholic/tours");

    return NextResponse.json({
      status: "success",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/upload error:", error);
    const safeMessage = sanitizeCloudinaryError(error);
    return NextResponse.json(
      { status: "error", message: safeMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Administrator authorization required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json(
        { status: "error", message: "publicId parameter is required." },
        { status: 400 }
      );
    }

    // Protect assets currently in use by active tours
    const db = await connectToDatabase();
    if (db) {
      const activeTour = await TourModel.findOne({
        $or: [
          { coverImagePublicId: publicId },
          { imageCover: { $regex: publicId } },
        ],
      });
      if (activeTour) {
        return NextResponse.json(
          {
            status: "error",
            message: "Cannot delete asset currently linked to an active tour expedition.",
          },
          { status: 400 }
        );
      }
    }

    const deleted = await deleteImage(publicId);
    return NextResponse.json({ status: "success", deleted });
  } catch (error: unknown) {
    console.error("DELETE /api/upload error:", error);
    return NextResponse.json(
      { status: "error", message: sanitizeCloudinaryError(error) },
      { status: 500 }
    );
  }
}
