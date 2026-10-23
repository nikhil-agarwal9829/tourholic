"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  ArrowUpRight,
  PieChart,
  BarChart3,
  Clock,
  Compass,
  ChevronRight,
} from "lucide-react";

interface AnalyticsData {
  filterPeriod: string;
  dateField: string;
  metrics: {
    totalBookingValue: number;
    collectedRevenue: number;
    outstandingAmount: number;
    cancelledBookingValue: number;
    refundTotals: number;
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    unpaidBookings: number;
    paidBookings: number;
    pendingBookings: number;
    completedBookings: number;
    averageBookingValue: number;
    currency: string;
  };
  charts: {
    timeSeries: Array<{
      _id: string;
      date: string;
      collectedRevenue: number;
      totalBookings: number;
      bookingValue: number;
    }>;
    revenueByTour: Array<{
      _id: string;
      tourName: string;
      totalRevenue: number;
      totalValue: number;
      bookingsCount: number;
    }>;
    revenueByDestination: Array<{
      _id: string;
      destination: string;
      country: string;
      totalRevenue: number;
      totalValue: number;
      bookingsCount: number;
    }>;
    paymentStatusBreakdown: Array<{
      _id: string;
      status: string;
      count: number;
      amount: number;
    }>;
    bookingStatusBreakdown: Array<{
      _id: string;
      status: string;
      count: number;
      amount: number;
    }>;
  };
}

