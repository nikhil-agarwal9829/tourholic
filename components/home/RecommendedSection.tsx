"use client";

import React, { useState } from "react";
import TourCard from "@/components/tours/TourCard";
import PlanExpeditionModal from "@/components/preferences/PlanExpeditionModal";
import { Sparkles, SlidersHorizontal, MapPin, Compass } from "lucide-react";
import { RecommendationResult, TravelPreferences } from "@/types";
import { useRouter } from "next/navigation";

interface RecommendedSectionProps {
  initialRecommendations: RecommendationResult[];
  hasPreferences: boolean;
  initialPreferences?: TravelPreferences;
  targetDestinationMessage?: string;
}

export default function RecommendedSection({
  initialRecommendations,
  hasPreferences,
  initialPreferences,
  targetDestinationMessage,
}: RecommendedSectionProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>(initialRecommendations);
  const [preferences, setPreferences] = useState<TravelPreferences | undefined>(initialPreferences);
  const [destMessage, setDestMessage] = useState<string | undefined>(targetDestinationMessage);

  const handlePreferencesSaved = async (updated: TravelPreferences) => {
    setPreferences(updated);
    try {
      const res = await fetch("/api/recommendations");
      if (res.ok) {
        const data = await res.json();
        if (data.data?.personalized) {
          setRecommendations(data.data.personalized);
          setDestMessage(data.data.targetDestinationMessage);
        }
      }
    } catch {
      // fallback
    }
    router.refresh();
  };

  return (
    <section className="py-20 bg-[#fbfaf8] border-t border-[#e8e3d8]" id="recommended-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#d97706] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deterministic Rule-Based Recommendations</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421]">
              Recommended for You
            </h2>
            <p className="text-xs text-stone-500 max-w-xl mt-2 leading-relaxed">
              Curated using your explicit destination preferences, travel categories, budget parameters,
              and real traveler ratings—no black-box AI or fabricated algorithms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e8e3d8] hover:border-[#124e3f] text-xs font-bold text-[#124e3f] shadow-xs transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{hasPreferences ? "Adjust Preferences" : "Set Travel Preferences"}</span>
            </button>
          </div>
        </div>

        {/* Active Preference Badges (if any) */}
        {hasPreferences && preferences && (
          <div className="p-3.5 rounded-2xl bg-white border border-[#e8e3d8] flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-stone-500 text-[11px] uppercase tracking-wider">
              Target Filters:
            </span>
            {preferences.preferredDestinations?.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium"
              >
                <MapPin className="w-3 h-3 text-[#124e3f]" />
                <span>{d}</span>
              </span>
            ))}
            {preferences.preferredCountries?.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 font-medium"
              >
                {c}
              </span>
            ))}
            {preferences.preferredCategories?.map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-full bg-[#f4efe6] text-[#854d0e] font-medium capitalize"
              >
                {cat}
              </span>
            ))}
            {preferences.maxBudget && (
              <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-medium">
                ≤ ${preferences.maxBudget}
              </span>
            )}
          </div>
        )}

        {/* Honest Destination Fallback Message */}
        {destMessage && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 shrink-0 text-amber-700" />
              <span>{destMessage}</span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="underline font-semibold hover:text-amber-950 shrink-0"
            >
              Change Destination
            </button>
          </div>
        )}

        {/* Tours Grid */}
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map(({ tour, reasons }) => (
              <TourCard key={tour._id} tour={tour} reason={reasons[0]} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-3xl bg-white border border-[#e8e3d8] space-y-3">
            <Compass className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800">
              No matching tours found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              We could not find any expeditions matching your current criteria. Try expanding your budget,
              broadening categories, or picking other regions.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-5 py-2 rounded-xl bg-[#124e3f] text-white text-xs font-bold"
            >
              Update Preferences
            </button>
          </div>
        )}
      </div>

      <PlanExpeditionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialPreferences={preferences}
        onSaved={handlePreferencesSaved}
      />
    </section>
  );
}
