"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Compass, ArrowRight, Info } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
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
          Reset Your Password
        </h2>
        <p className="mt-2 text-xs text-stone-600">
          Enter your registered email address to receive password recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#e8e3d8] travel-card-shadow space-y-6">
          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#f4efe6] border border-[#e2dcce] text-stone-700 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#124e3f]">
                  <Info className="w-4 h-4" />
                  <span>Password Reset Service Ready</span>
                </div>
                <p className="text-xs leading-relaxed text-stone-600">
                  Password reset link requested for <span className="font-semibold">{email}</span>.
                  In production with SMTP configured, a secure one-time link will be dispatched.
                  For local testing, you can use the demo accounts on the login page or update your password directly from the user profile.
                </p>
              </div>

              <Link
                href="/login"
                className="w-full py-3 bg-[#124e3f] text-white rounded-xl text-xs font-bold block text-center"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                className="w-full py-3.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Send Reset Instructions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center text-xs text-stone-600">
            Remembered your password?{" "}
            <Link href="/login" className="font-bold text-[#124e3f] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
