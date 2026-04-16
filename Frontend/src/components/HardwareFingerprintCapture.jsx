import { useEffect, useState } from 'react';
import { Fingerprint, PlugZap, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { sha256 } from '../utils/sha256';

export default function HardwareFingerprintCapture({ onHash }) {
  const isNative = Capacitor.isNativePlatform();
  const [supported, setSupported] = useState(true);
  const [port, setPort] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState('Device offline');
  const [mode, setMode] = useState('Register'); // or 'Voting'
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isNative && !('serial' in navigator)) {
      setSupported(false);
    }
  }, [isNative]);

  const connect = async () => {
    try {
      setConnecting(true);
      setStatus('Waiting for device selection...');
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });
      setPort(selectedPort);
      setStatus('Hardware session active');
      readLoop(selectedPort);
    } catch (err) {
      console.error(err);
      setStatus('Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const readLoop = async (serialPort) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;
        buffer += value;
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line) continue;
          handleLineFromDevice(line);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      reader.releaseLock();
      await readableStreamClosed.catch(() => {});
    }
  };

  const handleLineFromDevice = async (line) => {
    console.log('FP device:', line);
    if (line.startsWith('FPID_')) {
      setStatus(`Data received: ${line}`);
      const hash = await sha256(line);
      onHash?.(hash);
      setDone(true);
    }
  };

  const sendCommand = async (command) => {
    if (!port) {
      setStatus('Connect hardware first');
      return;
    }
    try {
      const textEncoder = new TextEncoder();
      const writer = port.writable.getWriter();
      await writer.write(textEncoder.encode(`${command}\n`));
      writer.releaseLock();
      setStatus(`Command "${command}" sent. Interacting with sensor...`);
    } catch (err) {
      console.error(err);
      setStatus('Command transmission failed');
    }
  };

  const runMobileMockScan = async () => {
    try {
      setConnecting(true);
      setStatus('Checking biometric availability...');
      const availability = await BiometricAuth.checkBiometry();
      if (!availability?.isAvailable) {
        setStatus(availability?.reason || 'Biometric authentication unavailable on this device');
        return;
      }

      setStatus('Waiting for fingerprint authentication...');
      await BiometricAuth.authenticate({
        reason: 'Mock fingerprint scan for vote verification',
        cancelTitle: 'Cancel',
        androidTitle: 'Fingerprint Verification',
        androidSubtitle: 'Use phone fingerprint to continue voting',
        allowDeviceCredential: false,
      });

      const mockFingerprintPayload = `MOBILE_MOCK_SCAN_${Date.now()}`;
      const hash = await sha256(mockFingerprintPayload);
      onHash?.(hash);
      setDone(true);
      setStatus('Mock fingerprint verification successful');
    } catch (err) {
      console.error(err);
      setStatus(err?.message || 'Fingerprint authentication failed');
    } finally {
      setConnecting(false);
    }
  };

  if (!supported) {
    return (
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 backdrop-blur-md flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>
          Browser version does not support Web Serial API. Please use Chrome or Edge for hardware integration.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
        <div className="p-3 bg-emerald-500/20 rounded-2xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-white text-lg tracking-tight">Biometric Data Acquired</p>
          <p className="text-sm text-emerald-400/80 font-medium">Verified via external hardware sensor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-5 rounded-3xl bg-slate-950/40 border border-slate-800/60 backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
          <Cpu className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white mb-1 uppercase tracking-wider">Hardware Interface</p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            Compatible with DigiVote external biometric modules. Ensure your USB-Serial device is recognized before connecting.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        {isNative ? (
          <button
            type="button"
            onClick={runMobileMockScan}
            disabled={connecting}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-950/20 active:scale-95 disabled:opacity-50"
          >
            <Fingerprint className="w-4 h-4" />
            {connecting ? 'Scanning...' : 'Scan with Phone Fingerprint'}
          </button>
        ) : !port ? (
          <button
            type="button"
            onClick={connect}
            disabled={connecting}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-950/20 active:scale-95 disabled:opacity-50"
          >
            <PlugZap className="w-4 h-4" />
            {connecting ? 'Initializing...' : 'Initialize Device'}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="Register">Registration Mode</option>
              <option value="Voting">Verification Mode</option>
            </select>

            <button
              type="button"
              onClick={() => sendCommand(mode)}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-950/20 active:scale-95"
            >
              Start {mode}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <div className={`h-2 w-2 rounded-full ${isNative ? (done ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700') : port ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{status}</p>
        </div>
      </div>
    </div>
  );
}
