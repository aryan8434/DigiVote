import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServerTime } from '../hooks/useServerTime';
import { useLanguage } from '../contexts/LanguageContext';
import { Vote, UserPlus, Users, HelpCircle } from 'lucide-react';

function Countdown({ ms }) {
  if (ms <= 0) return null;
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((ms % (60 * 1000)) / 1000);
  const { t } = useLanguage();
  return (
    <div className="flex gap-3 justify-start flex-wrap text-xs sm:text-sm font-medium text-emerald-200">
      {d > 0 && (
        <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40">
          {d} {t.days}
        </span>
      )}
      <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40">
        {h} {t.hours}
      </span>
      <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40">
        {m} {t.mins}
      </span>
      <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40">
        {s} {t.secs}
      </span>
    </div>
  );
}

function Block({ icon: Icon, title, onClick, disabled, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-start justify-between p-6 rounded-2xl
        bg-slate-900/70 border border-slate-700/80 shadow-[0_18px_55px_rgba(15,23,42,0.9)]
        hover:border-emerald-400/80 hover:shadow-[0_22px_70px_rgba(16,185,129,0.35)]
        hover:-translate-y-1 hover:scale-[1.01]
        transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none
        text-left w-full min-h-[170px] ${className}
      `}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-400/50">
          <Icon className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
      </div>
      <div className="text-sm text-slate-300/90">{children}</div>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { t, toggleLang } = useLanguage();
  const {
    loading,
    registrationOpen,
    votingOpen,
    votingNotStarted,
    countdownToStart,
  } = useServerTime();

  const handleVote = () => {
    if (votingNotStarted) return;
    if (!votingOpen) {
      alert('Voting period has ended.');
      return;
    }
    navigate('/vote');
  };

  const handleVoterReg = () => {
    if (!registrationOpen) {
      alert(t.registrationClosed);
      return;
    }
    navigate('/voter-registration');
  };

  const handleCandidateReg = () => {
    if (!registrationOpen) {
      alert(t.registrationClosed);
      return;
    }
    navigate('/candidate-registration');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-100/80">
            Preparing your secure ballot...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-400/80">
              Secure Digital Voting
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">DigiVote</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="hidden sm:inline-flex px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-xs sm:text-sm font-medium text-slate-100 hover:border-emerald-400/70 hover:bg-slate-900 transition-colors"
            >
              Admin Console
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14 grid lg:grid-cols-[1.2fr,1fr] gap-10 lg:gap-14 items-start">
          {/* Left: hero & status */}
          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
                Cast your vote with
                <span className="block text-emerald-400">trust & transparency.</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300/90 max-w-xl">
                DigiVote turns complex election flows into a clean, guided experience. Verify your
                identity, explore candidates, and submit your ballot in a few secure steps.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 via-slate-950 to-slate-950/80 p-4 sm:p-5 shadow-[0_18px_60px_rgba(16,185,129,0.25)]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
                    Live election status
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-semibold text-slate-50">
                    {votingOpen
                      ? t.electionLive || 'Election is live'
                      : votingNotStarted
                      ? t.electionScheduled || 'Election scheduled'
                      : t.electionClosed || 'Election closed'}
                  </p>
                </div>
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    votingOpen
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/60'
                      : 'bg-slate-900 text-slate-200 border border-slate-600'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      votingOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {votingOpen ? 'LIVE' : 'SYNCED'}
                </span>
              </div>

              {votingNotStarted && countdownToStart > 0 && (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                    {t.electionStartsIn}
                  </p>
                  <Countdown ms={countdownToStart} />
                </div>
              )}
            </div>

            <div className="grid gap-3 text-xs sm:text-sm text-slate-300/90">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <p>End-to-end encrypted vote transfer and tamper-resistant storage.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <p>Real-time sync between election configuration and all connected devices.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <p>Designed for campuses, organizations, and communities of any size.</p>
              </div>
            </div>
          </section>

          {/* Right: primary actions */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Block
                icon={Vote}
                title={t.vote}
                onClick={handleVote}
                disabled={!votingOpen && !votingNotStarted}
              >
                {votingNotStarted && countdownToStart > 0 ? (
                  <p className="text-emerald-200 text-xs sm:text-sm">
                    Your ballot opens soon. You&apos;ll be guided step-by-step once voting starts.
                  </p>
                ) : votingOpen ? (
                  <p className="text-emerald-200 text-xs sm:text-sm">
                    Begin a secure voting session and submit your choices with confidence.
                  </p>
                ) : (
                  <p className="text-rose-200 text-xs sm:text-sm">Voting period has ended.</p>
                )}
              </Block>

              <Block
                icon={UserPlus}
                title={t.voterRegistration}
                onClick={handleVoterReg}
                disabled={!registrationOpen}
              >
                {registrationOpen ? (
                  <p className="text-slate-200 text-xs sm:text-sm">
                    Create your voter profile so you can participate when the election opens.
                  </p>
                ) : (
                  <p className="mt-1 text-rose-200 text-xs sm:text-sm">{t.registrationClosed}</p>
                )}
              </Block>

              <Block
                icon={Users}
                title={t.candidateRegistration}
                onClick={handleCandidateReg}
                disabled={!registrationOpen}
              >
                {registrationOpen ? (
                  <p className="text-slate-200 text-xs sm:text-sm">
                    Submit your candidacy and share your vision with your voters.
                  </p>
                ) : (
                  <p className="mt-1 text-rose-200 text-xs sm:text-sm">{t.registrationClosed}</p>
                )}
              </Block>

              <Block
                icon={HelpCircle}
                title={t.helpDesk}
                onClick={() => navigate('/help-desk')}
                disabled={false}
              >
                <p className="text-slate-200 text-xs sm:text-sm">
                  Get answers about registration, voting steps, or resolving access issues.
                </p>
              </Block>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

