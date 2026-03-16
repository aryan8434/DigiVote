import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useLanguage } from '../contexts/LanguageContext';
import FingerprintSimulator from '../components/FingerprintSimulator';
import HardwareFingerprintCapture from '../components/HardwareFingerprintCapture';
import { ArrowLeft, Check } from 'lucide-react';

export default function VoterRegistration() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fingerprintHash, setFingerprintHash] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    fatherOrHusbandName: '',
    dateOfBirth: '',
    gender: 'male',
    aadhar: '',
    voterId: '',
    address: { permanent: '', current: '' },
    constituency: '',
    ward: '',
    booth: '',
    contact: '',
  });

  const canSubmit =
    form.fullName &&
    form.fatherOrHusbandName &&
    form.dateOfBirth &&
    form.gender &&
    form.aadhar.length === 12 &&
    form.voterId &&
    form.address.permanent &&
    form.constituency &&
    form.ward &&
    form.booth &&
    form.contact &&
    fingerprintHash;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const res = await axiosClient.post('/api/voter/register', {
        ...form,
        fingerprintHash,
      });
      if (res.data?.success) {
        alert('Registration successful! Document and biometric verified.');
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

  const update = (key, value) => {
    if (key.startsWith('address.')) {
      const sub = key.split('.')[1];
      setForm((f) => ({ ...f, address: { ...f.address, [sub]: value } }));
    } else {
      setForm((f) => ({ ...f, [key]: value }));
    }
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
          <h2 className="text-2xl font-bold text-slate-800">Voter Registration</h2>

          {error && (
            <div className="p-4 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              1. {t.fullName} (as per government ID)
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              2. {t.fatherHusbandName}
            </label>
            <input
              type="text"
              value={form.fatherOrHusbandName}
              onChange={(e) => update('fatherOrHusbandName', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              3. {t.dateOfBirth} (Age verification)
            </label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => update('dateOfBirth', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">4. {t.gender}</label>
            <select
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="male">{t.male}</option>
              <option value="female">{t.female}</option>
              <option value="other">{t.other}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              5. {t.aadharNumber} (12 digits)
            </label>
            <input
              type="text"
              value={form.aadhar}
              onChange={(e) => update('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))}
              maxLength={12}
              required
              placeholder="Last 4 digits shown for display"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              6. {t.voterId} (EPIC No.)
            </label>
            <input
              type="text"
              value={form.voterId}
              onChange={(e) => update('voterId', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              7. {t.address} - {t.permanent}
            </label>
            <textarea
              value={form.address.permanent}
              onChange={(e) => update('address.permanent', e.target.value)}
              required
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.address} - {t.current}
            </label>
            <textarea
              value={form.address.current}
              onChange={(e) => update('address.current', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              8. Constituency / Ward
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Constituency"
                value={form.constituency}
                onChange={(e) => update('constituency', e.target.value)}
                required
                className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Ward"
                value={form.ward}
                onChange={(e) => update('ward', e.target.value)}
                required
                className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              9. {t.boothNumber}
            </label>
            <input
              type="text"
              value={form.booth}
              onChange={(e) => update('booth', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              10. {t.contactNumber} (for OTP)
            </label>
            <input
              type="tel"
              value={form.contact}
              onChange={(e) => update('contact', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">{t.biometricData}</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">{t.fingerprintLabel}</p>
                <div className="space-y-4">
                  <HardwareFingerprintCapture onHash={setFingerprintHash} />
                  <div className="text-xs text-slate-500">
                    If the hardware connection is not available, you can also use the manual
                    simulator below during development.
                  </div>
                  <FingerprintSimulator onHash={setFingerprintHash} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <Check className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800">{t.verificationStatus}</p>
              <p className="text-sm text-emerald-600">
                {t.documentVerified} • {t.biometricRegistered}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {loading ? 'Submitting...' : t.submitRegistration}
          </button>
        </form>
      </div>
    </div>
  );
}
