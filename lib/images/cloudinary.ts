import { v2 as cloudinary } from "cloudinary";

// Server-only Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload an image buffer or base64 data string to Cloudinary.
 */
export async function uploadImage(
  fileData: string | Buffer,
  folder: string = "touroholic/tours"
): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary credentials are not configured in environment variables.");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload returned empty result"));
        }
        resolve({
          url: result.url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    if (Buffer.isBuffer(fileData)) {
      uploadStream.end(fileData);
    } else if (typeof fileData === "string") {
      cloudinary.uploader
        .upload(fileData, {
          folder,
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        })
        .then((result) => {
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        })
        .catch(reject);
    }
  });
}

/**
 * Delete an image by its public_id.
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary credentials are not configured.");
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (err) {
    console.error("Cloudinary deletion failed:", err);
    return false;
  }
}

/**
 * Read-only health check without uploading files.
 */
export async function checkCloudinaryHealth(): Promise<{
  success: boolean;
  status: string;
  error?: string;
}> {
  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      status: "missing_credentials",
      error: "Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing.",
    };
  }

  try {
    const ping = await cloudinary.api.ping();
    if (ping && ping.status === "ok") {
      return { success: true, status: "connected" };
    }
    return { success: false, status: "unexpected_response" };
  } catch (error: unknown) {
    const err = error as { message?: string; http_code?: number };
    return {
      success: false,
      status: err.http_code === 401 ? "invalid_credentials" : "connection_failed",
      error: err.message || "Failed to reach Cloudinary API",
    };
  }
}

/**
 * Sanitize error messages from Cloudinary to guarantee that API keys,
 * secrets, and sensitive tokens are never exposed in user-facing responses or logs.
 */
export function sanitizeCloudinaryError(error: unknown): string {
  if (!error) return "Image upload failed. Please try again.";
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);

  // Detect specific Cloudinary authorization / configuration issues
  if (
    /invalid\s*api_key/i.test(raw) ||
    /unknown\s*api_key/i.test(raw) ||
    /authorization\s*required/i.test(raw)
  ) {
    return "Cloudinary authentication failed: Invalid API credentials configured on server. Please verify your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET settings.";
  }
  if (/must\s*supply\s*api_key/i.test(raw) || /missing\s*credentials/i.test(raw)) {
    return "Cloudinary credentials missing: Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.";
  }
  if (/cloud_name/i.test(raw)) {
    return "Cloudinary configuration error: Invalid cloud name.";
  }

  // Redact any numbers with 6+ digits or long alphanumeric tokens to prevent credential leaks
  return raw
    .replace(/\b\d{6,}\b/g, "[REDACTED_KEY]")
    .replace(/[a-zA-Z0-9_-]{20,}/g, "[REDACTED_SECRET]");
}

export default cloudinary;
