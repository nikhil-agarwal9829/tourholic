"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, Mail, Send, CheckCircle2, MapPin, Phone, Globe, Share2 } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="bg-[#17231f] text-[#ede8dd] border-t border-[#2a3833]">
      {/* Newsletter Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 border-b border-[#283832]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#d97706]">
              Curated Travel Journal
            </span>
            <h3 className="font-serif text-3xl font-normal text-white mt-2">
              Receive secret trails and seasonal departures.
            </h3>
            <p className="text-sm text-[#a8b8b0] mt-2">
              No spam. Just handpicked expeditions, seasonal flight windows, and early access to limited departures.
            </p>
          </div>
          <div className="lg:col-span-6">
            {subscribed ? (
              <div className="flex items-center gap-3 bg-[#124e3f]/40 border border-[#124e3f] p-4 rounded-xl text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm">Thank you for subscribing! Your wanderlust edition will arrive shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-11 pr-4 py-3 bg-[#0d1613] border border-[#2b3d36] rounded-xl text-white placeholder-stone-400 focus:outline-none focus:border-[#d97706] text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors shadow-sm"
                  >
                    <span>Subscribe</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {error && <p className="text-xs text-rose-400 pl-1">{error}</p>}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#124e3f] flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                Touroholic
              </span>
            </Link>
            <p className="text-sm text-[#9eb0a7] leading-relaxed max-w-sm">
              Inspiring discovery through authentic, small-group expeditions. From the turquoise peaks of the Canadian Rockies to the timeless temples of Kyoto.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-[#22332c] flex items-center justify-center text-stone-300 hover:text-white hover:bg-[#124e3f] transition-all">
                <Globe className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="w-9 h-9 rounded-lg bg-[#22332c] flex items-center justify-center text-stone-300 hover:text-white hover:bg-[#124e3f] transition-all">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="https://touroholic.com" target="_blank" rel="noreferrer" aria-label="Expeditions" className="w-9 h-9 rounded-lg bg-[#22332c] flex items-center justify-center text-stone-300 hover:text-white hover:bg-[#124e3f] transition-all">
                <Compass className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 1 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Explore Destinations
            </h4>
            <ul className="space-y-2.5 text-sm text-[#9eb0a7]">
              <li><Link href="/tours?destination=Banff" className="hover:text-white transition-colors">Canadian Rockies</Link></li>
              <li><Link href="/tours?destination=Amalfi" className="hover:text-white transition-colors">Amalfi Coast, Italy</Link></li>
              <li><Link href="/tours?destination=Kyoto" className="hover:text-white transition-colors">Kyoto, Japan</Link></li>
              <li><Link href="/tours?destination=Serengeti" className="hover:text-white transition-colors">Serengeti Safari</Link></li>
              <li><Link href="/tours?destination=Patagonia" className="hover:text-white transition-colors">Patagonia Trek</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Expedition Types
            </h4>
            <ul className="space-y-2.5 text-sm text-[#9eb0a7]">
              <li><Link href="/tours?category=adventure" className="hover:text-white transition-colors">Alpine Adventure</Link></li>
              <li><Link href="/tours?category=cultural" className="hover:text-white transition-colors">Cultural Immersions</Link></li>
              <li><Link href="/tours?category=wildlife" className="hover:text-white transition-colors">Wildlife Safaris</Link></li>
              <li><Link href="/tours?category=nature" className="hover:text-white transition-colors">Nature Retreats</Link></li>
              <li><Link href="/tours?category=getaway" className="hover:text-white transition-colors">Weekend Getaways</Link></li>
            </ul>
          </div>

          {/* Column 3 - Contact & Trust */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Travel Concierge
            </h4>
            <ul className="space-y-3 text-sm text-[#9eb0a7]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                <span>450 Explorer Blvd, Suite 800, New York, NY</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#d97706] shrink-0" />
                <span>+1 (800) 555-TOUR</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#d97706] shrink-0" />
                <span>concierge@touroholic.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-12 mt-12 border-t border-[#283832] flex flex-col sm:flex-row justify-between items-center text-xs text-[#82968d] gap-4">
          <p>© {new Date().getFullYear()} Touroholic Inc. Crafted for purposeful travelers.</p>
          <div className="flex space-x-6">
            <Link href="/tours" className="hover:text-white transition-colors">Tours</Link>
            <Link href="/my-bookings" className="hover:text-white transition-colors">Bookings</Link>
            <span className="text-stone-500">|</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
