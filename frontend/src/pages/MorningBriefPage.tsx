import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { pitchesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { CategoryBadge, TrendScore, PitchCard, LoadingSpinner } from '../components/ui';

export default function MorningBriefPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [savedPitches, setSavedPitches] = useState<Set<string>>(new Set());

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['pitches-today'],
    queryFn: pitchesApi.getToday,
  });

  const saveMutation = useMutation({
    mutationFn: (pitchId: string) => pitchesApi.save(pitchId),
    onSuccess: (_d, pitchId) => setSavedPitches((prev) => new Set([...prev, pitchId])),
  });

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const topics = todayData || [];

  return (
    <div className="page-container pt-4 space-y-5">
      <div className="bg-gradient-to-br from-navy to-navy-light rounded-3xl p-6 text-white text-center space-y-2">
        <div className="text-4xl">☀️</div>
        <h1 className="text-xl font-bold">Good Morning, {user?.name?.split(' ')[0]}! ❤️</h1>
        <p className="text-white/70 text-sm">{today}</p>
        {topics.length > 0 && (
          <div className="bg-white/20 rounded-2xl px-4 py-2 inline-block mt-1">
            <span className="text-sm font-semibold">{topics.length} trending topics with pitches ready</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading today's brief..." />
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
          <span className="text-5xl">🌅</span>
          <h3 className="font-bold text-gray-700 text-lg">Brief not ready yet</h3>
          <p className="text-sm text-gray-500 max-w-xs">Your 6:30 AM morning brief is generated daily. Check back tomorrow or explore trending topics now.</p>
          <button onClick={() => navigate('/trending')} className="btn-primary">Explore Trending Topics</button>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map((item: any, index: number) => {
            const isExpanded = expandedTopic === item._id;
            const pitches = item.pitches || [];
            const topPitch = pitches[0];
            return (
              <div key={item._id} className="card space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-navy text-white rounded-xl w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">{index + 1}</div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CategoryBadge category={item.category} />
                      {item.trendScore >= 70 && <span className="badge bg-red-50 text-red-600">🔥</span>}
                    </div>
                    <h3 className="font-bold text-navy text-base leading-snug cursor-pointer" onClick={() => navigate(`/topics/${item._id}`)}>{item.title}</h3>
                    <TrendScore score={item.trendScore} />
                  </div>
                </div>
                {topPitch && (
                  <div className="bg-sand rounded-xl p-3 space-y-1">
                    <p className="text-xs font-bold text-navy-light uppercase tracking-wide">💡 Top Pitch</p>
                    <p className="font-semibold text-navy text-sm">{topPitch.headline}</p>
                    <p className="text-xs text-gray-500 italic">{topPitch.angle}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandedTopic(isExpanded ? null : item._id)} className="text-sm text-coral font-semibold">
                    {isExpanded ? '↑ Less pitches' : `↓ All ${pitches.length} pitches`}
                  </button>
                  <button onClick={() => navigate(`/topics/${item._id}`)} className="text-sm text-gray-400 ml-auto">Full topic →</button>
                </div>
                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    {pitches.map((pitch: any) => (
                      <PitchCard key={pitch._id} pitch={pitch} onSave={(id) => saveMutation.mutate(id)} saved={savedPitches.has(pitch._id)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
