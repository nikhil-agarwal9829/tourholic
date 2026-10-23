"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, Clock, AlertTriangle, XCircle, CreditCard, Calendar } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  booking?: string;
}

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications?limit=15");
      if (res.ok) {
        const json = await res.json();
        if (json.status === "success" && json.data) {
          setNotifications(json.data.notifications || []);
          setUnreadCount(json.data.unreadCount || 0);
        }
      }
    } catch {
      // Ignore network errors on background poll
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "booking_confirmation":
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case "payment_reminder":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "payment_confirmation":
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case "booking_cancellation":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "payment_deadline_approaching":
      case "payment_overdue":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-stone-500" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="View notifications"
        className="relative p-2 rounded-full text-stone-600 hover:text-[#124e3f] hover:bg-[#f4efe6] transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#fbfaf8]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-[#e8e3d8] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-[#fbfaf8] border-b border-[#e8e3d8]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#1c2421]">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#124e3f]/10 text-[#124e3f] text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#124e3f] hover:underline font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Bell className="w-8 h-8 mx-auto text-stone-300 mb-2 stroke-1" />
                <p className="text-xs font-medium text-stone-600">No notifications yet</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  We will notify you here when reservation or payment updates occur.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markAsRead(n._id)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-stone-50/80 ${
                    !n.read ? "bg-emerald-50/40" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-stone-100 shrink-0">
                      {getIconForType(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${!n.read ? "text-[#1c2421]" : "text-stone-700"}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#124e3f] mt-1.5 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 bg-[#fbfaf8] border-t border-[#e8e3d8] text-center">
            <Link
              href="/my-bookings"
              onClick={() => setIsOpen(false)}
              className="text-xs text-[#124e3f] hover:underline font-semibold"
            >
              View My Reservations &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
