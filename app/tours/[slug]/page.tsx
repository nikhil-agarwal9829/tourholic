import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getTourBySlug, getTourDepartures, getTourReviews, getTours } from "@/lib/tours/service";
import TourBookingWidget from "@/components/tours/TourBookingWidget";
import TourReviewForm from "@/components/tours/TourReviewForm";
import TourCard from "@/components/tours/TourCard";
import { formatPrice } from "@/lib/utils";

interface TourDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return { title: "Tour Not Found — Touroholic" };
  return {
    title: `${tour.name} — Touroholic Expeditions`,
    description: tour.summary,
  };
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  const [departures, reviews, { tours: allTours }] = await Promise.all([
    getTourDepartures(slug),
    getTourReviews(slug),
    getTours({ limit: 4 }),
  ]);

  const similarTours = allTours.filter((t) => t.slug !== tour.slug).slice(0, 3);

  return (
    <div className="bg-[#fbfaf8] min-h-screen">
      {/* 1. Large Hero Header */}
      <div className="relative h-[480px] lg:h-[580px] w-full bg-stone-900">
        <Image
          src={tour.imageCover}
          alt={tour.name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12241f] via-[#12241f]/40 to-black/30" />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
            {/* Breadcrumb & Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-white/90">
              <Link href="/tours" className="hover:underline text-stone-300">
                Tours
              </Link>
              <span>/</span>
              <span className="text-amber-300">{tour.category}</span>
              <span>/</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                {tour.difficulty}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-white max-w-4xl tracking-tight leading-tight">
              {tour.name}
            </h1>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-stone-200">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-300" />
                <span>
                  {tour.destination}, {tour.country}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>{tour.duration} Days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-300" />
                <span>Max {tour.maxGroupSize} Guests</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{tour.ratingsAverage.toFixed(1)}</span>
                <span className="text-stone-300">({tour.ratingsQuantity} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Tour Description, Gallery, Itinerary, Reviews */}
          <div className="lg:col-span-8 space-y-12">
            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e8e3d8] travel-card-shadow">
                <div className="flex items-center gap-2 mb-4 text-[#d97706]">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="font-serif text-xl font-bold text-[#1c2421]">Expedition Highlights</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tour.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                      <CheckCircle className="w-4 h-4 text-[#124e3f] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e8e3d8] travel-card-shadow space-y-4">
              <h2 className="font-serif text-2xl font-bold text-[#1c2421]">The Experience</h2>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-light whitespace-pre-line">
                {tour.description}
              </p>
            </div>

            {/* Photo Gallery */}
            {tour.images && tour.images.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-bold text-[#1c2421]">Expedition Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {tour.images.map((img, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm">
                      <Image
                        src={img}
                        alt={`${tour.name} view ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day-by-day Itinerary */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e8e3d8] travel-card-shadow space-y-6">
              <h2 className="font-serif text-2xl font-bold text-[#1c2421]">Day-by-Day Itinerary</h2>
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#e8e3d8]">
                {tour.itinerary?.map((item) => (
                  <div key={item.day} className="relative pl-8 space-y-1">
                    <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-[#124e3f] border-4 border-white shadow-sm" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#124e3f]">
                      Day {item.day}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#1c2421]">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-[#e8e3d8] travel-card-shadow space-y-4">
                <h3 className="font-serif text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>What&apos;s Included</span>
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700">
                  {tour.included?.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#e8e3d8] travel-card-shadow space-y-4">
                <h3 className="font-serif text-lg font-bold text-rose-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>What&apos;s Excluded</span>
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700">
                  {tour.excluded?.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-[#f4efe6] rounded-2xl p-6 border border-[#e2dcce] flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 text-[#124e3f] shrink-0 mt-1" />
              <div>
                <h4 className="font-serif text-base font-bold text-[#1c2421]">Cancellation & Flexibility</h4>
                <p className="text-xs sm:text-sm text-stone-700 mt-1 leading-relaxed">
                  {tour.cancellationPolicy}
                </p>
              </div>
            </div>

            {/* Reviews Section & Review Form */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e8e3d8] travel-card-shadow space-y-8">
              <div className="flex items-center justify-between border-b border-[#f0ece3] pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1c2421]">Traveler Reviews</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {tour.ratingsQuantity} verified expedition reviews
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#f4efe6] px-3.5 py-1.5 rounded-full text-[#124e3f] text-sm font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{tour.ratingsAverage.toFixed(1)} / 5.0</span>
                </div>
              </div>

              {/* Review Form */}
              <TourReviewForm tourId={tour._id} />

              {/* Review Cards List */}
              <div className="space-y-6 pt-4">
                {reviews.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">
                    No reviews yet. Be the first adventurer to share your feedback!
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} className="border-b border-[#f0ece3] pb-6 last:border-none space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-200 overflow-hidden relative">
                            <Image
                              src={rev.user.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                              alt={rev.user.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#1c2421]">{rev.user.name}</h4>
                            <span className="text-[10px] text-stone-400">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">{rev.review}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <TourBookingWidget tour={tour} departures={departures} />
            </div>
          </div>
        </div>

        {/* Similar Expeditions */}
        {similarTours.length > 0 && (
          <div className="mt-20 pt-16 border-t border-[#e8e3d8]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
                  Related Horizons
                </span>
                <h2 className="font-serif text-3xl font-normal text-[#1c2421] mt-1">
                  You Might Also Love
                </h2>
              </div>
              <Link
                href="/tours"
                className="text-xs font-semibold uppercase tracking-wider text-[#124e3f] hover:text-[#0c382d] flex items-center gap-1"
              >
                <span>View All Tours</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarTours.map((t) => (
                <TourCard key={t._id} tour={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
