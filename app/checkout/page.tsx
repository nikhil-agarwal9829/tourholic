"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Tour } from "@/types";
import {
  ShieldCheck,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tourId = searchParams.get("tourId") || "";
  const departureDate = searchParams.get("date") || "2026-06-15";
  const travelersCount = Number(searchParams.get("travelers")) || 2;

  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentChoice, setPaymentChoice] = useState("pay_later");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<{
    bookingReference: string;
    totalPrice: number;
    travelers: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Check if user is logged in to pre-fill name and email
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setGuestName(data.user.name || "");
          setGuestEmail(data.user.email || "");
        }
      })
      .catch(() => {});

    // Fetch tour info
    if (tourId) {
      fetch(`/api/tours/${tourId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.status === "success") {
            setTour(data.data.tour);
          }
        })
        .catch((err) => console.error("Error fetching tour:", err))
        .finally(() => setIsLoading(false));
    } else {
      // Default to sample tour if no id
      fetch(`/api/tours?limit=1`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.[0]) setTour(data.data[0]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [tourId]);

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMessage("Please provide traveler name and contact email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour?._id || tourId,
          departureDate,
          travelers: travelersCount,
          guestName,
          guestEmail,
          paymentMethod: paymentChoice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Failed to process reservation.");
        return;
      }

      setBookingConfirmed({
        bookingReference: data.data.bookingReference,
        totalPrice: data.data.totalPrice,
        travelers: data.data.travelers,
      });
    } catch {
      setErrorMessage("Network error processing your reservation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-24 text-center text-stone-500 text-sm">
        Verifying itinerary and reservation rates...
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold">Expedition Not Found</h2>
        <p className="text-xs text-stone-600">Please choose a tour from our exploration directory.</p>
        <Link
          href="/tours"
          className="inline-block px-5 py-2.5 bg-[#124e3f] text-white rounded-xl text-xs font-semibold"
        >
          Browse Expeditions
        </Link>
      </div>
    );
  }

  const totalPrice = tour.price * travelersCount;

  // Confirmation Success View
  if (bookingConfirmed) {
    return (
      <div className="bg-[#fbfaf8] min-h-screen py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#e8e3d8] travel-card-shadow text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
                Reservation Confirmed
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#1c2421] mt-1">
                Your Adventure Awaits!
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-2">
                We have reserved your spots for <span className="font-semibold text-stone-800">{tour.name}</span>.
              </p>
            </div>

            {/* Reference Box */}
            <div className="bg-[#f4efe6] p-5 rounded-2xl border border-[#e2dcce] text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 uppercase tracking-wider font-semibold">Booking Reference</span>
                <span className="font-mono font-bold text-sm text-[#124e3f] bg-white px-2 py-0.5 rounded border border-[#e8e3d8]">
                  {bookingConfirmed.bookingReference}
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-700 pt-1">
                <span>Departure Date:</span>
                <span className="font-semibold">{new Date(departureDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-700">
                <span>Guests:</span>
                <span className="font-semibold">{bookingConfirmed.travelers} Travelers</span>
              </div>
              <div className="flex justify-between text-xs text-stone-700">
                <span>Total Amount:</span>
                <span className="font-semibold">{formatPrice(bookingConfirmed.totalPrice, tour.currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-700">
                <span>Status:</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Confirmed (Unpaid / Demo Reservation)
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
              A copy of your expedition itinerary and meeting coordinates has been prepared. You can inspect or cancel your booking at any time under My Bookings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/my-bookings"
                className="flex-1 py-3.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-bold text-center transition-colors shadow-sm"
              >
                Go to My Bookings
              </Link>
              <Link
                href="/tours"
                className="flex-1 py-3.5 bg-[#f4efe6] hover:bg-[#ede6da] text-[#1c2421] rounded-xl text-xs font-bold text-center transition-colors border border-[#e8e3d8]"
              >
                Discover More Tours
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfaf8] min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Link
            href={`/tours/${tour.slug}`}
            className="text-xs font-semibold text-[#124e3f] hover:underline uppercase tracking-wider"
          >
            ← Return to Tour Details
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421] mt-2">
            Confirm Your Reservation
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Review your itinerary details and register guest information below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Guest Info & Payment Form */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handleConfirmReservation} className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e8e3d8] travel-card-shadow space-y-6">
              <h2 className="font-serif text-xl font-bold text-[#1c2421] border-b border-[#f0ece3] pb-3">
                1. Lead Traveler Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                    Full Name (as on Passport/ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Marcus Thorne"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                    Email Address (for confirmation & vouchers)
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="e.g. marcus@example.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                  />
                </div>
              </div>

              <h2 className="font-serif text-xl font-bold text-[#1c2421] border-b border-[#f0ece3] pb-3 pt-4">
                2. Payment & Reservation Policy
              </h2>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-[#124e3f] bg-emerald-50/40 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="pay_later"
                    checked={paymentChoice === "pay_later"}
                    onChange={() => setPaymentChoice("pay_later")}
                    className="mt-1 text-[#124e3f] focus:ring-[#124e3f]"
                  />
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-stone-900 block">
                      Pay Later / Guaranteed Demo Reservation
                    </span>
                    <span className="text-xs text-stone-600 block mt-0.5 leading-relaxed">
                      Lock in your departure date and seats today without charging a card. You can pay via wire transfer or concierge invoice prior to expedition departure.
                    </span>
                  </div>
                </label>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isSubmitting ? "Securing Reservation..." : "Confirm My Reservation"}</span>
              </button>

              <p className="text-[11px] text-stone-400 text-center leading-relaxed">
                By confirming, you agree to Touroholic&apos;s small-group terms and safety regulations. You will not be charged upfront.
              </p>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e8e3d8] travel-card-shadow space-y-6">
              <h2 className="font-serif text-lg font-bold text-[#1c2421] border-b border-[#f0ece3] pb-3">
                Expedition Summary
              </h2>

              {/* Tour Thumb */}
              <div className="flex gap-4">
                <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                  <Image
                    src={tour.imageCover}
                    alt={tour.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {tour.category}
                  </span>
                  <h3 className="font-serif text-sm font-bold text-[#1c2421] line-clamp-2">
                    {tour.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500">
                    <MapPin className="w-3 h-3 text-[#124e3f]" />
                    <span>{tour.destination}, {tour.country}</span>
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="space-y-2 py-3 border-y border-[#f0ece3] text-xs text-stone-600">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#124e3f]" />
                    Departure Date:
                  </span>
                  <span className="font-semibold text-stone-800">
                    {new Date(departureDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#124e3f]" />
                    Travelers:
                  </span>
                  <span className="font-semibold text-stone-800">{travelersCount} Guests</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>{formatPrice(tour.price, tour.currency)} × {travelersCount}</span>
                  <span className="font-semibold">{formatPrice(totalPrice, tour.currency)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Permits & National Park Pass</span>
                  <span className="text-emerald-700 font-medium">Included</span>
                </div>
                <div className="flex justify-between text-stone-800 font-bold pt-3 border-t border-[#f0ece3] text-base">
                  <span>Total Amount</span>
                  <span className="text-[#124e3f]">{formatPrice(totalPrice, tour.currency)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f4efe6] text-[11px] text-stone-700 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#124e3f]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Flexibility Guarantee</span>
                </div>
                <p>{tour.cancellationPolicy}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-24 text-center text-stone-500 text-sm">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
