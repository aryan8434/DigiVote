import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { ArrowLeft, Search, Mail, Phone } from 'lucide-react';

const FAQs = [
  { q: 'How do I register as a voter?', a: 'Click on VOTER REGISTRATION, fill the form with your details, complete biometric capture (photo with liveness and fingerprint), and submit. Registration is only open before the deadline.' },
  { q: 'How do I vote?', a: 'On election day, click VOTE. Select your constituency and ward, enter Aadhar, sign in. Complete photo and fingerprint verification, then select your candidate and submit.' },
  { q: 'Can I vote again?', a: 'No. After voting, you cannot vote again for 3 days. The system blocks repeat voting using your Aadhar and biometric data.' },
  { q: 'How is my vote secure?', a: 'Votes are stored with SHA-256 blockchain-style hashing. Each vote links to the previous one. Tampering breaks the chain. Biometric data is hashed, not stored in raw form.' },
  { q: 'When does registration close?', a: 'Registration closes at the configured deadline. Check the home page for status. After the deadline, the VOTER REGISTRATION and CANDIDATE REGISTRATION blocks are disabled.' },
];

export default function HelpDesk() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [faqFilter, setFaqFilter] = useState('');

  useEffect(() => {
    if (query.trim().length >= 2) {
      setLoading(true);
      axiosClient
        .get(`/api/candidate/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => {
          if (r.data?.candidates) setCandidates(r.data.candidates);
        })
        .finally(() => setLoading(false));
    } else {
      setCandidates([]);
    }
  }, [query]);

  const filteredFaqs = faqFilter
    ? FAQs.filter((f) => f.q.toLowerCase().includes(faqFilter.toLowerCase()) || f.a.toLowerCase().includes(faqFilter.toLowerCase()))
    : FAQs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Help Desk</h2>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs or candidate profiles..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {query.trim().length >= 2 && (
            <div className="mb-8">
              <h3 className="font-semibold text-slate-800 mb-4">Candidate Profiles</h3>
              {loading ? (
                <p className="text-slate-500">Searching...</p>
              ) : candidates.length === 0 ? (
                <p className="text-slate-500">No candidates found.</p>
              ) : (
                <div className="space-y-4">
                  {candidates.map((c) => (
                    <div
                      key={c._id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition"
                    >
                      <div className="flex gap-4">
                        {c.photoURL && (
                          <img
                            src={c.photoURL}
                            alt=""
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-slate-600">{c.partyName}</p>
                          <p className="text-sm text-slate-500">{c.position}</p>
                          {c.education?.length > 0 && (
                            <p className="text-sm mt-2">
                              <span className="font-medium">Education:</span>{' '}
                              {c.education.join(', ')}
                            </p>
                          )}
                          {c.achievements?.length > 0 && (
                            <p className="text-sm">
                              <span className="font-medium">Achievements:</span>{' '}
                              {c.achievements.join(', ')}
                            </p>
                          )}
                          {c.contact && (
                            <div className="flex gap-4 mt-2 text-sm">
                              {c.contact.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {c.contact.email}
                                </span>
                              )}
                              {c.contact.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {c.contact.phone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Frequently Asked Questions</h3>
            <input
              type="text"
              value={faqFilter}
              onChange={(e) => setFaqFilter(e.target.value)}
              placeholder="Filter FAQs..."
              className="w-full px-4 py-2 rounded-lg border border-slate-300 mb-4 focus:ring-2 focus:ring-emerald-500"
            />
            <div className="space-y-4">
              {filteredFaqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-medium text-slate-800">{faq.q}</p>
                  <p className="text-slate-600 mt-2 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
