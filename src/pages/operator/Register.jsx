import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plane,
  Eye,
  EyeOff,
  UserPlus,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";

function InputField({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  rightSlot,
  error,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 transition-all focus-within:ring-2 ${
          error
            ? "border-red-300 focus-within:ring-red-200 focus-within:border-red-400 bg-red-50"
            : "border-gray-300 focus-within:ring-teal-500 focus-within:border-teal-500 bg-white"
        }`}
      >
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
        />
        {rightSlot}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

export default function OperatorRegister() {
  const { register } = useOperatorAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    contactName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const fe = {};
    if (!form.contactName.trim()) fe.contactName = "Full name is required.";
    else if (form.contactName.trim().length < 2)
      fe.contactName = "Please enter a valid full name.";
    else if (!/^[a-zA-Z\s.]+$/.test(form.contactName.trim()))
      fe.contactName = "Name can only contain letters, spaces and dots.";

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const email = form.email.trim();
    if (!email) fe.email = "Email is required.";
    else if (!emailRegex.test(email))
      fe.email = "Please enter a valid email address.";
    else {
      // Catch obvious typos like "gmail.commmmm" — repeated chars or an
      // unusually long top-level domain.
      const domain = email.split("@")[1] || "";
      const tld = domain.split(".").pop() || "";
      if (/(.)\1\1/.test(domain) || tld.length > 6)
        fe.email = "This email looks like it has a typo. Please check it.";
    }

    const phoneDigits = (form.phone || "").replace(/\D/g, "");
    if (!form.phone.trim()) fe.phone = "Phone number is required.";
    else if (phoneDigits.length !== 10)
      fe.phone = "Phone number must be exactly 10 digits.";

    if (form.password.length < 8)
      fe.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword)
      fe.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      fe.confirmPassword = "Passwords do not match.";

    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = form;
      await register(submitData);
      navigate("/operator/onboarding", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2231] via-[#1a3347] to-[#0f2231] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500 rounded-2xl mb-4 shadow-lg shadow-teal-500/30">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TripReel</h1>
          <p className="text-gray-400 text-sm mt-1">Operator Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Create your account
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Register as a TripReel operator
          </p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Full Name"
              required
              icon={User}
              value={form.contactName}
              onChange={(v) => set("contactName", v)}
              placeholder="John Smith"
              error={fieldErrors.contactName}
            />

            <InputField
              label="Business Email"
              required
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(v) => set("email", v.replace(/\s/g, ""))}
              placeholder="you@company.com"
              error={fieldErrors.email}
            />

            <InputField
              label="Phone Number"
              required
              icon={Phone}
              type="tel"
              value={form.phone}
              onChange={(v) => set("phone", v.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
              error={fieldErrors.phone}
            />

            <InputField
              label="Password"
              required
              icon={Lock}
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(v) => set("password", v)}
              placeholder="Min. 8 characters"
              error={fieldErrors.password}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <InputField
              label="Confirm Password"
              required
              icon={ShieldCheck}
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(v) => set("confirmPassword", v)}
              placeholder="Re-enter your password"
              error={fieldErrors.confirmPassword}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-md shadow-teal-500/30 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/operator/login"
              className="text-teal-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
