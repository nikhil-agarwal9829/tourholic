"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Booking, Tour } from "@/types";
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = () => {
    setIsLoading(true);
    fetch("/api/bookings/my")
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === "success") {
          setBookings(data.data || []);
        }
      })
      .catch((err) => console.error("Error fetching bookings:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancelModalId) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${cancelModalId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b._id === cancelModalId ? { ...b, bookingStatus: "cancelled" } : b))
        );
        setCancelModalId(null);
      }
    } catch (err) {
      console.error("Failed to cancel booking:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-[#fbfaf8] min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-[#e8e3d8] pb-6">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#124e3f]">
            Traveler Dashboard
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421] mt-1">
            My Expeditions & Reservations
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Manage your booked departures, review cancellation conditions, and inspect vouchers.
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-24 text-center text-sm text-stone-500">
            Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#e8e3d8] travel-card-shadow max-w-lg mx-auto space-y-4">
            <Calendar className="w-12 h-12 text-[#124e3f] mx-auto opacity-75" />
            <h3 className="font-serif text-xl font-bold">No Bookings Yet</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              You have no active or past expedition reservations. Choose a destination from our catalog to begin your journey.
            </p>
            <Link
              href="/tours"
              className="inline-block px-5 py-2.5 bg-[#124e3f] text-white rounded-xl text-xs font-semibold hover:bg-[#0c382d] transition-colors"
            >
              Explore Tours
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const tour = booking.tour as Tour;
              const isCancelled = booking.bookingStatus === "cancelled";

              return (
                <div
                  key={booking._id}
                  className={`bg-white rounded-2xl p-6 sm:p-7 border border-[#e8e3d8] travel-card-shadow flex flex-col lg:flex-row justify-between gap-6 transition-all ${
                    isCancelled ? "opacity-60 bg-stone-50" : ""
                  }`}
                >
                  {/* Left: Tour image & core details */}
                  <div className="flex flex-col sm:flex-row gap-5">
                    {tour?.imageCover && (
                      <div className="relative w-full sm:w-44 h-36 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        <Image
                          src={tour.imageCover}
                          alt={tour.name || "Tour Cover"}
                          fill
                          sizes="180px"
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#124e3f] bg-[#f4efe6] px-2.5 py-0.5 rounded border border-[#e2dcce]">
                          {booking.bookingReference}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isCancelled
                              ? "bg-stone-200 text-stone-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {booking.bookingStatus}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {booking.paymentStatus}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1c2421]">
                        {tour?.name || "Private Expedition"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#124e3f]" />
                          <span>
                            {new Date(booking.departureDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#124e3f]" />
                          <span>{booking.travelers} Guests</span>
                        </div>
                        {tour?.duration && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#124e3f]" />
                            <span>{tour.duration} Days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Pricing & Cancellation action */}
                  <div className="flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 lg:border-l border-[#f0ece3] pt-4 lg:pt-0 lg:pl-6 space-y-4 shrink-0 min-w-[200px]">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-stone-400 block lg:text-right">
                        Total Investment
                      </span>
                      <span className="text-2xl font-bold text-[#124e3f] block lg:text-right">
                        {formatPrice(booking.totalPrice, booking.currency)}
                      </span>
                      <span className="text-[11px] text-stone-500 block lg:text-right">
                        ({formatPrice(booking.pricePerTraveler, booking.currency)} / person)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      {tour?.slug && (
                        <Link
                          href={`/tours/${tour.slug}`}
                          className="px-3 py-2 rounded-xl bg-[#f4efe6] hover:bg-[#ede6da] text-[#1c2421] text-xs font-semibold flex items-center gap-1"
                        >
                          <span>Itinerary</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}

                      {!isCancelled && (
                        <button
                          onClick={() => setCancelModalId(booking._id)}
                          className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancelModalId && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Cancel Expedition Booking?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Are you sure you want to cancel this reservation? Your reserved spots will immediately be released back to the departure schedule.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCancelModalId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Keep Reservation
                </button>
                <button
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isCancelling ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
