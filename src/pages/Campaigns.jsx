import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Megaphone, Plus, Trash2, Edit3, Eye, Calendar, X } from "lucide-react";
import { campaignsAPI, uploadAPI } from "../services/api";

function fmt(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    ctaText: "View Offer",
    ctaLink: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await campaignsAPI.getAll();
      setCampaigns(res.data?.campaigns || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error("Title, start date, and end date are required");
      return;
    }
    try {
      if (editing) {
        await campaignsAPI.update(editing, form);
        toast.success("Campaign updated");
      } else {
        await campaignsAPI.create(form);
        toast.success("Campaign created!");
      }
      setShowForm(false);
      setEditing(null);
      setForm({
        title: "",
        description: "",
        imageUrl: "",
        ctaText: "View Offer",
        ctaLink: "",
        startDate: "",
        endDate: "",
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this campaign?")) return;
    try {
      await campaignsAPI.delete(id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleEdit = (c) => {
    setEditing(c._id);
    setForm({
      title: c.title,
      description: c.description,
      imageUrl: c.imageUrl,
      ctaText: c.ctaText,
      ctaLink: c.ctaLink,
      startDate: c.startDate
        ? new Date(c.startDate).toISOString().split("T")[0]
        : "",
      endDate: c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await uploadAPI.uploadBase64(reader.result, file.name);
        setForm((f) => ({ ...f, imageUrl: res.data?.url || "" }));
        toast.success("Image uploaded");
      } catch {
        toast.error("Upload failed");
      }
    };
    reader.readAsDataURL(file);
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-sm text-gray-500">
              Create promotional banners for the app
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setForm({
              title: "",
              description: "",
              imageUrl: "",
              ctaText: "View Offer",
              ctaLink: "",
              startDate: "",
              endDate: "",
            });
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800">
              {editing ? "Edit Campaign" : "Create Campaign"}
            </h2>
            <button onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Title *
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Save 10% on summer trips!"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                CTA Button Text
              </label>
              <input
                value={form.ctaText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ctaText: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="View Offer"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Book within 7 days and save..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Start Date *
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                End Date *
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                CTA Link (optional)
              </label>
              <input
                value={form.ctaLink}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ctaLink: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="text-sm"
              />
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt=""
                  className="mt-2 h-20 rounded-lg object-cover"
                />
              )}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {editing ? "Update" : "Create"} Campaign
          </button>
        </div>
      )}

      {/* Campaign List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No campaigns yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const isActive =
              c.isActive &&
              new Date(c.startDate) <= now &&
              new Date(c.endDate) >= now;
            const isUpcoming = new Date(c.startDate) > now;
            const isExpired = new Date(c.endDate) < now;
            return (
              <div
                key={c._id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex"
              >
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt=""
                    className="w-32 h-auto object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{c.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : isUpcoming ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {isActive ? "Live" : isUpcoming ? "Upcoming" : "Expired"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {c.description || "-"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>
                      {fmt(c.startDate)} - {fmt(c.endDate)}
                    </span>
                    <span>{c.impressions} views</span>
                    <span>{c.clicks} clicks</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-2 p-3">
                  <button
                    onClick={() => handleEdit(c)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
