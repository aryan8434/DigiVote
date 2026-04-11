import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trophy, Users } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

export default function ElectionResults() {
  const navigate = useNavigate();

  const [constituencies, setConstituencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let isMounted = true;

    axiosClient
      .get('/api/vote/result/constituencies')
      .then((res) => {
        if (!isMounted) return;
        setConstituencies(res.data?.constituencies || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Unable to load constituencies.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredConstituencies = constituencies.filter((name) =>
    name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const handleSearchResult = async () => {
    const constituency = selectedConstituency || searchTerm.trim();
    if (!constituency) {
      setError('Please select or type a constituency.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await axiosClient.get(
        `/api/vote/result?constituency=${encodeURIComponent(constituency)}`
      );
      if (res.data?.success) {
        setResult(res.data);
      } else {
        setError(res.data?.message || 'Result not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch election result.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Intro
        </button>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Election Results
          </h1>
          <p className="text-slate-400 mb-6">
            Search by constituency and view winner plus vote count of all candidates.
          </p>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-start">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Constituency Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedConstituency('');
                  }}
                  placeholder="Type constituency name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {searchTerm.trim() && filteredConstituencies.length > 0 && (
                <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80">
                  {filteredConstituencies.map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        setSelectedConstituency(name);
                        setSearchTerm(name);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSearchResult}
              disabled={loading}
              className="h-[46px] px-6 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? 'Searching...' : 'Search Result'}
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-emerald-300" />
                <h2 className="text-2xl font-black text-emerald-200">Winner</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-[auto_1fr_auto] items-center">
                <img
                  src={result.winner?.photoURL || '/placeholder-avatar.png'}
                  alt={result.winner?.name || 'Winner'}
                  className="w-24 h-24 rounded-2xl object-cover border border-emerald-400/30"
                />
                <div>
                  <p className="text-2xl font-extrabold text-white">{result.winner?.name}</p>
                  <p className="text-emerald-200">{result.winner?.partyName}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs uppercase tracking-wider text-emerald-300/80">Vote Count</p>
                  <p className="text-3xl font-black text-emerald-100">{result.winner?.voteCount ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-300" />
                  Candidate Profiles and Vote Count
                </h3>
                <p className="text-sm text-slate-400">Total Votes: {result.totalVotesCast}</p>
              </div>

              <div className="space-y-3">
                {result.candidates?.map((candidate, idx) => (
                  <div
                    key={candidate._id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4 flex items-center gap-4"
                  >
                    <span className="w-8 text-center text-slate-500 font-bold">#{idx + 1}</span>
                    <img
                      src={candidate.photoURL || '/placeholder-avatar.png'}
                      alt={candidate.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{candidate.name}</p>
                      <p className="text-sm text-slate-400 truncate">{candidate.partyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest text-slate-500">Votes</p>
                      <p className="text-lg font-black text-emerald-300">{candidate.voteCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}