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
    <div className="flex gap-2 justify-center flex-wrap">
      {d > 0 && <span>{d} {t.days}</span>}
      <span>{h} {t.hours}</span>
      <span>{m} {t.mins}</span>
      <span>{s} {t.secs}</span>
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
        relative flex flex-col items-center justify-center p-8 rounded-2xl
        bg-white/95 shadow-xl border-2 border-slate-200
        hover:border-emerald-500 hover:shadow-2xl hover:scale-[1.02]
        transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
        text-left w-full min-h-[180px] ${className}
      `}
    >
      <Icon className="w-14 h-14 text-emerald-700 mb-3" strokeWidth={1.5} />
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      {children}
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50">
        <div className="animate-pulse text-emerald-700 font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50/30 to-teal-50">
      <header className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">VoteChain</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 rounded-lg bg-slate-600 text-white font-medium hover:bg-slate-700 transition"
          >
            Admin
          </button>
          <button
            onClick={toggleLang}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
          >
            {t.changeLanguage}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Block
            icon={Vote}
            title={t.vote}
            onClick={handleVote}
            disabled={!votingOpen && !votingNotStarted}
          >
            {votingNotStarted && countdownToStart > 0 && (
              <div className="mt-2 text-sm text-amber-700 font-medium">
                {t.electionStartsIn}{' '}
                <Countdown ms={countdownToStart} />
              </div>
            )}
          </Block>

          <Block
            icon={UserPlus}
            title={t.voterRegistration}
            onClick={handleVoterReg}
            disabled={!registrationOpen}
          >
            {!registrationOpen && (
              <p className="mt-2 text-sm text-rose-600 font-medium">{t.registrationClosed}</p>
            )}
          </Block>

          <Block
            icon={Users}
            title={t.candidateRegistration}
            onClick={handleCandidateReg}
            disabled={!registrationOpen}
          >
            {!registrationOpen && (
              <p className="mt-2 text-sm text-rose-600 font-medium">{t.registrationClosed}</p>
            )}
          </Block>

          <Block
            icon={HelpCircle}
            title={t.helpDesk}
            onClick={() => navigate('/help-desk')}
            disabled={false}
          />
        </div>
      </main>
    </div>
  );
}
