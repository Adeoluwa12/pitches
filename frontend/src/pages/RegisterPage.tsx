import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const CATEGORIES = [
  { id: 'nollywood', label: '🎬 Nollywood' },
  { id: 'afrobeats', label: '🎵 Afrobeats' },
  { id: 'celebrity', label: '⭐ Celebrity' },
  { id: 'reality_tv', label: '📺 Reality TV' },
  { id: 'internet_trends', label: '📱 Internet Trends' },
  { id: 'pop_culture', label: '🌍 Pop Culture' },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    categories: ['nollywood', 'celebrity', 'afrobeats'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const toggleCategory = (id: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(id) ? f.categories.filter((c) => c !== id) : [...f.categories, id],
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setAuth(data.user, data.token);
      // Update preferences
      await authApi.updatePreferences({ categories: form.categories });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy to-navy-light flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🎬</div>
          <h1 className="text-white text-xl font-bold">Join EPA</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl space-y-4">
          {/* Step indicator */}
          <div className="flex gap-2 mb-2">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 rounded-full flex-1 transition-colors ${step >= s ? 'bg-coral' : 'bg-gray-100'}`} />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-navy text-lg">Create your account</h2>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Your name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  placeholder="e.g. Feranmi"
                  autoComplete="given-name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
              </div>

              <button
                onClick={() => {
                  if (!form.name || !form.email || form.password.length < 8) {
                    setError('Please fill all fields (min 8-char password)');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="w-full btn-primary py-3.5"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-navy text-lg">What do you write about?</h2>
                <p className="text-sm text-gray-500 mt-1">Pick your topics — we'll personalise your daily brief</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`py-3 px-3 rounded-xl text-sm font-medium border-2 transition-colors text-left ${
                      form.categories.includes(cat.id)
                        ? 'border-coral bg-coral/5 text-coral'
                        : 'border-gray-100 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || form.categories.length === 0}
                className="w-full btn-primary py-3.5 disabled:opacity-60"
              >
                {loading ? 'Setting up your account...' : "Let's go! 🚀"}
              </button>

              <button onClick={() => setStep(1)} className="w-full text-sm text-gray-500 py-1">
                ← Back
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-coral font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
