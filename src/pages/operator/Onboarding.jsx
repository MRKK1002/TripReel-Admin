import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  User,
  Building2,
  MapPin,
  ShieldCheck,
  Landmark,
  FileText,
  CheckSquare,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Eye,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";
import { operatorAuthAPI } from "../../services/api";
import { COUNTRIES, INDIA_STATES } from "../../constants/locations";

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Basic Info", icon: User },
  { label: "Business", icon: Building2 },
  { label: "Location", icon: MapPin },
  { label: "Identity", icon: ShieldCheck },
  { label: "Bank Details", icon: Landmark },
  { label: "Documents", icon: FileText },
  { label: "Terms", icon: CheckSquare },
];

const BUSINESS_TYPES = [
  { value: "INDIVIDUAL_GUIDE", label: "Individual Guide" },
  { value: "TOUR_OPERATOR", label: "Tour Operator" },
  { value: "TRAVEL_AGENCY", label: "Travel Agency" },
  { value: "EXPERIENCE_HOST", label: "Experience Host" },
];

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}

function TextField({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all ${
          error
            ? "border-red-300 focus:ring-red-200 focus:border-red-400"
            : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
        }`}
      />
      <FieldError msg={error} />
    </div>
  );
}

function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
  error,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all bg-white ${
          error
            ? "border-red-300 focus:ring-red-200 focus:border-red-400"
            : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
        } ${value ? "text-gray-800" : "text-gray-400"}`}
      >
        <option value="">{placeholder || "Select…"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="text-gray-800">
            {opt}
          </option>
        ))}
      </select>
      <FieldError msg={error} />
    </div>
  );
}

