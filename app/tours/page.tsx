"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TourCard from "@/components/tours/TourCard";
import TourFilterSidebar from "@/components/tours/TourFilterSidebar";
import { Tour } from "@/types";
import { Compass, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

function ToursContent() {
  const searchParams = useSearchParams();

  const [tours, setTours] = useState<Tour[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter States
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "all");
  const [duration, setDuration] = useState(searchParams.get("duration") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [destination] = useState(searchParams.get("destination") || "");

  const hasActiveFilters = Boolean(
    search ||
      (category && category !== "all") ||
      (difficulty && difficulty !== "all") ||
      (duration && duration !== "all") ||
      minPrice ||
      maxPrice ||
      sort !== "newest" ||
      destination
  );

  const handleClearFilters = () => {
    setSearch("");
    setCategory("all");
    setDifficulty("all");
    setDuration("all");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  };

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (category !== "all") query.set("category", category);
    if (difficulty !== "all") query.set("difficulty", difficulty);
    if (duration !== "all") query.set("duration", duration);
    if (minPrice) query.set("minPrice", minPrice);
    if (maxPrice) query.set("maxPrice", maxPrice);
    if (sort) query.set("sort", sort);
    if (destination) query.set("destination", destination);
    query.set("page", page.toString());
    query.set("limit", "9");

    fetch(`/api/tours?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data?.status === "success") {
          setTours(data.data || []);
          setTotal(data.meta?.total || 0);
          setTotalPages(data.meta?.totalPages || 1);
        }
      })
      .catch((err) => console.error("Error loading tours:", err))
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [search, category, difficulty, duration, minPrice, maxPrice, sort, destination, page]);

  return (
    <div className="bg-[#fbfaf8] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-[#e8e3d8] pb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#124e3f] mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Catalog & Discovery</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#1c2421]">
              Explore Expeditions
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-xl">
              Browse our curated collection of active trekking, wildlife safaris, and cultural escapes across the globe.
            </p>
          </div>

          {/* Results count & Mobile filter button */}
          <div className="flex items-center justify-between sm:justify-end gap-4 mt-6 md:mt-0">
            <span className="text-xs text-stone-500 font-medium">
              Showing <span className="font-bold text-[#1c2421]">{total}</span> journeys
            </span>
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e8e3d8] text-xs font-semibold text-stone-800 shadow-sm"
            >
              <Filter className="w-3.5 h-3.5 text-[#124e3f]" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-stone-400">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#f4efe6] text-stone-800 border border-[#e2dcce]">
                &ldquo;{search}&rdquo;
                <button onClick={() => setSearch("")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {category !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#f4efe6] text-stone-800 border border-[#e2dcce]">
                Style: {category}
                <button onClick={() => setCategory("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {difficulty !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#f4efe6] text-stone-800 border border-[#e2dcce]">
                Difficulty: {difficulty}
                <button onClick={() => setDifficulty("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {duration !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#f4efe6] text-stone-800 border border-[#e2dcce]">
                Duration: {duration} days
                <button onClick={() => setDuration("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#f4efe6] text-stone-800 border border-[#e2dcce]">
                Budget: ${minPrice || "0"} – ${maxPrice || "Any"}
                <button onClick={() => { setMinPrice(""); setMaxPrice(""); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-[#d97706] hover:underline font-medium ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main Grid Layout: Sidebar + Tour Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <TourFilterSidebar
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              duration={duration}
              setDuration={setDuration}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              sort={sort}
              setSort={setSort}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Tour Cards Grid */}
          <div className="lg:col-span-3 space-y-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-2xl p-4 border border-[#e8e3d8] space-y-4 animate-pulse h-96"
                  >
                    <div className="aspect-[16/10] bg-stone-200 rounded-xl" />
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                    <div className="h-6 bg-stone-200 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 rounded w-full" />
                    <div className="h-10 bg-stone-100 rounded-xl mt-4" />
                  </div>
                ))}
              </div>
            ) : tours.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#e8e3d8] travel-card-shadow max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#f4efe6] text-[#124e3f] flex items-center justify-center mx-auto mb-4">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1c2421]">No Expeditions Found</h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  We couldn&apos;t find any tours matching your current combination of filters. Try broadening your budget or resetting categories.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-6 px-5 py-2.5 bg-[#124e3f] text-white rounded-xl text-xs font-semibold hover:bg-[#0c382d] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map((tour) => (
                  <TourCard key={tour._id} tour={tour} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-8 border-t border-[#e8e3d8] flex items-center justify-between">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-[#e8e3d8] text-xs font-medium text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <span className="text-xs text-stone-600 font-medium">
                  Page <span className="font-bold text-[#1c2421]">{page}</span> of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-[#e8e3d8] text-xs font-medium text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-sm bg-white h-full overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="font-serif text-lg font-bold">Filter Expeditions</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <TourFilterSidebar
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                duration={duration}
                setDuration={setDuration}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                sort={sort}
                setSort={setSort}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-[#124e3f] text-white rounded-xl text-xs font-bold mt-4"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToursPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-20 text-center text-stone-500 text-sm">
          Loading expeditions...
        </div>
      }
    >
      <ToursContent />
    </Suspense>
  );
}
