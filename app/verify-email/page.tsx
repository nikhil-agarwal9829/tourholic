"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, RefreshCw, Mail, Compass, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Set default resend email if user is logged in
  useEffect(() => {
    if (user?.email && !resendEmail) {
      setResendEmail(user.email);
    }
  }, [user, resendEmail]);

  // Handle Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Automatic token verification on mount
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const verify = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.status === "success") {
          setSuccess(true);
          if (refreshUser) {
            await refreshUser();
          }
        } else {
          setSuccess(false);
          setErrorMessage(data.message || "Failed to verify email. The link may be expired or invalid.");
        }
      } catch {
        if (!isMounted) return;
        setSuccess(false);
        setErrorMessage("Network error verifying email. Please check your connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, refreshUser]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (resendEmail || user?.email || "").trim();

    if (!targetEmail || !targetEmail.includes("@")) {
      setResendFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setIsResending(true);
    setResendFeedback(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setResendFeedback({ type: "success", message: data.message });
        setCooldown(data.cooldownRemainingSeconds || 120);
      } else if (data.status === "info") {
        setResendFeedback({ type: "success", message: data.message });
      } else {
        setResendFeedback({ type: "error", message: data.message || "Failed to resend verification link." });
        if (data.cooldownRemainingSeconds) {
          setCooldown(data.cooldownRemainingSeconds);
        }
      }
    } catch {
      setResendFeedback({ type: "error", message: "Network error sending email. Please try again later." });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col justify-center items-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e8e3d8] p-8 md:p-10 text-center relative overflow-hidden">
        {/* Subtle decorative top accent */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-600 via-[#124e3f] to-amber-600" />

        {/* LOGO */}
        <div className="mb-6 flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#124e3f]/10 text-[#124e3f] flex items-center justify-center font-bold text-2xl shadow-inner">
            <Compass className="w-8 h-8 animate-pulse text-[#124e3f]" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-stone-900">Verifying Your Email</h1>
            <p className="text-stone-500 text-sm">
              Please wait a moment while we validate your secure token with Touroholic...
            </p>
            <div className="py-8 flex justify-center">
              <RefreshCw className="w-10 h-10 text-[#124e3f] animate-spin" />
            </div>
          </div>
        ) : success ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Email Verified!</h1>
            <p className="text-stone-600 text-sm leading-relaxed">
              Your email address has been successfully verified. Your account is now fully active and ready to book
              expeditions across India and around the globe.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/tours"
                className="flex-1 py-3 px-4 bg-[#124e3f] hover:bg-[#0e3d31] text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                Explore Expeditions <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="py-3 px-5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-semibold text-sm transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">
              {errorMessage ? "Verification Link Expired" : "Verify Your Email"}
            </h1>

            {errorMessage ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            ) : (
              <p className="text-stone-600 text-sm leading-relaxed">
                We sent a verification link to your email address when you registered. Please click the link in your email
                to unlock expedition bookings.
              </p>
            )}

            {/* Resend Verification Form */}
            <form onSubmit={handleResend} className="pt-2 text-left space-y-3">
              <label className="block text-xs font-semibold text-stone-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124e3f]"
              />

              {resendFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    resendFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {resendFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  )}
                  <span>{resendFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isResending || cooldown > 0}
                className="w-full py-3 px-4 bg-[#124e3f] hover:bg-[#0e3d31] disabled:bg-stone-300 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending Link...
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <Clock className="w-4 h-4" /> Resend available in {cooldown}s
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Resend Verification Email
                  </>
                )}
              </button>
            </form>

            <div className="pt-2">
              <Link
                href="/"
                className="text-xs text-stone-500 hover:text-[#124e3f] underline transition-colors"
              >
                Return to Touroholic Homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-[#124e3f] animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
