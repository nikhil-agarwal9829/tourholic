"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Tour, TourDeparture } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Calendar, Users, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";

interface TourBookingWidgetProps {
  tour: Tour;
  departures: TourDeparture[];
}

export default function TourBookingWidget({ tour, departures }: TourBookingWidgetProps) {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string>(
    departures[0]?.startDate || "2026-06-15"
  );
  const [travelers, setTravelers] = useState<number>(2);

  const selectedDeparture = departures.find((d) => d.startDate === selectedDate);
  const remainingSeats = selectedDeparture
    ? selectedDeparture.capacity - selectedDeparture.reservedSeats
    : tour.maxGroupSize;

  const totalPrice = tour.price * travelers;

  const handleBookNow = () => {
    const params = new URLSearchParams({
      tourId: tour._id,
      date: selectedDate,
      travelers: travelers.toString(),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#e8e3d8] travel-card-shadow space-y-6">
      {/* Price Header */}
      <div className="flex items-baseline justify-between border-b border-[#f0ece3] pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">
            Guaranteed Rate
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl font-bold text-[#124e3f]">
              {formatPrice(tour.price, tour.currency)}
            </span>
            <span className="text-xs text-stone-500">/ person</span>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          All Fees Included
        </span>
      </div>

      {/* Date Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#124e3f]" />
            Departure Date
          </span>
          {selectedDeparture && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                remainingSeats <= 3
                  ? "bg-rose-50 text-rose-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {remainingSeats} spots left
            </span>
          )}
        </label>

        {departures.length > 0 ? (
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full py-2.5 px-3 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
          >
            {departures.map((d) => {
              const spots = d.capacity - d.reservedSeats;
              return (
                <option key={d._id} value={d.startDate} disabled={spots <= 0}>
                  {new Date(d.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  – {d.status === "sold_out" ? "Sold Out" : `${spots} spots`}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full py-2.5 px-3 text-xs bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
          />
        )}
      </div>

      {/* Travelers Counter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#124e3f]" />
          Number of Travelers
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center justify-between bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl p-1.5">
            <button
              onClick={() => setTravelers((prev) => Math.max(1, prev - 1))}
              disabled={travelers <= 1}
              className="w-8 h-8 rounded-lg bg-white border border-[#e8e3d8] text-stone-700 font-bold flex items-center justify-center hover:bg-stone-50 disabled:opacity-40"
            >
              -
            </button>
            <span className="text-sm font-bold text-stone-800">
              {travelers} {travelers === 1 ? "Traveler" : "Travelers"}
            </span>
            <button
              onClick={() => setTravelers((prev) => Math.min(Math.min(remainingSeats, 12), prev + 1))}
              disabled={travelers >= remainingSeats}
              className="w-8 h-8 rounded-lg bg-white border border-[#e8e3d8] text-stone-700 font-bold flex items-center justify-center hover:bg-stone-50 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Price Breakdown Calculation */}
      <div className="space-y-2 pt-4 border-t border-[#f0ece3] text-xs">
        <div className="flex justify-between text-stone-600">
          <span>
            {formatPrice(tour.price, tour.currency)} × {travelers} travelers
          </span>
          <span className="font-semibold">{formatPrice(totalPrice, tour.currency)}</span>
        </div>
        <div className="flex justify-between text-stone-600">
          <span>Permits & Lodge Taxes</span>
          <span className="text-emerald-700 font-medium">Included</span>
        </div>
        <div className="flex justify-between text-stone-800 font-bold pt-2 border-t border-[#f0ece3] text-sm">
          <span>Total Investment</span>
          <span className="text-base text-[#124e3f]">{formatPrice(totalPrice, tour.currency)}</span>
        </div>
      </div>

      {/* Reserve Button */}
      <button
        onClick={handleBookNow}
        disabled={remainingSeats <= 0}
        className="w-full py-3.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:bg-stone-300 disabled:cursor-not-allowed"
      >
        <span>Reserve Your Spot</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Trust Badges */}
      <div className="space-y-2 pt-2 text-[11px] text-stone-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pay later or confirm demo reservation without upfront payment</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{tour.cancellationPolicy}</span>
        </div>
      </div>
    </div>
  );
}
