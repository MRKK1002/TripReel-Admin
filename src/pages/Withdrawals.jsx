import { useState, useEffect } from "react";
import { Send, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { walletAdminAPI } from "../services/api";

function fmtMoney(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

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

const STATUS_STYLE = {
  PENDING: "text-amber-600 bg-amber-50",
  PROCESSING: "text-blue-600 bg-blue-50",
  PROCESSED: "text-green-600 bg-green-50",
  REVERSED: "text-orange-600 bg-orange-50",
  FAILED: "text-red-600 bg-red-50",
  CANCELLED: "text-gray-600 bg-gray-100",
};

const STATUSES = [
  "all",
  "PENDING",
  "PROCESSING",
  "PROCESSED",
  "REVERSED",
  "FAILED",
];

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (status !== "all") params.status = status;
      const res = await walletAdminAPI.getWithdrawals(params);
      setWithdrawals(res.data.withdrawals || []);
      setTotal(res.data.total || 0);
    } catch {
      setWithdrawals([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Operator Withdrawals
            </h1>
            <p className="text-sm text-gray-500">
              Payouts made by operators from their wallet
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              status === s
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "All" : s.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Send className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No withdrawals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Operator</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">
                    Destination
                  </th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Payout ID</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {withdrawals.map((w) => (
                  <tr key={w._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">
                        {w.operatorId?.businessName ||
                          w.operatorId?.contactName ||
                          "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {w.operatorId?.email || ""}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-800">
                      {fmtMoney(w.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {w.destination || (w.method === "vpa" ? "UPI" : "Bank")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          STATUS_STYLE[w.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {w.status}
                      </span>
                      {w.failureReason && (
                        <p className="text-[11px] text-red-500 mt-1 max-w-[180px] truncate">
                          {w.failureReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">
                      {w.payoutId || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {fmt(w.createdAt)}
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
              <span className="px-3 py-1 text-sm font-medium">
                {page}/{totalPages}
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
    </div>
  );
}
