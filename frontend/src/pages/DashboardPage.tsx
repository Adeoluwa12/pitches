import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { topicsApi } from '../services/api';
import { TopicCard, LoadingSpinner, EmptyState } from '../components/ui';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: trending, isLoading } = useQuery({
    queryKey: ['trending', 6],
    queryFn: () => topicsApi.getTrending(6),
    refetchInterval: 1000 * 60 * 10,
  });

  // Defensive — handle both array response and object with topics key
  const topicsArray = Array.isArray(trending)
    ? trending
    : (trending as any)?.topics || [];

  const hotTopics = topicsArray.filter((t: any) => t.trendScore >= 70);
  const otherTopics = topicsArray.filter((t: any) => t.trendScore < 70);

  return (
    <div className="page-container pt-4 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-navy">
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 text-sm">Here are today's article opportunities</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/morning-brief')}
          className="bg-gradient-to-br from-navy to-navy-light text-white rounded-2xl p-4 text-left space-y-1 active:scale-95 transition-transform"
        >
          <div className="text-2xl">☀️</div>
          <div className="font-bold text-sm">Morning Brief</div>
          <div className="text-white/60 text-xs">Today's pitches</div>
        </button>

        <button
          onClick={() => navigate('/trending')}
          className="bg-gradient-to-br from-coral to-orange-400 text-white rounded-2xl p-4 text-left space-y-1 active:scale-95 transition-transform"
        >
          <div className="text-2xl">🔥</div>
          <div className="font-bold text-sm">Trending Now</div>
          <div className="text-white/60 text-xs">Live topic scores</div>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Fetching trends..." />
      ) : (
        <>
          {hotTopics.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚨</span>
                <h3 className="font-bold text-navy">Hot Right Now</h3>
                <span className="badge bg-coral/10 text-coral">{hotTopics.length}</span>
              </div>
              <div className="space-y-3">
                {hotTopics.map((topic: any) => (
                  <TopicCard
                    key={topic._id}
                    topic={topic}
                    onClick={() => navigate(`/topics/${topic._id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {otherTopics.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-bold text-navy">Also Trending</h3>
              <div className="space-y-3">
                {otherTopics.map((topic: any) => (
                  <TopicCard
                    key={topic._id}
                    topic={topic}
                    onClick={() => navigate(`/topics/${topic._id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {topicsArray.length === 0 && (
            <EmptyState
              icon="📡"
              title="No trends yet"
              subtitle="Topics are being collected. Check back in a few minutes!"
            />
          )}
        </>
      )}
    </div>
  );
}