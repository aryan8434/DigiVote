import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { ArrowLeft } from 'lucide-react';

export default function AdminConfig() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    electionStatus: 'registration',
    startTime: '',
    endTime: '',
    registrationDeadline: '',
  });

  useEffect(() => {
    axiosClient.get('/api/config').then((r) => {
      if (r.data?.config) {
        const c = r.data.config;
        setConfig({
          electionStatus: c.electionStatus || 'registration',
          startTime: c.startTime ? new Date(c.startTime).toISOString().slice(0, 16) : '',
          endTime: c.endTime ? new Date(c.endTime).toISOString().slice(0, 16) : '',
          registrationDeadline: c.registrationDeadline
            ? new Date(c.registrationDeadline).toISOString().slice(0, 16)
            : '',
        });
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosClient.put('/api/config', {
        electionStatus: config.electionStatus,
        startTime: config.startTime || undefined,
        endTime: config.endTime || undefined,
        registrationDeadline: config.registrationDeadline || undefined,
      });
      alert('Configuration updated.');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Election Configuration (Admin)</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Election Status</label>
            <select
              value={config.electionStatus}
              onChange={(e) => setConfig((c) => ({ ...c, electionStatus: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="registration">Registration</option>
              <option value="waiting">Waiting</option>
              <option value="voting">Voting</option>
              <option value="ended">Ended</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Registration Deadline
            </label>
            <input
              type="datetime-local"
              value={config.registrationDeadline}
              onChange={(e) => setConfig((c) => ({ ...c, registrationDeadline: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Voting Start Time</label>
            <input
              type="datetime-local"
              value={config.startTime}
              onChange={(e) => setConfig((c) => ({ ...c, startTime: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Voting End Time</label>
            <input
              type="datetime-local"
              value={config.endTime}
              onChange={(e) => setConfig((c) => ({ ...c, endTime: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
}
