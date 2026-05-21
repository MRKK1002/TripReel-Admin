import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  Play,
  MapPin,
  Eye,
  EyeOff,
  Search,
  Video,
  Tag,
} from "lucide-react";
import Modal from "../components/Modal";
import { reelsAPI } from "../services/api";
import { useApi } from "../hooks/useApi";

const BADGES = ["Popular", "Trending", "New", "Featured", ""];

const badgeColors = {
  Popular: "bg-blue-100 text-blue-700",
  Trending: "bg-orange-100 text-orange-700",
  New: "bg-green-100 text-green-700",
  Featured: "bg-purple-100 text-purple-700",
};

const emptyForm = {
  title: "",
  location: "",
  badge: "Popular",
  video: "",
  thumbnail: "",
  user: { name: "", avatar: "", role: "" },
  isActive: true,
  order: 0,
};

// ── Reel card ─────────────────────────────────────────────────────────────────
function ReelCard({ reel, onEdit, onDelete, onToggle }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
      {/* Video */}
      <div
        className="relative bg-gray-900 aspect-[9/16] max-h-72 overflow-hidden cursor-pointer"
        onClick={toggle}
      >
        {reel.video ? (
          <video
            ref={videoRef}
            src={reel.video}
            poster={reel.thumbnail || undefined}
            className="w-full h-full object-cover"
            loop
            playsInline
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <Video className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Play/pause */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${playing ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
        >
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            {playing ? (
              <div className="flex gap-1">
                <span className="w-1.5 h-5 bg-white rounded-full" />
                <span className="w-1.5 h-5 bg-white rounded-full" />
              </div>
            ) : (
              <Play className="w-6 h-6 text-white ml-1" fill="white" />
            )}
          </div>
        </div>

        {/* Badge */}
        {reel.badge && (
          <span
            className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${badgeColors[reel.badge] || "bg-gray-100 text-gray-700"}`}
          >
            {reel.badge}
          </span>
        )}

        {/* Inactive */}
        {!reel.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-red-500 px-3 py-1 rounded-full">
              Inactive
            </span>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(reel);
            }}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white shadow-md"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(reel);
            }}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white shadow-md"
          >
            {reel.isActive ? (
              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-green-500" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(reel._id);
            }}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-red-50 shadow-md"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="font-semibold text-gray-800 text-sm truncate">
          {reel.title}
        </p>
        {reel.location && (
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <MapPin className="w-3 h-3" /> {reel.location}
          </div>
        )}
        {reel.user?.name && (
          <div className="flex items-center gap-2 pt-1.5 border-t border-gray-50">
            {reel.user.avatar ? (
              <img
                src={reel.user.avatar}
                alt={reel.user.name}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700 flex-shrink-0">
                {reel.user.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {reel.user.name}
              </p>
              {reel.user.role && (
                <p className="text-[10px] text-gray-400 truncate">
                  {reel.user.role}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Reels() {
  const [reels, setReels] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const videoFileRef = useRef(null);
  const thumbFileRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { loading: saving, error, run } = useApi();

  const fetchReels = async () => {
    try {
      const res = await reelsAPI.getAll({ limit: 100 });
      setReels(res.data.reels || []);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const filtered = reels.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.location || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openAdd = () => {
    setEditingReel(null);
    setForm(emptyForm);
    setVideoFile(null);
    setVideoPreview("");
    setThumbFile(null);
    setThumbPreview("");
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const openEdit = (reel) => {
    setEditingReel(reel);
    setForm({
      title: reel.title,
      location: reel.location || "",
      badge: reel.badge || "",
      video: reel.video || "",
      thumbnail: reel.thumbnail || "",
      user: {
        name: reel.user?.name || "",
        avatar: reel.user?.avatar || "",
        role: reel.user?.role || "",
      },
      isActive: reel.isActive,
      order: reel.order || 0,
    });
    setVideoFile(null);
    setVideoPreview(reel.video || "");
    setThumbFile(null);
    setThumbPreview(reel.thumbnail || "");
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReel(null);
    setVideoFile(null);
    setVideoPreview("");
    setThumbFile(null);
    setThumbPreview("");
  };

  const onVideoChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
  };

  const onThumbChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (!editingReel && !videoFile && !form.video) return;

    await run(async () => {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("location", form.location);
      fd.append("badge", form.badge);
      fd.append("isActive", form.isActive);
      fd.append("order", form.order);
      fd.append("user", JSON.stringify(form.user));

      if (form.video && !videoFile) fd.append("video", form.video);
      if (form.thumbnail && !thumbFile) fd.append("thumbnail", form.thumbnail);
      if (videoFile) fd.append("video", videoFile);
      if (thumbFile) fd.append("thumbnail", thumbFile);

      const axiosConfig = {
        onUploadProgress: (e) =>
          setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      };

      if (editingReel) {
        await reelsAPI.update(editingReel._id, fd, axiosConfig);
      } else {
        await reelsAPI.create(fd, axiosConfig);
      }
      await fetchReels();
      closeModal();
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this reel?")) return;
    await run(async () => {
      await reelsAPI.delete(id);
      setReels((prev) => prev.filter((r) => r._id !== id));
    });
  };

  const handleToggle = async (reel) => {
    const fd = new FormData();
    fd.append("isActive", !reel.isActive);
    await reelsAPI.update(reel._id, fd);
    setReels((prev) =>
      prev.map((r) =>
        r._id === reel._id ? { ...r, isActive: !r.isActive } : r,
      ),
    );
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setUser = (key, val) =>
    setForm((f) => ({ ...f, user: { ...f.user, [key]: val } }));

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reels</h1>
          <p className="text-gray-500 mt-1">
            Manage travel video reels shown in the app
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
            {reels.length} Reels
          </span>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> Add Reel
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none flex-1 text-gray-700 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Video className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-600">
            No reels yet
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Click "Add Reel" to upload your first video
          </p>
          <button
            onClick={openAdd}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Reel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((reel) => (
            <ReelCard
              key={reel._id}
              reel={reel}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
          <button
            onClick={openAdd}
            className="group border-2 border-dashed border-gray-200 rounded-2xl aspect-[9/16] max-h-72 flex flex-col items-center justify-center gap-2 hover:border-primary-400 hover:bg-primary-50/40 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary-500 transition-colors" />
            </div>
            <p className="text-xs font-semibold text-gray-400 group-hover:text-primary-600 transition-colors">
              Add Reel
            </p>
          </button>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingReel ? "Edit Reel" : "Add New Reel"}
      >
        <div className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Video upload */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-primary-500" /> Video File{" "}
              {!editingReel && "*"}
            </label>
            {videoPreview ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  src={videoPreview}
                  controls
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview("");
                    set("video", "");
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => videoFileRef.current.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                  <Upload className="w-7 h-7 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600 group-hover:text-primary-600 transition-colors">
                    Click to upload video
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    MP4, MOV, AVI, WEBM · Max 200 MB
                  </p>
                </div>
              </div>
            )}
            <input
              ref={videoFileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={onVideoChange}
            />

            {/* Progress bar */}
            {saving && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail (optional)
            </label>
            {thumbPreview ? (
              <div className="relative h-28 rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={thumbPreview}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setThumbFile(null);
                    setThumbPreview("");
                    set("thumbnail", "");
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => thumbFileRef.current.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center gap-2 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all text-gray-400 hover:text-primary-500"
              >
                <Upload className="w-4 h-4" />
                <span className="text-xs font-medium">
                  Upload thumbnail image
                </span>
              </div>
            )}
            <input
              ref={thumbFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onThumbChange}
            />
          </div>

          {/* Title + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Street Food Crawl"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Delhi"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Badge + Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge
              </label>
              <select
                value={form.badge}
                onChange={(e) => set("badge", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b || "— None —"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Creator info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Creator Info
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.user.name}
                  onChange={(e) => setUser("name", e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Role / Title
                </label>
                <input
                  type="text"
                  value={form.user.role}
                  onChange={(e) => setUser("role", e.target.value)}
                  placeholder="e.g. Food Expert"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Avatar URL
              </label>
              <input
                type="text"
                value={form.user.avatar}
                onChange={(e) => setUser("avatar", e.target.value)}
                placeholder="https://randomuser.me/api/portraits/women/23.jpg"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
              {form.user.avatar && (
                <img
                  src={form.user.avatar}
                  alt="Avatar preview"
                  className="mt-2 w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                />
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Active</p>
              <p className="text-xs text-gray-400">Show this reel in the app</p>
            </div>
            <button
              onClick={() => set("isActive", !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.isActive ? "bg-primary-500" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.isActive ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                saving ||
                !form.title.trim() ||
                (!editingReel && !videoFile && !form.video)
              }
              className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingReel ? "Update Reel" : "Save Reel"}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
