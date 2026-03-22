import { useState } from 'react';
import { sha256 } from '../utils/sha256';
import { Fingerprint, CheckCircle2, Terminal } from 'lucide-react';

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
      <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-xl animate-in font-sans">
        <div className="p-3 bg-emerald-500/20 rounded-2xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-white text-lg tracking-tight">Simulator Verified</p>
          <p className="text-sm text-emerald-400/80 font-medium tracking-tight">Biometric hash computed and validated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start gap-4 p-5 rounded-3xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40" />
        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
          <Terminal className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white mb-1 uppercase tracking-wider">Virtual Enrollment</p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            Testing environment simulation. Paste your test fingerprint string below to generate a secure enrollment hash.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. FPID_VOTER_SAMPLE"
            className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 text-slate-100 font-mono text-sm"
          />
        </div>
        
        <button
          type="button"
          onClick={handleVerify}
          disabled={!value.trim()}
          className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-lg transition-all shadow-xl shadow-white/5 active:scale-[0.98] disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-xs"
        >
          Verify Virtual Biometric
        </button>
      </div>
    </div>
  );
}
