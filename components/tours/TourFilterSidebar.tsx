"use client";

import React from "react";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";

interface TourFilterSidebarProps {
  search: string;
  setSearch: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  difficulty: string;
  setDifficulty: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "adventure", label: "Alpine & Trekking" },
  { id: "cultural", label: "Cultural Heritage" },
  { id: "wildlife", label: "Wildlife Safari" },
  { id: "nature", label: "Nature & Lakes" },
  { id: "getaway", label: "Weekend Escapes" },
];

const DIFFICULTIES = [
  { id: "all", label: "All Difficulties" },
  { id: "easy", label: "Easy (Gentle walks)" },
  { id: "medium", label: "Medium (Active hiking)" },
  { id: "difficult", label: "Difficult (Expedition)" },
];

const DURATIONS = [
  { id: "all", label: "Any Length" },
  { id: "1-3", label: "Short (1–3 Days)" },
  { id: "4-7", label: "Standard (4–7 Days)" },
  { id: "8+", label: "Extended (8+ Days)" },
];

export default function TourFilterSidebar({
  search,
  setSearch,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  duration,
  setDuration,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sort,
  setSort,
  onClearFilters,
  hasActiveFilters,
}: TourFilterSidebarProps) {
  return (
    <aside className="bg-white rounded-2xl p-6 border border-[#e8e3d8] travel-card-shadow space-y-6">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#f0ece3]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#124e3f]" />
          <h2 className="font-serif text-lg font-bold text-[#1c2421]">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-xs text-[#d97706] hover:text-[#b45309] font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Keyword Search */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Search Tours
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Destination, country, or title..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#124e3f]"
          />
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Sort By
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full py-2 px-3 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
        >
          <option value="newest">Featured & Newest</option>
          <option value="rating">Highest Rated</option>
          <option value="popular">Most Popular</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Expedition Category
        </label>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === cat.id
                  ? "bg-[#124e3f] text-white"
                  : "text-stone-700 hover:bg-[#f4efe6]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Difficulty Level
        </label>
        <div className="space-y-1.5">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff.id}
              onClick={() => setDifficulty(diff.id)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                difficulty === diff.id
                  ? "bg-[#124e3f] text-white"
                  : "text-stone-700 hover:bg-[#f4efe6]"
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Trip Duration
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {DURATIONS.map((dur) => (
            <button
              key={dur.id}
              onClick={() => setDuration(dur.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-center border transition-all ${
                duration === dur.id
                  ? "bg-[#124e3f] text-white border-[#124e3f]"
                  : "bg-[#fbfaf8] text-stone-700 border-[#e8e3d8] hover:bg-[#f4efe6]"
              }`}
            >
              {dur.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Price Range (USD)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="10000"
            step="100"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min $"
            className="w-1/2 px-2.5 py-1.5 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#124e3f]"
          />
          <span className="text-stone-400 text-xs">–</span>
          <input
            type="number"
            min="0"
            max="10000"
            step="100"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max $"
            className="w-1/2 px-2.5 py-1.5 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#124e3f]"
          />
        </div>
      </div>
    </aside>
  );
}
