import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import { useLanguage } from "../contexts/LanguageContext";
import WindowsHelloPIN from "../components/WindowsHelloPIN";
import {
  ArrowLeft,
  Check,
  User,
  Calendar,
  MapPin,
  Hash,
  Phone,
  ShieldCheck,
} from "lucide-react";

export default function VoterRegistration() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fingerprintHash, setFingerprintHash] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    fatherOrHusbandName: "",
    dateOfBirth: "",
    gender: "male",
    aadhar: "",
    voterId: "",
    address: { permanent: "", current: "" },
    constituency: "",
    ward: "",
    booth: "",
    contact: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/api/voter/register", {
        ...form,
        fingerprintHash,
      });
      if (res.data?.success) {
        alert("Registration successful! Document and biometric verified.");
        navigate("/");
      } else {
        setError(res.data?.message || "Registration failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => {
    if (key.startsWith("address.")) {
      const sub = key.split(".")[1];
      setForm((f) => ({ ...f, address: { ...f.address, [sub]: value } }));
    } else {
      setForm((f) => ({ ...f, [key]: value }));
    }
  };

  const inputClasses =
    "w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 text-slate-100 shadow-inner";
  const labelClasses = "block text-sm font-medium text-slate-400 mb-2 mt-1";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 py-12 px-4 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-125 h-125 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium uppercase tracking-widest text-xs">
            Back to Home
          </span>
        </button>

        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-400 font-bold mb-2">
            Voter Enrollment
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">
            Registration Portal
          </h1>
          <p className="text-slate-400 text-sm max-w-lg">
            Complete your digital profile to participate in upcoming elections
            securely.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center text-sm font-medium backdrop-blur-md">
              {error}
            </div>
          )}

          {/* Section 1: Personal Details */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl hover:border-slate-600/50 transition-colors">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <User className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-white tracking-tight">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClasses}>1. {t.fullName}</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className={inputClasses}
                  placeholder="Full name as per government records"
                />
              </div>

              <div>
                <label className={labelClasses}>2. {t.fatherHusbandName}</label>
                <input
                  type="text"
                  value={form.fatherOrHusbandName}
                  onChange={(e) =>
                    update("fatherOrHusbandName", e.target.value)
                  }
                  className={inputClasses}
                  placeholder="Father/Husband Name"
                />
              </div>

              <div>
                <label className={labelClasses}>3. {t.dateOfBirth}</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => update("dateOfBirth", e.target.value)}
                    className={`${inputClasses} pl-11`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>4. {t.gender}</label>
                <select
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className={inputClasses}
                >
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>5. {t.contactNumber}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={form.contact}
                    onChange={(e) => update("contact", e.target.value)}
                    className={`${inputClasses} pl-11`}
                    placeholder="Mobile number for OTP"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Identification & Region */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl hover:border-slate-600/50 transition-colors">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <ShieldCheck
                  className="w-6 h-6 text-blue-400"
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-xl font-semibold text-white tracking-tight">
                Identity & Region
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>6. {t.aadharNumber}</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={form.aadhar}
                    onChange={(e) =>
                      update(
                        "aadhar",
                        e.target.value.replace(/\D/g, "").slice(0, 12),
                      )
                    }
                    className={`${inputClasses} pl-11`}
                    placeholder="12-digit Aadhaar Number"
                    maxLength={12}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>7. {t.voterId} (EPIC)</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={form.voterId}
                    onChange={(e) => update("voterId", e.target.value)}
                    className={`${inputClasses} pl-11`}
                    placeholder="EPIC / Voter ID Number"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClasses}>
                  8. {t.address} - {t.permanent}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-500" />
                  <textarea
                    value={form.address.permanent}
                    onChange={(e) =>
                      update("address.permanent", e.target.value)
                    }
                    className={`${inputClasses} pl-11 min-h-20`}
                    placeholder="Enter full permanent residential address"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Constituency</label>
                <input
                  type="text"
                  value={form.constituency}
                  onChange={(e) => update("constituency", e.target.value)}
                  className={inputClasses}
                  placeholder="Region/District"
                />
              </div>

              <div>
                <label className={labelClasses}>Ward & Booth</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Ward"
                    value={form.ward}
                    onChange={(e) => update("ward", e.target.value)}
                    className={inputClasses}
                  />
                  <input
                    type="text"
                    placeholder="Booth"
                    value={form.booth}
                    onChange={(e) => update("booth", e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Windows Hello PIN */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl hover:border-slate-600/50 transition-colors">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <Hash className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold text-white tracking-tight">
                Windows Hello PIN Verification
              </h2>
            </div>

            <div className="space-y-6">
              <WindowsHelloPIN onHash={setFingerprintHash} />
            </div>

            {/* Verification Status */}
            <div
              className={`mt-8 flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                fingerprintHash
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                  : "bg-slate-800/20 border-slate-800 opacity-60 grayscale"
              }`}
            >
              <div
                className={`p-2 rounded-full ${fingerprintHash ? "bg-emerald-500 text-slate-950" : "bg-slate-700 text-slate-500"}`}
              >
                <Check className="w-5 h-5 stroke-[3px]" />
              </div>
              <div>
                <p
                  className={`font-bold ${fingerprintHash ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {fingerprintHash
                    ? "PIN Verified"
                    : "Awaiting PIN Verification"}
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {fingerprintHash ? "Ready to submit" : "6-digit PIN required"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl transition-all shadow-xl shadow-emerald-950/20 active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Enrollment...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Submit Enrollment
                <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
