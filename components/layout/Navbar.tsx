"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, Menu, X, User as UserIcon, Calendar, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import NotificationMenu from "@/components/notifications/NotificationMenu";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-[#fbfaf8]/90 backdrop-blur-md border-b border-[#e8e3d8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#124e3f] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#1c2421]">
                Touroholic
              </span>
              <span className="hidden sm:inline-block ml-1 text-[10px] tracking-widest uppercase font-semibold text-[#124e3f] bg-[#f4efe6] px-1.5 py-0.5 rounded">
                Expeditions
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#2d3748]">
            <Link
              href="/tours"
              className="hover:text-[#124e3f] transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#124e3f] hover:after:w-full after:transition-all"
            >
              Explore Tours
            </Link>
            <Link
              href="/tours?category=adventure"
              className="hover:text-[#124e3f] transition-colors"
            >
              Adventures
            </Link>
            <Link
              href="/tours?country=India"
              className="hover:text-[#124e3f] transition-colors font-medium text-[#124e3f]"
            >
              Explore India
            </Link>
            <Link
              href="/tours?category=cultural"
              className="hover:text-[#124e3f] transition-colors"
            >
              Cultural
            </Link>
            <Link
              href="/my-bookings"
              className="hover:text-[#124e3f] transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-[#124e3f]" />
              My Bookings
            </Link>
            {user?.role === "admin" && (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="text-[#124e3f] bg-[#eef7f4] border border-[#124e3f]/20 px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold text-xs hover:bg-[#d8efe8] transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Analytics
                </Link>
                <Link
                  href="/admin/bookings"
                  className="text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold text-xs transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-stone-600" />
                  Bookings
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationMenu />
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4efe6] hover:bg-[#ede6da] text-[#1c2421] text-xs font-medium transition-colors border border-[#e2dcce]"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#124e3f]" />
                  <span>{user.name.split(" ")[0]}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  title="Logout"
                  className="p-1.5 text-stone-500 hover:text-red-700 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#1c2421] hover:text-[#124e3f] px-3 py-2 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-[#124e3f] hover:bg-[#0c382d] text-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {user && <NotificationMenu />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-[#fbfaf8] border-b border-[#e8e3d8] px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/tours"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-stone-800 hover:bg-[#f4efe6]"
          >
            Explore Tours
          </Link>
          <Link
            href="/tours?country=India"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-[#124e3f] bg-emerald-50/60"
          >
            Explore India (12 Tours)
          </Link>
          <Link
            href="/tours?category=adventure"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-stone-800 hover:bg-[#f4efe6]"
          >
            Adventures
          </Link>
          <Link
            href="/tours?category=cultural"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-stone-800 hover:bg-[#f4efe6]"
          >
            Cultural Trips
          </Link>
          <Link
            href="/my-bookings"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-stone-800 hover:bg-[#f4efe6]"
          >
            My Bookings
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#124e3f] bg-[#eef7f4]"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-[#e8e3d8] flex flex-col space-y-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 text-stone-700 font-medium"
                >
                  My Profile ({user.name})
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="text-left px-3 py-2 text-red-600 font-medium"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-lg border border-[#e8e3d8] text-sm font-medium text-stone-800 hover:bg-[#f4efe6]"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-lg bg-[#124e3f] text-white text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