function FileUpload({
  label,
  required,
  fileKey,
  files,
  setFiles,
  accept = ".jpg,.jpeg,.png,.pdf",
  allowedTypes = ALLOWED,
}) {
  const [err, setErr] = useState("");
  const file = files[fileKey];

  const handle = (f) => {
    if (!f) return;
    if (!allowedTypes.includes(f.type)) {
      setErr("Only JPG, PNG or PDF allowed.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setErr("Max 5 MB.");
      return;
    }
    setErr("");
    setFiles((prev) => ({ ...prev, [fileKey]: f }));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
          file
            ? "border-teal-400 bg-teal-50"
            : err
              ? "border-red-300 bg-red-50"
              : "border-gray-200 hover:border-teal-300"
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => handle(e.target.files?.[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {file ? (
              <>
                <Upload className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-teal-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-teal-500">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">
                    <span className="text-teal-600 font-medium">
                      Click to upload
                    </span>{" "}
                    or drag & drop
                  </p>
                  <p className="text-xs text-gray-400">
                    JPG, PNG, PDF · max 5 MB
                  </p>
                </div>
              </>
            )}
          </div>
          {file && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setFiles((prev) => {
                  const n = { ...prev };
                  delete n[fileKey];
                  return n;
                });
              }}
              className="text-gray-400 hover:text-red-500 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <FieldError msg={err} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OperatorOnboarding() {
  const { operator, operatorLoading, refreshOperator, logout } =
    useOperatorAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});

  // Form state
  const [form, setForm] = useState({
    // Step 1
    contactName: "",
    phone: "",
    // Step 2
    businessName: "",
    businessType: "",
    // Step 3
    country: "",
    state: "",
    city: "",
    destinations: "",
    // Step 5
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    upiId: "",
    // Step 6
    gstNumber: "",
    // Step 7
    agreedToPolicies: false,
    confirmedAccuracy: false,
  });
  const [files, setFiles] = useState({});

  // Redirect logic
  useEffect(() => {
    if (operatorLoading) return;
    if (!operator) {
      navigate("/login", { replace: true });
      return;
    }
    if (operator.onboardingState !== "DRAFT") {
      if (operator.onboardingState === "APPROVED") {
        navigate("/operator/dashboard", { replace: true });
      } else {
        navigate("/operator/status", { replace: true });
      }
    }
  }, [operator, operatorLoading, navigate]);

  useEffect(() => {
    if (operator) {
      setForm((prev) => ({
        ...prev,
        contactName: operator.contactName || "",
        phone: operator.phone || "",
      }));
    }
  }, [operator]);

  if (operatorLoading || !operator || operator.onboardingState !== "DRAFT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // ── Validation per step ───────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.contactName.trim()) e.contactName = "Full name is required.";
      else if (form.contactName.trim().length < 2)
        e.contactName = "Please enter a valid full name.";
      const phoneDigits = (form.phone || "").replace(/\D/g, "");
      if (!form.phone.trim()) e.phone = "Mobile number is required.";
      else if (phoneDigits.length !== 10)
        e.phone = "Mobile number must be exactly 10 digits.";
    }
    if (step === 1) {
      if (!form.businessType) e.businessType = "Please select a business type.";
    }
    if (step === 2) {
      if (!form.country.trim()) e.country = "Country is required.";
      if (!form.state.trim()) e.state = "State is required.";
      if (!form.city.trim()) e.city = "City is required.";
      if (!form.destinations.trim())
        e.destinations = "At least one destination is required.";
    }
    if (step === 3) {
      if (!files.governmentId) e.governmentId = "Government ID is required.";
    }
    if (step === 4) {
      if (!form.accountHolderName.trim())
        e.accountHolderName = "Account holder name is required.";
      if (!form.bankName.trim()) e.bankName = "Bank name is required.";
      const acctDigits = (form.accountNumber || "").replace(/\D/g, "");
      if (!form.accountNumber.trim())
        e.accountNumber = "Account number is required.";
      else if (acctDigits.length < 9 || acctDigits.length > 18)
        e.accountNumber = "Enter a valid account number (9–18 digits).";
      if (!form.confirmAccountNumber.trim())
        e.confirmAccountNumber = "Please confirm your account number.";
      else if (form.accountNumber !== form.confirmAccountNumber)
        e.confirmAccountNumber = "Account numbers do not match.";
      if (!form.ifscCode.trim()) e.ifscCode = "IFSC code is required.";
      else if (
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.trim().toUpperCase())
      )
        e.ifscCode = "Enter a valid IFSC code (e.g. SBIN0001234).";
    }
    if (step === 5) {
      const isCompany = ["TOUR_OPERATOR", "TRAVEL_AGENCY"].includes(
        form.businessType,
      );
      if (!files.panCard) e.panCard = "PAN card is required.";
    }
    if (step === 6) {
      if (!form.agreedToPolicies)
        e.agreedToPolicies = "You must agree to the platform policies.";
      if (!form.confirmedAccuracy)
        e.confirmedAccuracy = "You must confirm accuracy of information.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validate()) return;
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    setStep((s) => s - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError("");
    setLoading(true);

    try {
      const fd = new FormData();

      // Text fields
      fd.append("contactName", form.contactName);
      fd.append("phone", form.phone);
      fd.append("businessName", form.businessName);
      fd.append("businessType", form.businessType);
      fd.append("country", form.country);
      fd.append("state", form.state);
      fd.append("city", form.city);
      fd.append("mainOperatingDestinations", form.destinations);
      fd.append("accountHolderName", form.accountHolderName);
      fd.append("bankName", form.bankName);
      fd.append("accountNumber", form.accountNumber);
      // confirmAccountNumber is only for UI validation — not sent to backend
      fd.append("ifscCode", form.ifscCode);
      fd.append("upiId", form.upiId);
      fd.append("gstNumber", form.gstNumber);
      fd.append("agreedToPolicies", form.agreedToPolicies);
      fd.append("confirmedAccuracy", form.confirmedAccuracy);

      // Files
      Object.entries(files).forEach(([key, file]) => fd.append(key, file));

      await operatorAuthAPI.submitOnboarding(fd);
      await refreshOperator();
      navigate("/operator/status", { replace: true });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Submission failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isCompany = ["TOUR_OPERATOR", "TRAVEL_AGENCY"].includes(
    form.businessType,
  );

  // ── Step renders ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Step 1: Basic Information ─────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-4">
            <TextField
              label="Full Name"
              required
              value={form.contactName}
              onChange={(v) => set("contactName", v)}
              placeholder="John Smith"
              error={errors.contactName}
            />
            <TextField
              label="Mobile Number"
              required
              value={form.phone}
              onChange={(v) => set("phone", v.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
              type="tel"
              error={errors.phone}
            />
            <TextField
              label="Email Address"
              value={operator.email}
              onChange={() => {}}
              placeholder={operator.email}
              error={""}
            />
            <p className="text-xs text-gray-400">
              Email is linked to your account and cannot be changed here.
            </p>
          </div>
        );

      // ── Step 2: Business Information ──────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <TextField
              label="Company / Agency Name"
              value={form.businessName}
              onChange={(v) => set("businessName", v)}
              placeholder="Acme Tours Pvt. Ltd."
              error={errors.businessName}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((bt) => (
                  <label
                    key={bt.value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                      form.businessType === bt.value
                        ? "border-teal-400 bg-teal-50 text-teal-700"
                        : "border-gray-200 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="businessType"
                      value={bt.value}
                      checked={form.businessType === bt.value}
                      onChange={() => set("businessType", bt.value)}
                      className="accent-teal-600"
                    />
                    <span className="text-sm font-medium">{bt.label}</span>
                  </label>
                ))}
              </div>
              <FieldError msg={errors.businessType} />
            </div>
          </div>
        );

      // ── Step 3: Location ──────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <SelectField
              label="Country"
              required
              value={form.country}
              onChange={(v) => {
                set("country", v);
                // reset state when leaving India (dropdown no longer applies)
                if (v !== "India") set("state", "");
              }}
              options={COUNTRIES}
              placeholder="Select country"
              error={errors.country}
            />
            {form.country === "India" ? (
              <SelectField
                label="State"
                required
                value={form.state}
                onChange={(v) => set("state", v)}
                options={INDIA_STATES}
                placeholder="Select state"
                error={errors.state}
              />
            ) : (
              <TextField
                label="State / Province"
                required
                value={form.state}
                onChange={(v) => set("state", v)}
                placeholder="State / Province"
                error={errors.state}
              />
            )}
            <TextField
              label="City"
              required
              value={form.city}
              onChange={(v) => set("city", v)}
              placeholder="Mumbai"
              error={errors.city}
            />
            <div>
              <TextField
                label="Main Operating Destinations"
                required
                value={form.destinations}
                onChange={(v) => set("destinations", v)}
                placeholder="Dubai, Goa, Bali, Thailand"
                error={errors.destinations}
              />
              <p className="mt-1 text-xs text-gray-400">
                Separate multiple destinations with commas.
              </p>
            </div>
          </div>
        );

      // ── Step 4: Identity Verification ─────────────────────────────────────
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <FileUpload
                label="Government ID"
                required
                fileKey="governmentId"
                files={files}
                setFiles={setFiles}
              />
              <p className="mt-1 text-xs text-gray-400">
                Aadhaar / Passport / Driving License
              </p>
              <FieldError msg={errors.governmentId} />
            </div>
            <div>
              <FileUpload
                label="Selfie Verification (Optional)"
                fileKey="selfieVerification"
                files={files}
                setFiles={setFiles}
                accept=".jpg,.jpeg,.png"
                allowedTypes={["image/jpeg", "image/jpg", "image/png"]}
              />
            </div>
          </div>
        );

      // ── Step 5: Bank Details ──────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              These details will be used for payouts. Please ensure accuracy.
            </p>
            <TextField
              label="Account Holder Name"
              required
              value={form.accountHolderName}
              onChange={(v) => set("accountHolderName", v)}
              placeholder="John Smith"
              error={errors.accountHolderName}
            />
            <TextField
              label="Bank Name"
              required
              value={form.bankName}
              onChange={(v) => set("bankName", v)}
              placeholder="HDFC Bank"
              error={errors.bankName}
            />
            <TextField
              label="Account Number"
              required
              value={form.accountNumber}
              onChange={(v) => set("accountNumber", v)}
              placeholder="000123456789"
              error={errors.accountNumber}
            />
            <TextField
              label="Confirm Account Number"
              required
              value={form.confirmAccountNumber}
              onChange={(v) => set("confirmAccountNumber", v)}
              placeholder="Re-enter account number"
              error={errors.confirmAccountNumber}
            />
            <TextField
              label="IFSC Code"
              required
              value={form.ifscCode}
              onChange={(v) => set("ifscCode", v.toUpperCase())}
              placeholder="HDFC0001234"
              error={errors.ifscCode}
            />
            <TextField
              label="UPI ID (Optional)"
              value={form.upiId}
              onChange={(v) => set("upiId", v)}
              placeholder="yourname@upi"
              error={errors.upiId}
            />
          </div>
        );

      // ── Step 6: Business Documents ────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-5">
            {isCompany ? (
              <>
                <p className="text-sm text-gray-500">
                  Since you're a <strong>company</strong>, please upload the
                  following:
                </p>
                <TextField
                  label="GST Number (Optional)"
                  value={form.gstNumber}
                  onChange={(v) => set("gstNumber", v)}
                  placeholder="22AAAAA0000A1Z5"
                  error={errors.gstNumber}
                />
                <FileUpload
                  label="Trade License (Optional)"
                  fileKey="tradeLicense"
                  files={files}
                  setFiles={setFiles}
                />
                <div>
                  <FileUpload
                    label="PAN Card"
                    required
                    fileKey="panCard"
                    files={files}
                    setFiles={setFiles}
                  />
                  <FieldError msg={errors.panCard} />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Since you're an <strong>individual</strong>, only PAN card is
                  required:
                </p>
                <div>
                  <FileUpload
                    label="PAN Card"
                    required
                    fileKey="panCard"
                    files={files}
                    setFiles={setFiles}
                  />
                  <FieldError msg={errors.panCard} />
                </div>
              </>
            )}
          </div>
        );

      // ── Step 7: Terms & Conditions ─────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4 text-sm text-gray-600 max-h-48 overflow-y-auto">
              <p className="font-semibold text-gray-800">Platform Policies</p>
              <p>
                By registering as a TripReel operator, you agree to maintain
                accurate listing information, provide quality services to
                travelers, and adhere to our community guidelines and code of
                conduct.
              </p>
              <p>
                You acknowledge that TripReel reserves the right to review,
                suspend, or remove your listings if they violate our policies.
                All payments are subject to our payout schedule and commission
                structure.
              </p>
              <p>
                You are responsible for ensuring all trip information, pricing,
                and availability is up to date at all times.
              </p>
            </div>

            <label
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                form.agreedToPolicies
                  ? "border-teal-400 bg-teal-50"
                  : errors.agreedToPolicies
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 hover:border-teal-300"
              }`}
            >
              <input
                type="checkbox"
                checked={form.agreedToPolicies}
                onChange={(e) => set("agreedToPolicies", e.target.checked)}
                className="mt-0.5 accent-teal-600"
              />
              <span className="text-sm text-gray-700">
                I agree to the{" "}
                <span className="text-teal-600 font-medium">
                  platform policies
                </span>{" "}
                and terms of service.
              </span>
            </label>
            <FieldError msg={errors.agreedToPolicies} />

            <label
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                form.confirmedAccuracy
                  ? "border-teal-400 bg-teal-50"
                  : errors.confirmedAccuracy
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 hover:border-teal-300"
              }`}
            >
              <input
                type="checkbox"
                checked={form.confirmedAccuracy}
                onChange={(e) => set("confirmedAccuracy", e.target.checked)}
                className="mt-0.5 accent-teal-600"
              />
              <span className="text-sm text-gray-700">
                I confirm that all information provided is{" "}
                <span className="font-medium">accurate and complete</span>.
              </span>
            </label>
            <FieldError msg={errors.confirmedAccuracy} />

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">TripReel</h1>
            <p className="text-xs text-gray-400">Operator Onboarding</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round(((step + 1) / STEPS.length) * 100)}% complete
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      i < step
                        ? "bg-teal-500 text-white"
                        : i === step
                          ? "bg-teal-100 text-teal-600 ring-2 ring-teal-500"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs hidden sm:block ${i === step ? "text-teal-600 font-medium" : "text-gray-400"}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                {STEPS[step].label}
              </h2>
              <p className="text-xs text-gray-400">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>
          </div>

          {renderStep()}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
