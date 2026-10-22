"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users, DollarSign, ArrowRight } from "lucide-react";

export default function HeroSection() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("all");
  const [budget, setBudget] = useState("");
  const [travelers, setTravelers] = useState("2");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("destination", destination.trim());
    if (category !== "all") params.set("category", category);
    if (budget.trim()) params.set("maxPrice", budget.trim());
    router.push(`/tours?${params.toString()}`);
  };

  return (
    <div className="relative min-h-[640px] lg:min-h-[720px] flex items-center justify-center overflow-hidden">
      {/* Background Photography with Editorial Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85"
          alt="Majestic mountain peaks in morning mist"
          fill
          priority
          sizes="100vw"
          className="object-cover brightness-[0.75]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#122822]/90 via-[#122822]/40 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-28">
        {/* Curated Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-widest mb-6 animate-in fade-in zoom-in duration-500">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Curated Small-Group Expeditions</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-white tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
          Wander where the <br className="hidden sm:inline" />
          <span className="italic font-light text-amber-200">wild winds</span> roam.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-200 font-light leading-relaxed mb-12">
          Discover handpicked expeditions across Banff, Patagonia, Serengeti, and Amalfi. 
          Experienced local guides, boutique eco-lodges, and memories that linger forever.
        </p>

        {/* Search Panel Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/30 text-left max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Field 1: Destination */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#124e3f]" />
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where to? (e.g. Banff, Italy)"
                className="w-full text-xs sm:text-sm font-medium text-stone-800 bg-transparent placeholder-stone-400 focus:outline-none border-b border-stone-200 pb-1 focus:border-[#124e3f]"
              />
            </div>

            {/* Field 2: Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#124e3f]" />
                Expedition Style
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium text-stone-800 bg-transparent focus:outline-none border-b border-stone-200 pb-1 focus:border-[#124e3f]"
              >
                <option value="all">All Styles</option>
                <option value="adventure">Alpine Adventure</option>
                <option value="cultural">Cultural Heritage</option>
                <option value="wildlife">Wildlife Safari</option>
                <option value="nature">Nature Sanctuary</option>
                <option value="getaway">Weekend Getaway</option>
              </select>
            </div>

            {/* Field 3: Budget */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#124e3f]" />
                Max Budget
              </label>
              <input
                type="number"
                min="500"
                step="250"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Up to $2,500"
                className="w-full text-xs sm:text-sm font-medium text-stone-800 bg-transparent placeholder-stone-400 focus:outline-none border-b border-stone-200 pb-1 focus:border-[#124e3f]"
              />
            </div>

            {/* Field 4: Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-11 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Search Expeditions</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
