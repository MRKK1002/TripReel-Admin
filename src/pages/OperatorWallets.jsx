import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Eye,
  X,
} from "lucide-react";
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

const TX_COLORS = {
  CREDIT: "text-green-600 bg-green-50",
  DEBIT: "text-red-500 bg-red-50",
  WITHDRAWAL: "text-blue-600 bg-blue-50",
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
function WalletDetailModal({ operatorId, operatorName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    walletAdminAPI
      .getByOperator(operatorId)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [operatorId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {operatorName}
            </h2>
            <p className="text-xs text-gray-400">
              Wallet & Transaction History
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No wallet data found
            </p>
          ) : (
            <>
              {/* Balance summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Balance",
                    value: fmtMoney(data.wallet?.balance),
                    color: "text-teal-700",
                  },
                  {
                    label: "Total Earned",
                    value: fmtMoney(data.wallet?.totalEarned),
                    color: "text-green-700",
                  },
                  {
                    label: "Withdrawn",
                    value: fmtMoney(data.wallet?.totalWithdrawn),
                    color: "text-blue-700",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-gray-50 rounded-xl p-3 text-center"
                  >
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className={`text-sm font-bold mt-1 ${s.color}`}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent transactions */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Recent Transactions
                </p>
                {data.recentTransactions?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No transactions yet
                  </p>
                ) : (
                  <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                    {data.recentTransactions?.map((tx) => (
                      <div
                        key={tx._id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${TX_COLORS[tx.type] || "bg-gray-100 text-gray-600"}`}
                          >
                            {tx.type}
                          </span>
                          <div>
                            <p className="text-sm text-gray-700">
                              {tx.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {fmt(tx.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${tx.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}
                          >
                            {tx.type === "CREDIT" ? "+" : "−"}
                            {fmtMoney(tx.amount)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Bal: {fmtMoney(tx.balanceAfter)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OperatorWallets() {
  const [wallets, setWallets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const limit = 20;

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await walletAdminAPI.getAll({ page, limit });
      setWallets(res.data.wallets || []);
      setTotal(res.data.total || 0);
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const totalPages = Math.ceil(total / limit);
  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operator Wallets</h1>
          <p className="text-sm text-gray-500">
            Earnings owed to operators across the platform
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4" />
          <p className="text-sm text-teal-100">
            Total Operator Payouts Pending
          </p>
        </div>
        <p className="text-3xl font-bold">{fmtMoney(totalBalance)}</p>
        <p className="text-xs text-teal-200 mt-1">
          Across {total} operator wallets
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wallet className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No wallets yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Operator
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Balance
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Total Earned
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">
                    Withdrawn
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {wallets.map((w) => (
                  <tr key={w._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">
                        {w.operatorId?.businessName ||
                          w.operatorId?.contactName ||
                          "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {w.operatorId?.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-teal-700">
                      {fmtMoney(w.balance)}
                    </td>
                    <td className="px-5 py-3.5 text-green-700 font-semibold">
                      {fmtMoney(w.totalEarned)}
                    </td>
                    <td className="px-5 py-3.5 text-blue-600">
                      {fmtMoney(w.totalWithdrawn)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <button
                          onClick={() =>
                            setSelected({
                              id: w.operatorId?._id,
                              name:
                                w.operatorId?.businessName ||
                                w.operatorId?.contactName,
                            })
                          }
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

      {selected && (
        <WalletDetailModal
          operatorId={selected.id}
          operatorName={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
