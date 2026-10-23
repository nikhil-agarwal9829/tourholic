"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import ImageUploader from "@/components/admin/ImageUploader";
import {
  Compass,
  Users,
  Calendar,
  DollarSign,
  PlusCircle,
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Inbox,
  Lock,
} from "lucide-react";

interface AdminStats {
  totalTours: number;
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  recentBookings: Array<{
    _id: string;
    bookingReference: string;
    guestName?: string;
    guestEmail?: string;
    tour: { name: string; price: number; currency?: string };
    totalPrice: number;
    currency: string;
    travelers: number;
    departureDate: string;
    bookingStatus: string;
    paymentStatus: string;
    paymentDueAt?: string;
    createdAt: string;
  }>;
  isAdmin: boolean;
}

export default function AdminDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  // New Tour Form State
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("adventure");
  const [difficulty, setDifficulty] = useState("medium");
  const [duration, setDuration] = useState("5");
  const [price, setPrice] = useState("1200");
  const [maxGroupSize, setMaxGroupSize] = useState("10");
  const [imageCover, setImageCover] = useState("");
  const [coverImagePublicId, setCoverImagePublicId] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "cache-control": "no-cache" },
      });
      const data = await res.json();
      if (res.ok && data?.status === "success") {
        setStats(data.data);
      } else {
        setError(data.message || "Failed to load admin statistics.");
      }
    } catch {
      setError("Network error while loading metrics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchStats();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [user, isAuthLoading, fetchStats]);

  /**
   * Validate all form fields and trigger confirmation dialog before publication
   */
  const handleInitiatePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!name.trim() || name.trim().length < 3) {
      setFormFeedback({
        type: "error",
        text: "Expedition title must be at least 3 characters.",
      });
      return;
    }

    if (!destination.trim() || destination.trim().length < 2) {
      setFormFeedback({
        type: "error",
        text: "Destination city or region must be at least 2 characters.",
      });
      return;
    }

    if (!country.trim() || country.trim().length < 2) {
      setFormFeedback({
        type: "error",
        text: "Country must be at least 2 characters.",
      });
      return;
    }

    if (!price || Number(price) <= 0) {
      setFormFeedback({
        type: "error",
        text: "Price must be a valid positive amount.",
      });
      return;
    }

    if (!duration || Number(duration) <= 0) {
      setFormFeedback({
        type: "error",
        text: "Duration must be at least 1 day.",
      });
      return;
    }

    if (isCoverUploading) {
      setFormFeedback({
        type: "error",
        text: "Cover photo is currently uploading to Cloudinary. Please wait a moment for the upload to complete.",
      });
      return;
    }

    if (!imageCover) {
      setFormFeedback({
        type: "error",
        text: "Please upload a cover photo to Cloudinary before publishing this expedition.",
      });
      return;
    }

    if (!summary.trim() || summary.trim().length < 10) {
      setFormFeedback({
        type: "error",
        text: "Summary must be at least 10 characters for catalog discovery.",
      });
      return;
    }

    const effectiveDesc = description.trim() || `Discover the captivating highlights and unique cultural heritage of ${destination.trim()}, ${country.trim()} with our expert guides.`;
    if (effectiveDesc.length < 20) {
      setFormFeedback({
        type: "error",
        text: "Detailed description overview must be at least 20 characters.",
      });
      return;
    }

    // Open confirmation dialog
    setConfirmModalOpen(true);
  };

  /**
   * Execute actual tour creation in MongoDB Atlas after admin confirmation
   */
  const handleConfirmPublish = async () => {
    setIsSubmitting(true);
    setFormFeedback(null);

    const effectiveDesc = description.trim() || `Discover the captivating highlights and unique cultural heritage of ${destination.trim()}, ${country.trim()} with our expert guides.`;

    try {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination: destination.trim(),
          country: country.trim(),
          category,
          difficulty,
          duration: Number(duration),
          price: Number(price),
          maxGroupSize: Number(maxGroupSize),
          imageCover,
          coverImagePublicId: coverImagePublicId || undefined,
          summary: summary.trim(),
          description: effectiveDesc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setConfirmModalOpen(false);
        setFormFeedback({
          type: "error",
          text: data.message || "Failed to create tour in database.",
        });
        return;
      }

      setConfirmModalOpen(false);
      setFormFeedback({
        type: "success",
        text: "Expedition created and published successfully to MongoDB Atlas!",
      });

      // Clear form fields
      setName("");
      setDestination("");
      setCountry("");
      setImageCover("");
      setCoverImagePublicId("");
      setSummary("");
      setDescription("");

      // Immediately refresh dashboard metrics & tour list
      fetchStats();

      // Close modal after brief confirmation display
      setTimeout(() => {
        setCreateModalOpen(false);
        setFormFeedback(null);
      }, 1500);
    } catch {
      setConfirmModalOpen(false);
      setFormFeedback({
        type: "error",
        text: "Network error while saving expedition. Please check your connection and retry.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading state while checking auth
  if (isAuthLoading || (isLoading && !stats && user?.role === "admin")) {
    return (
      <div className="min-h-screen py-24 text-center text-stone-500 text-sm flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#124e3f]/20 border-t-[#124e3f] rounded-full animate-spin" />
        <span>Verifying administrator authorization and computing metrics...</span>
      </div>
    );
  }

  // 2. Unauthorized state for ordinary users or guests
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#fbfaf8] flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#e8e3d8] travel-card-shadow text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1c2421]">
            Administrator Access Required
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            The curator and operations dashboard is restricted to authorized platform administrators. Please sign in with an administrator account to access this page.
          </p>
          <div className="pt-2">
            <Link
              href="/login?redirect=/admin"
              className="inline-block w-full py-3 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Sign In as Administrator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfaf8] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e3d8] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#124e3f] mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Curator & Operations Panel</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c2421]">
              Platform Administration
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats()}
              className="p-2.5 rounded-xl border border-[#e8e3d8] bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Refresh Metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish New Tour</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchStats()}
              className="underline font-bold text-rose-900 text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] travel-card-shadow">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs uppercase tracking-wider font-semibold">Active Expeditions</span>
              <Compass className="w-5 h-5 text-[#124e3f]" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#1c2421] mt-3">
              {stats?.totalTours ?? 0}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Live in discovery catalog</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] travel-card-shadow">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Reservations</span>
              <Calendar className="w-5 h-5 text-[#d97706]" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#1c2421] mt-3">
              {stats?.totalBookings ?? 0}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Across all departure schedules</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] travel-card-shadow">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs uppercase tracking-wider font-semibold">Registered Explorers</span>
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#1c2421] mt-3">
              {stats?.totalUsers ?? 0}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Verified community accounts</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] travel-card-shadow">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs uppercase tracking-wider font-semibold">Gross Booking Value</span>
              <DollarSign className="w-5 h-5 text-[#124e3f]" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#124e3f] mt-3">
              {formatPrice(stats?.totalRevenue ?? 0)}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Total reserved volume (unpaid & paid reservations)
            </span>
          </div>
        </div>

        {/* Recent Reservations Table */}
        <div className="bg-white rounded-2xl border border-[#e8e3d8] travel-card-shadow overflow-hidden">
          <div className="p-6 border-b border-[#f0ece3] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1c2421]">Recent Reservations</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Real bookings recorded in MongoDB Atlas
              </p>
            </div>
            <Link
              href="/tours"
              className="text-xs text-[#124e3f] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Explore Public Catalog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#fbfaf8] border-b border-[#e8e3d8] text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Reference</th>
                  <th className="py-3 px-6">Guest / Traveler</th>
                  <th className="py-3 px-6">Expedition</th>
                  <th className="py-3 px-6">Departure</th>
                  <th className="py-3 px-6">Guests</th>
                  <th className="py-3 px-6">Total Investment</th>
                  <th className="py-3 px-6">Booking Status</th>
                  <th className="py-3 px-6">Payment Status</th>
                  <th className="py-3 px-6">Payment Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece3] text-stone-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-stone-400">
                      Loading latest reservations...
                    </td>
                  </tr>
                ) : !stats?.recentBookings || stats.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-stone-400 space-y-2">
                      <Inbox className="w-8 h-8 mx-auto text-stone-300" />
                      <p className="text-xs font-medium text-stone-600">No reservations recorded yet</p>
                      <p className="text-[11px] text-stone-400">
                        When explorers book expeditions from the catalog, their bookings will appear here in real-time.
                      </p>
                    </td>
                  </tr>
                ) : (
                  stats.recentBookings.map((b) => {
                    const isOverdue =
                      Boolean(b.paymentDueAt) &&
                      b.paymentStatus === "unpaid" &&
                      b.bookingStatus !== "cancelled" &&
                      new Date(b.paymentDueAt as string) < new Date();

                    return (
                      <tr key={b._id} className="hover:bg-[#fbfaf8] transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-[#124e3f]">
                          {b.bookingReference}
                        </td>
                        <td className="py-4 px-6 font-medium text-stone-900">
                          <div>{b.guestName || "Registered Explorer"}</div>
                          {b.guestEmail && (
                            <div className="text-[10px] text-stone-400">{b.guestEmail}</div>
                          )}
                        </td>
                        <td className="py-4 px-6 max-w-xs truncate">
                          {b.tour?.name || "Private Tour"}
                        </td>
                        <td className="py-4 px-6">
                          {new Date(b.departureDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-6">{b.travelers}</td>
                        <td className="py-4 px-6 font-bold text-stone-900">
                          {formatPrice(b.totalPrice, b.currency)}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              b.bookingStatus === "confirmed"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : b.bookingStatus === "cancelled"
                                ? "bg-stone-100 text-stone-600 border border-stone-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {b.bookingStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              b.paymentStatus === "paid"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : isOverdue
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {b.paymentStatus}
                            {isOverdue && " (Overdue)"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-stone-500">
                          {b.paymentDueAt ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              <span>
                                {new Date(b.paymentDueAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Publish New Tour */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-6">
              <div className="flex items-center justify-between border-b border-[#f0ece3] pb-4">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#1c2421]">
                    Publish New Expedition
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Upload photos directly to Cloudinary and save details to MongoDB.
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {formFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                    formFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {formFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{formFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleInitiatePublish} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                    Expedition Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Norwegian Fjords & Glacier Odyssey"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Destination City / Region <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Geirangerfjord"
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Country <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. Norway"
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Category <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    >
                      <option value="adventure">Adventure</option>
                      <option value="cultural">Cultural</option>
                      <option value="nature">Nature</option>
                      <option value="wildlife">Wildlife</option>
                      <option value="getaway">Getaway</option>
                      <option value="beaches">Beaches</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Difficulty <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="difficult">Difficult</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Days <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Price (USD) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    />
                  </div>
                </div>

                {/* Cloudinary Photo Uploader */}
                <ImageUploader
                  required
                  initialUrl={imageCover}
                  initialPublicId={coverImagePublicId}
                  onUploadStart={() => {
                    setIsCoverUploading(true);
                    setFormFeedback(null);
                  }}
                  onUploadError={(err) => {
                    setIsCoverUploading(false);
                    setFormFeedback({ type: "error", text: err });
                  }}
                  onUploadSuccess={({ url, publicId }) => {
                    setIsCoverUploading(false);
                    setImageCover(url);
                    setCoverImagePublicId(publicId);
                    setFormFeedback(null);
                  }}
                />

                <div>
                  <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                    Summary <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Short editorial summary for catalog cards..."
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                  />
                </div>

                <div>
                  <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                    Detailed Itinerary Overview
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive description of the expedition experience (min 20 characters)..."
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                  />
                </div>

                {/* Bottom error feedback if user is scrolled to bottom */}
                {formFeedback && formFeedback.type === "error" && (
                  <div className="p-3.5 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formFeedback.text}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[#f0ece3]">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(false);
                      setFormFeedback(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCoverUploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Uploading Photo...</span>
                      </>
                    ) : (
                      <span>Publish Expedition</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Dialog Modal */}
        {confirmModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e8e3d8] travel-card-shadow space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#124e3f] flex items-center justify-center shrink-0">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1c2421]">
                    Publish This Expedition?
                  </h3>
                  <p className="text-xs text-stone-500">
                    Confirm publication to the public exploration directory.
                  </p>
                </div>
              </div>

              <div className="bg-[#fbfaf8] border border-[#e8e3d8] rounded-2xl p-4 space-y-3 text-xs">
                <p className="text-stone-700 leading-relaxed font-medium">
                  Are you sure you want to publish <span className="font-bold text-[#1c2421]">&ldquo;{name}&rdquo;</span> in <span className="font-bold text-[#1c2421]">{destination}, {country}</span> for <span className="font-bold text-[#124e3f]">${price}</span>?
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f0ece3] text-[11px] text-stone-500">
                  <div>Duration: <span className="font-semibold text-stone-800">{duration} Days</span></div>
                  <div>Category: <span className="font-semibold text-stone-800 capitalize">{category}</span></div>
                  <div>Difficulty: <span className="font-semibold text-stone-800 capitalize">{difficulty}</span></div>
                  <div>Group Size: <span className="font-semibold text-stone-800">Max {maxGroupSize}</span></div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setConfirmModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  No, Go Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmPublish}
                  className="px-5 py-2.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Publishing Tour...</span>
                    </>
                  ) : (
                    <span>Yes, Publish Tour</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
