import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Package,
  AlertCircle,
  X,
  Eye,
} from "lucide-react";
import { adminTripBookingsAPI } from "../services/api";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-700 border-green-200",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}
    >
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
function BookingModal({ booking, onClose, onStatusChanged }) {
  const [action, setAction] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action) {
      setError("Select an action.");
      return;
    }
    if (action === "CANCELLED" && !cancelReason.trim()) {
      setError("Please provide a cancellation reason.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await adminTripBookingsAPI.updateStatus(
        booking._id,
        action,
        cancelReason.trim(),
      );
      onStatusChanged();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const p = booking.pricing || {};
  const batch = booking.batchId || {};
  const snap = booking.snapshot || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {booking.bookingId}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {snap.packageTitle || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <StatusBadge status={booking.status} />

          {/* User */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              User
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {booking.userId?.name || "—"}
            </p>
            <p className="text-xs text-gray-500">{booking.userId?.email}</p>
            {booking.userId?.phone && (
              <p className="text-xs text-gray-500">{booking.userId.phone}</p>
            )}
          </div>

          {/* Trip */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              Trip
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {snap.packageTitle} — {snap.packageLocation}
            </p>
            <p className="text-xs text-gray-500">
              {fmt(snap.startDate)} → {fmt(snap.endDate)}
              {snap.batchLabel ? ` · ${snap.batchLabel}` : ""}
            </p>
            <p className="text-xs text-gray-500">
              {booking.seats} seat{booking.seats !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Money Flow Breakdown */}
          {(() => {
            const addonAmount = p.addonAmount || 0;
            const addonSurcharge = booking.addonSurcharge || 0;
            const addonBase = Math.max(0, addonAmount - addonSurcharge);
            const fareSub = p.fareSubtotal ?? p.subtotal ?? 0;
            const platformKeeps =
              (p.platformFeeAmount || 0) + (p.gstAmount || 0);

            // Settlement status
            let settle = null;
            if (booking.status === "CANCELLED") {
              settle = {
                color: "bg-red-50 text-red-700 border-red-200",
                text: "Booking cancelled — see Refunds page for refund details.",
              };
            } else if (
              booking.status === "COMPLETED" &&
              booking.walletReleased
            ) {
              settle = {
                color: "bg-green-50 text-green-700 border-green-200",
                text: `Operator paid ₹${Number(p.operatorAmount || 0).toLocaleString("en-IN")} (escrow released).`,
              };
            } else if (booking.status === "COMPLETED") {
              settle = {
                color: "bg-amber-50 text-amber-700 border-amber-200",
                text: "Trip completed — operator payout releasing (2 days after trip end).",
              };
            } else if (booking.status === "CONFIRMED") {
              const rel = snap.endDate
                ? new Date(
                    new Date(snap.endDate).getTime() + 2 * 86400000,
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "2 days after trip ends";
              settle = {
                color: "bg-blue-50 text-blue-700 border-blue-200",
                text: `In escrow — operator gets ₹${Number(p.operatorAmount || 0).toLocaleString("en-IN")} on ${rel}.`,
              };
            }

            return (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                  Money Flow
                </p>

                {/* What customer paid */}
                <p className="text-[11px] font-semibold text-gray-500 mb-1">
                  CUSTOMER PAID
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trip fare</span>
                    <span>{fmtMoney(fareSub)}</span>
                  </div>
                  {addonAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Add-ons (held)</span>
                      <span>{fmtMoney(addonAmount)}</span>
                    </div>
                  )}
                  {p.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-xs">Coupon ({p.couponCode})</span>
                      <span className="text-xs">
                        -{fmtMoney(p.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST ({p.gstPercent}%)</span>
                    <span>{fmtMoney(p.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1">
                    <span>Total Paid</span>
                    <span>{fmtMoney(p.totalAmount)}</span>
                  </div>
                </div>

                {/* Where it goes */}
                <p className="text-[11px] font-semibold text-gray-500 mt-3 mb-1">
                  WHERE IT GOES
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-teal-700">🧑‍✈️ Operator earnings</span>
                    <span className="font-semibold text-teal-700">
                      {fmtMoney(p.operatorAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      🏢 Platform fee ({p.platformFeePercent}%)
                    </span>
                    <span>{fmtMoney(p.platformFeeAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">🧾 GST (to govt)</span>
                    <span>{fmtMoney(p.gstAmount)}</span>
                  </div>
                  {addonBase > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">📷 Snapja (add-on)</span>
                      <span>{fmtMoney(addonBase)}</span>
                    </div>
                  )}
                  {addonSurcharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        ↳ incl. outside-city surcharge (operator)
                      </span>
                      <span className="text-xs text-gray-400">
                        {fmtMoney(addonSurcharge)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-400 border-t border-gray-200 pt-1 mt-1">
                    <span>Platform retains (fee + GST)</span>
                    <span>{fmtMoney(platformKeeps)}</span>
                  </div>
                </div>

                {/* Settlement status */}
                {settle && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg border text-xs font-medium ${settle.color}`}
                  >
                    {settle.text}
                  </div>
                )}
              </div>
            );
          })()}

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

          {/* Operator */}
          {booking.operatorId && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Operator
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {booking.operatorId.businessName ||
                  booking.operatorId.contactName}
              </p>
              <p className="text-xs text-gray-500">
                {booking.operatorId.email}
              </p>
            </div>
          )}

          {/* Cancellation info */}
          {booking.status === "CANCELLED" && booking.cancelReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs font-semibold text-red-700 mb-1">
                Cancellation Reason
              </p>
              <p className="text-sm text-red-800">{booking.cancelReason}</p>
            </div>
          )}

          {/* Action form — only for PENDING/CONFIRMED */}
          {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 border-t border-gray-100 pt-4"
            >
              <p className="text-sm font-semibold text-gray-800">
                Update Status
              </p>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{" "}
                  {error}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {booking.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAction("CONFIRMED");
                      setError("");
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-colors border-green-300 bg-green-50 text-green-700 hover:bg-green-100 ${action === "CONFIRMED" ? "ring-2 ring-green-400 ring-offset-1" : ""}`}
                  >
                    <CheckCircle className="w-4 h-4" /> Confirm
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAction("CANCELLED");
                    setError("");
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-colors border-red-300 bg-red-50 text-red-700 hover:bg-red-100 ${action === "CANCELLED" ? "ring-2 ring-red-400 ring-offset-1" : ""}`}
                >
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              </div>
              {action === "CANCELLED" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <input
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation…"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading || !action}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${action === "CONFIRMED" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : action === "CONFIRMED" ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Confirm Booking
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> Cancel Booking
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TripBookings() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await adminTripBookingsAPI.getAll(params);
      setBookings(res.data.bookings || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Bookings</h1>
          <p className="text-sm text-gray-500">
            Manage and confirm user bookings
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${statusFilter === s ? "bg-primary-500 text-white border-primary-500" : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"}`}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500"
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
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
                    User
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
                    Amount
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">
                    Actions
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
                      <p className="font-medium text-gray-800 max-w-[160px] truncate">
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
                    <td className="px-5 py-3.5 font-semibold text-gray-800">
                      {fmtMoney(b.pricing?.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
              of {total}
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
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChanged={() => {
            fetchBookings();
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
}
