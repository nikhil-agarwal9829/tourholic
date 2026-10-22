import React from "react";
import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { SAMPLE_REVIEWS } from "@/lib/data/sample-tours";

export default function ReviewsSection() {
  return (
    <section className="py-20 bg-[#fbfaf8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
            Real Stories
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421] mt-2">
            Loved by Travelers Worldwide
          </h2>
          <p className="text-sm text-stone-600 mt-3">
            Read unedited reviews from adventurers who journeyed with us across six continents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SAMPLE_REVIEWS.slice(0, 3).map((review) => (
            <div
              key={review._id}
              className="bg-white p-7 rounded-2xl border border-[#e8e3d8] travel-card-shadow flex flex-col justify-between relative"
            >
              <Quote className="w-10 h-10 text-[#f4efe6] absolute top-6 right-6 -z-0" />
              <div className="relative z-10 space-y-4">
                {/* Rating Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Text */}
                <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                  &ldquo;{review.review}&rdquo;
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-6 border-t border-[#f0ece3] mt-6 relative z-10">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-200">
                  <Image
                    src={review.user.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                    alt={review.user.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1c2421]">{review.user.name}</h4>
                  <p className="text-[11px] text-stone-500">Verified Adventurer</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
