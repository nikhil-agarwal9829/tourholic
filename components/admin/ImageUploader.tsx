"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, X, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  onUploadSuccess: (data: { url: string; publicId: string }) => void;
  initialUrl?: string;
  initialPublicId?: string;
  required?: boolean;
}

export default function ImageUploader({
  onUploadSuccess,
  initialUrl = "",
  initialPublicId = "",
  required = true,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl);
  const [publicId, setPublicId] = useState<string>(initialPublicId);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(Boolean(initialUrl));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage("");

    // Client-side file type validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Only JPEG, PNG, and WebP images are permitted.");
      return;
    }

    // Client-side file size validation (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage("File exceeds the 10MB limit. Please choose a smaller photo.");
      return;
    }

    // Show instant local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result.message || "Failed to upload photo to Cloudinary.");
        setUploadSuccess(false);
        return;
      }

      const uploadedUrl = result.data.url;
      const uploadedPublicId = result.data.publicId;

      setPreviewUrl(uploadedUrl);
      setPublicId(uploadedPublicId);
      setUploadSuccess(true);
      onUploadSuccess({ url: uploadedUrl, publicId: uploadedPublicId });
    } catch {
      setErrorMessage("Network error during image upload. Please retry.");
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    const currentPublicId = publicId;
    if (currentPublicId) {
      fetch(`/api/upload?publicId=${encodeURIComponent(currentPublicId)}`, {
        method: "DELETE",
      }).catch((err) => console.warn("Failed to clean up removed photo:", err));
    }

    setPreviewUrl("");
    setPublicId("");
    setUploadSuccess(false);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onUploadSuccess({ url: "", publicId: "" });
  };

  return (
    <div className="space-y-2">
      <label className="font-semibold uppercase tracking-wider text-stone-600 block text-xs">
        Cover Photo {required && <span className="text-rose-600">*</span>}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Zone */}
      {!previewUrl ? (
        <div
          onClick={handleTriggerClick}
          className="cursor-pointer border-2 border-dashed border-[#e8e3d8] hover:border-[#124e3f] bg-[#fbfaf8] hover:bg-[#f4efe6]/50 rounded-2xl p-6 text-center transition-all group space-y-2"
        >
          <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-[#124e3f]/10 text-stone-500 group-hover:text-[#124e3f] flex items-center justify-center mx-auto transition-colors">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-800 group-hover:text-[#124e3f] block">
              Click to Upload Cover Photo
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              Supports JPEG, PNG, WebP up to 10MB (Stored on Cloudinary)
            </span>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-[#e8e3d8] bg-[#fbfaf8] p-3 flex flex-col sm:flex-row items-center gap-4">
          {/* Thumbnail preview */}
          <div className="relative w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
            <Image
              src={previewUrl}
              alt="Cover Photo Preview"
              fill
              sizes="128px"
              className="object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 w-full space-y-1">
            <div className="flex items-center gap-1.5">
              {uploadSuccess ? (
                <div className="flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Photo Uploaded to Cloudinary</span>
                </div>
              ) : isUploading ? (
                <div className="flex items-center gap-1 text-stone-600 text-xs font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Cloudinary CDN...</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-stone-600">Selected Photo</span>
              )}
            </div>

            {publicId && (
              <p className="font-mono text-[10px] text-stone-400 truncate max-w-xs">
                ID: {publicId}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={handleTriggerClick}
                className="px-3 py-1.5 rounded-lg border border-[#e8e3d8] hover:bg-stone-100 text-[11px] font-semibold text-stone-700 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replace Photo</span>
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={handleReset}
                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
