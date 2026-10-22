import React from "react";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ReviewsSection from "@/components/home/ReviewsSection";
import TourCard from "@/components/tours/TourCard";
import { getTours } from "@/lib/tours/service";
import { getRecommendedTours } from "@/lib/recommendations/engine";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

export const metadata = {
  title: "Touroholic — Curated Small-Group Tours & Expeditions",
  description:
    "Discover handpicked, small-group adventure and cultural tours. From Banff's alpine lakes to Serengeti safaris and Kyoto heritage.",
};

export default async function HomePage() {
  const { tours } = await getTours({ limit: 6, sort: "popular" });
  const featuredTours = tours.filter((t) => t.featured).slice(0, 3);
  const recommendedResults = getRecommendedTours(tours, undefined, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section with Search Panel */}
      <HeroSection />

      {/* 2. Featured Expeditions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
                Handpicked Journeys
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421] mt-2">
                Featured Expeditions
              </h2>
            </div>
            <Link
              href="/tours"
              className="text-xs font-semibold uppercase tracking-wider text-[#124e3f] hover:text-[#0c382d] flex items-center gap-1.5 mt-4 md:mt-0"
            >
              <span>View All 12 Expeditions</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Categories & Destination Photography */}
      <CategoryGrid />

      {/* 4. Recommended for You Section */}
      <section className="py-20 bg-[#fbfaf8] border-t border-[#e8e3d8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#d97706] mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explainable Recommendations</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421]">
                Recommended for You
              </h2>
            </div>
            <p className="text-xs text-stone-500 max-w-xs mt-3 md:mt-0">
              Ranked dynamically by traveler ratings, group intimacy, and seasonal conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedResults.map(({ tour, reasons }) => (
              <TourCard key={tour._id} tour={tour} reason={reasons[0]} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us */}
      <WhyChooseUs />

      {/* 6. Traveler Reviews & Testimonials */}
      <ReviewsSection />
    </div>
  );
}
