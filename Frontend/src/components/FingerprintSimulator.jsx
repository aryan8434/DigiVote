import { useState, useEffect } from 'react';
import { sha256 } from '../utils/sha256';
import { Fingerprint, CheckCircle2, ScanLine } from 'lucide-react';

export default function FingerprintSimulator({ onHash }) {
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);

  const startScan = () => {
    if (scanning || done) return;
    setScanning(true);
    
    // Simulate biometric hardware scan taking 2 seconds
    setTimeout(async () => {
      // Auto-generate a dummy static hash representing the device owner's fingerprint
      const dummyBiometricString = "FINGERPRINT_HARDWARE_TOKEN_2026";
      const hash = await sha256(dummyBiometricString);
      onHash?.(hash);
      setScanning(false);
      setDone(true);
    }, 2000);
  };

  if (done) {
    return (
      <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-xl animate-in fade-in duration-500 font-sans">
        <div className="p-3 bg-emerald-500/20 rounded-2xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-white text-lg tracking-tight">Biometric Verified</p>
          <p className="text-sm text-emerald-400/80 font-medium tracking-tight">Hardware match successfully validated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col items-center">
      
      <div className="text-center space-y-2 mb-4">
        <p className="text-lg font-bold text-white tracking-widest uppercase">
          {scanning ? 'Scanning...' : 'Biometric Security'}
        </p>
        <p className="text-sm text-slate-400">
          {scanning ? 'Hold device steady' : 'Tap the sensor to authenticate your identity.'}
        </p>
      </div>

      <div className="relative flex items-center justify-center w-32 h-40 group cursor-pointer" onClick={startScan}>
        
        {/* Background glow when scanning */}
        <div className={`absolute inset-0 bg-emerald-500 blur-2xl rounded-full transition-opacity duration-500 ${scanning ? 'opacity-30' : 'opacity-0 group-hover:opacity-10'}`} />

        {/* The fingerprint icon */}
        <Fingerprint className={`w-24 h-24 transition-colors duration-500 ${scanning ? 'text-emerald-400' : 'text-slate-600 group-hover:text-emerald-500'}`} strokeWidth={0.5} />

        {/* The scanner line (laser) */}
        {scanning && (
          <div className="absolute top-0 w-32 h-1 bg-emerald-400 animate-scannerLine shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10" />
        )}
      </div>
      
    </div>
  );
}
