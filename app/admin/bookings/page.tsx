"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatPrice } from "@/lib/utils";
import {
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Send,
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileText,
  User,
  Compass,
  DollarSign,
  Info,
} from "lucide-react";

interface BookingRecord {
  _id: string;
  bookingReference: string;
  user: {
    _id: string;
    name: string;
    email: string;
    photo?: string;
  } | null;
  guestName: string;
  guestEmail: string;
  tour: {
    _id: string;
    name: string;
    slug: string;
    destination: string;
    country: string;
    imageCover?: string;
    price: number;
    currency: string;
    duration?: number;
  };
  departureSchedule: {
    startDate: string;
    endDate: string;
    capacity: number;
    reservedSeats: number;
    status: string;
  } | null;
  departureDate: string;
  travelers: number;
  pricePerTraveler: number;
  totalPrice: number;
  currency: string;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
  paymentDueAt: string | null;
  paymentReference: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  paymentReconciledBy: { name: string; email: string } | null;
  paymentReconciledAt: string | null;
  paymentReconciliationNotes: string | null;
  cancelledAt: string | null;
  cancelledBy: { name: string; email: string } | null;
  cancellationReason: string | null;
  cancellationPolicySnapshot: string | null;
  refundAmount: number;
  refundedAt: string | null;
  refundReason: string | null;
  lastPaymentReminderSentAt: string | null;
  paymentReminderCount: number;
  specialRequests: string | null;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminBookingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Data states
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals & Drawer
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [bookingDetailAudit, setBookingDetailAudit] = useState<any[]>([]);
  const [bookingDetailNotifications, setBookingDetailNotifications] = useState<any[]>([]);

  // Cancellation Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelPolicyAck, setCancelPolicyAck] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Reminder Modal State
  const [reminderModalBooking, setReminderModalBooking] = useState<BookingRecord | null>(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Reconciliation Modal State
  const [reconcileModalBooking, setReconcileModalBooking] = useState<BookingRecord | null>(null);
  const [reconcileRef, setReconcileRef] = useState("");
  const [reconcileMethod, setReconcileMethod] = useState("Bank Transfer");
  const [reconcileNotes, setReconcileNotes] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);

