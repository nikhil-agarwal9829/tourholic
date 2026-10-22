"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Tour } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ShieldCheck,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Clock,
  HelpCircle,
} from "lucide-react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const slugParam = searchParams.get("slug");
  const tourIdParam = searchParams.get("tourId");
  const idParam = searchParams.get("id");
  const tourIdentifier = slugParam || tourIdParam || idParam || "";
  const departureDate = searchParams.get("date") || "2026-06-15";
  const travelersCount = Number(searchParams.get("travelers")) || 2;

  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<"not_found" | "server_error" | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<{
    bookingReference: string;
    tourName: string;
    departureDate: string;
    travelers: number;
    totalPrice: number;
    currency: string;
    bookingStatus: string;
    paymentStatus: string;
    paymentDueAt: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      setGuestName(user.name || "");
      setGuestEmail(user.email || "");
    }
  }, [user]);

  const loadTour = () => {
    setIsLoading(true);
    setErrorType(null);
    setErrorDetails("");

    if (tourIdentifier) {
      fetch(`/api/tours/${encodeURIComponent(tourIdentifier)}`)
        .then(async (res) => {
          if (res.status === 404) {
            setErrorType("not_found");
            setTour(null);
            return;
          }
          if (!res.ok) {
            setErrorType("server_error");
            setErrorDetails("Unable to retrieve tour details from the server.");
            setTour(null);
            return;
          }
          const data = await res.json();
          if (data?.status === "success" && data.data?.tour) {
            setTour(data.data.tour);
          } else {
            setErrorType("not_found");
            setTour(null);
          }
        })
        .catch((err) => {
          console.error("Error fetching tour for checkout:", err);
          setErrorType("server_error");
          setErrorDetails("Network connectivity issue. Please check your internet connection and try again.");
          setTour(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      fetch(`/api/tours?limit=1`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.[0]) {
            setTour(data.data[0]);
          } else {
            setErrorType("not_found");
            setTour(null);
          }
        })
        .catch((err) => {
          console.error("Error fetching fallback tour:", err);
          setErrorType("server_error");
          setTour(null);
        })
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    loadTour();
  }, [tourIdentifier]);

  // Open confirmation modal
  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!user) {
      setErrorMessage("Please sign in to complete your expedition booking.");
      return;
    }

    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMessage("Please provide traveler full name and a valid email.");
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute actual booking submission after user confirms modal
  const handleExecuteBooking = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour?._id || tourIdentifier,
          departureDate,
          travelers: travelersCount,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          specialRequests,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setShowConfirmModal(false);
        setErrorMessage(data.message || "Failed to confirm expedition booking.");
        return;
      }

      setShowConfirmModal(false);
      setBookingConfirmed({
        bookingReference: data.data.bookingReference,
        tourName: tour?.name || "Expedition",
        departureDate,
        travelers: data.data.travelers,
        totalPrice: data.data.totalPrice,
        currency: data.data.currency || tour?.currency || "USD",
        bookingStatus: data.data.bookingStatus || "confirmed",
        paymentStatus: data.data.paymentStatus || "unpaid",
        paymentDueAt: data.data.paymentDueAt,
      });
    } catch {
      setShowConfirmModal(false);
      setErrorMessage("Network error while creating reservation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen py-24 text-center text-stone-500 text-sm">
        Verifying itinerary and reservation rates...
      </div>
    );
  }

  if (errorType === "server_error") {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#1c2421]">Unable to Retrieve Expedition</h2>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          {errorDetails || "We encountered a temporary connection issue while retrieving this itinerary."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={loadTour}
            className="px-5 py-2.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Retry Expedition Lookup
          </button>
          <Link
            href="/tours"
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Browse Expeditions
          </Link>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#1c2421]">Expedition Not Found</h2>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          The requested tour does not exist, has been archived, or the link is invalid. Please select a valid tour from our exploration directory.
        </p>
        <Link
          href="/tours"
          className="inline-block px-5 py-2.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Browse Expeditions
        </Link>
      </div>
    );
  }

  const totalPrice = tour.price * travelersCount;

  // View: Booking Confirmed Success Screen
  if (bookingConfirmed) {
    const formattedDeadline = bookingConfirmed.paymentDueAt
      ? new Date(bookingConfirmed.paymentDueAt).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Within 3 days of booking";

    return (
      <div className="bg-[#fbfaf8] min-h-screen py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#e8e3d8] travel-card-shadow text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
                Booking Confirmed!
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#1c2421] mt-1">
                Your Adventure Awaits!
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-2">
                Your reservation has been created successfully. Payment is currently pending.
              </p>
            </div>

            {/* Reference & Status Card */}
            <div className="bg-[#f4efe6] p-6 rounded-2xl border border-[#e2dcce] text-left space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[#e2dcce]">
                <span className="text-stone-500 uppercase tracking-wider font-semibold">Booking Reference</span>
                <span className="font-mono font-bold text-sm text-[#124e3f] bg-white px-2.5 py-1 rounded border border-[#e8e3d8]">
                  {bookingConfirmed.bookingReference}
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-700">
                <span>Expedition Tour:</span>
                <span className="font-semibold text-right">{bookingConfirmed.tourName}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-700">
                <span>Departure Date:</span>
                <span className="font-semibold">
                  {new Date(bookingConfirmed.departureDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-700">
                <span>Guest Count:</span>
                <span className="font-semibold">{bookingConfirmed.travelers} Guests</span>
              </div>
              <div className="flex justify-between text-xs text-stone-700">
                <span>Total Amount:</span>
                <span className="font-bold text-[#124e3f] text-sm">
                  {formatPrice(bookingConfirmed.totalPrice, bookingConfirmed.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-[#e2dcce]">
                <span>Booking Status:</span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
                  Confirmed
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Payment Status:</span>
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
                  Unpaid
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 text-stone-600 border-t border-[#e2dcce]">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#124e3f]" />
                  Payment Deadline:
                </span>
                <span className="font-semibold text-[#124e3f]">{formattedDeadline}</span>
              </div>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
              Seats have been officially locked in our reservation registry. An expedition invoice has been issued. You can inspect or manage your booking anytime under My Bookings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/my-bookings"
                className="flex-1 py-3.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-bold text-center transition-colors shadow-sm"
              >
                View My Booking
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

        {/* Authentication Notice if not signed in */}
        {!user && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-bold">Authentication Required to Book</p>
                <p className="text-[11px] text-amber-700">
                  Please log in with your explorer account or register before reserving departures.
                </p>
              </div>
            </div>
            <Link
              href={`/login?redirect=${encodeURIComponent(
                `/checkout?slug=${tour.slug || ""}&tourId=${tour._id || ""}&date=${departureDate}&travelers=${travelersCount}`
              )}`}
              className="px-4 py-2 bg-[#124e3f] text-white rounded-xl text-xs font-semibold hover:bg-[#0c382d] text-center shrink-0"
            >
              Sign In to Book
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Guest Info & Payment Form */}
          <div className="lg:col-span-7 space-y-8">
            <form
              onSubmit={handleOpenConfirmModal}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e8e3d8] travel-card-shadow space-y-6"
            >
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

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                    Special Requests or Dietary Requirements (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Vegetarian meals, twin beds..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                  />
                </div>
              </div>

              <h2 className="font-serif text-xl font-bold text-[#1c2421] border-b border-[#f0ece3] pb-3 pt-4">
                2. Payment & Reservation Policy
              </h2>

              <div className="p-4 rounded-xl border border-[#e8e3d8] bg-[#fbfaf8] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <Clock className="w-4 h-4 text-[#124e3f]" />
                  <span>Reserve Now, Pay Pending Concierge Invoice</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Payment is currently pending. Touroholic reserves your seats immediately upon booking. Your booking status will be set to <strong className="text-stone-800">Confirmed</strong> and payment status to <strong className="text-stone-800">Unpaid</strong>. A payment window of 3 days applies before departure.
                </p>
                <div className="pt-2 text-[11px] text-stone-500 flex items-center gap-1.5 border-t border-[#e8e3d8]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Payment gateway integration is currently in demo/invoice mode.</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!user}
                className="w-full py-4 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Review & Confirm Reservation</span>
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 border border-[#e8e3d8] travel-card-shadow sticky top-28 space-y-6">
              <h3 className="font-serif text-lg font-bold text-[#1c2421]">Expedition Summary</h3>

              {/* Tour Preview */}
              <div className="flex gap-4">
                {tour.imageCover && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                    <Image
                      src={tour.imageCover}
                      alt={tour.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#124e3f] bg-[#f4efe6] px-2 py-0.5 rounded">
                    {tour.category}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-[#1c2421] mt-1 line-clamp-2">
                    {tour.name}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#124e3f]" />
                    <span>
                      {tour.destination}, {tour.country}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reservation Specifics */}
              <div className="space-y-3 pt-3 border-t border-[#f0ece3] text-xs text-stone-600">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#124e3f]" />
                    Departure Date:
                  </span>
                  <span className="font-semibold text-stone-900">
                    {new Date(departureDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#124e3f]" />
                    Travelers:
                  </span>
                  <span className="font-semibold text-stone-900">{travelersCount} Guests</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Price per Guest:</span>
                  <span className="font-semibold text-stone-900">
                    {formatPrice(tour.price, tour.currency)}
                  </span>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-4 border-t border-[#f0ece3]">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block">
                      Total Investment
                    </span>
                    <span className="text-[11px] text-stone-500">Taxes & park fees included</span>
                  </div>
                  <span className="font-serif text-2xl font-bold text-[#124e3f]">
                    {formatPrice(totalPrice, tour.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#124e3f] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#1c2421]">
                  Confirm Your Expedition Booking
                </h3>
                <p className="text-xs text-stone-500">
                  Please review your reservation details before confirming.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              Are you sure you want to book <strong className="text-stone-900">{tour.name}</strong> for{" "}
              <strong className="text-stone-900">{travelersCount} guest(s)</strong> at{" "}
              <strong className="text-[#124e3f]">{formatPrice(totalPrice, tour.currency)}</strong>?
            </p>

            <div className="bg-[#fbfaf8] p-4 rounded-2xl border border-[#e8e3d8] space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Selected Departure Date:</span>
                <span className="font-semibold text-stone-900">
                  {new Date(departureDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Lead Traveler:</span>
                <span className="font-semibold text-stone-900">{guestName}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Contact Email:</span>
                <span className="font-semibold text-stone-900">{guestEmail}</span>
              </div>
              <div className="flex justify-between text-stone-600 pt-2 border-t border-[#e8e3d8]">
                <span>Total Amount:</span>
                <span className="font-bold text-sm text-[#124e3f]">
                  {formatPrice(totalPrice, tour.currency)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Initial Payment Status:</span>
                <span className="font-bold text-amber-700">Unpaid (Payment Pending)</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                No, Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteBooking}
                className="flex-1 py-3 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Yes, Book Tour</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-24 text-center text-stone-500 text-sm">
          Loading checkout session...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
