import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, FileText, CheckCircle,
  AlertCircle, XCircle, Clock, ThumbsUp, ThumbsDown,
  RefreshCw, User, MapPin, Building2, Landmark, ShieldCheck,
} from "lucide-react";
import { adminOperatorsAPI } from "../services/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATE_LABELS = {
  DRAFT:            "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED:         "Approved",
  REJECTED:         "Rejected",
  SUSPENDED:        "Suspended",
};

const STATE_COLORS = {
  DRAFT:            "bg-gray-100 text-gray-700 border-gray-200",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED:         "bg-green-100 text-green-700 border-green-200",
  REJECTED:         "bg-red-100 text-red-700 border-red-200",
  SUSPENDED:        "bg-orange-100 text-orange-700 border-orange-200",
};

const DOCUMENT_LABELS = {
  governmentId:       "Government ID (Aadhaar / Passport / DL)",
  selfieVerification: "Selfie Verification",
  tradeLicense:       "Trade License",
  panCard:            "PAN Card",
};

const DOCUMENT_PATHS = {
  governmentId:       "governmentId",
  selfieVerification: "selfieVerification",
  tradeLicense:       "tradeLicensePath",
  panCard:            "panCardPath",
};

const DOC_STATUS_COLORS = {
  PENDING:          "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED:         "bg-green-50 text-green-700 border-green-200",
  REJECTED:         "bg-red-50 text-red-700 border-red-200",
  REUPLOAD_REQUIRED:"bg-orange-50 text-orange-700 border-orange-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function StateBadge({ state }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${STATE_COLORS[state] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {STATE_LABELS[state] || state}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function formatDate(ts) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OperatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [note, setNote] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [docRemarks, setDocRemarks] = useState({});
  const [docLoading, setDocLoading] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminOperatorsAPI.getById(id);
      setOperator(res.data.operator);
    } catch (err) {
      setFetchError(err.response?.data?.message || "Failed to load operator.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const doTransition = async (newState) => {
    if (!note.trim() && (newState === "REJECTED" || newState === "SUSPENDED")) {
      setActionError("Please enter a reason before rejecting or suspending.");
      return;
    }
    setActionError("");
    setActionSuccess("");
    setActionLoading(newState);
    try {
      const res = await adminOperatorsAPI.transitionState(id, { newState, note: note.trim() || `Status changed to ${STATE_LABELS[newState]}` });
      setOperator(res.data.operator);
      setNote("");
      setActionSuccess(`Status updated to "${STATE_LABELS[newState]}".`);
    } catch (err) {
      setActionError(err.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading("");
    }
  };

  const doDocStatus = async (key, status) => {
    const remark = (docRemarks[key] || "").trim();
    if ((status === "REJECTED" || status === "REUPLOAD_REQUIRED") && !remark) {
      setActionError(`Please enter a remark for ${DOCUMENT_LABELS[key]} before rejecting.`);
      return;
    }
    setActionError("");
    setActionSuccess("");
    setDocLoading(`${key}:${status}`);
    try {
      const res = await adminOperatorsAPI.updateDocumentStatus(id, { key, status, remark });
      setOperator(res.data.operator);
      setDocRemarks(prev => ({ ...prev, [key]: "" }));
      setActionSuccess(`${DOCUMENT_LABELS[key]} marked as ${status.replace(/_/g, " ").toLowerCase()}.`);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update document.");
    } finally {
      setDocLoading("");
    }
  };

  // ── Loading states ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (fetchError || !operator) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-gray-600">{fetchError || "Operator not found."}</p>
      <button onClick={() => navigate("/operators")} className="text-sm text-primary-600 hover:underline">Back to list</button>
    </div>
  );

  const history = [...(operator.transitionHistory || [])].reverse();
  const isPending = operator.onboardingState === "PENDING_APPROVAL";
  const isApproved = operator.onboardingState === "APPROVED";
  const isRejected = operator.onboardingState === "REJECTED";
  const isSuspended = operator.onboardingState === "SUSPENDED";

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate("/operators")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-0.5 flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {operator.businessName || operator.contactName}
            </h1>
            <StateBadge state={operator.onboardingState} />
          </div>
          <p className="text-sm text-gray-500">
            {operator.email} · Registered {formatDate(operator.createdAt)}
          </p>
        </div>
        <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Feedback */}
      {actionSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-sm text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {actionError}
        </div>
      )}

      {/* ── Documents Section ── */}
      <Section title="Document Review" icon={ShieldCheck}>
        <p className="text-sm text-gray-500 mb-4">
          Review each document individually. Add a remark before rejecting or requesting re-upload.
        </p>
        <div className="space-y-4">
          {Object.entries(DOCUMENT_LABELS).map(([key, label]) => {
            const filePath = operator[DOCUMENT_PATHS[key]];
            const docStatus = operator.documentStatus?.[key];
            const status = docStatus?.status || (filePath ? "PENDING" : null);
            const remark = docStatus?.remark;
            const isDocLoading = (s) => docLoading === `${key}:${s}`;

            return (
              <div key={key} className={`rounded-xl border p-4 ${filePath ? "border-gray-200 bg-gray-50" : "border-dashed border-gray-200 bg-gray-50"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 flex-shrink-0 ${filePath ? "text-teal-500" : "text-gray-300"}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      {status && (
                        <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${DOC_STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {status.replace(/_/g, " ")}
                        </span>
                      )}
                      {remark && <p className="text-xs text-gray-500 mt-1">Remark: {remark}</p>}
                    </div>
                  </div>
                  {filePath ? (
                    <a href={`http://localhost:5001${filePath}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700">
                      <ExternalLink className="w-3.5 h-3.5" /> View Document
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Not uploaded</span>
                  )}
                </div>

                {filePath && status !== "APPROVED" && (
                  <>
                    <input
                      value={docRemarks[key] || ""}
                      onChange={e => setDocRemarks(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Remark for ${label} (required for reject/re-upload)`}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 bg-white mb-3"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => doDocStatus(key, "APPROVED")}
                        disabled={!!docLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 transition-colors">
                        {isDocLoading("APPROVED") ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button onClick={() => doDocStatus(key, "REUPLOAD_REQUIRED")}
                        disabled={!!docLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors">
                        {isDocLoading("REUPLOAD_REQUIRED") ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Request Re-upload
                      </button>
                      <button onClick={() => doDocStatus(key, "REJECTED")}
                        disabled={!!docLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors">
                        {isDocLoading("REJECTED") ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                    </div>
                  </>
                )}

                {filePath && status === "APPROVED" && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" /> Document approved
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Final Approval ── */}
      {(isPending || isApproved || isRejected || isSuspended) && (
        <Section title="Final Decision" icon={ThumbsUp}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Note <span className="text-gray-400 font-normal">(required for rejection / suspension)</span>
            </label>
            <textarea
              value={note}
              onChange={e => { setNote(e.target.value); setActionError(""); }}
              rows={3}
              placeholder="Add a note for the operator…"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {!isApproved && (
              <button onClick={() => doTransition("APPROVED")}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white disabled:opacity-60 transition-colors">
                {actionLoading === "APPROVED" ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                Approve Operator
              </button>
            )}
            {!isRejected && !isApproved && (
              <button onClick={() => doTransition("REJECTED")}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 transition-colors">
                {actionLoading === "REJECTED" ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject Application
              </button>
            )}
            {isApproved && !isSuspended && (
              <button onClick={() => doTransition("SUSPENDED")}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60 transition-colors">
                {actionLoading === "SUSPENDED" ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                Suspend Account
              </button>
            )}
            {isSuspended && (
              <button onClick={() => doTransition("APPROVED")}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white disabled:opacity-60 transition-colors">
                {actionLoading === "APPROVED" ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Reinstate Account
              </button>
            )}
          </div>
        </Section>
      )}

      {/* ── Business Profile ── */}
      <Section title="Business Profile" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Contact Name"  value={operator.contactName} />
          <InfoRow label="Business Name" value={operator.businessName} />
          <InfoRow label="Email"         value={operator.email} />
          <InfoRow label="Phone"         value={operator.phone} />
          <InfoRow label="Business Type" value={operator.businessType?.replace(/_/g, " ") || "—"} />
          <InfoRow label="GST Number"    value={operator.gstNumber} />
        </div>
      </Section>

      {/* ── Location ── */}
      <Section title="Location" icon={MapPin}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoRow label="Country" value={operator.country} />
          <InfoRow label="State"   value={operator.state} />
          <InfoRow label="City"    value={operator.city} />
          <div className="sm:col-span-3">
            <InfoRow label="Operating Destinations" value={(operator.mainOperatingDestinations || []).join(", ")} />
          </div>
        </div>
      </Section>

      {/* ── Bank Details ── */}
      <Section title="Bank Details" icon={Landmark}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Account Holder" value={operator.accountHolderName} />
          <InfoRow label="Bank Name"      value={operator.bankName} />
          <InfoRow label="Account Number" value={operator.accountNumber} />
          <InfoRow label="IFSC Code"      value={operator.ifscCode} />
          <InfoRow label="UPI ID"         value={operator.upiId} />
        </div>
      </Section>

      {/* ── Transition History ── */}
      {history.length > 0 && (
        <Section title="Review History" icon={Clock}>
          <div className="space-y-4">
            {history.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    entry.toState === "APPROVED" ? "bg-green-400" :
                    entry.toState === "REJECTED" || entry.toState === "SUSPENDED" ? "bg-red-400" : "bg-amber-400"
                  }`} />
                  {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-4 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StateBadge state={entry.toState} />
                    <span className="text-xs text-gray-400">from <span className="font-medium text-gray-500">{STATE_LABELS[entry.fromState] || entry.fromState}</span></span>
                  </div>
                  {entry.note && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-1">{entry.note}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
