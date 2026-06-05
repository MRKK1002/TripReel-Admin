import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Calendar,
  Users,
  Wallet,
  Star,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  MapPin,
  BarChart3,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";
import {
  operatorPackagesAPI,
  operatorBatchesAPI,
  operatorTripBookingsAPI,
  operatorWalletAPI,
} from "../../services/api";

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

export default function OperatorDashboard() {
  const { operator, operatorLoading } = useOperatorAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPackages: 0,
    approvedPackages: 0,
    totalBatches: 0,
    upcomingBatches: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    walletBalance: 0,
    totalEarned: 0,
    recentBookings: [],
    upcomingBatchList: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (operatorLoading) return;
    if (!operator) {
      navigate("/login", { replace: true });
      return;
    }
    if (operator.onboardingState !== "APPROVED") {
      navigate("/operator/status", { replace: true });
      return;
    }

    const fetchStats = async () => {
      try {
        const [pkgRes, batchRes, bookingRes, walletRes] = await Promise.all([
          operatorPackagesAPI.getMine(),
          operatorBatchesAPI.getMine(),
          operatorTripBookingsAPI.getMine({ limit: 5 }),
          operatorWalletAPI.get(),
        ]);

        const packages = pkgRes.data.packages || [];
        const batches = batchRes.data.batches || [];
        const bookings = bookingRes.data.bookings || [];
        const wallet = walletRes.data.wallet || {};

        const now = new Date();
        const upcoming = batches
          .filter((b) => new Date(b.startDate) > now)
          .slice(0, 3);

        setStats({
          totalPackages: packages.length,
          approvedPackages: packages.filter((p) => p.status === "APPROVED")
            .length,
          totalBatches: batches.length,
          upcomingBatches: upcoming.length,
          totalBookings: bookingRes.data.total || bookings.length,
          confirmedBookings: bookings.filter((b) => b.status === "CONFIRMED")
            .length,
          completedBookings: bookings.filter((b) => b.status === "COMPLETED")
            .length,
          walletBalance: wallet.balance || 0,
          totalEarned: wallet.totalEarned || 0,
          recentBookings: bookings.slice(0, 5),
          upcomingBatchList: upcoming,
        });
      } catch {}
      setLoading(false);
    };

    fetchStats();
  }, [operator, operatorLoading, navigate]);

  if (operatorLoading || loading || !operator) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
        <p className="text-sm text-teal-100">Welcome back,</p>
        <h1 className="text-2xl font-bold mt-1">
          {operator.businessName || operator.contactName}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <CheckCircle className="w-4 h-4 text-teal-200" />
          <span className="text-sm text-teal-100">Account fully active</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Packages",
            value: stats.totalPackages,
            sub: `${stats.approvedPackages} approved`,
            icon: Package,
            color: "bg-blue-50 text-blue-600",
            link: "/operator/packages",
          },
          {
            label: "Active Batches",
            value: stats.upcomingBatches,
            sub: `${stats.totalBatches} total`,
            icon: Calendar,
            color: "bg-purple-50 text-purple-600",
            link: "/operator/batches",
          },
          {
            label: "Total Bookings",
            value: stats.totalBookings,
            sub: `${stats.confirmedBookings} confirmed`,
            icon: Users,
            color: "bg-orange-50 text-orange-600",
            link: "/operator/bookings",
          },
          {
            label: "Wallet Balance",
            value: fmtMoney(stats.walletBalance),
            sub: `${fmtMoney(stats.totalEarned)} earned`,
            icon: Wallet,
            color: "bg-green-50 text-green-600",
            link: "/operator/wallet",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={() => navigate(stat.link)}
            className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div
              className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              Recent Bookings
            </h2>
            <button
              onClick={() => navigate("/operator/bookings")}
              className="text-sm text-teal-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {stats.recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No bookings yet
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentBookings.map((b) => (
                <div
                  key={b._id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {b.userId?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {b.snapshot?.packageTitle || "—"} · {b.seats} seat
                        {b.seats > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-teal-700">
                      {fmtMoney(b.pricing?.operatorAmount)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.status === "CONFIRMED"
                          ? "bg-green-50 text-green-600"
                          : b.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Batches */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              Upcoming Batches
            </h2>
            <button
              onClick={() => navigate("/operator/batches")}
              className="text-sm text-teal-600 hover:underline flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {stats.upcomingBatchList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No upcoming batches
            </p>
          ) : (
            <div className="space-y-3">
              {stats.upcomingBatchList.map((b) => {
                const left = (b.totalSeats || 0) - (b.bookedSeats || 0);
                return (
                  <div key={b._id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {b.packageId?.title || "Package"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {fmt(b.startDate)} → {fmt(b.endDate)}{" "}
                          {b.label ? `· ${b.label}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-teal-700">
                          {fmtMoney(b.adultPrice)}
                        </p>
                        <p
                          className={`text-xs font-medium ${left <= 3 ? "text-orange-500" : "text-gray-500"}`}
                        >
                          {left}/{b.totalSeats} seats left
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Account Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Business Name", value: operator.businessName || "—" },
            { label: "Contact Name", value: operator.contactName },
            { label: "Email", value: operator.email },
            { label: "Phone", value: operator.phone || "—" },
            { label: "Business Type", value: operator.businessType || "—" },
            {
              label: "Operating In",
              value: operator.mainOperatingDestinations?.join(", ") || "—",
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
