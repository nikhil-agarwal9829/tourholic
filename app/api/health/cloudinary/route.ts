import { NextResponse } from "next/server";
import { checkCloudinaryHealth } from "@/lib/images/cloudinary";

export async function GET() {
  const result = await checkCloudinaryHealth();

  if (result.success) {
    return NextResponse.json({
      success: true,
      service: "cloudinary",
      status: "connected",
    });
  }

  return NextResponse.json(
    {
      success: false,
      service: "cloudinary",
      status: result.status,
      message: result.error || "Cloudinary authentication check failed.",
    },
    { status: result.status === "missing_credentials" ? 503 : 401 }
  );
}
