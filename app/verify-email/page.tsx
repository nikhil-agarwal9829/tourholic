"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Compass,
  ArrowRight,
  Clock,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const urlToken = searchParams.get("token");

  const [loading, setLoading] = useState(!!urlToken);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual token input state
  const [manualToken, setManualToken] = useState("");
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Resend form state
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Prefill resend email if user is currently logged in
  useEffect(() => {
    if (user?.email && !resendEmail) {
      setResendEmail(user.email);
    }
  }, [user, resendEmail]);

  // Handle countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Execute verification against the backend API
  const performVerification = async (tokenToVerify: string) => {
    setLoading(true);
    setErrorMessage(null);
    setManualError(null);

    // Extract raw token if user pasted full URL (e.g., https://.../verify-email?token=xyz)
    let cleanedToken = tokenToVerify.trim();
    if (cleanedToken.includes("token=")) {
      try {
        const urlObj = new URL(cleanedToken);
        cleanedToken = urlObj.searchParams.get("token") || cleanedToken;
      } catch {
        const match = cleanedToken.match(/token=([a-zA-Z0-9]+)/);
        if (match && match[1]) cleanedToken = match[1];
      }
    }

    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(cleanedToken)}`);
      const data = await res.json();

      if (res.ok && data.status === "success") {
        setSuccess(true);
        setSuccessMessage(data.message || "Your email address has been successfully verified!");
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        setSuccess(false);
        const err = data.message || "Verification link is invalid or has expired.";
        setErrorMessage(err);
        setManualError(err);
      }
    } catch {
      setSuccess(false);
      const networkErr = "Network error verifying your account. Please check your connection.";
      setErrorMessage(networkErr);
      setManualError(networkErr);
    } finally {
      setLoading(false);
      setIsVerifyingManual(false);
    }
  };

  // Automatic verification when token is present in URL
  useEffect(() => {
    if (!urlToken) return;
    performVerification(urlToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken]);

  // Handle manual token submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      setManualError("Please enter your verification token or paste the link.");
      return;
    }
    setIsVerifyingManual(true);
    await performVerification(manualToken.trim());
  };

  // Handle resend verification email
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
        setResendFeedback({
          type: "success",
          message: data.message || "A new verification email has been sent. Please check your inbox.",
        });
        setCooldown(data.cooldownRemainingSeconds || 120);
      } else if (data.status === "info") {
        setResendFeedback({
          type: "success",
          message: data.message,
        });
      } else {
        let errMessage = data.message || "Failed to resend verification link.";
        if (errMessage.toLowerCase().includes("key not found") || errMessage.toLowerCase().includes("unauthorized")) {
          errMessage = "Email service configuration error. Please ensure Brevo credentials are properly set up.";
        }
        setResendFeedback({
          type: "error",
          message: errMessage,
        });
        if (data.cooldownRemainingSeconds) {
          setCooldown(data.cooldownRemainingSeconds);
        }
      }
    } catch {
      setResendFeedback({
        type: "error",
        message: "Network error sending email. Please try again later.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col justify-center items-center px-4 py-16">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#e8e3d8] p-8 md:p-10 text-center relative overflow-hidden">
        {/* Subtle decorative top accent */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-600 via-[#124e3f] to-amber-600" />

        {/* LOGO */}
        <div className="mb-6 flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#124e3f]/10 text-[#124e3f] flex items-center justify-center font-bold text-2xl shadow-inner">
            <Compass className="w-8 h-8 animate-pulse text-[#124e3f]" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 py-4">
            <h1 className="text-2xl font-bold text-stone-900">Verifying Your Email</h1>
            <p className="text-stone-500 text-sm">
              Please wait while we validate your secure token with Touroholic...
            </p>
            <div className="py-8 flex justify-center">
              <RefreshCw className="w-10 h-10 text-[#124e3f] animate-spin" />
            </div>
          </div>
        ) : success ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 py-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Email Successfully Verified!</h1>
            <p className="text-stone-600 text-sm leading-relaxed">
              {successMessage || "Your Touroholic account is now verified. You have full access to reserve expeditions across India and worldwide."}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/tours"
                className="flex-1 py-3 px-4 bg-[#124e3f] hover:bg-[#0e3d31] text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                Explore Expeditions <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/my-bookings"
                className="py-3 px-5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-semibold text-sm transition-colors"
              >
                My Bookings
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <Mail className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-stone-900">
                {errorMessage ? "Verification Link Expired" : "Verify Your Email"}
              </h1>
              <p className="text-stone-600 text-xs leading-relaxed max-w-sm mx-auto">
                {errorMessage
                  ? "The link you clicked has expired or was already used. You can request a fresh verification link or paste your token below."
                  : "We sent a secure verification email to your registered inbox. Click the link in the email or paste your token below."}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Section 1: Manual Token Entry */}
            <div className="bg-[#fbfaf8] border border-stone-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-stone-800 font-semibold text-xs">
                <KeyRound className="w-4 h-4 text-[#124e3f]" />
                <span>Enter Verification Token / Link</span>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste your 64-character token or link..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124e3f]"
                />
                {manualError && (
                  <p className="text-[11px] text-red-600">{manualError}</p>
                )}
                <button
                  type="submit"
                  disabled={isVerifyingManual || !manualToken.trim()}
                  className="w-full py-2 px-3 bg-stone-800 hover:bg-stone-900 disabled:bg-stone-300 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isVerifyingManual ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Validating Token...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Verify Token
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Section 2: Resend Verification Email */}
            <div className="border-t border-stone-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700">
                  Resend Verification Email
                </label>
                {cooldown > 0 && (
                  <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Resend in {cooldown}s
                  </span>
                )}
              </div>

              <form onSubmit={handleResend} className="space-y-2.5">
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your-account-email@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124e3f]"
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
                    <span className="leading-relaxed">{resendFeedback.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResending || cooldown > 0}
                  className="w-full py-2.5 px-4 bg-[#124e3f] hover:bg-[#0e3d31] disabled:bg-stone-300 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching Email...
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5" /> Please wait {cooldown}s
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" /> Send New Verification Link
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-2 text-center">
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
