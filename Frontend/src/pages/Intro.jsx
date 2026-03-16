import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const DIGIVOTE_LOGO_URL = "https://drive.google.com/thumbnail?id=1naSUDeBakElU24rHJ56PkLzQbS5K8g7g";

export default function Intro() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">DigiVote</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center relative">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto px-6 py-12 w-full grid lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT SIDE: Content */}
          <section className="space-y-8 z-10">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                v2.0 Secure Protocol
              </span>
              <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                The Future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-500 drop-shadow-sm">
                  Digital Democracy
                </span>
              </h2>
              <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                A transparent, tamper-proof, and accessible voting ecosystem designed for modern communities. Secure your voice with end-to-end encryption.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/home')}
                className="px-8 py-4 rounded-xl bg-emerald-500 text-slate-950 font-bold text-lg hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(16,185,129,0.3)]"
              >
                Enter Voting Portal
              </button>
              <button
                onClick={() => navigate('/help-desk')}
                className="px-8 py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-lg hover:border-emerald-500/50 hover:bg-slate-800 transition-all"
              >
                Learn More
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex items-center gap-6 border-t border-slate-800">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">99.9%</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Uptime</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">AES-256</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Encryption</span>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE: Bright Visual Image */}
          <section className="relative flex justify-center items-center lg:justify-end">
            {/* Massive Outer Glow */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full scale-75 animate-pulse" />
            
            {/* Visual Container */}
            <div className="relative group flex items-center justify-center">
              {/* Spinning Ring (Decorative) */}
              <div className="absolute inset-0 border-2 border-dashed border-emerald-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
              
              {/* Main Card */}
              <div className="relative z-10 w-80 h-80 sm:w-[450px] sm:h-[450px] rounded-[4rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-400/40 shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden flex items-center justify-center group-hover:border-emerald-400 transition-colors duration-500">
                
                {/* Internal Light Rays */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-400/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full" />
                
                {/* The Logo (Brighter) */}
                <div className="relative p-12 bg-white/5 rounded-full backdrop-blur-sm border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-110">
                  <img
                    src={DIGIVOTE_LOGO_URL}
                    alt="DigiVote Central"
                    className="w-200 h-auto sm:w-64 sm:h-64 object-cover brightness-125 contrast-110 drop-shadow-[0_0_40px_rgba(52,211,153,0.7)]"
                  />
                </div>
            
              </div>

              {/* Orbital Badge (outside) */}

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}