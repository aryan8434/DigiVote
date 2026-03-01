import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import FingerprintSimulator from '../components/FingerprintSimulator';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const STEPS = ['details', 'fingerprint', 'candidates', 'submit'];

export default function VoteFlow() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    constituency: '',
    ward: '',
    aadhar: '',
  });
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [fingerprintHash, setFingerprintHash] = useState('');
  const [voterVerified, setVoterVerified] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    axiosClient.get('/api/voter/constituencies').then((r) => {
      if (r.data?.constituencies) setConstituencies(r.data.constituencies);
    });
  }, []);

  useEffect(() => {
    if (!form.constituency) {
      setWards([]);
      return;
    }
    axiosClient.get(`/api/voter/wards/${encodeURIComponent(form.constituency)}`).then((r) => {
      if (r.data?.wards) setWards(r.data.wards);
    });
  }, [form.constituency]);

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post('/api/vote/verify', form);
      if (res.data?.success && res.data?.canVote) {
        setVoterVerified(true);
        setStep(1); // go directly to fingerprint step
      } else {
        setError(res.data?.message || 'Cannot proceed to vote.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2 && form.constituency) {
      axiosClient.get(`/api/candidate/list?constituency=${encodeURIComponent(form.constituency)}`).then((r) => {
        if (r.data?.candidates) setCandidates(r.data.candidates);
      });
    }
  }, [step, form.constituency]);

  const handleCastVote = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post('/api/vote/cast', {
        candidateId: selectedCandidate._id,
        aadhar: form.aadhar,
        constituency: form.constituency,
        ward: form.ward,
        fingerprintHash,
      });
      if (res.data?.success) {
        setStep(4);
      } else {
        setError(res.data?.message || 'Vote failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Vote failed.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => (step === 0 ? navigate('/') : setStep(step - 1))}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
            {error}
          </div>
        )}

        {currentStep === 'details' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Sign In to Vote</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.constituency}</label>
              {constituencies.length > 0 ? (
                <select
                  value={form.constituency}
                  onChange={(e) => setForm((f) => ({ ...f, constituency: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select</option>
                  {constituencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.constituency}
                  onChange={(e) => setForm((f) => ({ ...f, constituency: e.target.value }))}
                  placeholder="Enter constituency"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.wardNumber}</label>
              {wards.length > 0 ? (
                <select
                  value={form.ward}
                  onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select</option>
                  {wards.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.ward}
                  onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))}
                  placeholder="Enter ward"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.aadharNumber}</label>
              <input
                type="text"
                value={form.aadhar}
                onChange={(e) => setForm((f) => ({ ...f, aadhar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                placeholder="12 digits"
                maxLength={12}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={loading || !form.constituency || !form.ward || form.aadhar.length !== 12}
              className="w-full py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading ? 'Verifying...' : t.signIn}
            </button>
          </div>
        )}

        {currentStep === 'fingerprint' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t.fingerprint}</h2>
            <FingerprintSimulator onHash={setFingerprintHash} />
            <button
              onClick={() => setStep(3)}
              disabled={!fingerprintHash}
              className="mt-6 w-full py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              View Candidates
            </button>
          </div>
        )}

        {currentStep === 'candidates' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t.candidates}</h2>
            <div className="space-y-4">
              {candidates.length === 0 && (
                <p className="text-slate-500 text-center py-8">No candidates in this constituency.</p>
              )}
              {candidates.map((c) => (
                <div
                  key={c._id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedCandidate?._id === c._id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                  onClick={() => setSelectedCandidate(selectedCandidate?._id === c._id ? null : c)}
                >
                  <img
                    src={c.photoURL || '/placeholder-avatar.png'}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover bg-slate-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23e2e8f0" width="64" height="64" rx="32"/%3E%3Ccircle cx="32" cy="24" r="10" fill="%2394a3b8"/%3E%3Cellipse cx="32" cy="56" rx="20" ry="12" fill="%2394a3b8"/%3E%3C/svg%3E';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-slate-600">{c.partyName}</p>
                  </div>
                  {c.symbolURL && (
                    <img src={c.symbolURL} alt="" className="w-10 h-10 object-contain" />
                  )}
                  <span className="text-sm font-medium text-emerald-600">
                    {selectedCandidate?._id === c._id ? t.unvote : t.voteBtn}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleCastVote}
              disabled={loading || !selectedCandidate}
              className="mt-8 w-full py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {loading ? 'Submitting...' : t.submit}
            </button>
          </div>
        )}

        {currentStep === 'submit' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Vote Recorded Successfully</h2>
            <p className="text-slate-600 mb-8">
              You cannot vote again for 3 days. Thank you for participating.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
