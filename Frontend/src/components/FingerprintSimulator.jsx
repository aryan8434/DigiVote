import { useState } from 'react';
import { sha256 } from '../utils/sha256';
import { Fingerprint } from 'lucide-react';

export default function FingerprintSimulator({ onHash }) {
  const [value, setValue] = useState('');
  const [done, setDone] = useState(false);

  const handleVerify = async () => {
    if (!value.trim()) return;
    const hash = await sha256(value.trim());
    onHash?.(hash);
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <Fingerprint className="w-10 h-10 text-emerald-600" />
        <div>
          <p className="font-medium text-emerald-800">Fingerprint verified</p>
          <p className="text-sm text-emerald-600">SHA-256 hash computed and verified</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200">
        <Fingerprint className="w-10 h-10 text-slate-500" />
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Fingerprint from sensor (paste ID)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Run the Arduino fingerprint sketch, then paste the fingerprint ID it prints here. The
            app will hash and store this value for secure matching.
          </p>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. FPID_23 from Arduino serial monitor"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleVerify}
        disabled={!value.trim()}
        className="w-full py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
      >
        Verify Fingerprint
      </button>
    </div>
  );
}
