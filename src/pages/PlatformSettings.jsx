import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { platformSettingsAPI, cronAPI } from "../services/api";

const SETTING_DESCRIPTIONS = {
  platform_fee_percent:
    "Percentage cut TripReel takes from every confirmed booking. Applied to booking subtotal.",
  gst_percent:
    "GST applied on booking subtotal. Shown to users in pricing breakdown.",
};

export default function PlatformSettings() {
  const [settings, setSettings] = useState([]);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [loading, setLoading] = useState(true);
  const [cronLoading, setCronLoading] = useState(false);
  const [cronResult, setCronResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await platformSettingsAPI.getAll();
      const s = res.data.settings || [];
      setSettings(s);
      const vals = {};
      s.forEach((item) => {
        vals[item.key] = String(item.value);
      });
      setEditing(vals);
    } catch (err) {
      console.warn("Settings fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key) => {
    const val = editing[key];
    const num = Number(val);
    if (isNaN(num) || num < 0) {
      setErrors((e) => ({ ...e, [key]: "Must be a non-negative number" }));
      return;
    }
    setSaving((s) => ({ ...s, [key]: true }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setSuccess((s) => ({ ...s, [key]: false }));
    try {
      await platformSettingsAPI.update(key, num);
      setSuccess((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSuccess((s) => ({ ...s, [key]: false })), 2500);
      fetchSettings();
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [key]: err.response?.data?.message || "Save failed",
      }));
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const handleRunCron = async () => {
    setCronLoading(true);
    setCronResult(null);
    try {
      const res = await cronAPI.run();
      setCronResult({
        success: true,
        message: res.data.message,
        results: res.data.results,
      });
    } catch (err) {
      setCronResult({
        success: false,
        message: err.response?.data?.message || "Cron failed",
      });
    } finally {
      setCronLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Platform Settings
          </h1>
          <p className="text-sm text-gray-500">
            Configure fees and automated jobs
          </p>
        </div>
      </div>

      {/* Fee Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Fee Configuration
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Changes apply to new bookings only — existing bookings retain their
            original fee snapshot
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {settings.map((item) => (
              <div key={item.key} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {SETTING_DESCRIPTIONS[item.key] || ""}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary-600">
                    {item.value}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center flex-1 border border-gray-300 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary-400">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editing[item.key] ?? ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          [item.key]: e.target.value,
                        }))
                      }
                      className="flex-1 px-4 py-2.5 text-sm outline-none"
                    />
                    <span className="px-3 text-sm text-gray-400 font-medium">
                      %
                    </span>
                  </div>
                  <button
                    onClick={() => handleSave(item.key)}
                    disabled={saving[item.key]}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {saving[item.key] ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : success[item.key] ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {success[item.key] ? "Saved!" : "Save"}
                  </button>
                </div>

                {errors[item.key] && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors[item.key]}
                  </div>
                )}

                {item.updatedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last updated:{" "}
                    {new Date(item.updatedAt).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cron Jobs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Automated Jobs
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Runs automatically daily at midnight. Trigger manually here to run
            immediately.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              <p className="text-sm font-semibold text-gray-800">
                Booking Status Updater
              </p>
            </div>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1 pl-1">
              <li>
                Auto-completes CONFIRMED bookings where the trip end date has
                passed
              </li>
              <li>
                Auto-cancels PENDING bookings where the booking deadline has
                passed
              </li>
            </ul>

            <button
              onClick={handleRunCron}
              disabled={cronLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors mt-2"
            >
              {cronLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {cronLoading ? "Running…" : "Run Now"}
            </button>
          </div>

          {cronResult && (
            <div
              className={`p-4 rounded-xl border text-sm ${cronResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}
            >
              <p className="font-semibold">{cronResult.message}</p>
              {cronResult.results?.errors?.length > 0 && (
                <ul className="mt-2 text-xs list-disc list-inside">
                  {cronResult.results.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
