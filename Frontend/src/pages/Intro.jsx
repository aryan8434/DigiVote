import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';


const DIGIVOTE_LOGO_URL =
  'https://drive.google.com/uc?export=view&id=1naSUDeBakElU24rHJ56PkLzQbS5K8g7g';

export default function Intro() {
  const navigate = useNavigate();
  const { t, toggleLang } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-slate-900/80 border border-emerald-400/50 flex items-center justify-center overflow-hidden">
              <img
                src={DIGIVOTE_LOGO_URL}
                alt="DigiVote logo"
                className="h-full w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-400/80">
                Secure Digital Voting
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">DigiVote</h1>
            </div>
          </div>

          <button
            onClick={toggleLang}
            className="px-3 sm:px-4 py-2 rounded-lg bg-emerald-500 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-emerald-400 shadow-[0_10px_35px_rgba(16,185,129,0.45)] transition-colors"
          >
            {t.changeLanguage}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
          <section className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400/80">
              Welcome to DigiVote
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Fast, secure
              <span className="block text-emerald-400">digital elections for everyone.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300/90 max-w-xl">
              This portal guides your community through voter registration, candidate onboarding, and
              transparent voting in a single streamlined flow.
            </p>
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-slate-300/90">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                End‑to‑end encrypted ballots
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Real‑time election status
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/home')}
                className="px-6 py-2.5 rounded-lg bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400 shadow-[0_16px_45px_rgba(16,185,129,0.55)] transition-colors"
              >
                Enter voting portal
              </button>
              <button
                onClick={() => navigate('/help-desk')}
                className="px-5 py-2.5 rounded-lg border border-slate-700 bg-slate-900/80 text-sm font-medium text-slate-100 hover:border-emerald-400/70 hover:bg-slate-900 transition-colors"
              >
                Visit help desk
              </button>
            </div>
          </section>

          <section className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-6 bg-emerald-500/15 blur-3xl rounded-[2.5rem]" />
              <div className="relative h-64 w-64 sm:h-72 sm:w-72 rounded-[2.5rem] bg-slate-900/90 border border-emerald-400/60 shadow-[0_26px_80px_rgba(16,185,129,0.45)] flex items-center justify-center overflow-hidden">
                <img
                  src={DIGIVOTE_LOGO_URL}
                  alt="DigiVote logo large"
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

