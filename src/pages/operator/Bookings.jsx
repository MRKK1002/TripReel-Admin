import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
} from "lucide-react";
import { operatorTripBookingsAPI } from "../../services/api";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-700 border-green-200",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};

function StatusBadge({ status }) {
  const Icon = STATUS_ICONS[status] || Clock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

// ── Booking Detail Modal ──────────────────────────────────────────────────────
function DetailModal({ booking, onClose, onCancelled }) {
  const snap = booking.snapshot || {};
  const p = booking.pricing || {};
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelErr, setCancelErr] = useState("");

  const tripStarted = snap.startDate && new Date(snap.startDate) <= new Date();
  const canCancel =
    ["CONFIRMED", "PENDING"].includes(booking.status) && !tripStarted;

  const doCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelErr("Please provide a reason.");
      return;
    }
    setCancelling(true);
    setCancelErr("");
    try {
      await operatorTripBookingsAPI.cancelBooking(
        booking._id,
        cancelReason.trim(),
      );
      onCancelled?.();
      onClose();
    } catch (err) {
      setCancelErr(err.response?.data?.message || "Cancel failed.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {booking.bookingId}
            </h2>
            <StatusBadge status={booking.status} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* User */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">
              Customer
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {booking.userId?.name || "—"}
            </p>
            <p className="text-xs text-gray-500">
              {booking.userId?.phone || booking.userId?.email}
            </p>
          </div>

          {/* Trip */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">
              Trip Details
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {snap.packageTitle}
            </p>
            <p className="text-xs text-gray-500">{snap.packageLocation}</p>
            <p className="text-xs text-gray-500 mt-1">
              {fmt(snap.startDate)} → {fmt(snap.endDate)}
              {snap.batchLabel ? ` · ${snap.batchLabel}` : ""}
            </p>
            <p className="text-xs text-gray-500">
              {booking.seats} seat{booking.seats !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Traveler names */}
          {booking.travelerNames?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Traveler Names
              </p>
              {booking.travelerNames.map((n, i) => (
                <p key={i} className="text-sm text-gray-700">
                  #{i + 1} {n}
                </p>
              ))}
            </div>
          )}

          {/* Pricing */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
              Pricing
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{fmtMoney(p.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST ({p.gstPercent}%)</span>
                <span>{fmtMoney(p.gstAmount)}</span>
              </div>
              {p.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="text-xs">Coupon ({p.couponCode})</span>
                  <span className="text-xs">-{fmtMoney(p.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1">
                <span>Total Paid</span>
                <span>{fmtMoney(p.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-teal-600 text-xs mt-1">
                <span>
                  Your earnings (after {p.platformFeePercent}% platform fee)
                </span>
                <span className="font-semibold">
                  {fmtMoney(p.operatorAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Travelers */}
          {booking.travelers?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                Travelers ({booking.travelers.length})
              </p>
              <div className="space-y-2">
                {booking.travelers.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-800">
                      {t.name || "—"}
                    </span>
                    {t.gender && (
                      <span className="text-xs text-gray-400">{t.gender}</span>
                    )}
                    {t.age > 0 && (
                      <span className="text-xs text-gray-400">Age {t.age}</span>
                    )}
                    {t.age > 0 && t.age <= 7 && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        Child
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status notes */}
          {booking.status === "CONFIRMED" && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
              Booking confirmed. Earnings will be released 2 days after trip
              ends.
            </div>
          )}
          {booking.status === "CANCELLED" && booking.cancelReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs font-semibold text-red-700 mb-1">
                Cancellation Reason
              </p>
              <p className="text-xs text-red-800">{booking.cancelReason}</p>
            </div>
          )}

          {/* Cancel action */}
          {canCancel && (
            <div className="border-t border-gray-100 pt-4">
              {!showCancel ? (
                <button
                  onClick={() => setShowCancel(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100"
                >
                  Cancel This Booking
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Cancelling gives the customer a <strong>100% refund</strong>
                    . Admin will be notified. This cannot be undone.
                  </div>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={2}
                    placeholder="Reason for cancellation (required)…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                  {cancelErr && (
                    <p className="text-xs text-red-600">{cancelErr}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancel(false)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={doCancel}
                      disabled={cancelling}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                    >
                      {cancelling ? "Cancelling…" : "Confirm Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OperatorBookings() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await operatorTripBookingsAPI.getMine(params);
      setBookings(res.data.bookings || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, fromDate, toDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const totalPages = Math.ceil(total / limit);

  // Summary counts
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500">
            Bookings made for your packages
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: total, color: "bg-gray-50 border-gray-200" },
          {
            label: "Pending",
            value: pending,
            color: "bg-yellow-50 border-yellow-200",
          },
          {
            label: "Confirmed",
            value: confirmed,
            color: "bg-green-50 border-green-200",
          },
          {
            label: "Page",
            value: `${page}/${totalPages || 1}`,
            color: "bg-teal-50 border-teal-200",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} border rounded-xl p-3`}
          >
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className="text-xl font-bold text-gray-800 mt-0.5">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${statusFilter === s ? "bg-teal-500 text-white border-teal-500" : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"}`}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Search + date filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-teal-500"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              className="text-xs text-gray-500 hover:text-red-500 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Booking ID
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Package
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Trip Dates
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Seats
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Your Earnings
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr
                    key={b._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                      {b.bookingId}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">
                        {b.userId?.name || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {b.userId?.phone || b.userId?.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 max-w-[150px] truncate">
                        {b.snapshot?.packageTitle || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {b.snapshot?.packageLocation}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmt(b.snapshot?.startDate)} →{" "}
                        {fmt(b.snapshot?.endDate)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-3 h-3" /> {b.seats}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-teal-700">
                      {fmtMoney(b.pricing?.operatorAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
              {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedBooking && (
        <DetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancelled={fetchBookings}
        />
      )}
    </div>
  );
}
