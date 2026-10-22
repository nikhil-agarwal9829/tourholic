"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Compass, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Invalid credentials");
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setErrorMessage("Network error during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoRole: "user" | "admin") => {
    if (demoRole === "admin") {
      setEmail("admin@touroholic.com");
      setPassword("AdminPass123!");
    } else {
      setEmail("traveler@touroholic.com");
      setPassword("TravelerPass123!");
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#124e3f] flex items-center justify-center text-white shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-[#1c2421]">
            Touroholic
          </span>
        </Link>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1c2421]">
          Welcome Back, Adventurer
        </h2>
        <p className="mt-2 text-xs text-stone-600">
          Sign in to manage your expeditions, reviews, and private departures.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#e8e3d8] travel-card-shadow space-y-6">
          {/* Quick Demo Mode Login Buttons */}
          <div className="p-3.5 bg-[#f4efe6] rounded-2xl border border-[#e2dcce] text-left space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#124e3f] block">
              🚀 Demo Access Credentials
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("user")}
                className="flex-1 py-1.5 px-2.5 bg-white border border-[#e8e3d8] rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Traveler Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("admin")}
                className="flex-1 py-1.5 px-2.5 bg-[#124e3f] text-white rounded-lg text-xs font-semibold hover:bg-[#0c382d]"
              >
                Admin Demo
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#124e3f]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#124e3f] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#fbfaf8] border border-[#e8e3d8] rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#124e3f]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
              disabled={isLoading}
              className="w-full py-3.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <span>{isLoading ? "Signing In..." : "Sign In to Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-stone-600">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="font-bold text-[#124e3f] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
