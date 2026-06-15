import { useState, useEffect } from "react";
import {
  Percent,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Zap,
} from "lucide-react";
import { platformSettingsAPI } from "../services/api";

// Quick presets admins can apply with one click
const PRESETS = {
  Flexible: [
    { daysBeforeTrip: 7, refundPercent: 100 },
    { daysBeforeTrip: 3, refundPercent: 75 },
    { daysBeforeTrip: 1, refundPercent: 50 },
    { daysBeforeTrip: 0, refundPercent: 0 },
  ],
  Moderate: [
    { daysBeforeTrip: 30, refundPercent: 90 },
    { daysBeforeTrip: 15, refundPercent: 75 },
    { daysBeforeTrip: 7, refundPercent: 50 },
    { daysBeforeTrip: 3, refundPercent: 25 },
    { daysBeforeTrip: 0, refundPercent: 0 },
  ],
  Strict: [
    { daysBeforeTrip: 30, refundPercent: 50 },
    { daysBeforeTrip: 15, refundPercent: 25 },
    { daysBeforeTrip: 7, refundPercent: 10 },
    { daysBeforeTrip: 0, refundPercent: 0 },
  ],
};

const SAMPLE_AMOUNT = 10000; // ₹ used for the live example

export default function CancellationSlabs() {
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSlabs();
  }, []);

  const fetchSlabs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformSettingsAPI.getAll();
      const settings = res.data.settings || [];
      const slabSetting = settings.find(
        (s) => s.key === "cancellation_refund_slabs",
      );
      if (slabSetting && Array.isArray(slabSetting.value)) {
        setSlabs(slabSetting.value);
      } else {
        setSlabs([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load slabs");
    } finally {
      setLoading(false);
    }
  };

  const handleSlabChange = (index, field, value) => {
    setSlabs((prev) =>
      prev.map((slab, i) =>
        i === index ? { ...slab, [field]: Number(value) || 0 } : slab,
      ),
    );
    setSuccess("");
  };

  const handleAddSlab = () => {
    setSlabs((prev) => [...prev, { daysBeforeTrip: 0, refundPercent: 0 }]);
    setSuccess("");
  };

  const handleRemoveSlab = (index) => {
    setSlabs((prev) => prev.filter((_, i) => i !== index));
    setSuccess("");
  };

  const applyPreset = (name) => {
    setSlabs(PRESETS[name].map((s) => ({ ...s })));
    setSuccess("");
    setError("");
  };

  // Build a sorted, human-readable preview of the slabs as ranges
  const buildPreview = () => {
    const sorted = [...slabs].sort(
      (a, b) => b.daysBeforeTrip - a.daysBeforeTrip,
    );
    return sorted.map((slab, i) => {
      const upper = sorted[i - 1];
      let range;
      if (i === 0) {
        range = `${slab.daysBeforeTrip}+ days before`;
      } else if (slab.daysBeforeTrip === 0) {
        range = `Less than ${upper.daysBeforeTrip} days / no-show`;
      } else {
        range = `${slab.daysBeforeTrip}–${upper.daysBeforeTrip - 1} days before`;
      }
      return { ...slab, range };
    });
  };

  const validate = () => {
    if (slabs.length === 0) return "Add at least one slab.";
    for (const slab of slabs) {
      if (slab.daysBeforeTrip < 0)
        return "Days before trip cannot be negative.";
      if (slab.refundPercent < 0 || slab.refundPercent > 100)
        return "Refund percentage must be between 0 and 100.";
    }
    // Must have a 0-day catch-all so every cancellation maps to a tier
    if (!slabs.some((s) => Number(s.daysBeforeTrip) === 0))
      return "Add a 0-day tier (the catch-all for last-minute cancellations / no-shows).";
    // Logical check: farther from trip should refund >= closer to trip
    const sorted = [...slabs].sort(
      (a, b) => b.daysBeforeTrip - a.daysBeforeTrip,
    );
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].refundPercent > sorted[i - 1].refundPercent) {
        return `Illogical tiers: cancelling closer to the trip (${sorted[i].daysBeforeTrip} days) cannot refund more than cancelling earlier (${sorted[i - 1].daysBeforeTrip} days).`;
      }
    }
    // Duplicate day thresholds
    const days = sorted.map((s) => s.daysBeforeTrip);
    if (new Set(days).size !== days.length)
      return "Two slabs have the same 'days before trip' value. Make each tier unique.";
    return "";
  };

  const handleSave = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const sorted = [...slabs].sort(
        (a, b) => b.daysBeforeTrip - a.daysBeforeTrip,
      );
      await platformSettingsAPI.update("cancellation_refund_slabs", sorted);
      setSlabs(sorted);
      setSuccess("Cancellation slabs saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save slabs");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const preview = buildPreview();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Percent className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cancellation & Refund Policy
          </h1>
          <p className="text-sm text-gray-500">
            Set how much a customer is refunded based on how early they cancel.
            Applies to all packages platform-wide. Saving here also auto-updates
            the policy text shown to users.
          </p>
        </div>
      </div>

      {/* Quick presets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-800">Quick Presets</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-colors"
            >
              {name}
            </button>
          ))}
          <span className="text-xs text-gray-400 self-center">
            Click to load a template, then fine-tune below.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                Refund Tiers
              </h2>
              <p className="text-xs text-gray-400">
                Higher days = more refund. Sorted automatically on save.
              </p>
            </div>
            <button
              onClick={fetchSlabs}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {slabs.length > 0 && (
              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 mb-3 px-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Days Before Trip
                </p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Refund %
                </p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                  &nbsp;
                </p>
              </div>
            )}

            <div className="space-y-3">
              {slabs.length === 0 ? (
                <div className="text-center py-8">
                  <Percent className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No tiers configured</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Use a preset above or add tiers manually
                  </p>
                </div>
              ) : (
                slabs.map((slab, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={slab.daysBeforeTrip}
                        onChange={(e) =>
                          handleSlabChange(
                            index,
                            "daysBeforeTrip",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                        placeholder="Days"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        days
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={slab.refundPercent}
                        onChange={(e) =>
                          handleSlabChange(
                            index,
                            "refundPercent",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                        placeholder="Refund %"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        %
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveSlab(index)}
                      className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleAddSlab}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Tier
            </button>

            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving || slabs.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving…" : "Save Policy"}
              </button>
            </div>
          </div>
        </div>

        {/* Live preview card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                Customer-Facing Preview
              </h2>
              <p className="text-xs text-gray-400">
                Example on a ₹{SAMPLE_AMOUNT.toLocaleString("en-IN")} booking
              </p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {preview.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Configure tiers to see the preview
              </p>
            ) : (
              preview.map((p, i) => {
                const refundAmt = Math.round(
                  (SAMPLE_AMOUNT * p.refundPercent) / 100,
                );
                const retained = SAMPLE_AMOUNT - refundAmt;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {p.range}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Platform retains ₹{retained.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${p.refundPercent === 0 ? "text-red-500" : "text-green-600"}`}
                      >
                        {p.refundPercent}% back
                      </p>
                      <p className="text-xs text-gray-500">
                        ₹{refundAmt.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> Operator-cancelled trips always refund
                100% regardless of these tiers. Razorpay's payment-gateway fee
                (~2%) is not returned on refunds and is absorbed by the
                platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