export default function RevenueAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState("30d");
  const [dateField, setDateField] = useState("createdAt");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      params.set("dateField", dateField);
      if (period === "custom" && startDate) params.set("startDate", startDate);
      if (period === "custom" && endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.status === "success") {
        setData(json.data);
      } else {
        setError(json.message || "Failed to load revenue analytics");
      }
    } catch {
      setError("Network error fetching financial analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [period, dateField, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const metrics = data?.metrics;
  const charts = data?.charts;

  // Maximum value for timeSeries SVG scaling
  const maxSeriesValue = Math.max(
    ...(charts?.timeSeries.map((t) => t.bookingValue) || [100]),
    100
  );

  return (
    <section className="space-y-6">
      {/* Analytics Section Header & Controls */}
      <div className="bg-white rounded-2xl border border-[#e8e3d8] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#124e3f]" />
              <h2 className="font-serif text-2xl font-bold text-[#1c2421]">
                Financial Revenue & Operations Analytics
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Real-time MongoDB aggregation metrics. Unpaid reservations are separated from collected funds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Export Dropdown */}
            <div className="flex items-center gap-1.5">
              <a
                href={`/api/admin/export?type=revenue`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-300 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export Revenue CSV
              </a>
              <Link
                href="/admin/bookings"
                className="px-3.5 py-1.5 bg-[#124e3f] hover:bg-[#0c382d] text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs"
              >
                <span>Manage All Bookings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-400 font-medium">Time Window:</span>
            {[
              { id: "today", label: "Today" },
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Previous Month" },
              { id: "this_year", label: "This Year" },
              { id: "all", label: "All Time" },
              { id: "custom", label: "Custom Range" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  period === p.id
                    ? "bg-[#124e3f] text-white"
                    : "bg-[#fbfaf8] text-stone-600 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Date field toggle */}
            <div className="flex items-center gap-1.5 text-stone-600">
              <span className="text-stone-400">Date by:</span>
              <select
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
                className="bg-[#fbfaf8] border border-stone-200 rounded-lg px-2 py-1 text-xs"
              >
                <option value="createdAt">Booking Date</option>
                <option value="departureDate">Departure Date</option>
              </select>
            </div>

            <button
              onClick={() => fetchAnalytics()}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Custom date range input */}
        {period === "custom" && (
          <div className="flex items-center gap-2 pt-2 text-xs">
            <span className="text-stone-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#fbfaf8] border border-stone-300 rounded-lg px-2 py-1"
            />
            <span className="text-stone-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#fbfaf8] border border-stone-300 rounded-lg px-2 py-1"
            />
            <button
              onClick={fetchAnalytics}
              className="px-3 py-1 bg-[#124e3f] text-white rounded-lg font-semibold"
            >
              Apply Dates
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchAnalytics} className="underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* 6 Key Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* A. Total Booking Value */}
        <div className="bg-white p-5 rounded-2xl border border-[#e8e3d8] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Booking Value</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#124e3f]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
            {formatPrice(metrics?.totalBookingValue ?? 0)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Sum of eligible non-cancelled reservations
          </p>
        </div>

        {/* B. Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow ring-1 ring-emerald-500/10">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800">
              Collected Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-800 mt-2">
            {formatPrice(metrics?.collectedRevenue ?? 0)}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            Verified received payments (less recorded refunds)
          </p>
        </div>

        {/* C. Outstanding Amount */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-800">
              Outstanding Amount
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-800 mt-2">
            {formatPrice(metrics?.outstandingAmount ?? 0)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Pending / unpaid active reservations
          </p>
        </div>

        {/* D. Cancelled Booking Value */}
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs uppercase tracking-wider font-semibold text-red-800">
              Cancelled Booking Value
            </span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-red-800 mt-2">
            {formatPrice(metrics?.cancelledBookingValue ?? 0)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Reported separately; not counted as platform revenue
          </p>
        </div>

        {/* E. Refund Totals */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs uppercase tracking-wider font-semibold text-purple-800">
              Recorded Refunds
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-purple-900 mt-2">
            {formatPrice(metrics?.refundTotals ?? 0)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Actual recorded refunds returned to customers
          </p>
        </div>

        {/* F. Average Booking Value */}
        <div className="bg-white p-5 rounded-2xl border border-[#e8e3d8] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs uppercase tracking-wider font-semibold">Average Booking Value</span>
            <div className="p-2 rounded-xl bg-stone-100 text-stone-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#124e3f] mt-2">
            {formatPrice(metrics?.averageBookingValue ?? 0)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Mean investment across {metrics?.totalBookings ?? 0} total reservations
          </p>
        </div>
      </div>

      {/* Visual Charts & Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Over Time */}
        <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#124e3f]" />
                Collected Revenue & Volume Over Time
              </h3>
              <p className="text-[11px] text-stone-400">
                Grouped by {period === "this_year" || period === "all" ? "Month" : "Day"}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#124e3f] bg-emerald-50 px-2 py-0.5 rounded-full">
              Real DB Aggregations
            </span>
          </div>

          {!charts?.timeSeries || charts.timeSeries.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400">
              No transactions recorded in the selected period window.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="flex items-end gap-2 h-48 border-b border-stone-200 pb-2 overflow-x-auto">
                {charts.timeSeries.map((item, index) => {
                  const barHeight = Math.max(10, Math.round((item.bookingValue / maxSeriesValue) * 160));
                  const collectedBarHeight = Math.max(
                    item.collectedRevenue > 0 ? 8 : 0,
                    Math.round((item.collectedRevenue / maxSeriesValue) * 160)
                  );

                  return (
                    <div
                      key={index}
                      className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center justify-end group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[10px] p-1.5 rounded shadow pointer-events-none z-30 whitespace-nowrap">
                        <div className="font-bold">{item.date}</div>
                        <div>Collected: {formatPrice(item.collectedRevenue)}</div>
                        <div>Total: {formatPrice(item.bookingValue)}</div>
                        <div>Bookings: {item.totalBookings}</div>
                      </div>

                      {/* Stacked bars: Grey Total Value background, Green Collected foreground */}
                      <div className="w-full flex items-end justify-center gap-0.5">
                        <div
                          style={{ height: `${barHeight}px` }}
                          className="w-2.5 bg-stone-200 rounded-t group-hover:bg-stone-300 transition-all"
                        />
                        <div
                          style={{ height: `${collectedBarHeight}px` }}
                          className="w-2.5 bg-[#124e3f] rounded-t group-hover:bg-emerald-700 transition-all"
                        />
                      </div>
                      <span className="text-[9px] text-stone-400 mt-1 truncate max-w-full">
                        {item.date.slice(-5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 text-[11px] text-stone-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-stone-300" /> Total Reserved Value
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#124e3f]" /> Collected Revenue (Paid)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Status Breakdown Distributions */}
        <div className="bg-white p-6 rounded-2xl border border-[#e8e3d8] shadow-sm space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#124e3f]" />
            Status & Lifecycle Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Booking Status Distribution */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="text-xs font-bold text-stone-800 block">Booking Status</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed:
                  </span>
                  <strong className="text-stone-900">{metrics?.confirmedBookings ?? 0}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed:
                  </span>
                  <strong className="text-stone-900">{metrics?.completedBookings ?? 0}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-700 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Cancelled:
                  </span>
                  <strong className="text-stone-900">{metrics?.cancelledBookings ?? 0}</strong>
                </div>
              </div>
            </div>

            {/* Payment Status Distribution */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="text-xs font-bold text-stone-800 block">Payment Status</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Paid:
                  </span>
                  <strong className="text-stone-900">{metrics?.paidBookings ?? 0}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Unpaid / Pending:
                  </span>
                  <strong className="text-stone-900">
                    {(metrics?.unpaidBookings ?? 0) + (metrics?.pendingBookings ?? 0)}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Refunded:
                  </span>
                  <strong className="text-stone-900">
                    {charts?.paymentStatusBreakdown.find((p) => p.status === "refunded")?.count ?? 0}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue by Top Tours */}
          <div className="pt-2 border-t border-stone-100">
            <span className="text-xs font-bold text-stone-800 block mb-2">
              Top Expeditions by Revenue
            </span>
            {!charts?.revenueByTour || charts.revenueByTour.length === 0 ? (
              <p className="text-xs text-stone-400">No tour revenue recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {charts.revenueByTour.slice(0, 4).map((t, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-stone-700 truncate max-w-[240px]" title={t.tourName}>
                      {t.tourName}
                    </span>
                    <span className="font-semibold text-stone-900">
                      {formatPrice(t.totalValue)} ({t.bookingsCount} reservations)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
