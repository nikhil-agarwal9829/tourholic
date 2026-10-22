"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  MapPin,
  Globe,
  Tag,
  DollarSign,
  Calendar,
  Clock,
  X,
  Check,
  Navigation,
  Loader2,
  Sparkles,
} from "lucide-react";
import { TravelPreferences } from "@/types";

interface PlanExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPreferences?: TravelPreferences;
  onSaved?: (updated: TravelPreferences) => void;
}

const POPULAR_INDIAN_DESTINATIONS = [
  "Mumbai",
  "New Delhi",
  "Kashmir",
  "Varkala",
  "Kerala Backwaters",
  "Goa",
  "Jaipur",
  "Agra",
  "Rishikesh",
  "Manali",
  "Varanasi",
  "Darjeeling",
];

const POPULAR_COUNTRIES = ["India", "Italy", "Canada", "Japan", "Tanzania", "Peru"];

const CATEGORIES = [
  { id: "adventure", label: "Adventure" },
  { id: "cultural", label: "Cultural" },
  { id: "nature", label: "Nature" },
  { id: "wildlife", label: "Wildlife" },
  { id: "beach", label: "Beach" },
  { id: "spiritual", label: "Spiritual" },
  { id: "heritage", label: "Heritage" },
  { id: "relaxation", label: "Relaxation" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PlanExpeditionModal({
  isOpen,
  onClose,
  initialPreferences,
  onSaved,
}: PlanExpeditionModalProps) {
  const [homeCountry, setHomeCountry] = useState(initialPreferences?.homeCountry || "");
  const [homeCity, setHomeCity] = useState(initialPreferences?.homeCity || "");
  const [destinationScope, setDestinationScope] = useState<"india" | "international" | "both">(
    initialPreferences?.destinationScope || "both"
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialPreferences?.preferredCountries || ["India"]
  );
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    initialPreferences?.preferredDestinations || []
  );
  const [customDestination, setCustomDestination] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialPreferences?.preferredCategories || []
  );
  const [maxBudget, setMaxBudget] = useState<string>(
    initialPreferences?.maxBudget ? String(initialPreferences.maxBudget) : ""
  );
  const [preferredDuration, setPreferredDuration] = useState<string>(
    initialPreferences?.preferredDuration ? String(initialPreferences.preferredDuration) : ""
  );
  const [preferredMonth, setPreferredMonth] = useState<number | undefined>(
    initialPreferences?.preferredTravelMonth
  );

  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialPreferences) {
      setHomeCountry(initialPreferences.homeCountry || "");
      setHomeCity(initialPreferences.homeCity || "");
      setDestinationScope(initialPreferences.destinationScope || "both");
      setSelectedCountries(initialPreferences.preferredCountries || ["India"]);
      setSelectedDestinations(initialPreferences.preferredDestinations || []);
      setSelectedCategories(initialPreferences.preferredCategories || []);
      setMaxBudget(initialPreferences.maxBudget ? String(initialPreferences.maxBudget) : "");
      setPreferredDuration(
        initialPreferences.preferredDuration ? String(initialPreferences.preferredDuration) : ""
      );
      setPreferredMonth(initialPreferences.preferredTravelMonth);
    }
  }, [initialPreferences]);

  if (!isOpen) return null;

  // Toggle selection helpers
  const toggleDestination = (dest: string) => {
    if (selectedDestinations.includes(dest)) {
      setSelectedDestinations(selectedDestinations.filter((d) => d !== dest));
    } else {
      setSelectedDestinations([...selectedDestinations, dest]);
    }
  };

  const addCustomDestination = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = customDestination.trim();
    if (trimmed && !selectedDestinations.includes(trimmed)) {
      setSelectedDestinations([...selectedDestinations, trimmed]);
      setCustomDestination("");
    }
  };

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter((c) => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  // Optional browser geolocation helper (strictly on explicit click with clear explanation)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser. Please type your city manually.");
      return;
    }
    setIsLocating(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // Reverse geocode via free client-side OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.municipality ||
              data.address?.state_district ||
              "";
            const country = data.address?.country || "";
            if (city) setHomeCity(city);
            if (country) setHomeCountry(country);
          }
        } catch {
          // Graceful fallback: do nothing, user can type manually
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setErrorMsg("Location access was denied or unavailable. Please type your city manually.");
      },
      { timeout: 8000 }
    );
  };

  const handleSave = async (skip: boolean = false) => {
    setIsSaving(true);
    setErrorMsg("");

    const payload: TravelPreferences = skip
      ? {
          ...initialPreferences,
          onboardingCompleted: true,
        }
      : {
          homeCountry: homeCountry.trim() || undefined,
          homeCity: homeCity.trim() || undefined,
          preferredCountries: selectedCountries,
          preferredDestinations: selectedDestinations,
          preferredCategories: selectedCategories,
          destinationScope,
          minBudget: undefined,
          maxBudget: maxBudget ? Number(maxBudget) : undefined,
          preferredDuration: preferredDuration ? Number(preferredDuration) : undefined,
          preferredTravelMonth: preferredMonth,
          onboardingCompleted: true,
        };

    try {
      const res = await fetch("/api/users/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save preferences");
      }

      const resData = await res.json();
      if (onSaved) onSaved(resData.data?.travelPreferences || payload);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#e8e3d8] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#124e3f] text-white p-6 sm:p-8 relative">
          <button
            onClick={() => handleSave(true)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="Skip for now"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold uppercase tracking-wider text-emerald-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Recommendation Engine</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
            Plan Your Next Expedition
          </h2>
          <p className="text-xs sm:text-sm text-stone-200 mt-2 max-w-xl">
            Tell us about your travel dreams. We will tailor deterministic, rule-based recommendations
            across India and the world—no artificial intelligence, just pure bespoke curation.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-7 max-h-[68vh] overflow-y-auto text-stone-800">
          {errorMsg && (
            <div className="p-3 rounded-xl text-xs bg-rose-50 text-rose-800 border border-rose-200">
              {errorMsg}
            </div>
          )}

          {/* Section A: Current Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#124e3f]" />
                <span>1. Where do you currently live?</span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="text-[11px] font-semibold text-[#124e3f] hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                <span>Auto-detect city</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              Your home location is kept separate from where you wish to travel.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Home Country (e.g., India, USA)"
                value={homeCountry}
                onChange={(e) => setHomeCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl focus:outline-none focus:border-[#124e3f]"
              />
              <input
                type="text"
                placeholder="Home City (e.g., Mumbai, New York)"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl focus:outline-none focus:border-[#124e3f]"
              />
            </div>
          </div>

          {/* Section B: Travel Scope & Desired Destinations */}
          <div className="space-y-3 pt-3 border-t border-[#f0ece3]">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#124e3f]" />
              <span>2. Where would you like to explore?</span>
            </label>

            {/* Scope selector */}
            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              {[
                { id: "india", label: "Explore India" },
                { id: "international", label: "International" },
                { id: "both", label: "Both (Anywhere)" },
              ].map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setDestinationScope(scope.id as "india" | "international" | "both")}
                  className={`py-2 px-3 rounded-xl border text-center transition-all ${
                    destinationScope === scope.id
                      ? "bg-[#124e3f] text-white border-[#124e3f] shadow-sm font-bold"
                      : "bg-[#fbfaf8] text-stone-700 border-[#e8e3d8] hover:border-stone-400"
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>

            {/* Quick Country selection */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
                Preferred Countries:
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_COUNTRIES.map((country) => {
                  const isSelected = selectedCountries.includes(country);
                  return (
                    <button
                      key={country}
                      type="button"
                      onClick={() => toggleCountry(country)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-300 text-[#124e3f] font-semibold"
                          : "bg-white border-[#e8e3d8] text-stone-600 hover:border-stone-400"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{country}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Popular Destinations / Cities */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
                Quick-select Indian destinations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_INDIAN_DESTINATIONS.map((dest) => {
                  const isSelected = selectedDestinations.includes(dest);
                  return (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => toggleDestination(dest)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                        isSelected
                          ? "bg-[#124e3f] text-white border-[#124e3f] font-semibold shadow-xs"
                          : "bg-white border-[#e8e3d8] text-stone-700 hover:border-[#124e3f]"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                      <span>{dest}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Destination input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add other city, state, or region (press Enter)..."
                value={customDestination}
                onChange={(e) => setCustomDestination(e.target.value)}
                onKeyDown={addCustomDestination}
                className="flex-1 px-3.5 py-2 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl focus:outline-none focus:border-[#124e3f]"
              />
              <button
                type="button"
                onClick={addCustomDestination}
                className="px-3.5 py-2 rounded-xl bg-[#f4efe6] text-xs font-semibold text-stone-800 hover:bg-[#ede6da]"
              >
                Add
              </button>
            </div>

            {selectedDestinations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedDestinations.map((dest) => (
                  <span
                    key={dest}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-medium"
                  >
                    <span>{dest}</span>
                    <button
                      type="button"
                      onClick={() => toggleDestination(dest)}
                      className="hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section C: Optional Category Preferences */}
          <div className="space-y-3 pt-3 border-t border-[#f0ece3]">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#124e3f]" />
              <span>3. Preferred Tour Categories</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-[#124e3f] text-white border-[#124e3f] font-bold shadow-xs"
                        : "bg-white text-stone-700 border-[#e8e3d8] hover:border-stone-400"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section D: Optional Budget, Duration, Travel Month */}
          <div className="space-y-3 pt-3 border-t border-[#f0ece3]">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#124e3f]" />
              <span>4. Optional Trip Parameters</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-stone-500 block mb-1">Max Budget (USD):</span>
                <input
                  type="number"
                  placeholder="e.g. 800"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl focus:outline-none focus:border-[#124e3f]"
                />
              </div>

              <div>
                <span className="text-[11px] text-stone-500 block mb-1">
                  Ideal Duration (Days):
                </span>
                <input
                  type="number"
                  placeholder="e.g. 4"
                  value={preferredDuration}
                  onChange={(e) => setPreferredDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl focus:outline-none focus:border-[#124e3f]"
                />
              </div>

              <div>
                <span className="text-[11px] text-stone-500 block mb-1">Travel Month:</span>
                <select
                  value={preferredMonth || ""}
                  onChange={(e) =>
                    setPreferredMonth(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-2 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl focus:outline-none focus:border-[#124e3f]"
                >
                  <option value="">Any Month</option>
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#fbfaf8] p-5 sm:p-6 border-t border-[#e8e3d8] flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors"
          >
            Skip for Now
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="w-full sm:w-auto px-7 py-3 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <span>Save & Discover Journeys</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
