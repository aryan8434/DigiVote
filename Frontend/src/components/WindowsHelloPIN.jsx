import { useState } from "react";
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { sha256 } from "../utils/sha256";

export default function WindowsHelloPIN({ onHash }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState("Enter a 6-digit PIN");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const validatePin = (value) => {
    if (!/^\d{0,6}$/.test(value)) return pin;
    return value;
  };

  const handlePinChange = (e) => {
    const value = validatePin(e.target.value);
    setPin(value);
    setError("");
  };

  const handleConfirmChange = (e) => {
    const value = validatePin(e.target.value);
    setConfirmPin(value);
    setError("");
  };

  const handleVerify = async () => {
    if (pin.length !== 6) {
      setError("PIN must be exactly 6 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    try {
      const hash = await sha256(pin);
      onHash?.(hash);
      setVerified(true);
      setStatus("PIN verified successfully");
    } catch (err) {
      setError("Verification failed: " + err.message);
    }
  };

  const handleReset = () => {
    setPin("");
    setConfirmPin("");
    setVerified(false);
    setStatus("Enter a 6-digit PIN");
    setError("");
  };

  if (verified) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
          <CheckCircle2
            className="w-8 h-8 text-emerald-400"
            strokeWidth={1.5}
          />
          <div>
            <p className="font-bold text-emerald-400">PIN Verified</p>
            <p className="text-[12px] text-slate-400">
              Windows Hello authentication complete
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
        >
          Change PIN
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Lock className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              Windows Hello PIN
            </p>
            <p className="text-xs text-slate-500">
              Secure 6-digit authentication
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Create PIN (6 digits)
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={handlePinChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-slate-100 shadow-inner font-mono tracking-widest text-center text-2xl"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPin ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm PIN Input */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Confirm PIN
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPin}
                onChange={handleConfirmChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-slate-100 shadow-inner font-mono tracking-widest text-center text-2xl"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Status/Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          {!error && pin.length < 6 && (
            <p className="text-xs text-slate-500">
              {pin.length > 0
                ? `${6 - pin.length} digits remaining`
                : "Enter 6 digits to proceed"}
            </p>
          )}
        </div>
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={
          pin.length !== 6 || confirmPin.length !== 6 || pin !== confirmPin
        }
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-blue-950/20 active:scale-[0.98] disabled:opacity-50"
      >
        Verify PIN
      </button>

      <p className="text-xs text-slate-500 text-center">{status}</p>
    </div>
  );
}
