import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

export default function VoterLogin() {
  const navigate = useNavigate();
  const [voterId, setVoterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!voterId.trim()) {
      setError('Please enter your Voter ID.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await axiosClient.get(`/api/voter/verify/${voterId.trim()}`);
      if (res.data?.success) {
        // You can save voterDetails to context/local storage here if needed for Home page
        // localStorage.setItem('voterDetails', JSON.stringify(res.data.voterDetails));
        navigate('/home');
      } else {
        setError(res.data?.message || 'Verification failed.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error occurred while verifying your Voter ID.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Intro</span>
          </button>

          <button
            onClick={() => navigate('/admin-login')}
            title="Admin Panel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-xs text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Inner Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/10 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="text-center mb-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold tracking-tight mb-2">Voter Login</h2>
                <p className="text-slate-400">
                  Enter your assigned Voter ID to access the DigiVote secure portal.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="voterId" className="block text-sm font-medium text-slate-300 mb-2">
                    Voter ID
                  </label>
                  <input
                    id="voterId"
                    type="text"
                    value={voterId}
                    onChange={(e) => setVoterId(e.target.value)}
                    placeholder="e.g. VTR-1234-5678"
                    className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-100 placeholder:text-slate-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-emerald-500 text-slate-950 font-bold text-lg hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                >
                  {loading ? 'Verifying Identity...' : 'Access Portal'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                <p className="text-slate-400 text-sm">
                  Not registered yet?{' '}
                  <button
                    onClick={() => navigate('/voter-registration')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-all"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
