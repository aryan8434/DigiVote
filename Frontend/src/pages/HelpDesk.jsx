import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Search, Mail, Phone, MessageSquare, Info, UserCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold uppercase tracking-widest text-xs">Back to Home</span>
        </button>

        <div className="mb-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-400 font-bold mb-2">Support Center</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-4 italic font-serif">Help Desk</h1>
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
            Find answers to frequently asked questions or explore candidate profiles to make an informed choice.
          </p>
        </div>

        <div className="space-y-8">
          {/* Main Search Area */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search candidates by name, party, or keyword..."
                className="w-full pl-14 pr-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 shadow-inner"
              />
            </div>

            {query.trim().length >= 2 && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-6">
                  <UserCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white tracking-tight">Candidate Insights</h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                  </div>
                ) : candidates.length === 0 ? (
                  <p className="text-slate-500 text-center py-10 bg-slate-950/30 rounded-2xl border border-slate-800/50 italic">
                    No matching candidates found in our records.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidates.map((c) => (
                      <div
                        key={c._id}
                        className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all duration-300 group"
                      >
                        <div className="flex gap-4">
                          <div className="relative">
                            <img
                              src={c.photoURL || 'https://via.placeholder.com/150'}
                              alt=""
                              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-800 group-hover:ring-emerald-500/30 transition-all"
                            />
                            {c.symbolURL && (
                              <img 
                                src={c.symbolURL} 
                                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 p-1 object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight truncate">
                              {c.name}
                            </h4>
                            <p className="text-emerald-500/90 text-sm font-bold uppercase tracking-widest text-[10px] mb-1">
                              {c.partyName}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
                              <Info className="w-3 h-3" />
                              <span className="truncate">{c.position}</span>
                            </div>
                            
                            <div className="flex gap-4 mt-auto">
                              {c.contact?.email && <Mail className="w-4 h-4 text-slate-600 hover:text-blue-400 cursor-help" />}
                              {c.contact?.phone && <Phone className="w-4 h-4 text-slate-600 hover:text-emerald-400 cursor-help" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Frequently Asked Questions</h3>
              </div>
              
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  value={faqFilter}
                  onChange={(e) => setFaqFilter(e.target.value)}
                  placeholder="Filter FAQs..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredFaqs.map((faq, i) => (
                <div 
                  key={i} 
                  className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 transition-colors group cursor-default"
                >
                  <div className="flex gap-4">
                    <span className="text-emerald-500/50 font-black text-lg font-serif">0{i+1}</span>
                    <div>
                      <h4 className="font-bold text-white tracking-tight mb-2 group-hover:text-emerald-400 transition-colors">
                        {faq.q}
                      </h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
