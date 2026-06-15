import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { adminRefundsAPI } from "../services/api";

const REFUND_COLORS = {
  REFUNDED: "bg-green-100 text-green-700 border-green-200",
  PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  MANUAL: "bg-amber-100 text-amber-700 border-amber-200",
  NONE: "bg-gray-100 text-gray-600 border-gray-200",
};

const CANCELLED_BY_LABEL = {
  user: "User",
  operator: "Operator",
  admin: "Admin",
  system: "System",
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function Refunds() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancelledBy, setCancelledBy] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState("");
  const [msg, setMsg] = useState("");
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filter !== "all") params.refundStatus = filter;
      if (cancelledBy !== "all") params.cancelledBy = cancelledBy;
      if (debouncedSearch) params.search = debouncedSearch;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await adminRefundsAPI.getAll(params);
      setBookings(res.data.bookings || []);
      setTotal(res.data.total || 0);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter, cancelledBy, debouncedSearch, fromDate, toDate]);

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleRetry = async (id) => {
    setBusyId(id);
    setMsg("");
    try {
      await adminRefundsAPI.retry(id);
      setMsg("Refund retried successfully.");
      fetchRefunds();
    } catch (err) {
      setMsg(err.response?.data?.message || "Retry failed.");
    } finally {
      setBusyId("");
    }
  };

  const handleMarkDone = async (id) => {
    if (!window.confirm("Mark this refund as completed (paid offline)?"))
      return;
    setBusyId(id);
    setMsg("");
    try {
      await adminRefundsAPI.markDone(id);
      setMsg("Marked as refunded.");
      fetchRefunds();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Cancellations & Refunds
            </h1>
            <p className="text-sm text-gray-500">
              {total} cancelled booking{total !== 1 ? "s" : ""} · refunds are
              automatic; retry only failed ones
            </p>
          </div>
        </div>
        <button
          onClick={fetchRefunds}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", "REFUNDED", "PROCESSING", "FAILED", "MANUAL"].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              filter === f
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Search + cancelled-by + date filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        <select
          value={cancelledBy}
          onChange={(e) => {
            setCancelledBy(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All cancellers</option>
          <option value="user">By User</option>
          <option value="operator">By Operator</option>
          <option value="admin">By Admin</option>
          <option value="system">By System</option>
        </select>
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

      {msg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No cancellations found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const bd = b.refundBreakdown || {};
            return (
              <div
                key={b._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {b.bookingId}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${REFUND_COLORS[b.refundStatus] || REFUND_COLORS.NONE}`}
                      >
                        {b.refundStatus}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Cancelled by {CANCELLED_BY_LABEL[b.cancelledBy] || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 mt-1.5">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      {b.packageId?.title || b.snapshot?.packageTitle || "—"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {b.userId?.name || "—"} · {b.userId?.email || ""} ·{" "}
                      {b.userId?.phone || ""}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Cancelled: {fmt(b.cancelledAt)}
                      {b.cancelReason ? ` · ${b.cancelReason}` : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-rose-600">
                      {money(b.refundAmount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      refunded ({b.refundPercent}%)
                    </p>
                    {b.refundId && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {b.refundId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Breakdown */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <Stat label="Fare refund" value={money(bd.fareRefund)} />
                  <Stat label="GST refund" value={money(bd.gstRefund)} />
                  <Stat label="Addon refund" value={money(bd.addonRefund)} />
                  <Stat
                    label="Operator got"
                    value={money(bd.operatorRetained)}
                    green
                  />
                  <Stat
                    label="Platform kept"
                    value={money(bd.platformRetained)}
                    green
                  />
                </div>

                {b.refundError && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {b.refundError}
                  </p>
                )}

                {/* Actions for failed / manual */}
                {(b.refundStatus === "FAILED" ||
                  b.refundStatus === "MANUAL") && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleRetry(b._id)}
                      disabled={busyId === b._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry Razorpay Refund
                    </button>
                    <button
                      onClick={() => handleMarkDone(b._id)}
                      disabled={busyId === b._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Paid Offline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, green }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`font-semibold ${green ? "text-green-600" : "text-gray-800"}`}
      >
        {value}
      </p>
    </div>
  );
}
