import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LogIn,
  Shield,
  Mail,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const { login: adminLogin, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // If already logged in as admin, redirect
  if (user && user.role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

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
      const u = await adminLogin(form.email.trim(), form.password);
      if (u.role !== "admin") {
        setError("Access denied. Admin accounts only.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TripReel Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Admin access only</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 shadow-xl space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold text-gray-800">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to your admin account
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <div
              className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 focus-within:ring-2 ${fieldErrors.email ? "border-red-300 focus-within:ring-red-200 bg-red-50" : "border-gray-300 focus-within:ring-teal-500 focus-within:border-teal-500 bg-white"}`}
            >
              <Mail className="w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="admin@tripreel.com"
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
              />
            </div>
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
            <div
              className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 focus-within:ring-2 ${fieldErrors.password ? "border-red-300 focus-within:ring-red-200 bg-red-50" : "border-gray-300 focus-within:ring-teal-500 focus-within:border-teal-500 bg-white"}`}
            >
              <Lock className="w-4 h-4 text-gray-400" />
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  setFieldErrors((p) => ({ ...p, password: "" }));
                }}
                placeholder="••••••••"
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="text-gray-400 hover:text-gray-600"
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
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
