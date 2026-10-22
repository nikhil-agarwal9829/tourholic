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

export default cloudinary;
