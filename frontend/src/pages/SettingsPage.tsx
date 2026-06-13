import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const CATEGORIES = [
  { id: 'nollywood', label: '🎬 Nollywood' },
  { id: 'afrobeats', label: '🎵 Afrobeats' },
  { id: 'celebrity', label: '⭐ Celebrity' },
  { id: 'reality_tv', label: '📺 Reality TV' },
  { id: 'internet_trends', label: '📱 Internet Trends' },
  { id: 'pop_culture', label: '🌍 Pop Culture' },
  { id: 'movie_review', label: '🎞️ Movie Reviews' },
];

const WRITING_STYLES = [
  { id: 'informative', label: 'Informative' },
  { id: 'opinionated', label: 'Opinionated' },
  { id: 'conversational', label: 'Conversational' },
  { id: 'analytical', label: 'Analytical' },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [categories, setCategories] = useState<string[]>(
    user?.preferences?.categories || ['nollywood', 'celebrity', 'afrobeats'],
  );
  const [writingStyle, setWritingStyle] = useState(
    user?.preferences?.writingStyle || 'informative',
  );
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () => authApi.updatePreferences({ categories, writingStyle }),
    onSuccess: (data) => {
      if (user) {
        setAuth({ ...user, preferences: { ...user.preferences, categories, writingStyle } }, localStorage.getItem('epa_auth') ? JSON.parse(localStorage.getItem('epa_auth')!).token : '');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleLogout = () => {
    logout();
    qc.clear();
    navigate('/login');
  };

  return (
    <div className="page-container pt-4 space-y-6">
      <h2 className="text-2xl font-bold text-navy">⚙️ Settings</h2>

      {/* Profile */}
      <div className="card space-y-3">
        <h3 className="font-bold text-navy">Profile</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-navy to-navy-light rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="card space-y-3">
        <div>
          <h3 className="font-bold text-navy">Topics I Write About</h3>
          <p className="text-sm text-gray-500 mt-0.5">Your morning brief will be filtered to these</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`py-3 px-3 rounded-xl text-sm font-medium border-2 transition-colors text-left ${
                categories.includes(cat.id)
                  ? 'border-coral bg-coral/5 text-coral'
                  : 'border-gray-100 bg-gray-50 text-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Writing style */}
      <div className="card space-y-3">
        <div>
          <h3 className="font-bold text-navy">Writing Style</h3>
          <p className="text-sm text-gray-500 mt-0.5">Influences how pitches are framed for you</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {WRITING_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setWritingStyle(style.id)}
              className={`py-3 px-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                writingStyle === style.id
                  ? 'border-navy bg-navy/5 text-navy'
                  : 'border-gray-100 bg-gray-50 text-gray-600'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending || saved}
        className="w-full btn-primary py-4 disabled:opacity-60 text-base"
      >
        {saved ? '✅ Saved!' : updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
      </button>

      {/* App info */}
      <div className="card space-y-2 text-sm text-gray-500">
        <p className="font-semibold text-gray-700">About EPA</p>
        <p>Entertainment Pitch Assistant v1.0 — Your personal Nigerian entertainment editor powered by AI.</p>
        <p>Morning brief: 6:30 AM (Lagos time) · Hot topic alerts: every 10 minutes</p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full text-coral font-semibold py-4 border-2 border-coral/20 rounded-2xl active:bg-coral/5 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
