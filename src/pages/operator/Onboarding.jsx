import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Plane,
  FileText,
  LogOut,
  User,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";
import { operatorAuthAPI } from "../../services/api";

const DOCUMENT_FIELDS = [
  { key: "gstCertificate", label: "GST Registration Certificate" },
  { key: "pan", label: "PAN Card" },
  { key: "incorporationCertificate", label: "Certificate of Incorporation" },
  { key: "bankProof", label: "Bank Account Proof (Cancelled Cheque)" },
  { key: "tan", label: "TAN Certificate" },
  {
    key: "industryAssociationCertificate",
    label: "Industry Association Certificate",
  },
  {
    key: "liabilityInsuranceCertificate",
    label: "Liability Insurance Certificate",
  },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const STEPS = [
  { icon: User, label: "Register" },
  { icon: ClipboardList, label: "Onboarding" },
  { icon: LayoutDashboard, label: "Dashboard" },
];

export default function OperatorOnboarding() {
  const { operator, operatorLoading, refreshOperator, logout } =
    useOperatorAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    businessName: "",
    registeredAddress: "",
    gstin: "",
    pan: "",
    tan: "",
    bankAccountNumber: "",
  });
  const [files, setFiles] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Guard: if not DRAFT, redirect appropriately
  useEffect(() => {
    if (operatorLoading) return;
    if (!operator) {
      navigate("/operator/login", { replace: true });
      return;
    }
    if (operator.onboardingState !== "DRAFT") {
      if (
        operator.onboardingState === "ACTIVE_PROBATION" ||
        operator.onboardingState === "ACTIVE_FULL"
      ) {
        navigate("/operator/dashboard", { replace: true });
      } else {
        navigate("/operator/status", { replace: true });
      }
    }
  }, [operator, operatorLoading, navigate]);

  if (operatorLoading || !operator || operator.onboardingState !== "DRAFT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleFileChange = (key, file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileErrors((prev) => ({
        ...prev,
        [key]: "Only PDF, JPEG, JPG, or PNG files are allowed.",
      }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileErrors((prev) => ({
        ...prev,
        [key]: "File must not exceed 5 MB.",
      }));
      return;
    }
    setFileErrors((prev) => ({ ...prev, [key]: "" }));
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const hasErrors = Object.values(fileErrors).some((e) => e);
    if (hasErrors) {
      setError("Please fix file errors before submitting.");
      return;
    }
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    Object.entries(files).forEach(([k, f]) => formData.append(k, f));
    setLoading(true);
    try {
      await operatorAuthAPI.submitOnboarding(formData);
      await refreshOperator();
      navigate("/operator/status", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Submission failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">TripReel</h1>
            <p className="text-xs text-gray-400">Operator Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">
            {operator.email}
          </span>
          <button
            onClick={() => {
              logout();
              navigate("/operator/login", { replace: true });
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress stepper */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === 1; // Onboarding is step index 1
            const isDone = i === 0; // Register is done
            return (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isDone
                        ? "bg-teal-500 border-teal-500"
                        : isActive
                        ? "bg-teal-500 border-teal-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-white" : "text-gray-400"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-teal-600" : isDone ? "text-teal-500" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 ${
                      i === 0 ? "bg-teal-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Complete Your Onboarding
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in your business details and upload the required documents.
            Once submitted, our team will review your application.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5">
              Business Details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  key: "businessName",
                  label: "Business Name",
                  placeholder: "Acme Tours Pvt. Ltd.",
                  full: true,
                },
                {
                  key: "registeredAddress",
                  label: "Registered Address",
                  placeholder: "123 MG Road, Mumbai 400001",
                  full: true,
                },
                { key: "gstin", label: "GSTIN", placeholder: "22AAAAA0000A1Z5" },
                { key: "pan", label: "PAN Number", placeholder: "AAAAA0000A" },
                { key: "tan", label: "TAN Number", placeholder: "AAAA00000A" },
                {
                  key: "bankAccountNumber",
                  label: "Bank Account Number",
                  placeholder: "000123456789",
                },
              ].map(({ key, label, placeholder, full }) => (
                <div key={key} className={full ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    required
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Document Uploads */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              Required Documents
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Upload PDF, JPEG, JPG, or PNG. Max 5 MB each.
            </p>
            <div className="space-y-4">
              {DOCUMENT_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
                      files[key]
                        ? "border-teal-400 bg-teal-50"
                        : fileErrors[key]
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileChange(key, e.target.files?.[0])
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-3">
                      {files[key] ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-teal-700">
                              {files[key].name}
                            </p>
                            <p className="text-xs text-teal-500">
                              {(files[key].size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="text-teal-600 font-medium">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">
                              PDF, JPEG, JPG, PNG up to 5 MB
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {fileErrors[key] && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fileErrors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md shadow-teal-500/30"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
