import React from "react";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-[#fbfaf8] px-4 py-20">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#e8e3d8] travel-card-shadow text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#124e3f]/10 text-[#124e3f] flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-[#124e3f]">
            404 — Expedition Not Found
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1c2421]">
            Lost Off the Trail?
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            The expedition or itinerary you are seeking does not exist, has been concluded, or the path has changed.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/tours"
            className="px-6 py-3 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span>Browse Expeditions</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-[#f4efe6] hover:bg-[#ede6da] text-[#1c2421] rounded-xl text-xs font-semibold flex items-center justify-center transition-all border border-[#e8e3d8]"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
