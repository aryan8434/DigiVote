import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Plus, X, User, Briefcase, Award, Megaphone, Scale, Wallet, Mail, Phone, Globe, Twitter, Facebook, Upload, Image as ImageIcon } from 'lucide-react';

function ArrayInput({ label, icon: Icon, values, onChange, placeholder, color = "emerald" }) {
  const add = () => onChange([...values, '']);
  const update = (i, v) => onChange(values.map((x, j) => (j === i ? v : x)));
  const remove = (i) => onChange(values.filter((_, j) => j !== i));

  const colorClass = color === "emerald" ? "text-emerald-400" : "text-indigo-400";
  const bgClass = color === "emerald" ? "bg-emerald-500/10" : "bg-indigo-500/10";

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${bgClass} rounded-lg`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
          <label className="block text-sm font-bold text-white tracking-tight uppercase tracking-[0.1em]">{label}</label>
        </div>
        <button 
          type="button" 
          onClick={add} 
          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={3} /> {values.length === 0 ? 'Add First' : 'Add Item'}
        </button>
      </div>
      <div className="space-y-3">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2 group animate-in slide-in-from-right-2 duration-300">
            <input
              type="text"
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-700 text-sm font-medium"
            />
            <button 
              type="button" 
              onClick={() => remove(i)} 
              className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {values.length === 0 && (
          <p className="text-center py-4 text-xs text-slate-600 italic">No items added yet.</p>
        )}
      </div>
    </div>
  );
}

export default function CandidateRegistration() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    partyName: '',
    symbolURL: '',
    photoURL: '',
    position: '',
    constituency: '',
    education: [''],
    experience: [''],
    achievements: [''],
    promises: [''],
    criminalRecord: 'NONE',
    assetsDeclared: '',
    contact: { email: '', phone: '', facebook: '', twitter: '' },
  });
  const [photoPreview, setPhotoPreview] = useState('');
  const [symbolPreview, setSymbolPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [symbolFile, setSymbolFile] = useState(null);

  const update = (key, value) => {
    if (key.startsWith('contact.')) {
      const sub = key.split('.')[1];
      setForm((f) => ({ ...f, contact: { ...f.contact, [sub]: value } }));
    } else {
      setForm((f) => ({ ...f, [key]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        education: form.education.filter(Boolean),
        experience: form.experience.filter(Boolean),
        achievements: form.achievements.filter(Boolean),
        promises: form.promises.filter(Boolean),
      };
      
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (key === 'photoURL' || key === 'symbolURL') return;
        if (Array.isArray(payload[key]) || typeof payload[key] === 'object') {
          formData.append(key, JSON.stringify(payload[key]));
        } else {
          formData.append(key, payload[key]);
        }
      });

      if (photoFile) formData.append('photoURL', photoFile);
      if (symbolFile) formData.append('symbolURL', symbolFile);

      const res = await axiosClient.post('/api/candidate/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        alert('Candidate registration successful!');
        navigate('/');
      } else {
        setError(res.data?.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    if (type === 'photo') {
      setPhotoPreview(localUrl);
      setPhotoFile(file);
    } else {
      setSymbolPreview(localUrl);
      setSymbolFile(file);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700 text-slate-100";
  const labelClasses = "block text-xs font-bold text-slate-500 mb-2 uppercase tracking-[0.15em]";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-[10px]">Portal Exit</span>
        </button>

        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 font-bold mb-3">Electoral Presence</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">Candidate Enrollment</h1>
          <p className="text-slate-500 max-w-lg leading-relaxed text-sm">Create your public profile. This information will be visible to all voters during the election period.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 pb-20">
          {error && (
            <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium backdrop-blur-md text-center">
              {error}
            </div>
          )}

          {/* Identity Section */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-[40px] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-10">
               <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-inner">
                  <User className="w-6 h-6 text-emerald-400" />
               </div>
               <h2 className="text-2xl font-bold text-white tracking-tight">Identity & Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              {/* Media Uploads */}
              <div className="md:col-span-4 space-y-8">
                <div className="text-center">
                   <p className={labelClasses}>Professional Photo</p>
                   <div className="relative inline-block group">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500/40 to-blue-500/40 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-950 flex items-center justify-center">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-slate-800" />
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer">
                          <Upload className="w-6 h-6 text-white mb-1" />
                          <span className="text-[10px] text-white font-bold uppercase">Update</span>
                          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} className="hidden" />
                        </label>
                      </div>
                   </div>
                </div>

                <div className="text-center">
                   <p className={labelClasses}>Official Party Symbol</p>
                   <div className="relative inline-block group">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500/40 to-indigo-500/40 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                      <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-950 flex items-center justify-center transition-all group-hover:border-indigo-500/40">
                        {symbolPreview ? (
                          <img src={symbolPreview} alt="Symbol" className="w-full h-full object-cover" />
                        ) : (
                          <Plus className="w-8 h-8 text-slate-800" />
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer">
                          <Upload className="w-5 h-5 text-white mb-0.5" />
                          <span className="text-[10px] text-white font-bold uppercase">Symbol</span>
                          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'symbol')} className="hidden" />
                        </label>
                      </div>
                   </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="md:col-span-8 space-y-6">
                <div>
                  <label className={labelClasses}>Legal Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    required
                    className={inputClasses}
                    placeholder="Candidate full name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Affiliated Party</label>
                    <input
                      type="text"
                      value={form.partyName}
                      onChange={(e) => update('partyName', e.target.value)}
                      required
                      placeholder="e.g. Democratic Alliance"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Constituency</label>
                    <input
                      type="text"
                      value={form.constituency}
                      onChange={(e) => update('constituency', e.target.value)}
                      required
                      className={inputClasses}
                      placeholder="e.g. Central District"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Running Position</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => update('position', e.target.value)}
                    required
                    placeholder="e.g. Member of Parliament"
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Credentials Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ArrayInput
              label="Academic Background"
              icon={Briefcase}
              values={form.education}
              onChange={(v) => update('education', v)}
              placeholder="e.g. PhD in Political Science"
              color="indigo"
            />
            <ArrayInput
              label="Professional Experience"
              icon={Award}
              values={form.experience}
              onChange={(v) => update('experience', v)}
              placeholder="e.g. 15 Years Public Service"
              color="indigo"
            />
            <ArrayInput
              label="Core Achievements"
              icon={Award}
              values={form.achievements}
              onChange={(v) => update('achievements', v)}
              placeholder="e.g. Community Health Initiative"
            />
            <ArrayInput
              label="Election Manifesto"
              icon={Megaphone}
              values={form.promises}
              onChange={(v) => update('promises', v)}
              placeholder="e.g. Transparent Budgeting"
            />
          </div>

          {/* Legal / Financial Section */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-[40px] p-8 backdrop-blur-xl shadow-2xl">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <div className="flex items-center gap-3 mb-6">
                      <Scale className="w-5 h-5 text-rose-400" />
                      <h3 className="text-lg font-bold text-white tracking-tight">Legal Disclosures</h3>
                   </div>
                   <label className={labelClasses}>Criminal Record History</label>
                   <input
                     type="text"
                     value={form.criminalRecord}
                     onChange={(e) => update('criminalRecord', e.target.value)}
                     placeholder="NONE or Case details"
                     className={`${inputClasses} border-rose-500/20 focus:ring-rose-500/50`}
                   />
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-6">
                      <Wallet className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-bold text-white tracking-tight">Asset Declaration</h3>
                   </div>
                   <label className={labelClasses}>Declared Net Worth</label>
                   <input
                     type="text"
                     value={form.assetsDeclared}
                     onChange={(e) => update('assetsDeclared', e.target.value)}
                     placeholder="e.g. ₹75,00,000 Total Assets"
                     className={inputClasses}
                   />
                </div>
             </div>
          </div>

          {/* Contact Methods */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-[40px] p-8 backdrop-blur-xl shadow-2xl">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                   <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Public Contact Channels</h2>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-400" />
                  <input type="email" placeholder="Official Email" value={form.contact.email} onChange={(e) => update('contact.email', e.target.value)} className={`${inputClasses} pl-12`} />
               </div>
               <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-400" />
                  <input type="tel" placeholder="Public Phone" value={form.contact.phone} onChange={(e) => update('contact.phone', e.target.value)} className={`${inputClasses} pl-12`} />
               </div>
               <div className="relative group col-span-full">
                  <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-400" />
                  <input type="text" placeholder="Facebook Profile URL" value={form.contact.facebook} onChange={(e) => update('contact.facebook', e.target.value)} className={`${inputClasses} pl-12`} />
               </div>
               <div className="relative group col-span-full">
                  <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-blue-400" />
                  <input type="text" placeholder="Twitter Handle" value={form.contact.twitter} onChange={(e) => update('contact.twitter', e.target.value)} className={`${inputClasses} pl-12`} />
               </div>
             </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-[32px] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl transition-all shadow-2xl shadow-emerald-900/40 active:scale-[0.98] disabled:opacity-50 group overflow-hidden relative"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
               {loading ? 'Processing Protocol...' : 'Submit Verification Data'}
               {!loading && <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-2 transition-transform duration-500" />}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-emerald-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </form>
      </div>
    </div>
  );
}
