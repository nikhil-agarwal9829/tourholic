"use client";

import React, { useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface TourReviewFormProps {
  tourId: string;
}

export default function TourReviewForm({ tourId }: TourReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!review.trim() || review.trim().length < 5) {
      setError("Please write at least a few words about your experience (minimum 5 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId, rating, review }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError("You must be logged in to leave a review.");
        } else {
          setError(data.message || "Failed to submit review.");
        }
        return;
      }

      setSubmitted(true);
      setReview("");
    } catch {
      setError("Network error while submitting review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <span className="text-xs sm:text-sm font-medium">
          Thank you! Your verified review has been submitted and added to this expedition.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#fbfaf8] p-5 rounded-2xl border border-[#e8e3d8] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-serif text-base font-bold text-[#1c2421]">Write a Review</h3>

        {/* Interactive Star Picker */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-stone-500 mr-2">Your Rating:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className="p-1 focus:outline-none"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  star <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-stone-300 hover:text-amber-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          rows={3}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your personal experience with the guides, lodges, trails, or unforgettable moments..."
          className="w-full p-3 text-xs sm:text-sm bg-white border border-[#e8e3d8] rounded-xl focus:outline-none focus:border-[#124e3f] text-stone-800 placeholder-stone-400"
        />
      </div>

      {error && (
        <div className="text-xs text-rose-600 font-medium">
          {error}{" "}
          {error.includes("logged in") && (
            <Link href="/login" className="underline font-bold ml-1 text-[#124e3f]">
              Log in here
            </Link>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#124e3f] hover:bg-[#0c382d] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          <span>{isSubmitting ? "Submitting..." : "Submit Review"}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
}
