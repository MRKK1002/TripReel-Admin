import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plane,
  Package,
  BarChart2,
  Star,
  CheckCircle,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { useOperatorAuth } from "../../context/OperatorAuthContext";

const ACTIVE_STATES = ["ACTIVE_PROBATION", "ACTIVE_FULL"];

const STATE_LABELS = {
  ACTIVE_PROBATION: "Active (Probation)",
  ACTIVE_FULL: "Active",
};

export default function OperatorDashboard() {
  const { operator, operatorLoading } = useOperatorAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!operatorLoading && operator) {
      if (!ACTIVE_STATES.includes(operator.onboardingState)) {
        navigate("/operator/status", { replace: true });
      }
    }
    if (!operatorLoading && !operator) {
      navigate("/operator/login", { replace: true });
    }
  }, [operator, operatorLoading, navigate]);

  if (operatorLoading || !operator) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isProbation = operator.onboardingState === "ACTIVE_PROBATION";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-teal-100 text-sm mb-1">Welcome back,</p>
            <h2 className="text-2xl font-bold">
              {operator.businessName || operator.contactName}
            </h2>
            <div className="flex items-center gap-2 mt-3">
              <CheckCircle className="w-4 h-4 text-teal-200" />
              <span className="text-sm text-teal-100">
                {isProbation ? "Account active — probationary period" : "Account fully active"}
              </span>
            </div>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Plane className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Probation notice */}
      {isProbation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Probationary Period Active</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your first 5 bookings are monitored. Full access unlocks after successful completion.
            </p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/operator/packages"
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-teal-50 text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-colors">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">My Packages</h3>
          <p className="text-sm text-gray-500">Create and manage your travel packages</p>
          <div className="flex items-center gap-1 text-teal-500 text-sm font-medium mt-3">
            Go to packages <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {[
          {
            icon: BarChart2,
            title: "Analytics",
            desc: "View bookings, revenue, and performance",
            color: "text-purple-500 bg-purple-50",
          },
          {
            icon: Star,
            title: "Reviews",
            desc: "See what travellers say about your packages",
            color: "text-amber-500 bg-amber-50",
          },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
            <p className="text-xs text-teal-500 font-medium mt-3">Coming soon</p>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ["Business Name", operator.businessName || "—"],
            ["Contact Name", operator.contactName],
            ["Email", operator.email],
            ["Phone", operator.phone || "—"],
            ["GSTIN", operator.gstin || "—"],
            ["PAN", operator.pan || "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
              <span className="text-gray-700 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
