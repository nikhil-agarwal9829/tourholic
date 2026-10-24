"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, RefreshCw, CheckCircle2, AlertCircle, Clock, X } from "lucide-react";
import { useAuth } from "./AuthProvider";

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // If not logged in, or already verified, or admin, or on verify-email page, or dismissed for this tab:
  if (!user || user.role === "admin" || user.emailVerified === true || pathname === "/verify-email" || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setMessage({
          type: "success",
          text: "Verification link sent! Please check your inbox.",
        });
        setCooldown(data.cooldownRemainingSeconds || 120);
      } else if (data.status === "info") {
        setMessage({
          type: "success",
          text: data.message,
        });
      } else {
        let errText = data.message || "Unable to send verification email.";
        if (errText.toLowerCase().includes("key not found") || errText.toLowerCase().includes("unauthorized")) {
          errText = "Email service configuration error. Please verify your Brevo credentials in Vercel or local config.";
        }
        setMessage({
          type: "error",
          text: errText,
        });
        if (data.cooldownRemainingSeconds) {
          setCooldown(data.cooldownRemainingSeconds);
        }
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error sending verification link.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-900/90 via-[#8a4a1a]/90 to-amber-900/90 text-amber-50 px-4 py-2.5 text-xs border-b border-amber-700/50 shadow-sm relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="p-1 rounded-md bg-amber-800/80 text-amber-200">
            <Mail className="w-4 h-4" />
          </span>
          <p className="font-medium">
            <strong className="text-white">Verify your email:</strong> Please verify{" "}
            <span className="underline font-semibold">{user.email}</span> to confirm expedition bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {message && (
            <span
              className={`text-[11px] font-semibold flex items-center gap-1 ${
                message.type === "success" ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {message.text}
            </span>
          )}

          <button
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="px-3 py-1 bg-amber-100 hover:bg-white text-amber-950 font-bold rounded-lg text-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" /> Sending...
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-3 h-3" /> Resend in {cooldown}s
              </>
            ) : (
              "Resend Email"
            )}
          </button>

          <Link
            href="/verify-email"
            className="text-amber-200 hover:text-white underline font-semibold text-[11px] hidden md:inline-block"
          >
            Enter Code / Help
          </Link>

          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss notice for this session"
            className="p-1 text-amber-300 hover:text-white rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
