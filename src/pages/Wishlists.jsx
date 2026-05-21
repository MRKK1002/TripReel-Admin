import { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Eye,
  Heart,
  Calendar,
  MapPin,
  X,
  User,
  Mail,
} from "lucide-react";
import { wishlistsAPI } from "../services/api";
import { useApi } from "../hooks/useApi";

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

function WishlistDrawer({ wishlist, onClose }) {
  if (!wishlist) return null;
  const userName = wishlist.user?.name || "Unknown";
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
              Wishlist Details
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Viewing saved items</p>
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
            {wishlist.image ? (
              <img
                src={wishlist.image}
                alt={wishlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white">{wishlist.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-white/80 text-xs">
                  <Heart className="w-3.5 h-3.5 fill-white/80" />
                  {wishlist.packages?.length || 0} saved
                </div>
                {wishlist.location && (
                  <div className="flex items-center gap-1 text-white/70 text-xs">
                    <MapPin className="w-3 h-3" />
                    {wishlist.location}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                User Info
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
                  {wishlist.user?.email && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {wishlist.user.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {wishlist.packages?.length || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">Items Saved</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {wishlist.updatedAt
                    ? new Date(wishlist.updatedAt).toLocaleDateString()
                    : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-1">Last Updated</p>
              </div>
            </div>

            {wishlist.packages?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                  Saved Packages ({wishlist.packages.length})
                </p>
                <div className="space-y-2">
                  {wishlist.packages.map((pkg, i) => (
                    <div
                      key={pkg._id || i}
                      className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: avatarColors[colorIdx],
                          color: avatarTextColors[colorIdx],
                        }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
                        {pkg.title || pkg.name || `Package ${i + 1}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-400 text-xs pb-2">
              <Calendar className="w-3.5 h-3.5" />
              Last updated:{" "}
              <span className="font-medium text-gray-500">
                {wishlist.updatedAt
                  ? new Date(wishlist.updatedAt).toLocaleDateString()
                  : "—"}
              </span>
            </div>
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

function DeleteModal({ wishlist, onConfirm, onCancel }) {
  if (!wishlist) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 text-center">
          Delete wishlist?
        </h3>
        <p className="text-sm text-gray-500 text-center mt-2 mb-6">
          This will permanently remove{" "}
          <span className="font-semibold text-gray-700">"{wishlist.name}"</span>{" "}
          for{" "}
          <span className="font-semibold text-gray-700">
            {wishlist.user?.name}
          </span>
          . This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function WishlistCard({ wishlist, onView, onDelete }) {
  const userName = wishlist.user?.name || "Unknown";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colorIdx = userName.charCodeAt(0) % avatarColors.length;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="relative h-44 overflow-hidden">
        {wishlist.image ? (
          <img
            src={wishlist.image}
            alt={wishlist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <button
            onClick={() => onView(wishlist)}
            title="View details"
            className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white shadow-md transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => onDelete(wishlist)}
            title="Delete wishlist"
            className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-red-50 shadow-md transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-semibold text-white text-base leading-tight">
            {wishlist.name}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <Heart className="w-3.5 h-3.5 fill-white/80" />
              {wishlist.packages?.length || 0} saved
            </div>
            {wishlist.location && (
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <MapPin className="w-3 h-3" />
                {wishlist.location}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{
              backgroundColor: avatarColors[colorIdx],
              color: avatarTextColors[colorIdx],
            }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 text-sm truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {wishlist.user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Updated{" "}
              {wishlist.updatedAt
                ? new Date(wishlist.updatedAt).toLocaleDateString()
                : "—"}
            </span>
          </div>
          <button
            onClick={() => onView(wishlist)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            View →
          </button>
        </div>
      </div>
    </div>
  );
}

function Wishlists() {
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const { run } = useApi();

  useEffect(() => {
    wishlistsAPI
      .getAll()
      .then((res) => setWishlists(res.data.wishlists || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = wishlists.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteConfirm = async () => {
    await run(async () => {
      await wishlistsAPI.delete(deleteItem._id);
      setWishlists((prev) => prev.filter((w) => w._id !== deleteItem._id));
      setDeleteItem(null);
    });
  };

  const totalSaved = wishlists.reduce(
    (acc, w) => acc + (w.packages?.length || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Wishlists
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View and manage all user wishlists
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-center shadow-sm">
              <p className="text-xl font-bold text-gray-900">
                {wishlists.length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Wishlists</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-center shadow-sm">
              <p className="text-xl font-bold text-gray-900">{totalSaved}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total Saved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by wishlist name, user or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none flex-1 text-gray-700 text-sm placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {searchTerm && (
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">{filtered.length}</span>{" "}
            result{filtered.length !== 1 ? "s" : ""} for "{searchTerm}"
          </p>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((wishlist) => (
              <WishlistCard
                key={wishlist._id}
                wishlist={wishlist}
                onView={setViewItem}
                onDelete={setDeleteItem}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-600">
              No wishlists found
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your search term
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      <WishlistDrawer wishlist={viewItem} onClose={() => setViewItem(null)} />
      <DeleteModal
        wishlist={deleteItem}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

export default Wishlists;
