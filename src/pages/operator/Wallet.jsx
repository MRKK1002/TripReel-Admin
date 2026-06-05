import { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { operatorWalletAPI } from "../../services/api";

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

const TYPE_COLORS = {
  CREDIT: "text-green-600 bg-green-50",
  DEBIT: "text-red-500 bg-red-50",
  WITHDRAWAL: "text-blue-600 bg-blue-50",
};

export default function OperatorWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const limit = 20;

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      try {
        const res = await operatorWalletAPI.get();
        setWallet(res.data.wallet);
      } catch {}
      setLoading(false);
    };
    fetchWallet();
  }, []);

  useEffect(() => {
    const fetchTx = async () => {
      setTxLoading(true);
      try {
        const res = await operatorWalletAPI.getTransactions({ page, limit });
        setTransactions(res.data.transactions || []);
        setTotal(res.data.total || 0);
      } catch {}
      setTxLoading(false);
    };
    fetchTx();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-sm text-gray-500">
            Earnings from confirmed bookings
          </p>
        </div>
      </div>

      {/* Balance cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
            <p className="text-sm text-teal-100 font-medium">
              Available Balance
            </p>
            <p className="text-3xl font-bold mt-1">
              {fmtMoney(wallet?.balance)}
            </p>
            <p className="text-xs text-teal-200 mt-2">Ready for withdrawal</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-sm text-gray-500 font-medium">Total Earned</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {fmtMoney(wallet?.totalEarned)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Lifetime earnings</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-gray-500 font-medium">
                Total Withdrawn
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {fmtMoney(wallet?.totalWithdrawn)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Contact admin to withdraw
            </p>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Transaction History
          </h2>
        </div>

        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400">
            <Wallet className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">
              Earnings appear when admin confirms a booking
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_COLORS[tx.type] || "bg-gray-100 text-gray-600"}`}
                  >
                    {tx.type}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tx.description || "—"}
                    </p>
                    <p className="text-xs text-gray-400">{fmt(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold text-sm ${tx.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}
                  >
                    {tx.type === "CREDIT" ? "+" : "−"}
                    {fmtMoney(tx.amount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Balance: {fmtMoney(tx.balanceAfter)}
                  </p>
                </div>
              </div>
            ))}
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
