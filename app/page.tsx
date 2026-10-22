import React from "react";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ReviewsSection from "@/components/home/ReviewsSection";
import TourCard from "@/components/tours/TourCard";
import RecommendedSection from "@/components/home/RecommendedSection";
import { getGroupedRecommendations } from "@/lib/recommendations/deterministic-service";
import { getSession } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { TravelPreferences } from "@/types";
import Link from "next/link";
import { ArrowUpRight, Star, Sparkles, MapPin } from "lucide-react";

export const metadata = {
  title: "Touroholic — Curated Small-Group Tours & Expeditions",
  description:
    "Discover handpicked, small-group adventure and cultural tours. From the backwaters of Kerala and Kashmir's alpine valleys to the Canadian Rockies and Amalfi Coast.",
};

export default async function HomePage() {
  // Read authenticated user's travel preferences if logged in
  const session = await getSession();
  let userPreferences: TravelPreferences | undefined = undefined;

  if (session?.userId) {
    try {
      await connectToDatabase();
      const user = await User.findById(session.userId).select("travelPreferences").lean();
      if (user?.travelPreferences) {
        userPreferences = user.travelPreferences;
      }
    } catch {
      // Graceful fallback
    }
  }

  // Fetch deterministic, rule-based recommendations from MongoDB Atlas
  const {
    personalized,
    hasPreferences,
    topRated,
    exploreIndia,
    exploreMore,
    targetDestinationMessage,
  } = await getGroupedRecommendations(userPreferences, 12);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section with Search Panel */}
      <HeroSection />

      {/* 2. Recommended for You (Personalized with Reason Badges) */}
      <RecommendedSection
        initialRecommendations={personalized}
        hasPreferences={hasPreferences}
        initialPreferences={userPreferences}
        targetDestinationMessage={targetDestinationMessage}
      />

      {/* 3. Top Rated Expeditions (Genuine Review Data) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#124e3f] mb-2">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Verified Traveler Consensus</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421]">
                Top Rated Expeditions
              </h2>
            </div>
            <p className="text-xs text-stone-500 max-w-sm mt-3 md:mt-0">
              Ranked strictly by verified traveler reviews and ratings. Minimum review threshold
              applied; no fabricated ratings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topRated.map((tour) => (
              <TourCard
                key={tour._id}
                tour={tour}
                reason={`Top-rated expedition (${tour.ratingsAverage}★ out of 5 from ${tour.ratingsQuantity} reviews)`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Explore India Collection (Dedicated Section with 12 Indian Tours) */}
      <section className="py-20 bg-[#fbfaf8] border-t border-[#e8e3d8]" id="explore-india">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#124e3f] mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Subcontinent Wonders</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421]">
                Explore India
              </h2>
              <p className="text-xs text-stone-500 max-w-xl mt-2 leading-relaxed">
                From the misty tea slopes of Darjeeling and red cliffs of Varkala to the royal forts
                of Jaipur and Mughal heritage of Agra. Handcrafted small-group Indian journeys.
              </p>
            </div>

            <Link
              href="/tours?country=India"
              className="text-xs font-semibold uppercase tracking-wider text-[#124e3f] hover:text-[#0c382d] flex items-center gap-1.5 shrink-0"
            >
              <span>View All 12 Indian Journeys</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exploreIndia.slice(0, 6).map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>

          {exploreIndia.length > 6 && (
            <div className="pt-4 text-center">
              <Link
                href="/tours?country=India"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#e8e3d8] hover:border-[#124e3f] text-xs font-bold text-[#124e3f] shadow-xs transition-colors"
              >
                <span>Explore More Indian Destinations ({exploreIndia.length - 6} more)</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 5. Destination Categories Grid */}
      <CategoryGrid />

      {/* 6. Explore More Destinations */}
      <section className="py-20 bg-white border-t border-[#e8e3d8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
                Global Horizons
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421] mt-2">
                Explore More Expeditions
              </h2>
            </div>
            <Link
              href="/tours"
              className="text-xs font-semibold uppercase tracking-wider text-[#124e3f] hover:text-[#0c382d] flex items-center gap-1.5"
            >
              <span>Discover All Tours</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exploreMore.slice(0, 6).map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Why Choose Us */}
      <WhyChooseUs />

      {/* 8. Genuine Traveler Reviews */}
      <ReviewsSection />
    </div>
  );
}
