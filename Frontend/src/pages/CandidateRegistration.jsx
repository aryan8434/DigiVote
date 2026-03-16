import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Plus, X } from 'lucide-react';

function ArrayInput({ label, values, onChange, placeholder }) {
  const add = () => onChange([...values, '']);
  const update = (i, v) => onChange(values.map((x, j) => (j === i ? v : x)));
  const remove = (i) => onChange(values.filter((_, j) => j !== i));

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <button type="button" onClick={add} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
            <button type="button" onClick={() => remove(i)} className="p-2 text-rose-600 hover:bg-rose-50 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
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
      if (payload.education.length === 0 || payload.experience.length === 0 || payload.achievements.length === 0 || payload.promises.length === 0) {
        setError('Please fill at least one item in Education, Experience, Achievements, and Promises.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        // Skip URL fields, we'll append the actual files below
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

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoPreview('');
      setPhotoFile(null);
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setPhotoFile(file);
  };

  const handleSymbolChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSymbolPreview('');
      setSymbolFile(null);
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setSymbolPreview(localUrl);
    setSymbolFile(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Candidate Registration</h2>

          {error && (
            <div className="p-4 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Candidate preview"
                className="mt-3 w-24 h-24 rounded-full object-cover border border-slate-200"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.name}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.party}</label>
              <input
                type="text"
                value={form.partyName}
                onChange={(e) => update('partyName', e.target.value)}
                required
                placeholder="Party name"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Party Symbol</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSymbolChange}
              className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {symbolPreview && (
              <img
                src={symbolPreview}
                alt="Symbol preview"
                className="mt-3 w-16 h-16 object-contain border border-slate-200 bg-white"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.position}</label>
            <input
              type="text"
              value={form.position}
              onChange={(e) => update('position', e.target.value)}
              required
              placeholder="e.g. Member of Parliament - Central District"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Constituency</label>
            <input
              type="text"
              value={form.constituency}
              onChange={(e) => update('constituency', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <ArrayInput
            label="📚 Education"
            values={form.education}
            onChange={(v) => update('education', v)}
            placeholder="e.g. Master's in Public Administration"
          />

          <ArrayInput
            label="Experience"
            values={form.experience}
            onChange={(v) => update('experience', v)}
            placeholder="e.g. 10 years as Council Member"
          />

          <ArrayInput
            label="🏆 Key Achievements"
            values={form.achievements}
            onChange={(v) => update('achievements', v)}
            placeholder="e.g. Built 3 new schools"
          />

          <ArrayInput
            label="📢 Main Promises"
            values={form.promises}
            onChange={(v) => update('promises', v)}
            placeholder="e.g. Free education for all"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">⚖️ {t.criminalRecord}</label>
            <input
              type="text"
              value={form.criminalRecord}
              onChange={(e) => update('criminalRecord', e.target.value)}
              placeholder="NONE or details"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">💰 {t.assetsDeclared}</label>
            <input
              type="text"
              value={form.assetsDeclared}
              onChange={(e) => update('assetsDeclared', e.target.value)}
              placeholder="e.g. ₹50 Lakhs"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-800 mb-4">📞 {t.contact}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email"
                value={form.contact.email}
                onChange={(e) => update('contact.email', e.target.value)}
                className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.contact.phone}
                onChange={(e) => update('contact.phone', e.target.value)}
                className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Facebook"
                value={form.contact.facebook}
                onChange={(e) => update('contact.facebook', e.target.value)}
                className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 col-span-2"
              />
              <input
                type="text"
                placeholder="Twitter handle"
                value={form.contact.twitter}
                onChange={(e) => update('contact.twitter', e.target.value)}
                className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 col-span-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
