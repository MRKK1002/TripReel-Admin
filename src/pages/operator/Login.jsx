import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plane, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";

export default function OperatorLogin() {
  const { login } = useOperatorAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const fe = {};
    const email = form.email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) fe.email = "Email is required.";
    else if (!emailRegex.test(email))
      fe.email = "Please enter a valid email address.";
    if (!form.password) fe.password = "Password is required.";
    if (Object.keys(fe).length > 0) {
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const op = await login(form.email.trim(), form.password);
      if (
        op.onboardingState === "ACTIVE_PROBATION" ||
        op.onboardingState === "ACTIVE_FULL"
      ) {
        navigate("/operator/dashboard", { replace: true });
      } else if (op.onboardingState === "DRAFT") {
        // Not yet submitted onboarding form — go fill it in
        navigate("/operator/onboarding", { replace: true });
      } else {
        // Submitted but awaiting admin review
        navigate("/operator/status", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to your operator account
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="operator@company.com"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all ${fieldErrors.email ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"}`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    setFieldErrors((p) => ({ ...p, password: "" }));
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 pr-11 border rounded-xl text-sm outline-none focus:ring-2 transition-all ${fieldErrors.password ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-md shadow-teal-500/30"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              to="/operator/register"
              className="text-teal-600 font-medium hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
