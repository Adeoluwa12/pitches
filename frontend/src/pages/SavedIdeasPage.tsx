import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { pitchesApi } from '../services/api';
import { PitchCard, CategoryBadge, LoadingSpinner, EmptyState } from '../components/ui';

export default function SavedIdeasPage() {
  const navigate = useNavigate();

  const { data: savedData, isLoading, error } = useQuery({
    queryKey: ['saved-ideas'],
    queryFn: pitchesApi.getSaved,
  });

  const saved = Array.isArray(savedData) ? savedData : [];

  return (
    <div className="page-container pt-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-navy">💾 Saved Ideas</h2>
        <p className="text-gray-500 text-sm">
          {saved.length} {saved.length === 1 ? 'pitch' : 'pitches'} saved
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading saved ideas..." />
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load saved ideas"
          subtitle="There was a problem fetching your saved pitches."
        />
      ) : saved.length === 0 ? (
        <EmptyState
          icon="🔖"
          title="No saved ideas yet"
          subtitle="Tap the bookmark icon on any pitch to save it here for later."
        />
      ) : (
        <div className="space-y-4">
          {saved.map((item: any) => (
            <div key={item._id} className="space-y-2">
              {item.topic && (
                <button
                  onClick={() => navigate(`/topics/${item.topic._id}`)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy w-full text-left"
                >
                  <CategoryBadge category={item.topic.category} />
                  <span className="line-clamp-1 flex-1">{item.topic.title}</span>
                  <span className="text-xs flex-shrink-0">→</span>
                </button>
              )}
              {item.pitch && <PitchCard pitch={item.pitch} saved />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}