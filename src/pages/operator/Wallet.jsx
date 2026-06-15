import { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  CheckCircle,
  AlertCircle,
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

const WD_STATUS = {
  PENDING: "text-amber-600 bg-amber-50",
  PROCESSING: "text-blue-600 bg-blue-50",
  PROCESSED: "text-green-600 bg-green-50",
  REVERSED: "text-orange-600 bg-orange-50",
  FAILED: "text-red-600 bg-red-50",
  CANCELLED: "text-gray-600 bg-gray-100",
};

export default function OperatorWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const limit = 20;

  // Withdrawal modal state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawDone, setWithdrawDone] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const MIN_WITHDRAWAL = 100;

  const fetchWallet = async () => {
    try {
      const res = await operatorWalletAPI.get();
      setWallet(res.data.wallet);
    } catch {}
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await operatorWalletAPI.getWithdrawals({ limit: 10 });
      setWithdrawals(res.data.withdrawals || []);
    } catch {}
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await Promise.all([fetchWallet(), fetchWithdrawals()]);
      setLoading(false);
    };
    run();
  }, [refreshKey]);

  useEffect(() => {
    const fetchTx = async () => {
      setTxLoading(true);
      try {
        const params = { page, limit };
        if (typeFilter !== "all") params.type = typeFilter;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        const res = await operatorWalletAPI.getTransactions(params);
        setTransactions(res.data.transactions || []);
        setTotal(res.data.total || 0);
      } catch {}
      setTxLoading(false);
    };
    fetchTx();
  }, [page, typeFilter, fromDate, toDate, refreshKey]);

  const handleWithdraw = async () => {
    const amt = Math.floor(Number(withdrawAmount));
    setWithdrawError("");
    setWithdrawDone("");
    if (!amt || amt < MIN_WITHDRAWAL) {
      setWithdrawError(`Minimum withdrawal is ${fmtMoney(MIN_WITHDRAWAL)}`);
      return;
    }
    if (amt > Number(wallet?.balance || 0)) {
      setWithdrawError("Amount exceeds your available balance");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await operatorWalletAPI.withdraw({ amount: amt });
      setWithdrawDone(res.data?.message || "Withdrawal initiated successfully");
      setWithdrawAmount("");
      setRefreshKey((k) => k + 1);
      setTimeout(() => {
        setShowWithdraw(false);
        setWithdrawDone("");
      }, 1800);
    } catch (err) {
      setWithdrawError(
        err?.response?.data?.message || "Withdrawal failed. Please try again.",
      );
    } finally {
      setWithdrawing(false);
    }
  };

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
            <button
              onClick={() => {
                setWithdrawError("");
                setWithdrawDone("");
                setWithdrawAmount("");
                setShowWithdraw(true);
              }}
              disabled={Number(wallet?.balance || 0) < MIN_WITHDRAWAL}
              className="mt-3 inline-flex items-center gap-2 bg-white/95 hover:bg-white text-teal-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Withdraw
            </button>
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
              Paid out to your bank/UPI
            </p>
          </div>
        </div>
      )}

      {/* Withdrawals */}
      {withdrawals.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              Recent Withdrawals
            </h2>
            <span className="text-xs text-gray-400">Last 10</span>
          </div>
          <div className="divide-y divide-gray-50">
            {withdrawals.map((w) => (
              <div
                key={w._id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${WD_STATUS[w.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {w.status}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      To{" "}
                      {w.destination || (w.method === "vpa" ? "UPI" : "bank")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmt(w.createdAt)}
                      {w.failureReason ? ` · ${w.failureReason}` : ""}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-sm text-gray-800">
                  {fmtMoney(w.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-800">
            Transaction History
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="all">All types</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-teal-400"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-teal-400"
            />
            {(typeFilter !== "all" || fromDate || toDate) && (
              <button
                onClick={() => {
                  setTypeFilter("all");
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

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Withdraw Money
              </h3>
              <button
                onClick={() => setShowWithdraw(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-teal-50 rounded-xl p-4">
                <p className="text-xs text-teal-700 font-medium">
                  Available Balance
                </p>
                <p className="text-2xl font-bold text-teal-700">
                  {fmtMoney(wallet?.balance)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Amount to withdraw
                </label>
                <div className="mt-1 flex items-center border border-gray-200 rounded-lg px-3 focus-within:ring-2 focus-within:ring-teal-400">
                  <span className="text-gray-500 font-semibold">₹</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Min ${MIN_WITHDRAWAL}`}
                    min={MIN_WITHDRAWAL}
                    className="flex-1 px-2 py-2.5 outline-none text-sm"
                  />
                  <button
                    onClick={() =>
                      setWithdrawAmount(
                        String(Math.floor(Number(wallet?.balance || 0))),
                      )
                    }
                    className="text-xs font-semibold text-teal-600 hover:underline"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Sent to your registered bank account / UPI via RazorpayX.
                </p>
              </div>

              {withdrawError && (
                <div className="flex items-start gap-2 bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}
              {withdrawDone && (
                <div className="flex items-start gap-2 bg-green-50 text-green-600 text-sm rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{withdrawDone}</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {withdrawing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {withdrawing ? "Processing…" : "Withdraw"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