  // Global Action Feedback Toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  const fetchBookings = useCallback(
    async (targetPage = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", targetPage.toString());
        params.set("limit", "10");
        if (search.trim()) params.set("search", search.trim());
        if (bookingStatus !== "all") params.set("bookingStatus", bookingStatus);
        if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(`/api/admin/bookings?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.status === "success") {
          setBookings(data.data.bookings || []);
          setPagination(data.data.pagination);
        } else {
          setError(data.message || "Failed to load bookings");
        }
      } catch {
        setError("Network error while loading reservations.");
      } finally {
        setIsLoading(false);
      }
    },
    [search, bookingStatus, paymentStatus, startDate, endDate]
  );

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchBookings(1);
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [user, isAuthLoading, fetchBookings]);

  // Open detail drawer and load audit logs
  const handleOpenDetail = async (b: BookingRecord) => {
    setSelectedBooking(b);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${b._id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === "success") {
          setBookingDetailAudit(json.data.auditLogs || []);
          setBookingDetailNotifications(json.data.notifications || []);
        }
      }
    } catch {
      // Silent error fallback
    } finally {
      setDrawerLoading(false);
    }
  };

  // Process Cancellation
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 3) {
      showToast("error", "Please provide a valid cancellation reason (minimum 3 characters).");
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/admin/bookings/${cancelModalBooking._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReason.trim(),
          policyAcknowledged: cancelPolicyAck,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        showToast("success", data.message || "Booking successfully cancelled.");
        setCancelModalBooking(null);
        setCancelReason("");
        setCancelPolicyAck(false);
        fetchBookings(pagination.page);
        if (selectedBooking && selectedBooking._id === cancelModalBooking._id) {
          handleOpenDetail({
            ...selectedBooking,
            bookingStatus: "cancelled",
            cancelledAt: new Date().toISOString(),
            cancellationReason: cancelReason.trim(),
          });
        }
      } else {
        showToast("error", data.message || "Failed to cancel booking.");
      }
    } catch {
      showToast("error", "Network error occurred while cancelling reservation.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Process Send Payment Reminder
  const handleConfirmReminder = async () => {
    if (!reminderModalBooking) return;

    setIsSendingReminder(true);
    try {
      const res = await fetch(`/api/admin/bookings/${reminderModalBooking._id}/remind`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        showToast(
          "success",
          `Payment reminder dispatched to ${reminderModalBooking.guestEmail}. (${data.data.emailDeliveryStatus})`
        );
        setReminderModalBooking(null);
        fetchBookings(pagination.page);
      } else {
        showToast("error", data.message || "Unable to send payment reminder.");
      }
    } catch {
      showToast("error", "Network error sending payment reminder.");
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Process Manual Reconciliation
  const handleConfirmReconciliation = async () => {
    if (!reconcileModalBooking) return;
    if (!reconcileRef.trim() || reconcileRef.trim().length < 3) {
      showToast("error", "Payment reference or transaction number is required.");
      return;
    }
    if (!reconcileNotes.trim() || reconcileNotes.trim().length < 5) {
      showToast("error", "Please record audit notes explaining how payment was verified.");
      return;
    }

    setIsReconciling(true);
    try {
      const res = await fetch(`/api/admin/bookings/${reconcileModalBooking._id}/reconcile-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentReference: reconcileRef.trim(),
          paymentMethod: reconcileMethod,
          notes: reconcileNotes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        showToast("success", data.message || "Payment verified and recorded.");
        setReconcileModalBooking(null);
        setReconcileRef("");
        setReconcileNotes("");
        fetchBookings(pagination.page);
        if (selectedBooking && selectedBooking._id === reconcileModalBooking._id) {
          handleOpenDetail({
            ...selectedBooking,
            paymentStatus: "paid",
            paidAt: new Date().toISOString(),
            paymentReference: reconcileRef.trim(),
            paymentMethod: reconcileMethod,
          });
        }
      } else {
        showToast("error", data.message || "Failed to reconcile payment.");
      }
    } catch {
      showToast("error", "Network error reconciling payment.");
    } finally {
      setIsReconciling(false);
    }
  };

  // Status Badges
  const renderBookingStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">
            {status}
          </span>
        );
    }
  };

  const renderPaymentStatusBadge = (status: string, deadline?: string | null) => {
    const isOverdue =
      deadline && (status === "unpaid" || status === "pending") && new Date(deadline) < new Date();

    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CreditCard className="w-3 h-3" /> Paid
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            Refunded
          </span>
        );
      case "unpaid":
      case "pending":
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isOverdue
                ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                : "bg-amber-50 text-amber-800 border-amber-300"
            }`}
          >
            <Clock className="w-3 h-3" />
            {isOverdue ? "Overdue" : status === "pending" ? "Pending" : "Unpaid"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  if (!isAuthLoading && (!user || user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#fbfaf8] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-[#e8e3d8]">
          <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-stone-900 mb-2">Access Restricted</h1>
          <p className="text-stone-600 text-sm mb-6">
            Administrator privileges are required to view and manage reservation records.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 bg-[#124e3f] text-white text-sm font-semibold rounded-xl hover:bg-[#0c382d] transition-colors"
          >
            Log In as Administrator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#1c2421]">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-emerald-900 text-emerald-50 border-emerald-700"
              : "bg-red-900 text-red-50 border-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Top Navigation Banner */}
      <header className="border-b border-[#e8e3d8] bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-stone-500 hover:text-stone-800 text-sm font-medium flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-stone-300">/</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#124e3f]" />
              <h1 className="font-bold text-lg text-stone-900">Reservations & Bookings</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/api/admin/export?type=bookings&bookingStatus=${bookingStatus}&paymentStatus=${paymentStatus}&startDate=${startDate}&endDate=${endDate}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
            <button
              onClick={() => fetchBookings(pagination.page)}
              title="Refresh reservations"
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Controls Card */}
        <div className="bg-white rounded-2xl border border-[#e8e3d8] p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchBookings(1)}
                placeholder="Search reference, guest, email, tour..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#fbfaf8] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#124e3f]/20 focus:border-[#124e3f]"
              />
            </div>

            {/* Quick Filter Selectors */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Booking Status */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-500 font-medium">Booking:</span>
                <select
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(e.target.value)}
                  className="text-xs bg-[#fbfaf8] border border-stone-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#124e3f]"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Payment Status */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-500 font-medium">Payment:</span>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="text-xs bg-[#fbfaf8] border border-stone-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#124e3f]"
                >
                  <option value="all">All Payments</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <span>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs bg-[#fbfaf8] border border-stone-300 rounded-lg px-2 py-1 focus:outline-none"
                />
                <span>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs bg-[#fbfaf8] border border-stone-300 rounded-lg px-2 py-1 focus:outline-none"
                />
              </div>

              <button
                onClick={() => fetchBookings(1)}
                className="px-4 py-1.5 bg-[#124e3f] text-white rounded-lg text-xs font-semibold hover:bg-[#0c382d] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Table Card */}
        <div className="bg-white rounded-2xl border border-[#e8e3d8] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 text-[#124e3f] animate-spin mx-auto mb-3" />
              <p className="text-xs font-medium text-stone-500">Fetching live reservation records from MongoDB Atlas...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center px-4">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-800">{error}</p>
              <button
                onClick={() => fetchBookings(1)}
                className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-medium"
              >
                Retry
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-20 text-center px-4">
              <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3 stroke-1" />
              <h3 className="text-sm font-semibold text-stone-700">No Reservations Found</h3>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                No booking records match the selected query and filters. Try adjusting search criteria or dates.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fbfaf8] border-b border-[#e8e3d8] text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Expedition & Destination</th>
                    <th className="py-3.5 px-4">Departure</th>
                    <th className="py-3.5 px-3 text-center">Guests</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4">Booking</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Deadline</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {bookings.map((b) => (
                    <tr
                      key={b._id}
                      className="hover:bg-stone-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(b)}
                    >
                      {/* Booking Reference */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#124e3f] whitespace-nowrap">
                        {b.bookingReference}
                      </td>

                      {/* Customer Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{b.guestName}</div>
                        <div className="text-[11px] text-stone-400">{b.guestEmail}</div>
                      </td>

                      {/* Tour Name & Destination */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-medium text-stone-900 truncate" title={b.tour?.name}>
                          {b.tour?.name}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1 truncate">
                          <Compass className="w-3 h-3 text-[#124e3f]" />
                          {b.tour?.destination} {b.tour?.country && `(${b.tour.country})`}
                        </div>
                      </td>

                      {/* Departure Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                        {b.departureDate}
                      </td>

                      {/* Guests */}
                      <td className="py-3.5 px-3 text-center font-medium">
                        {b.travelers}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-stone-900">
                          {formatPrice(b.totalPrice, b.currency || "USD")}
                        </span>
                      </td>

                      {/* Booking Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderBookingStatusBadge(b.bookingStatus)}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderPaymentStatusBadge(b.paymentStatus, b.paymentDueAt)}
                      </td>

                      {/* Payment Deadline */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-500 text-[11px]">
                        {b.paymentDueAt ? (
                          <div className={new Date(b.paymentDueAt) < new Date() && b.paymentStatus !== "paid" ? "text-red-600 font-semibold" : ""}>
                            {new Date(b.paymentDueAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(b)}
                            title="View Full Reservation"
                            className="p-1.5 text-stone-600 hover:text-[#124e3f] hover:bg-[#eef7f4] rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Send Reminder button: eligible if unpaid/pending and not cancelled */}
                          {b.bookingStatus !== "cancelled" &&
                            b.bookingStatus !== "completed" &&
                            b.paymentStatus !== "paid" &&
                            b.paymentStatus !== "refunded" && (
                              <button
                                onClick={() => setReminderModalBooking(b)}
                                title="Send Payment Reminder"
                                className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                          {/* Reconcile Payment button if unpaid/pending */}
                          {b.bookingStatus !== "cancelled" &&
                            b.paymentStatus !== "paid" &&
                            b.paymentStatus !== "refunded" && (
                              <button
                                onClick={() => {
                                  setReconcileModalBooking(b);
                                  setReconcileRef(`WIRE-${Date.now().toString().slice(-6)}`);
                                }}
                                title="Record Reconciled Payment"
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}

                          {/* Cancel Booking button: eligible if not cancelled & not completed */}
                          {b.bookingStatus !== "cancelled" && b.bookingStatus !== "completed" && (
                            <button
                              onClick={() => setCancelModalBooking(b)}
                              title="Cancel Reservation"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-[#fbfaf8] border-t border-[#e8e3d8] text-xs">
              <span className="text-stone-500">
                Showing Page <strong className="text-stone-800">{pagination.page}</strong> of{" "}
                <strong className="text-stone-800">{pagination.totalPages}</strong> ({pagination.total}{" "}
                total reservations)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchBookings(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchBookings(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Booking Detail Slide-Over Drawer */}
      {drawerOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-[#e8e3d8]">
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-[#fbfaf8] border-b border-[#e8e3d8] flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#124e3f]">
                    Reservation Details
                  </span>
                  <h2 className="text-lg font-bold text-stone-900">
                    {selectedBooking.bookingReference}
                  </h2>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-stone-700">
                {/* Status Badges Row */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Booking Status</span>
                    {renderBookingStatusBadge(selectedBooking.bookingStatus)}
                  </div>
                  <div className="h-8 w-px bg-stone-200" />
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Payment Status</span>
                    {renderPaymentStatusBadge(selectedBooking.paymentStatus, selectedBooking.paymentDueAt)}
                  </div>
                </div>

                {/* Expedition Information Card */}
                <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#124e3f]" /> Expedition Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 text-[11px] block">Tour Title:</span>
                      <strong className="text-stone-800">{selectedBooking.tour?.name}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Destination:</span>
                      <strong className="text-stone-800">{selectedBooking.tour?.destination}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Departure Date:</span>
                      <strong className="text-stone-800">{selectedBooking.departureDate}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Travelers:</span>
                      <strong className="text-stone-800">{selectedBooking.travelers} Guests</strong>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#124e3f]" /> Traveler Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 text-[11px] block">Primary Name:</span>
                      <strong className="text-stone-800">{selectedBooking.guestName}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Contact Email:</span>
                      <strong className="text-stone-800">{selectedBooking.guestEmail}</strong>
                    </div>
                    {selectedBooking.specialRequests && (
                      <div className="col-span-2 bg-[#fbfaf8] p-2.5 rounded-lg border border-stone-200">
                        <span className="text-stone-400 text-[11px] block">Special Requests:</span>
                        <p className="text-stone-700 italic">{selectedBooking.specialRequests}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & Financial Breakdown */}
                <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#124e3f]" /> Financial Breakdown
                  </h3>
                  <div className="space-y-1.5 divide-y divide-stone-100">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Rate per Traveler:</span>
                      <span>{formatPrice(selectedBooking.pricePerTraveler, selectedBooking.currency)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Guest Count:</span>
                      <span>× {selectedBooking.travelers}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-sm font-bold text-stone-900">
                      <span>Total Reservation Value:</span>
                      <span className="text-[#124e3f]">
                        {formatPrice(selectedBooking.totalPrice, selectedBooking.currency)}
                      </span>
                    </div>
                    {selectedBooking.paymentDueAt && (
                      <div className="flex justify-between py-1 text-[11px]">
                        <span className="text-stone-500">Payment Deadline:</span>
                        <span className="font-mono text-stone-700">
                          {new Date(selectedBooking.paymentDueAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedBooking.paymentReference && (
                      <div className="flex justify-between py-1 text-[11px]">
                        <span className="text-stone-500">Payment Reference:</span>
                        <span className="font-mono font-semibold text-emerald-800">
                          {selectedBooking.paymentReference}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancellation Metadata (if cancelled) */}
                {selectedBooking.bookingStatus === "cancelled" && (
                  <div className="border border-red-200 bg-red-50/50 rounded-xl p-4 space-y-2">
                    <h3 className="font-bold text-red-900 text-sm flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-600" /> Cancellation Details
                    </h3>
                    <p className="text-xs text-red-800">
                      <strong>Reason:</strong> {selectedBooking.cancellationReason || "Not provided"}
                    </p>
                    <p className="text-[11px] text-red-700">
                      <strong>Cancelled On:</strong>{" "}
                      {selectedBooking.cancelledAt
                        ? new Date(selectedBooking.cancelledAt).toLocaleString()
                        : "N/A"}
                    </p>
                    {selectedBooking.cancelledBy && (
                      <p className="text-[11px] text-red-700">
                        <strong>Cancelled By Admin:</strong> {selectedBooking.cancelledBy.email}
                      </p>
                    )}
                  </div>
                )}

                {/* Audit & Notification History */}
                <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#124e3f]" /> Audit Trail & History
                  </h3>
                  {drawerLoading ? (
                    <p className="text-stone-400">Loading audit trail...</p>
                  ) : bookingDetailAudit.length === 0 ? (
                    <p className="text-stone-400">No admin changes logged yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {bookingDetailAudit.map((a, idx) => (
                        <div key={idx} className="p-2 rounded bg-stone-50 border border-stone-100 text-[11px]">
                          <div className="flex justify-between font-semibold text-stone-800">
                            <span>{a.action.replace(/_/g, " ").toUpperCase()}</span>
                            <span className="text-stone-400">
                              {new Date(a.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-stone-500 mt-0.5">By: {a.actorEmail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 bg-[#fbfaf8] border-t border-[#e8e3d8] flex items-center justify-between">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-100 text-xs font-semibold"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {selectedBooking.bookingStatus !== "cancelled" &&
                    selectedBooking.paymentStatus !== "paid" && (
                      <button
                        onClick={() => {
                          setReconcileModalBooking(selectedBooking);
                          setReconcileRef(`WIRE-${Date.now().toString().slice(-6)}`);
                        }}
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Reconcile Payment
                      </button>
                    )}

                  {selectedBooking.bookingStatus !== "cancelled" &&
                    selectedBooking.bookingStatus !== "completed" && (
                      <button
                        onClick={() => setCancelModalBooking(selectedBooking)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs"
            onClick={() => !isCancelling && setCancelModalBooking(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 bg-red-50/60 border-b border-red-100 flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Cancel Reservation</h3>
                <p className="text-xs text-stone-500">
                  Confirmation required for booking {cancelModalBooking.bookingReference}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Summary details */}
              <div className="bg-[#fbfaf8] border border-stone-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Expedition:</span>
                  <span className="font-semibold text-stone-900">{cancelModalBooking.tour?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Customer:</span>
                  <span className="font-semibold text-stone-900">{cancelModalBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Departure:</span>
                  <span className="font-semibold text-stone-900">{cancelModalBooking.departureDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Amount:</span>
                  <span className="font-bold text-[#124e3f]">
                    {formatPrice(cancelModalBooking.totalPrice, cancelModalBooking.currency)}
                  </span>
                </div>
              </div>

              {/* Policy Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Touroholic Cancellation Terms:</strong> Cancelling releases reserved seats back to the tour inventory. If this reservation was already paid, refund processing must be manually reconciled by the finance desk.
                </p>
              </div>

              {/* Cancellation Reason Input */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="State the reason for cancellation (e.g., customer requested refund, expedition reschedule, health advisory)..."
                  className="w-full p-2.5 bg-[#fbfaf8] border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Policy Acknowledgement */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cancelPolicyAck}
                  onChange={(e) => setCancelPolicyAck(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-[11px] text-stone-600">
                  I understand this action cancels the reservation, updates inventory, and notifies the traveler.
                </span>
              </label>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-100 text-xs font-semibold"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isCancelling || cancelReason.trim().length < 3}
                onClick={handleConfirmCancel}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cancelling...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Payment Reminder Modal */}
      {reminderModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs"
            onClick={() => !isSendingReminder && setReminderModalBooking(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-amber-50/60 border-b border-amber-100 flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-100 text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Send Payment Reminder</h3>
                <p className="text-[11px] text-stone-500">
                  Ref: {reminderModalBooking.bookingReference}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-stone-600">
                You are about to send an urgent payment reminder to:
              </p>

              <div className="bg-[#fbfaf8] border border-stone-200 rounded-xl p-3.5 space-y-1 text-xs">
                <div>
                  <span className="text-stone-400 text-[11px]">Recipient:</span>{" "}
                  <strong className="text-stone-900">{reminderModalBooking.guestEmail}</strong>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px]">Amount Due:</span>{" "}
                  <strong className="text-amber-800">
                    {formatPrice(reminderModalBooking.totalPrice, reminderModalBooking.currency)}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px]">Due Date:</span>{" "}
                  <strong className="text-stone-800">
                    {reminderModalBooking.paymentDueAt
                      ? new Date(reminderModalBooking.paymentDueAt).toLocaleString()
                      : "Standard 3-day policy"}
                  </strong>
                </div>
                {reminderModalBooking.lastPaymentReminderSentAt && (
                  <div className="text-[11px] text-stone-400 pt-1 border-t border-stone-200">
                    Last sent on: {new Date(reminderModalBooking.lastPaymentReminderSentAt).toLocaleString()}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-stone-500">
                The reminder creates an in-app alert for the traveler and dispatches an email notification through the configured delivery service.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSendingReminder}
                onClick={() => setReminderModalBooking(null)}
                className="px-4 py-1.5 border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingReminder}
                onClick={handleConfirmReminder}
                className="px-4 py-1.5 bg-[#124e3f] hover:bg-[#0c382d] text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {isSendingReminder ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Dispatch Reminder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Reconciliation Modal */}
      {reconcileModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs"
            onClick={() => !isReconciling && setReconcileModalBooking(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-emerald-50/60 border-b border-emerald-100 flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-800">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Audited Payment Reconciliation</h3>
                <p className="text-[11px] text-stone-500">
                  Verify & record payment for {reconcileModalBooking.bookingReference}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-[#fbfaf8] border border-stone-200 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-stone-400 text-[11px]">Amount to Reconcile:</span>
                  <div className="text-base font-bold text-[#124e3f]">
                    {formatPrice(reconcileModalBooking.totalPrice, reconcileModalBooking.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 text-[11px]">Traveler:</span>
                  <div className="font-semibold text-stone-800">{reconcileModalBooking.guestName}</div>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Payment Reference / Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reconcileRef}
                  onChange={(e) => setReconcileRef(e.target.value)}
                  placeholder="e.g. WIRE-837492, STRIPE-ch_3M..., BANK-9921"
                  className="w-full p-2 bg-[#fbfaf8] border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#124e3f]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Payment Channel / Method
                </label>
                <select
                  value={reconcileMethod}
                  onChange={(e) => setReconcileMethod(e.target.value)}
                  className="w-full p-2 bg-[#fbfaf8] border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#124e3f]"
                >
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Credit Card">Credit Card Terminal</option>
                  <option value="Counter Cash">Cash at Office / Front Desk</option>
                  <option value="UPI / Online Transfer">UPI / Instant Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Audit Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="Document payment receipt, bank statement matching, or authorization code..."
                  className="w-full p-2 bg-[#fbfaf8] border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-[#124e3f]"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isReconciling}
                onClick={() => setReconcileModalBooking(null)}
                className="px-4 py-1.5 border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReconciling || reconcileRef.trim().length < 3 || reconcileNotes.trim().length < 5}
                onClick={handleConfirmReconciliation}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {isReconciling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                  </>
                ) : (
                  "Record Verified Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
