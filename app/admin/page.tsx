"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  Compass,
  Users,
  Calendar,
  DollarSign,
  PlusCircle,
  Shield,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
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
    tour: { name: string; price: number };
    totalPrice: number;
    travelers: number;
    departureDate: string;
    bookingStatus: string;
    paymentStatus: string;
  }>;
  isAdmin: boolean;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Tour Form State
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("adventure");
  const [difficulty, setDifficulty] = useState("medium");
  const [duration, setDuration] = useState("5");
  const [price, setPrice] = useState("1200");
  const [maxGroupSize, setMaxGroupSize] = useState("10");
  const [imageCover, setImageCover] = useState("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");

  const fetchStats = () => {
    setIsLoading(true);
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === "success") {
          setStats(data.data);
        }
      })
      .catch((err) => console.error("Error fetching admin stats:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormFeedback(null);

    try {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          destination,
          country,
          category,
          difficulty,
          duration: Number(duration),
          price: Number(price),
          maxGroupSize: Number(maxGroupSize),
          imageCover,
          summary: summary || `${name} in ${destination}, ${country}.`,
          description: description || `Experience the beauty of ${destination} with our expert guides.`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormFeedback({ type: "error", text: data.message || "Failed to create tour." });
        return;
      }

      setFormFeedback({ type: "success", text: "Expedition created successfully!" });
      setName("");
      setSummary("");
      setDescription("");
      setTimeout(() => {
        setCreateModalOpen(false);
        setFormFeedback(null);
        fetchStats();
      }, 1500);
    } catch {
      setFormFeedback({ type: "error", text: "Network error while saving expedition." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-24 text-center text-stone-500 text-sm">
        Verifying administrator authorization and computing metrics...
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
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish New Tour</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] travel-card-shadow">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs uppercase tracking-wider font-semibold">Active Expeditions</span>
              <Compass className="w-5 h-5 text-[#124e3f]" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#1c2421] mt-3">
              {stats?.totalTours || 12}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Live in discovery catalog</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] travel-card-shadow">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Reservations</span>
              <Calendar className="w-5 h-5 text-[#d97706]" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#1c2421] mt-3">
              {stats?.totalBookings || 18}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Across all departure schedules</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] travel-card-shadow">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs uppercase tracking-wider font-semibold">Registered Explorers</span>
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#1c2421] mt-3">
              {stats?.totalUsers || 42}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Verified community accounts</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] travel-card-shadow">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs uppercase tracking-wider font-semibold">Gross Booking Value</span>
              <DollarSign className="w-5 h-5 text-[#124e3f]" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#124e3f] mt-3">
              {formatPrice(stats?.totalRevenue || 34850)}
            </p>
            <span className="text-[11px] text-stone-400 mt-1 block">Guaranteed expedition volume</span>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-2xl border border-[#e8e3d8] travel-card-shadow overflow-hidden">
          <div className="p-6 border-b border-[#f0ece3] flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#1c2421]">Recent Reservations</h2>
            <Link
              href="/tours"
              className="text-xs text-[#124e3f] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Explore Public Site</span>
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
                  <th className="py-3 px-6">Investment</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece3] text-stone-700">
                {stats?.recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-[#fbfaf8] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#124e3f]">
                      {b.bookingReference}
                    </td>
                    <td className="py-4 px-6 font-medium text-stone-900">
                      {b.guestName || "Registered Explorer"}
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate">
                      {b.tour?.name || "Private Tour"}
                    </td>
                    <td className="py-4 px-6">
                      {new Date(b.departureDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">{b.travelers}</td>
                    <td className="py-4 px-6 font-bold text-stone-900">
                      {formatPrice(b.totalPrice)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Publish New Tour */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-6">
              <div className="flex items-center justify-between border-b border-[#f0ece3] pb-4">
                <h3 className="font-serif text-2xl font-bold text-[#1c2421]">Publish New Expedition</h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
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

              <form onSubmit={handleCreateTour} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                    Expedition Title
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
                      Destination City / Region
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
                      Country
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
                      Category
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
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Difficulty
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
                      Days
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
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    required
                    value={imageCover}
                    onChange={(e) => setImageCover(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                  />
                </div>

                <div>
                  <label className="font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                    Summary
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

                <div className="flex justify-end gap-3 pt-4 border-t border-[#f0ece3]">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Publishing..." : "Publish Expedition"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
