import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Users, MapPin, ArrowUpRight } from "lucide-react";
import { Tour } from "@/types";
import { formatPrice } from "@/lib/utils";

interface TourCardProps {
  tour: Tour;
  reason?: string;
  distanceKm?: number;
  searchedOrigin?: string;
  showBookNowButton?: boolean;
}

export default function TourCard({
  tour,
  reason,
  distanceKm,
  searchedOrigin,
  showBookNowButton = true,
}: TourCardProps) {
  const difficultyColor =
    tour.difficulty === "easy"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tour.difficulty === "medium"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-rose-50 text-rose-800 border-rose-200";

  const effectiveDistance = distanceKm ?? tour.distanceKm;

  // Build actual geographic destination string
  const actualLocationParts = [tour.city, tour.state || tour.destination, tour.country].filter(
    (item, index, self) => Boolean(item) && self.indexOf(item) === index
  );
  const locationLabel = actualLocationParts.length > 0 ? actualLocationParts.join(", ") : `${tour.destination}, ${tour.country}`;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#e8e3d8] travel-card-shadow hover:travel-card-shadow-hover transition-all duration-300 flex flex-col h-full">
      {/* Cover Image & Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
        <Image
          src={tour.imageCover}
          alt={tour.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Category & Difficulty Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/95 backdrop-blur-md text-[#124e3f] shadow-sm">
            {tour.category}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md border shadow-sm ${difficultyColor}`}
          >
            {tour.difficulty}
          </span>
        </div>

        {/* Top Rated Badge (only when real review threshold is met) */}
        {tour.ratingsQuantity >= 2 && tour.ratingsAverage >= 4.7 && (
          <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-md">
            <Star className="w-3 h-3 fill-white text-white" />
            <span>Top Rated</span>
          </div>
        )}

        {/* Distance Badge on Image if available */}
        {effectiveDistance !== undefined && (
          <div className="absolute bottom-3.5 left-3.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#124e3f]/90 backdrop-blur-md text-white text-xs font-semibold shadow-md">
            <MapPin className="w-3.5 h-3.5 text-emerald-300" />
            <span>~{Math.round(effectiveDistance)} km away</span>
          </div>
        )}

        {/* Rating Floating Pill: 'New' if 0 reviews, else genuine rating & count */}
        <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-semibold">
          {tour.ratingsQuantity > 0 ? (
            <>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{tour.ratingsAverage.toFixed(1)}</span>
              <span className="text-stone-300 text-[10px]">({tour.ratingsQuantity})</span>
            </>
          ) : (
            <span className="text-[11px] font-medium text-emerald-300">New Expedition</span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Destination */}
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#124e3f] shrink-0" />
              <span className="truncate" title={locationLabel}>
                {locationLabel}
              </span>
            </div>
            {effectiveDistance !== undefined && (
              <span className="text-[11px] font-semibold text-[#124e3f] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 ml-2">
                ~{Math.round(effectiveDistance)} km
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/tours/${tour.slug}`}>
            <h3 className="font-serif text-lg font-bold text-[#1c2421] group-hover:text-[#124e3f] transition-colors line-clamp-1">
              {tour.name}
            </h3>
          </Link>

          {/* Summary */}
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {tour.summary}
          </p>

          {/* Reason Badge (for recommendations) */}
          {reason && (
            <div className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f4efe6] text-[#854d0e] border border-[#e5dccb]">
              ✨ {reason}
            </div>
          )}
        </div>

        {/* Tour Key Details Bar */}
        <div className="pt-3 border-t border-[#f0ece3] flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{tour.duration} Days</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-stone-400" />
            <span>Max {tour.maxGroupSize}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-medium">
              Starting from
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#124e3f]">
                {formatPrice(tour.price, tour.currency)}
              </span>
              <span className="text-xs text-stone-500">/ person</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showBookNowButton ? (
              <Link
                href={`/tours/${tour.slug}`}
                className="px-3.5 py-2 rounded-xl bg-[#124e3f] hover:bg-[#0c382d] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                aria-label={`Book ${tour.name}`}
              >
                <span>Book Now</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href={`/tours/${tour.slug}`}
                className="w-10 h-10 rounded-xl bg-[#f4efe6] group-hover:bg-[#124e3f] group-hover:text-white text-[#124e3f] flex items-center justify-center transition-all duration-300"
                aria-label={`View details for ${tour.name}`}
              >
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
