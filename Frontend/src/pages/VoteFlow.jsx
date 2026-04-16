import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import { useLanguage } from "../contexts/LanguageContext";
import FingerprintSimulator from "../components/FingerprintSimulator";
import HardwareFingerprintCapture from "../components/HardwareFingerprintCapture";
import {
  ArrowLeft,
  CheckCircle,
  UserCheck,
  Shield,
  Users,
  Send,
  MapPin,
  Hash,
  Sparkles,
} from "lucide-react";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

const STEPS = ["details", "fingerprint", "candidates", "submit"];
const API_BASE_URL = getApiBaseUrl();

const getNativeJson = async (url, options = {}) => {
  const response = await CapacitorHttp.request({
    method: options.method || "GET",
    url,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    data: options.data,
  });

  let payload = response.data;
  if (typeof response.data === "string") {
    try {
      payload = JSON.parse(response.data || "{}");
    } catch {
      payload = { message: response.data };
    }
  }
  if (!payload || typeof payload !== "object") payload = {};

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    data: payload,
  };
};

export default function VoteFlow() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isNative = Capacitor.isNativePlatform();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voterId, setVoterId] = useState(localStorage.getItem("voterId") || "");
  const [mobileVoter, setMobileVoter] = useState(null);

  const [form, setForm] = useState({
    constituency: "",
    ward: "",
    aadhar: "",
  });
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [fingerprintHash, setFingerprintHash] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const handleNativeVerify = async () => {
    const normalizedVoterId = String(voterId || "").trim();
    if (!normalizedVoterId) {
      setError("Please enter your Voter ID.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const verifyResponse = await getNativeJson(
        `${API_BASE_URL}/api/voter/verify/${encodeURIComponent(normalizedVoterId)}`,
      );
      const verifyData = verifyResponse.data;

      if (!verifyResponse.ok) {
        if (verifyResponse.status === 404) {
          setError("Voter not registered.");
          return;
        }

        setError(
          verifyData?.message ||
            `Connection failed (status ${verifyResponse.status}).`,
        );
        return;
      }

      if (!verifyData?.success) {
        setError(verifyData?.message || "Verification failed.");
        return;
      }

      if (verifyData?.canVote === false) {
        setError(
          verifyData?.message || "You are not eligible to vote right now.",
        );
        return;
      }

      const voter = verifyData?.voterDetails;
      if (!voter?.constituency) {
        setError("Voter constituency not found.");
        return;
      }

      setMobileVoter(voter);
      localStorage.setItem("voterId", normalizedVoterId);

      const candidateResponse = await getNativeJson(
        `${API_BASE_URL}/api/candidate/list`,
      );
      const candidateData = candidateResponse.data;
      if (!candidateResponse.ok) {
        setError(
          candidateData?.message ||
            "Connection failed. Unable to load candidates.",
        );
        return;
      }

      setCandidates(candidateData?.candidates || []);
      setStep(2);
    } catch (err) {
      console.error("Native verify failed", err);
      if (
        String(err?.message || "")
          .toLowerCase()
          .includes("failed to fetch")
      ) {
        setError("Connection failed. Unable to verify voter right now.");
        return;
      }

      if (err.response?.status === 404) {
        setError("Voter not registered.");
        return;
      }

      setError(
        err.response?.data?.message || err?.message || "Unable to verify voter.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNativeCastVote = async () => {
    if (!selectedCandidate) {
      setError("A candidate selection is required.");
      return;
    }
    if (!fingerprintHash) {
      setError("Fingerprint scan is required before casting your vote.");
      return;
    }

    const normalizedVoterId = String(voterId || "").trim();
    if (!normalizedVoterId) {
      setError("Voter ID is required.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await getNativeJson(
        `${API_BASE_URL}/api/vote/cast-by-voter-id`,
        {
          method: "POST",
          data: {
            voterId: normalizedVoterId,
            candidateId: selectedCandidate._id,
          },
        },
      );
      const res = response.data;

      if (!response.ok) {
        setError(res?.message || "Secure transmission failed.");
        return;
      }

      if (res?.success) {
        setStep(3);
      } else {
        setError(res?.message || "Transaction failed. Please try again.");
      }
    } catch (err) {
      setError("Connection failed. Unable to submit vote.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axiosClient.get("/api/voter/constituencies").then((r) => {
      if (r.data?.constituencies) setConstituencies(r.data.constituencies);
    });
  }, []);

  useEffect(() => {
    if (!form.constituency) {
      setWards([]);
      return;
    }
    axiosClient
      .get(`/api/voter/wards/${encodeURIComponent(form.constituency)}`)
      .then((r) => {
        if (r.data?.wards) setWards(r.data.wards);
      });
  }, [form.constituency]);

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/api/vote/verify", form);
      if (res.data?.success && res.data?.canVote) {
        setStep(1);
      } else {
        setError(
          res.data?.message ||
            "Verification failed. Please check your credentials.",
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to verification server.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2 && form.constituency) {
      axiosClient
        .get(
          `/api/candidate/list?constituency=${encodeURIComponent(form.constituency)}`,
        )
        .then((r) => {
          if (r.data?.candidates) setCandidates(r.data.candidates);
        });
    }
  }, [step, form.constituency]);

  const handleCastVote = async () => {
    if (!selectedCandidate) {
      setError("A candidate selection is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/api/vote/cast", {
        candidateId: selectedCandidate._id,
        aadhar: form.aadhar,
        constituency: form.constituency,
        ward: form.ward,
        fingerprintHash,
      });
      if (res.data?.success) {
        setStep(3);
      } else {
        setError(res.data?.message || "Transaction failed. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Secure transmission failed.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[step];
  const inputClasses =
    "w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700 text-slate-100";
  const labelClasses =
    "block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-[0.2em]";

  if (isNative) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <button
                onClick={() => (step === 0 ? navigate("/") : setStep(0))}
                className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-4 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  Back
                </span>
              </button>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-emerald-400" />
                Mobile Voting
              </h1>
            </div>
          </header>

          {error && (
            <div className="mb-8 p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium backdrop-blur-md flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </div>
          )}

          {step === 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-[40px] p-8 sm:p-10 backdrop-blur-xl shadow-2xl">
              <div className="mb-10">
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                  Voter Verification
                </h2>
                <p className="text-slate-400 text-sm">
                  Enter your registered voter ID to continue.
                </p>
              </div>

              <div className="space-y-8">
                <div>
                  <label className={labelClasses}>Voter ID</label>
                  <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="text"
                      value={voterId}
                      onChange={(e) => setVoterId(e.target.value)}
                      placeholder="Enter your voter ID"
                      className={`${inputClasses} pl-11`}
                    />
                  </div>
                </div>

                <button
                  onClick={handleNativeVerify}
                  disabled={loading || !String(voterId || "").trim()}
                  className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg transition-all shadow-xl shadow-emerald-950/20 active:scale-95 disabled:opacity-30 disabled:grayscale"
                >
                  {loading ? "Verifying..." : "Verify Voter ID"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-[40px] p-8 sm:p-10 backdrop-blur-xl shadow-2xl">
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                    Cast Your Vote
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {mobileVoter?.fullName
                      ? `Verified voter: ${mobileVoter.fullName}`
                      : "Select one candidate from your constituency."}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {candidates.length === 0 && (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl">
                    <p className="text-slate-500 italic">
                      No candidates found for your constituency.
                    </p>
                  </div>
                )}
                {candidates.map((c) => (
                  <div
                    key={c._id}
                    onClick={() =>
                      setSelectedCandidate(
                        selectedCandidate?._id === c._id ? null : c,
                      )
                    }
                    className={`relative flex items-center gap-5 p-5 rounded-[28px] border-2 cursor-pointer transition-all duration-300 group ${
                      selectedCandidate?._id === c._id
                        ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5"
                        : "border-slate-800 bg-slate-950/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={c.photoURL || "/placeholder-avatar.png"}
                        alt=""
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-800 group-hover:ring-slate-700 transition-all"
                      />
                      {c.symbolURL && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 p-1">
                          <img
                            src={c.symbolURL}
                            alt=""
                            className="w-full h-full object-cover rounded-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white tracking-tight truncate group-hover:text-emerald-400 transition-colors uppercase italic">
                        {c.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                        {c.partyName}
                      </p>
                    </div>

                    <div
                      className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                        selectedCandidate?._id === c._id
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-slate-900 text-slate-700"
                      }`}
                    >
                      <CheckCircle
                        className={`w-6 h-6 ${selectedCandidate?._id === c._id ? "scale-100 opacity-100" : "scale-75 opacity-20"}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-5 rounded-3xl bg-slate-950/40 border border-slate-800">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                  Biometric Verification
                </p>
                <HardwareFingerprintCapture onHash={setFingerprintHash} />
                {fingerprintHash ? (
                  <p className="mt-3 text-emerald-400 text-sm font-medium">
                    Fingerprint verified. You can cast your vote now.
                  </p>
                ) : (
                  <p className="mt-3 text-slate-400 text-sm">
                    Scan fingerprint before casting your vote.
                  </p>
                )}
              </div>

              <button
                onClick={handleNativeCastVote}
                disabled={loading || !selectedCandidate || !fingerprintHash}
                className="mt-10 w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl transition-all shadow-2xl shadow-emerald-950/30 active:scale-95 disabled:opacity-20 group disabled:grayscale"
              >
                <span className="flex items-center justify-center gap-3">
                  {loading ? "Submitting..." : "Cast Vote"}
                  {!loading && (
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  )}
                </span>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-[40px] p-12 text-center backdrop-blur-xl shadow-2xl">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                <CheckCircle
                  className="w-24 h-24 text-emerald-400 relative z-10 mx-auto"
                  strokeWidth={1.5}
                />
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
                Vote Successfully Recorded
              </h2>
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-10 leading-relaxed">
                Your vote has been securely submitted.
              </div>

              <button
                onClick={() => navigate("/")}
                className="px-10 py-4 rounded-2xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-lg transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center gap-3 mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                Return Home
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <button
              onClick={() => (step === 0 ? navigate("/") : setStep(step - 1))}
              className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-4 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold uppercase tracking-widest text-[10px]">
                Step Back
              </span>
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-400" />
              Secure Ballot
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= step ? "w-8 bg-emerald-500" : "w-4 bg-slate-800"
                }`}
              />
            ))}
          </div>
        </header>

        {error && (
          <div className="mb-8 p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            {error}
          </div>
        )}

        {/* Phase 1: Identity Verification */}
        {currentStep === "details" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-[40px] p-8 sm:p-10 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-500">
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                Voter Authentication
              </h2>
              <p className="text-slate-400 text-sm">
                Please verify your electoral district and identity to access
                your ballot.
              </p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Constituency</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    {constituencies.length > 0 ? (
                      <select
                        value={form.constituency}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            constituency: e.target.value,
                          }))
                        }
                        className={`${inputClasses} pl-11 appearance-none`}
                      >
                        <option value="">Select District</option>
                        {constituencies.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.constituency}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            constituency: e.target.value,
                          }))
                        }
                        placeholder="District Name"
                        className={`${inputClasses} pl-11`}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Ward / Booth</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    {wards.length > 0 ? (
                      <select
                        value={form.ward}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, ward: e.target.value }))
                        }
                        className={`${inputClasses} pl-11 appearance-none`}
                      >
                        <option value="">Select Ward</option>
                        {wards.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.ward}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, ward: e.target.value }))
                        }
                        placeholder="Ward Number"
                        className={`${inputClasses} pl-11`}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Aadhaar Identity</label>
                <div className="relative">
                  <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    value={form.aadhar}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        aadhar: e.target.value.replace(/\D/g, "").slice(0, 12),
                      }))
                    }
                    placeholder="0000 0000 0000"
                    maxLength={12}
                    className={`${inputClasses} pl-11 font-mono tracking-widest`}
                  />
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={
                  loading ||
                  !form.constituency ||
                  !form.ward ||
                  form.aadhar.length !== 12
                }
                className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg transition-all shadow-xl shadow-emerald-950/20 active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                {loading
                  ? "Decrypting Credentials..."
                  : "Authenticate Identity"}
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Biometric Validation */}
        {currentStep === "fingerprint" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-[40px] p-8 sm:p-10 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                Biometric Verification
              </h2>
              <p className="text-slate-400 text-sm">
                Please provide your registered fingerprint to unlock your
                digital ballot.
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6">
                <HardwareFingerprintCapture onHash={setFingerprintHash} />
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-slate-900 px-3 text-slate-600 font-black tracking-widest">
                    Backup Authentication
                  </span>
                </div>
              </div>

              <FingerprintSimulator onHash={setFingerprintHash} />

              <button
                onClick={() => setStep(2)}
                disabled={!fingerprintHash}
                className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all shadow-xl shadow-indigo-950/20 active:scale-95 disabled:opacity-20"
              >
                Confirm & Open Ballot
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Candidate Selection */}
        {currentStep === "candidates" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-[40px] p-8 sm:p-10 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                  Cast Your Vote
                </h2>
                <p className="text-slate-400 text-sm">
                  Select one candidate from your registered constituency.
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {candidates.length === 0 && (
                <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl">
                  <p className="text-slate-500 italic">
                    No candidates found for {form.constituency}.
                  </p>
                </div>
              )}
              {candidates.map((c) => (
                <div
                  key={c._id}
                  onClick={() =>
                    setSelectedCandidate(
                      selectedCandidate?._id === c._id ? null : c,
                    )
                  }
                  className={`relative flex items-center gap-5 p-5 rounded-[28px] border-2 cursor-pointer transition-all duration-300 group ${
                    selectedCandidate?._id === c._id
                      ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5"
                      : "border-slate-800 bg-slate-950/30 hover:border-slate-700"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={c.photoURL || "/placeholder-avatar.png"}
                      alt=""
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-800 group-hover:ring-slate-700 transition-all"
                    />
                    {c.symbolURL && (
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 p-1">
                        <img
                          src={c.symbolURL}
                          alt=""
                          className="w-full h-full object-cover rounded-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white tracking-tight truncate group-hover:text-emerald-400 transition-colors uppercase italic">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      {c.partyName}
                    </p>
                  </div>

                  <div
                    className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                      selectedCandidate?._id === c._id
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-900 text-slate-700"
                    }`}
                  >
                    <CheckCircle
                      className={`w-6 h-6 ${selectedCandidate?._id === c._id ? "scale-100 opacity-100" : "scale-75 opacity-20"}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleCastVote}
              disabled={loading || !selectedCandidate}
              className="mt-10 w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl transition-all shadow-2xl shadow-emerald-950/30 active:scale-95 disabled:opacity-20 group disabled:grayscale"
            >
              <span className="flex items-center justify-center gap-3">
                {loading ? "Transmitting Securely..." : "Cast Secret Ballot"}
                {!loading && (
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                )}
              </span>
            </button>
          </div>
        )}

        {/* Phase 4: Final Confirmation */}
        {currentStep === "submit" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-[40px] p-12 text-center backdrop-blur-xl shadow-2xl animate-in zoom-in duration-700">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
              <CheckCircle
                className="w-24 h-24 text-emerald-400 relative z-10 mx-auto"
                strokeWidth={1.5}
              />
            </div>

            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
              Vote Successfully Recorded
            </h2>
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-10 leading-relaxed">
              Your digital ballot has been hashed and stored in the secure
              electoral database. The anti-fraud lock is now active for this
              Aadhaar identity.
            </div>

            <button
              onClick={() => navigate("/")}
              className="px-10 py-4 rounded-2xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-lg transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center gap-3 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Return to Control Center
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
