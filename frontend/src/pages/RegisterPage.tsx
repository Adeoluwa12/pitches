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
  const [showPassword, setShowPassword] = useState(false);
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
      categories: f.categories.includes(id)
        ? f.categories.filter((c) => c !== id)
        : [...f.categories, id],
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
          <div className="flex gap-2 mb-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-colors ${step >= s ? 'bg-coral' : 'bg-gray-100'}`}
              />
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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