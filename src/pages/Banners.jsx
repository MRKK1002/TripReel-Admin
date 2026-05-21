import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Image,
  Save,
  Upload,
  X,
  Globe,
  MapPin,
  Compass,
} from "lucide-react";
import Modal from "../components/Modal";
import { bannersAPI, uploadAPI } from "../services/api";
import { useApi } from "../hooks/useApi";

const T = {
  teal: "#0d9488",
  tealLight: "#f0fdfa",
  tealMid: "#ccfbf1",
  tealBorder: "#5eead4",
  tealDark: "#0f766e",
  navy: "#0f2231",
  navyMid: "#1a3347",
  white: "#ffffff",
  gray50: "#f8fafc",
  gray100: "#f1f5f9",
  gray200: "#e2e8f0",
  gray400: "#94a3b8",
  gray600: "#475569",
  gray800: "#1e293b",
};

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [isModalOpen, setModal] = useState(false);
  const [editingBanner, setEditing] = useState(null);
  const [formData, setForm] = useState({ image: "", title: "", subtitle: "" });
  const [loaded, setLoaded] = useState({});
  const fileRef = useRef(null);
  const { loading, run } = useApi();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBanners = async () => {
    try {
      const res = await bannersAPI.getAll();
      setBanners(res.data.banners || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ image: "", title: "", subtitle: "" });
    setModal(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({ image: b.image, title: b.title, subtitle: b.subtitle });
    setModal(true);
  };
  const close = () => {
    setModal(false);
    setEditing(null);
    setForm({ image: "", title: "", subtitle: "" });
  };

  const save = async () => {
    if (!formData.image || !formData.title) return;
    await run(async () => {
      // Upload base64 image if needed
      let imageUrl = formData.image;
      if (imageUrl.startsWith("data:")) {
        const res = await uploadAPI.uploadBase64(imageUrl);
        imageUrl = res.data.url;
      }
      const payload = { ...formData, image: imageUrl };
      if (editingBanner) {
        await bannersAPI.update(editingBanner._id, payload);
      } else {
        await bannersAPI.create(payload);
      }
      await fetchBanners();
      close();
    });
  };

  const del = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    await run(async () => {
      await bannersAPI.delete(id);
      setBanners((prev) => prev.filter((b) => b._id !== id));
    });
  };

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => setForm((prev) => ({ ...prev, image: r.result }));
    r.readAsDataURL(f);
  };

  const icons = [Globe, MapPin, Compass];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        .bn-root * { box-sizing: border-box; }
        .bn-root { font-family: 'DM Sans', sans-serif; }
        .bn-card { position:relative; border-radius:20px; overflow:hidden; aspect-ratio:9/16; max-height:360px; background:${T.navyMid}; transition:transform .4s cubic-bezier(.34,1.56,.64,1),box-shadow .4s ease; cursor:pointer; }
        .bn-card:hover { transform:translateY(-7px) scale(1.015); box-shadow:0 28px 56px -10px rgba(13,148,136,.35),0 12px 24px -8px rgba(0,0,0,.3); }
        .bn-img { width:100%; height:100%; object-fit:cover; opacity:0; transition:opacity .45s ease,transform .6s ease; }
        .bn-img.on { opacity:1; }
        .bn-card:hover .bn-img { transform:scale(1.06); }
        .bn-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(10,30,40,.92) 0%,rgba(10,30,40,.38) 55%,rgba(10,30,40,.08) 100%); }
        .bn-acts { position:absolute; top:13px; right:13px; display:flex; gap:8px; opacity:0; transform:translateY(-8px); transition:opacity .22s,transform .22s; }
        .bn-card:hover .bn-acts { opacity:1; transform:translateY(0); }
        .bn-act { width:36px; height:36px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(14px); transition:transform .2s; }
        .bn-act:hover { transform:scale(1.12); }
        .bn-act.edit { background:rgba(255,255,255,.92); }
        .bn-act.del  { background:rgba(239,68,68,.88); }
        .bn-body { position:absolute; bottom:0; left:0; right:0; padding:26px 20px 20px; }
        .bn-tag { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px; margin-bottom:11px; font-size:11px; font-weight:500; letter-spacing:.04em; color:#fff; background:rgba(13,148,136,.35); border:1px solid rgba(94,234,212,.45); backdrop-filter:blur(10px); }
        .bn-title { font-family:'Playfair Display',serif; font-size:23px; font-weight:700; color:#fff; line-height:1.22; margin:0 0 8px; white-space:pre-line; text-shadow:0 2px 14px rgba(0,0,0,.5); }
        .bn-sub { font-size:12.5px; font-weight:300; font-style:italic; color:rgba(255,255,255,.72); line-height:1.5; margin:0; }
        .bn-line { position:absolute; bottom:0; left:0; right:0; height:3px; }
        .bn-add { border-radius:20px; aspect-ratio:9/16; max-height:360px; border:2px dashed ${T.gray200}; background:${T.gray50}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; cursor:pointer; transition:all .3s ease; }
        .bn-add:hover { border-color:${T.teal}; background:${T.tealLight}; transform:translateY(-5px); }
        .bn-add-icon { width:52px; height:52px; border-radius:16px; background:${T.tealMid}; display:flex; align-items:center; justify-content:center; transition:background .3s; }
        .bn-add:hover .bn-add-icon { background:${T.tealBorder}; }
        .bn-count { padding:5px 15px; border-radius:999px; background:${T.tealMid}; color:${T.tealDark}; font-size:13px; font-weight:500; border:1px solid ${T.tealBorder}; }
        .bn-add-btn { display:flex; align-items:center; gap:8px; padding:10px 20px; border-radius:12px; border:none; background:linear-gradient(135deg,${T.teal},${T.tealDark}); color:#fff; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; box-shadow:0 4px 16px rgba(13,148,136,.4); transition:opacity .2s,transform .2s; }
        .bn-add-btn:hover { opacity:.9; transform:translateY(-1px); }
        .fm-label { display:block; font-size:11px; font-weight:500; color:${T.gray400}; letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; }
        .fm-input,.fm-area { width:100%; padding:10px 14px; border:1.5px solid ${T.gray200}; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13.5px; outline:none; color:${T.gray800}; background:#fff; transition:border-color .2s; }
        .fm-input:focus,.fm-area:focus { border-color:${T.teal}; }
        .fm-area { resize:none; }
        .fm-upload-btn { display:flex; align-items:center; gap:7px; padding:10px 16px; border-radius:12px; cursor:pointer; border:1.5px solid ${T.tealBorder}; background:${T.tealLight}; color:${T.tealDark}; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; white-space:nowrap; transition:background .2s; }
        .fm-upload-btn:hover { background:${T.tealMid}; }
        .fm-preview { position:relative; height:155px; border-radius:14px; overflow:hidden; background:${T.gray100}; margin-top:8px; }
        .fm-preview img { width:100%; height:100%; object-fit:cover; }
        .fm-rm { position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:50%; border:none; background:rgba(239,68,68,.88); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform .2s; }
        .fm-rm:hover { transform:scale(1.1); }
        .fm-drop { margin-top:8px; height:145px; border-radius:14px; border:2px dashed ${T.gray200}; background:${T.gray50}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; cursor:pointer; transition:all .25s; }
        .fm-drop:hover { border-color:${T.teal}; background:${T.tealLight}; }
        .fm-cancel { flex:1; padding:12px; border-radius:12px; cursor:pointer; border:1.5px solid ${T.gray200}; background:#fff; color:${T.gray600}; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; transition:background .2s; }
        .fm-cancel:hover { background:${T.gray100}; }
        .fm-save { flex:1; padding:12px; border-radius:12px; border:none; cursor:pointer; background:linear-gradient(135deg,${T.teal},${T.tealDark}); color:#fff; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 14px rgba(13,148,136,.38); transition:opacity .2s,transform .2s; }
        .fm-save:hover { opacity:.9; transform:translateY(-1px); }
        .fm-save:disabled { opacity:.5; cursor:not-allowed; }
      `}</style>

      <div className="bn-root">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 28,
                fontWeight: 700,
                color: T.gray800,
                margin: 0,
              }}
            >
              Welcome Banners
            </h1>
            <p
              style={{
                color: T.gray400,
                fontSize: 14,
                marginTop: 4,
                fontWeight: 400,
              }}
            >
              Manage your app's onboarding experience
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="bn-count">{banners.length} Banners</span>
            <button className="bn-add-btn" onClick={openAdd}>
              <Plus size={16} /> Add Banner
            </button>
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
            gap: 24,
          }}
        >
          {banners.map((b, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={b._id} className="bn-card">
                <img
                  src={b.image}
                  alt={b.title}
                  className={`bn-img${loaded[b._id] ? " on" : ""}`}
                  onLoad={() => setLoaded((p) => ({ ...p, [b._id]: true }))}
                />
                <div className="bn-overlay" />
                <div className="bn-acts">
                  <button className="bn-act edit" onClick={() => openEdit(b)}>
                    <Edit2 size={15} color={T.gray800} />
                  </button>
                  <button className="bn-act del" onClick={() => del(b._id)}>
                    <Trash2 size={15} color="#fff" />
                  </button>
                </div>
                <div className="bn-body">
                  <div className="bn-tag">
                    <Icon size={11} /> Banner {i + 1}
                  </div>
                  <h3 className="bn-title">{b.title}</h3>
                  <p className="bn-sub">{b.subtitle}</p>
                </div>
                <div
                  className="bn-line"
                  style={{ background: b.accent || T.teal }}
                />
              </div>
            );
          })}

          <button className="bn-add" onClick={openAdd}>
            <div className="bn-add-icon">
              <Plus size={24} color={T.tealDark} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: T.teal }}>
              Add Banner
            </span>
            <span style={{ fontSize: 12, color: T.gray400 }}>
              Upload or paste URL
            </span>
          </button>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={close}
          title={editingBanner ? "Edit Banner" : "Add New Banner"}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="fm-label">Banner Image</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  className="fm-input"
                  value={
                    formData.image.startsWith("data:") ? "" : formData.image
                  }
                  onChange={(e) =>
                    setForm((p) => ({ ...p, image: e.target.value }))
                  }
                  placeholder="Paste image URL…"
                />
                <button
                  className="fm-upload-btn"
                  onClick={() => fileRef.current.click()}
                >
                  <Upload size={14} /> Upload
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  style={{ display: "none" }}
                />
              </div>
              {formData.image ? (
                <div className="fm-preview">
                  <img src={formData.image} alt="Preview" />
                  <button
                    className="fm-rm"
                    onClick={() => setForm((p) => ({ ...p, image: "" }))}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  className="fm-drop"
                  onClick={() => fileRef.current.click()}
                >
                  <Image size={28} color={T.gray200} />
                  <span style={{ fontSize: 13, color: T.gray400 }}>
                    Click to upload or paste a URL above
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="fm-label">Title</label>
              <textarea
                className="fm-area"
                rows={2}
                value={formData.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Enter banner title…"
              />
            </div>
            <div>
              <label className="fm-label">Subtitle</label>
              <textarea
                className="fm-area"
                rows={2}
                value={formData.subtitle}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subtitle: e.target.value }))
                }
                placeholder="Enter banner subtitle…"
              />
            </div>
            <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
              <button className="fm-cancel" onClick={close}>
                Cancel
              </button>
              <button
                className="fm-save"
                onClick={save}
                disabled={loading || !formData.image || !formData.title}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={15} /> Save Banner
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
