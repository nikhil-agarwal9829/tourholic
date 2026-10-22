"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Lock, Calendar, Star, Compass, CheckCircle2, AlertCircle, Shield, Sparkles, MapPin, Globe, Tag, DollarSign } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import PlanExpeditionModal from "@/components/preferences/PlanExpeditionModal";
import { TravelPreferences } from "@/types";

interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  role: string;
  photo?: string;
  travelPreferences?: TravelPreferences;
}

export default function ProfilePage() {
  const { user, refreshUser, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences">("profile");
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(user as UserProfile);
      setName(user.name || "");
      setIsLoading(false);
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.message || "Failed to update profile." });
        return;
      }

      setStatusMessage({ type: "success", text: "Your profile has been saved successfully." });
      setCurrentPassword("");
      setNewPassword("");
      if (profile) setProfile({ ...profile, name });
    } catch {
      setStatusMessage({ type: "error", text: "Network error updating profile." });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-24 text-center text-stone-500 text-sm">
        Loading profile credentials...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold">Please Sign In</h2>
        <p className="text-xs text-stone-600">You must be logged in to access your explorer profile.</p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 bg-[#124e3f] text-white rounded-xl text-xs font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfaf8] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e3d8] travel-card-shadow flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-stone-100 ring-4 ring-[#124e3f]/10 shrink-0">
            <Image
              src={profile.photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"}
              alt={profile.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c2421]">
                {profile.name}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {profile.role}
              </span>
            </div>
            <p className="text-xs text-stone-500">{profile.email}</p>
            <div className="flex flex-wrap gap-3 pt-2 justify-center sm:justify-start">
              <Link
                href="/my-bookings"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4efe6] text-xs font-semibold text-stone-800 hover:bg-[#ede6da] transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-[#124e3f]" />
                <span>My Bookings</span>
              </Link>
              <Link
                href="/tours"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4efe6] text-xs font-semibold text-stone-800 hover:bg-[#ede6da] transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-[#124e3f]" />
                <span>Explore Tours</span>
              </Link>
              {profile.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#124e3f] text-xs font-semibold text-white hover:bg-[#0c382d] transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e3d8] travel-card-shadow space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-[#f0ece3] gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === "profile"
                  ? "border-[#124e3f] text-[#124e3f]"
                  : "border-transparent text-stone-400 hover:text-stone-700"
              }`}
            >
              Profile Settings
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "preferences"
                  ? "border-[#124e3f] text-[#124e3f]"
                  : "border-transparent text-stone-400 hover:text-stone-700"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#d97706]" />
              <span>Travel Preferences</span>
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === "security"
                  ? "border-[#124e3f] text-[#124e3f]"
                  : "border-transparent text-stone-400 hover:text-stone-700"
              }`}
            >
              Password & Security
            </button>
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === "preferences" ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#fbfaf8] border border-[#e8e3d8]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1c2421]">
                    Your Bespoke Travel Blueprint
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Deterministic preferences used to surface matching journeys across India and the globe.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreferencesModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#124e3f] hover:bg-[#0c382d] text-white text-xs font-bold shadow-sm transition-colors shrink-0"
                >
                  Edit Travel Preferences
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Location */}
                <div className="p-4 rounded-xl border border-[#e8e3d8] bg-white space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#124e3f]" />
                    <span>Home Location</span>
                  </span>
                  <p className="text-sm font-semibold text-stone-800">
                    {profile.travelPreferences?.homeCity || profile.travelPreferences?.homeCountry
                      ? `${profile.travelPreferences?.homeCity || "Unknown City"}, ${
                          profile.travelPreferences?.homeCountry || "Unknown Country"
                        }`
                      : "Not set yet"}
                  </p>
                </div>

                {/* Scope */}
                <div className="p-4 rounded-xl border border-[#e8e3d8] bg-white space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[#124e3f]" />
                    <span>Exploration Scope</span>
                  </span>
                  <p className="text-sm font-semibold text-stone-800 capitalize">
                    {profile.travelPreferences?.destinationScope === "india"
                      ? "India Exclusive"
                      : profile.travelPreferences?.destinationScope === "international"
                      ? "International Only"
                      : "India & International"}
                  </p>
                </div>

                {/* Preferred Destinations */}
                <div className="p-4 rounded-xl border border-[#e8e3d8] bg-white space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-[#124e3f]" />
                    <span>Target Destinations</span>
                  </span>
                  {profile.travelPreferences?.preferredDestinations &&
                  profile.travelPreferences.preferredDestinations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.travelPreferences.preferredDestinations.map((d) => (
                        <span
                          key={d}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f4efe6] text-[#124e3f] border border-[#e5dccb]"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">No specific destinations selected</p>
                  )}
                </div>

                {/* Preferred Categories */}
                <div className="p-4 rounded-xl border border-[#e8e3d8] bg-white space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#124e3f]" />
                    <span>Travel Styles</span>
                  </span>
                  {profile.travelPreferences?.preferredCategories &&
                  profile.travelPreferences.preferredCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.travelPreferences.preferredCategories.map((c) => (
                        <span
                          key={c}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">All travel categories welcome</p>
                  )}
                </div>

                {/* Budget & Duration */}
                <div className="p-4 rounded-xl border border-[#e8e3d8] bg-white space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#124e3f]" />
                    <span>Budget & Duration Preference</span>
                  </span>
                  <p className="text-sm font-semibold text-stone-800">
                    {profile.travelPreferences?.maxBudget
                      ? `Up to $${profile.travelPreferences.maxBudget}`
                      : "Flexible budget"}
                    {profile.travelPreferences?.preferredDuration
                      ? ` · ${profile.travelPreferences.preferredDuration} days`
                      : ""}
                  </p>
                </div>
              </div>

              <PlanExpeditionModal
                isOpen={isPreferencesModalOpen}
                onClose={() => setIsPreferencesModalOpen(false)}
                initialPreferences={profile.travelPreferences}
                onSaved={async (updated) => {
                  setProfile({ ...profile, travelPreferences: updated });
                  await refreshUser();
                }}
              />
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {activeTab === "profile" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-100 border border-[#e8e3d8] rounded-xl text-stone-500 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-stone-400 mt-1 block">
                      Account email is unique and verified.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                      New Password (minimum 8 characters)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 focus:outline-none focus:border-[#124e3f]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="py-3 px-6 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
              >
                Save Profile Changes
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
