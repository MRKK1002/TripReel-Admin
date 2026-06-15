import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Calendar,
  Edit2,
  Trash2,
  Copy,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
} from "lucide-react";
import {
  operatorBatchesAPI,
  operatorPackagesAPI,
  resolveImageUrl,
  operatorTripBookingsAPI,
} from "../../services/api";

const inp =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toInputDate(d) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

const emptyBatch = {
  startDate: "",
  endDate: "",
  bookingDeadline: "",
  adultPrice: "",
  childPrice: "",
  totalSeats: "",
  label: "",
};

// ── Batch Form Modal ──────────────────────────────────────────────────────────
function BatchModal({ packageId, batch, durationDays = 0, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    batch
      ? {
          startDate: toInputDate(batch.startDate),
          endDate: toInputDate(batch.endDate),
          bookingDeadline: toInputDate(batch.bookingDeadline),
          adultPrice: batch.adultPrice ?? "",
          childPrice: batch.childPrice ?? "",
          totalSeats: batch.totalSeats ?? "",
          label: batch.label || "",
        }
      : emptyBatch,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => {
    setForm((f) => {
      const updated = { ...f, [k]: v };
      // Auto-clamp: bookingDeadline can't exceed startDate
      if (k === "startDate" && updated.bookingDeadline > v) {
        updated.bookingDeadline = v;
      }
      if (
        k === "bookingDeadline" &&
        updated.startDate &&
        v > updated.startDate
      ) {
        updated.bookingDeadline = updated.startDate;
      }
      // Auto-calculate endDate from startDate + package durationDays
      if (k === "startDate" && v && durationDays > 0) {
        const start = new Date(v);
        const end = new Date(start);
        end.setDate(start.getDate() + durationDays);
        updated.endDate = end.toISOString().split("T")[0];
      }
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.startDate || !form.endDate || !form.bookingDeadline) {
      setError("Start date, end date, and booking deadline are required.");
      return;
    }
    if (!form.adultPrice || Number(form.adultPrice) <= 0) {
      setError("Adult price must be greater than 0.");
      return;
    }
    if (!form.totalSeats || Number(form.totalSeats) < 1) {
      setError("Total seats must be at least 1.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        packageId,
        startDate: form.startDate,
        endDate: form.endDate,
        bookingDeadline: form.bookingDeadline,
        adultPrice: Number(form.adultPrice),
        childPrice: Number(form.childPrice) || 0,
        totalSeats: Number(form.totalSeats),
        label: form.label.trim(),
      };

      if (batch) {
        await operatorBatchesAPI.update(batch._id, payload);
      } else {
        await operatorBatchesAPI.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {batch ? "Edit Batch" : "Add New Batch"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={form.startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => set("startDate", e.target.value)}
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => set("endDate", e.target.value)}
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Booking Deadline *
              <span className="ml-1 text-gray-400 font-normal">
                (must be ≤ start date)
              </span>
            </label>
            <input
              type="date"
              value={form.bookingDeadline}
              min={new Date().toISOString().split("T")[0]}
              max={form.startDate || undefined}
              onChange={(e) => set("bookingDeadline", e.target.value)}
              className={inp}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Adult Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                placeholder="8999"
                value={form.adultPrice}
                onChange={(e) => set("adultPrice", e.target.value)}
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Child Price (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="5999"
                value={form.childPrice}
                onChange={(e) => set("childPrice", e.target.value)}
                className={inp}
              />
            </div>
          </div>

          {/* Seats */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Total Seats *
              </label>
              <input
                type="number"
                min="1"
                placeholder="20"
                value={form.totalSeats}
                onChange={(e) => set("totalSeats", e.target.value)}
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Batch Label
              </label>
              <input
                type="text"
                placeholder="e.g. Christmas Special"
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
                className={inp}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-600 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {batch ? "Update Batch" : "Add Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Package row with expandable batch list ────────────────────────────────────
function PackageBatchRow({ pkg }) {
  const [expanded, setExpanded] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [error, setError] = useState("");

  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const res = await operatorBatchesAPI.getMine({ packageId: pkg._id });
      setBatches(res.data.batches || []);
    } catch {
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  }, [pkg._id]);

  useEffect(() => {
    if (expanded) fetchBatches();
  }, [expanded, fetchBatches]);

  const handleClone = async (batch) => {
    const today = new Date();
    const newStart = new Date(today);
    newStart.setDate(today.getDate() + 30);
    const newEnd = new Date(newStart);
    newEnd.setDate(
      newStart.getDate() +
        (new Date(batch.endDate) - new Date(batch.startDate)) /
          (1000 * 60 * 60 * 24),
    );

    try {
      await operatorBatchesAPI.clone(batch._id, {
        startDate: newStart.toISOString().split("T")[0],
        endDate: newEnd.toISOString().split("T")[0],
        bookingDeadline: newStart.toISOString().split("T")[0],
        label: batch.label ? `${batch.label} (copy)` : "Copy",
      });
      fetchBatches();
    } catch (err) {
      setError(err.response?.data?.message || "Clone failed.");
    }
  };

  const handleDelete = async (batchId) => {
    if (!window.confirm("Delete this batch?")) return;
    try {
      await operatorBatchesAPI.delete(batchId);
      fetchBatches();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleCancelBatch = async (batch) => {
    const reason = window.prompt(
      `Cancel batch "${batch.label || ""}"? All ${batch.bookedSeats} booking(s) will be cancelled and FULLY refunded. Enter a reason:`,
    );
    if (!reason || !reason.trim()) return;
    try {
      const res = await operatorTripBookingsAPI.cancelBatch(
        batch._id,
        reason.trim(),
      );
      alert(
        `Batch cancelled. ${res.data.cancelledCount} booking(s) refunded (₹${Number(res.data.totalRefund || 0).toLocaleString("en-IN")}).`,
      );
      fetchBatches();
    } catch (err) {
      setError(err.response?.data?.message || "Batch cancellation failed.");
    }
  };

  const isApproved = pkg.status === "APPROVED";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Package header row */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {pkg.image_url ? (
            <img
              src={resolveImageUrl(pkg.image_url)}
              alt={pkg.title}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{pkg.title}</p>
            <p className="text-xs text-gray-400">{pkg.location}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {isApproved ? (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
              Approved
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
              {pkg.status}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded batch list */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {!isApproved && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              Package must be approved before you can add batches.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {error}
            </div>
          )}

          {isApproved && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditBatch(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white text-xs font-semibold rounded-lg hover:bg-teal-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Batch
              </button>
            </div>
          )}

          {loadingBatches ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No batches yet. {isApproved ? "Add your first batch above." : ""}
            </p>
          ) : (
            <div className="space-y-2">
              {batches.map((b) => {
                const remaining = b.totalSeats - b.bookedSeats;
                const isFull = remaining <= 0;
                const isCompleted = new Date(b.endDate) < new Date();
                return (
                  <div
                    key={b._id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${isCompleted ? "bg-gray-50 border-gray-100" : isFull ? "bg-red-50 border-red-100" : "bg-teal-50 border-teal-100"}`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {fmt(b.startDate)} → {fmt(b.endDate)}
                        </p>
                        {b.label && (
                          <span className="text-xs px-1.5 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">
                            {b.label}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                            Completed
                          </span>
                        )}
                        {isFull && !isCompleted && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">
                            FULL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Book by {fmt(b.bookingDeadline)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {remaining}/{b.totalSeats} left
                        </span>
                        <span className="font-semibold text-teal-700">
                          ₹{Number(b.adultPrice).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {!isCompleted && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleClone(b)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-white rounded-lg transition-colors"
                          title="Clone"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {b.bookedSeats > 0 && (
                          <button
                            onClick={() => handleCancelBatch(b)}
                            className="px-2 py-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-500 border border-red-200 rounded-lg transition-colors"
                            title="Cancel batch & refund all"
                          >
                            Cancel & Refund
                          </button>
                        )}
                        {b.bookedSeats === 0 && (
                          <>
                            <button
                              onClick={() => {
                                setEditBatch(b);
                                setShowModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(b._id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <BatchModal
          packageId={pkg._id}
          batch={editBatch}
          durationDays={pkg.durationDays || 0}
          onClose={() => {
            setShowModal(false);
            setEditBatch(null);
          }}
          onSaved={fetchBatches}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OperatorBatches() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await operatorPackagesAPI.getMine();
        setPackages(res.data.packages || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load packages.");
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const approvedPackages = packages.filter((p) => p.status === "APPROVED");
  const otherPackages = packages.filter((p) => p.status !== "APPROVED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Batches</h1>
          <p className="text-sm text-gray-500">
            Add scheduled departures to your approved packages — no re-approval
            needed
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No packages yet</p>
          <p className="text-sm mt-1">
            Create and get a package approved to start adding batches
          </p>
        </div>
      ) : (
        <>
          {/* Approved packages */}
          {approvedPackages.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Approved Packages — Click to manage batches
              </h2>
              {approvedPackages.map((pkg) => (
                <PackageBatchRow key={pkg._id} pkg={pkg} />
              ))}
            </div>
          )}

          {/* Other packages */}
          {otherPackages.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Pending / Draft Packages
              </h2>
              {otherPackages.map((pkg) => (
                <PackageBatchRow key={pkg._id} pkg={pkg} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
