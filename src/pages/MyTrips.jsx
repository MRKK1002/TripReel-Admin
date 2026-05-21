import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Calendar,
  MapPin,
  Clock,
  X,
  User,
  Mail,
  Hash,
  Tag,
  ChevronRight,
} from "lucide-react";
import { tripsAPI } from "../services/api";

const statusConfig = {
  Confirmed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  Pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  Cancelled: {
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
    border: "border-red-200",
  },
  Completed: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
};

const tripTypeBadge = {
  Package: { bg: "bg-blue-50", text: "text-blue-600" },
  Adventure: { bg: "bg-orange-50", text: "text-orange-600" },
  Experience: { bg: "bg-purple-50", text: "text-purple-600" },
  Custom: { bg: "bg-gray-50", text: "text-gray-600" },
};

const avatarColors = [
  "#EBF3FF",
  "#F0FDF4",
  "#FEF3C7",
  "#FFF1F2",
  "#F5F3FF",
  "#ECFDF5",
];
const avatarTextColors = [
  "#1A56DB",
  "#16A34A",
  "#B45309",
  "#BE123C",
  "#7C3AED",
  "#059669",
];

function TripDrawer({ trip, onClose }) {
  if (!trip) return null;
  const st = statusConfig[trip.status] || statusConfig.Pending;
  const tt = tripTypeBadge[trip.tripType] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
  };
  const userName = trip.user?.name || "Unknown";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colorIdx = userName.charCodeAt(0) % avatarColors.length;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Trip Details
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Booking #{trip.bookingId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="relative h-48">
            {trip.image ? (
              <img
                src={trip.image}
                alt={trip.tripName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white">{trip.tripName}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-white/75 text-xs">
                <MapPin className="w-3 h-3" />
                {trip.location}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${st.bg} ${st.text} ${st.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {trip.status}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium ${tt.bg} ${tt.text}`}
              >
                {trip.tripType}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Nights", value: trip.nights },
                { label: "Guests", value: trip.guests },
                { label: "Amount", value: `₹${trip.amount?.toLocaleString()}` },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-gray-50 rounded-2xl p-3 text-center"
                >
                  <p className="text-base font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Traveller
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: avatarColors[colorIdx],
                    color: avatarTextColors[colorIdx],
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <p className="font-semibold text-gray-800 text-sm">
                      {userName}
                    </p>
                  </div>
                  {trip.user?.email && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-500">{trip.user.email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Booking Info
              </p>
              {[
                { icon: Hash, label: "Booking ID", value: trip.bookingId },
                {
                  icon: Calendar,
                  label: "Start Date",
                  value: trip.startDate
                    ? new Date(trip.startDate).toLocaleDateString()
                    : "—",
                },
                {
                  icon: Calendar,
                  label: "End Date",
                  value: trip.endDate
                    ? new Date(trip.endDate).toLocaleDateString()
                    : "—",
                },
                { icon: Tag, label: "Trip Type", value: trip.tripType },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{label}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {trip.highlights?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  Trip Highlights
                </p>
                <div className="space-y-2">
                  {trip.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5"
                    >
                      <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <ChevronRight className="w-3 h-3 text-teal-600" />
                      </div>
                      <p className="text-sm text-gray-700">{h}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

function TripRow({ trip, onView }) {
  const st = statusConfig[trip.status] || statusConfig.Pending;
  const tt = tripTypeBadge[trip.tripType] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-px transition-all duration-200">
      <div className="flex items-center px-4 py-3 gap-3 flex-wrap md:flex-nowrap">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          {trip.image ? (
            <img
              src={trip.image}
              alt={trip.tripName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600" />
          )}
        </div>

        {/* Trip info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {trip.tripName}
            </p>
            <span
              className={`text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${tt.bg} ${tt.text}`}
            >
              {trip.tripType}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-[11px] text-gray-500 truncate">
              {trip.location?.split(",")[0]}
            </span>
          </div>
        </div>

        {/* User */}
        <div className="hidden md:flex items-center gap-2 w-40 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-[11px] font-bold text-teal-700 flex-shrink-0">
            {(trip.user?.name || "U")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">
              {trip.user?.name || "—"}
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              {trip.user?.email?.split("@")[0]}@...
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="hidden lg:block w-36 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-[11px] text-gray-600">
              {trip.startDate
                ? new Date(trip.startDate).toLocaleDateString()
                : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 ml-4">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400">
              {trip.nights}n · {trip.guests} guest{trip.guests > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Booking ID */}
        <div className="hidden xl:block w-32 flex-shrink-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
            Booking ID
          </p>
          <p className="text-[11px] font-mono text-gray-700 truncate mt-0.5">
            {trip.bookingId}
          </p>
        </div>

        {/* Amount */}
        <div className="w-24 flex-shrink-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
            Amount
          </p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">
            ₹{trip.amount?.toLocaleString()}
          </p>
        </div>

        {/* Status */}
        <div className="flex-shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${st.bg} ${st.text} ${st.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {trip.status}
          </span>
        </div>

        {/* Action */}
        <div className="flex-shrink-0">
          <button
            onClick={() => onView(trip)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-teal-300 hover:text-teal-600 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
        </div>
      </div>
    </div>
  );
}

function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewTrip, setViewTrip] = useState(null);

  useEffect(() => {
    tripsAPI
      .getAll({ limit: 100 })
      .then((res) => setTrips(res.data.trips || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = trips.filter((trip) => {
    const matchesSearch =
      trip.tripName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.user?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      trip.bookingId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || trip.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: trips.length,
    confirmed: trips.filter((t) => t.status === "Confirmed").length,
    pending: trips.filter((t) => t.status === "Pending").length,
    cancelled: trips.filter((t) => t.status === "Cancelled").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            My Trips
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View and manage all user bookings
          </p>
        </div>
        <div className="flex gap-3">
          {[
            {
              label: "Total",
              value: counts.all,
              color: "text-gray-900",
              bg: "bg-gray-50",
            },
            {
              label: "Confirmed",
              value: counts.confirmed,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Pending",
              value: counts.pending,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} rounded-xl px-4 py-2 text-center min-w-[70px]`}
            >
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 border border-gray-100">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by trip name, traveller or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none flex-1 text-gray-700 text-sm placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 text-sm outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="all">All Status ({counts.all})</option>
            <option value="confirmed">Confirmed ({counts.confirmed})</option>
            <option value="pending">Pending ({counts.pending})</option>
            <option value="cancelled">Cancelled ({counts.cancelled})</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2.5">
          {filtered.map((trip) => (
            <TripRow key={trip._id} trip={trip} onView={setViewTrip} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-700">
            No trips found
          </h3>
          <p className="text-gray-400 text-sm mt-1 max-w-sm">
            Try adjusting your search or filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      <TripDrawer trip={viewTrip} onClose={() => setViewTrip(null)} />
    </div>
  );
}

export default MyTrips;
