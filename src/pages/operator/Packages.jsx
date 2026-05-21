import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Package,
  Clock,
  MapPin,
  Upload,
  ImagePlus,
  Image,
} from "lucide-react";
import { operatorPackagesAPI } from "../../services/api";

const STATUS_LABELS = {
  PENDING: "Pending Review",
  NEEDS_REVISION: "Needs Revision",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  NEEDS_REVISION: "bg-orange-100 text-orange-700 border-orange-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const emptyForm = {
  title: "",
  location: "",
  description: "",
  about: "",
  price: "",
  priceLabel: "",
  badge: "Popular",
  duration: "",
  highlights: [""],
  itinerary: [{ day: 1, title: "", points: [""] }],
  inclusions: [""],
  exclusions: [""],
  addons: [{ name: "", price: "", details: [""] }],
};

// Previews are kept separately (data URLs for display, File objects for upload)
const emptyPreviews = {
  image_url: "",      // data URL or existing URL
  images: ["", "", "", ""], // data URLs or existing URLs
};
const emptyFiles = {
  image_url: null,    // File | null
  images: [null, null, null, null], // File | null
};

const inp =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all";

function TagListEditor({ label, values, onChange }) {
  const update = (i, val) => { const a = [...values]; a[i] = val; onChange(a); };
  const add = () => onChange([...values, ""]);
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input value={v} onChange={(e) => update(i, e.target.value)} className={inp} />
          {values.length > 1 && (
            <button onClick={() => remove(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button onClick={add} className="text-sm text-teal-600 hover:underline font-medium">+ Add</button>
    </div>
  );
}

// ── Package Form Modal ────────────────────────────────────────────────────────
function PackageFormModal({ pkg, onClose, onSaved }) {
  const [form, setForm] = useState(pkg ? {
    ...pkg,
    highlights: pkg.highlights?.length ? pkg.highlights : [""],
    inclusions: pkg.inclusions?.length ? pkg.inclusions : [""],
    exclusions: pkg.exclusions?.length ? pkg.exclusions : [""],
    addons: pkg.addons?.length ? pkg.addons : [{ name: "", price: "", details: [""] }],
    itinerary: pkg.itinerary?.length ? pkg.itinerary : [{ day: 1, title: "", points: [""] }],
  } : emptyForm);

  // File objects for new uploads
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([null, null, null, null]);

  // Preview URLs (existing server URLs or local object URLs)
  const [coverPreview, setCoverPreview] = useState(pkg?.image_url || "");
  const [galleryPreviews, setGalleryPreviews] = useState(
    pkg?.images?.length
      ? [...pkg.images, "", "", "", ""].slice(0, 4)
      : ["", "", "", ""]
  );

  const [tab, setTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleCoverChange = (file) => {
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (file, idx) => {
    if (!file) return;
    const files = [...galleryFiles]; files[idx] = file; setGalleryFiles(files);
    const previews = [...galleryPreviews]; previews[idx] = URL.createObjectURL(file); setGalleryPreviews(previews);
  };

  const removeCover = () => { setCoverFile(null); setCoverPreview(""); };
  const removeGallery = (idx) => {
    const files = [...galleryFiles]; files[idx] = null; setGalleryFiles(files);
    const previews = [...galleryPreviews]; previews[idx] = ""; setGalleryPreviews(previews);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.location.trim() || !form.price) {
      setError("Title, location, and price are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();

      // Scalar fields
      const scalars = ["title", "location", "description", "about", "price",
        "priceLabel", "badge", "duration"];
      scalars.forEach((k) => fd.append(k, form[k] ?? ""));

      // Array fields — send as JSON strings, backend parses them
      ["highlights", "inclusions", "exclusions", "itinerary", "addons"].forEach((k) => {
        const val = Array.isArray(form[k]) ? form[k] : [];
        const filtered = k === "highlights" || k === "inclusions" || k === "exclusions"
          ? val.filter(Boolean)
          : k === "addons" ? val.filter((a) => a.name)
          : val.filter((it) => it.title);
        fd.append(k, JSON.stringify(filtered));
      });

      // Images — new file takes priority, otherwise keep existing URL
      if (coverFile) {
        fd.append("image_url", coverFile);
      } else if (coverPreview) {
        fd.append("existing_image_url", coverPreview);
      }

      galleryFiles.forEach((file, i) => {
        if (file) {
          fd.append("images", file);
        } else if (galleryPreviews[i]) {
          fd.append("existing_images", galleryPreviews[i]);
        }
      });

      let res;
      if (pkg) {
        res = await operatorPackagesAPI.update(pkg._id, fd);
      } else {
        res = await operatorPackagesAPI.create(fd);
      }
      onSaved(res.data.package);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateItinerary = (i, key, val) => {
    const a = [...form.itinerary]; a[i] = { ...a[i], [key]: val }; set("itinerary", a);
  };
  const updateItPoint = (di, pi, val) => {
    const a = [...form.itinerary]; a[di].points[pi] = val; set("itinerary", a);
  };
  const addItPoint = (di) => {
    const a = [...form.itinerary]; a[di].points = [...a[di].points, ""]; set("itinerary", a);
  };
  const removeItPoint = (di, pi) => {
    const a = [...form.itinerary]; a[di].points = a[di].points.filter((_, i) => i !== pi); set("itinerary", a);
  };
  const addDay = () => set("itinerary", [...form.itinerary, { day: form.itinerary.length + 1, title: "", points: [""] }]);
  const removeDay = (i) => set("itinerary", form.itinerary.filter((_, idx) => idx !== i));

  const tabs = ["basic", "details", "itinerary", "media"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {pkg ? "Edit Package" : "Create New Package"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {tab === "basic" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                  <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Bali Honeymoon Package" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Location *</label>
                  <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Bali, Indonesia" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                  <input value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 5 Days - 4 Nights" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="89999" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price Label</label>
                  <input value={form.priceLabel} onChange={(e) => set("priceLabel", e.target.value)} placeholder="From ₹89,999/person" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Badge</label>
                  <select value={form.badge} onChange={(e) => set("badge", e.target.value)} className={inp}>
                    <option value="Popular">Popular</option>
                    <option value="Trending">Trending</option>
                    <option value="New">New</option>
                    <option value="">None</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                  <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief summary shown on cards" className={inp} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">About</label>
                  <textarea value={form.about} onChange={(e) => set("about", e.target.value)} rows={3} placeholder="Detailed description of the package…" className={inp + " resize-none"} />
                </div>
              </div>
            </>
          )}

          {tab === "details" && (
            <div className="space-y-5">
              <TagListEditor label="Highlights" values={form.highlights} onChange={(v) => set("highlights", v)} />
              <TagListEditor label="Inclusions" values={form.inclusions} onChange={(v) => set("inclusions", v)} />
              <TagListEditor label="Exclusions" values={form.exclusions} onChange={(v) => set("exclusions", v)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons</label>
                {form.addons.map((addon, ai) => (
                  <div key={ai} className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
                    <div className="flex gap-2">
                      <input value={addon.name} onChange={(e) => { const a = [...form.addons]; a[ai].name = e.target.value; set("addons", a); }} placeholder="Add-on name" className={inp + " flex-1"} />
                      <input type="number" value={addon.price} onChange={(e) => { const a = [...form.addons]; a[ai].price = e.target.value; set("addons", a); }} placeholder="Price" className={inp + " w-24"} />
                      {form.addons.length > 1 && (
                        <button onClick={() => set("addons", form.addons.filter((_, i) => i !== ai))} className="p-2 text-red-400 hover:text-red-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <TagListEditor label="Details" values={addon.details || [""]} onChange={(v) => { const a = [...form.addons]; a[ai].details = v; set("addons", a); }} />
                  </div>
                ))}
                <button onClick={() => set("addons", [...form.addons, { name: "", price: "", details: [""] }])} className="text-sm text-teal-600 hover:underline font-medium">+ Add Add-on</button>
              </div>
            </div>
          )}

          {tab === "itinerary" && (
            <div className="space-y-4">
              {form.itinerary.map((day, di) => (
                <div key={di} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{day.day || di + 1}</span>
                    </div>
                    <input value={day.title} onChange={(e) => updateItinerary(di, "title", e.target.value)} placeholder={`Day ${di + 1} title`} className={inp + " flex-1"} />
                    {form.itinerary.length > 1 && (
                      <button onClick={() => removeDay(di)} className="p-1.5 text-red-400 hover:text-red-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="pl-11 space-y-2">
                    {day.points.map((pt, pi) => (
                      <div key={pi} className="flex gap-2">
                        <input value={pt} onChange={(e) => updateItPoint(di, pi, e.target.value)} placeholder="Activity or point" className={inp + " flex-1"} />
                        {day.points.length > 1 && (
                          <button onClick={() => removeItPoint(di, pi)} className="p-1.5 text-red-400 hover:text-red-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addItPoint(di)} className="text-sm text-teal-600 hover:underline font-medium">+ Add point</button>
                  </div>
                </div>
              ))}
              <button onClick={addDay} className="flex items-center gap-2 text-sm text-teal-600 hover:underline font-medium">
                <Plus className="w-4 h-4" /> Add Day
              </button>
            </div>
          )}

          {tab === "media" && (
            <div className="space-y-5">
              {/* Cover image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cover Image <span className="text-gray-400 font-normal">(JPEG, PNG, WebP — max 5 MB)</span>
                </label>
                {coverPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={coverPreview} alt="cover" className="w-full h-44 object-cover" />
                    <button
                      type="button"
                      onClick={removeCover}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                    <Upload className="w-7 h-7 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload cover image</span>
                    <span className="text-xs text-gray-400 mt-0.5">or drag and drop</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleCoverChange(e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>

              {/* Gallery images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gallery Images <span className="text-gray-400 font-normal">(up to 4)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx}>
                      {galleryPreviews[idx] ? (
                        <div className="relative rounded-xl overflow-hidden">
                          <img src={galleryPreviews[idx]} alt={`gallery ${idx + 1}`} className="w-full h-28 object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGallery(idx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                          <ImagePlus className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-400">Photo {idx + 1}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleGalleryChange(e.target.files?.[0], idx)}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Upload className="w-4 h-4" /> {pkg ? "Save Changes" : "Submit for Review"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OperatorPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formPkg, setFormPkg] = useState(undefined); // undefined = closed, null = new, obj = edit
  const [viewPkg, setViewPkg] = useState(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await operatorPackagesAPI.getMine();
      setPackages(res.data.packages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPackages(); }, []);

  const handleSaved = (pkg) => {
    setPackages((prev) => {
      const exists = prev.find((p) => p._id === pkg._id);
      return exists ? prev.map((p) => (p._id === pkg._id ? pkg : p)) : [pkg, ...prev];
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this package?")) return;
    try {
      await operatorPackagesAPI.delete(id);
      setPackages((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create packages and submit them for admin review
          </p>
        </div>
        <button
          onClick={() => setFormPkg(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Package
        </button>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-sm text-blue-700">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">How it works</p>
          <p className="text-blue-600 mt-0.5">
            Submit your package for review. The admin will approve it, request changes, or reject it.
            Approved packages are published to the platform with the category assigned by admin.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <Package className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No packages yet</p>
          <p className="text-xs mt-1">Click "New Package" to create your first one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-36 bg-gray-100">
                {pkg.image_url ? (
                  <img src={pkg.image_url} alt={pkg.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[pkg.status] || "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABELS[pkg.status] || pkg.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{pkg.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pkg.location}</span>
                  {pkg.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.duration}</span>}
                </div>
                <p className="text-sm font-bold text-teal-600 mt-2">₹{Number(pkg.price).toLocaleString()}</p>

                {/* Admin note */}
                {pkg.adminNotes && (
                  <div className={`mt-3 p-2.5 rounded-lg border text-xs ${
                    pkg.status === "NEEDS_REVISION"
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : pkg.status === "REJECTED"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-green-50 border-green-200 text-green-700"
                  }`}>
                    <p className="font-semibold mb-0.5 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Admin Note
                    </p>
                    <p>{pkg.adminNotes}</p>
                  </div>
                )}

                {/* Approved category */}
                {pkg.status === "APPROVED" && pkg.approvedCategory && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Published in: <span className="font-semibold">{pkg.approvedCategory}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {(pkg.status === "PENDING" || pkg.status === "NEEDS_REVISION") && (
                    <button
                      onClick={() => setFormPkg(pkg)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {pkg.status === "NEEDS_REVISION" ? "Fix & Resubmit" : "Edit"}
                    </button>
                  )}
                  <button
                    onClick={() => setViewPkg(pkg)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  {pkg.status !== "APPROVED" && (
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="px-3 py-2 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {formPkg !== undefined && (
        <PackageFormModal
          pkg={formPkg}
          onClose={() => setFormPkg(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
