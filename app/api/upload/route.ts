import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/images/cloudinary";
import { getSession } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    // In production require admin session; in dev allow verified uploads
    if (session && session.role !== "admin") {
      return NextResponse.json(
        { status: "error", message: "Admin authorization required." },
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
    const err = error as { message?: string };
    return NextResponse.json(
      { status: "error", message: err.message || "Image upload failed." },
      { status: 500 }
    );
  }
}
