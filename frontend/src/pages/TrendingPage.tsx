import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { topicsApi } from '../services/api';
import { TopicCard, LoadingSpinner, EmptyState, CategoryBadge } from '../components/ui';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'nollywood', label: 'Nollywood' },
  { id: 'afrobeats', label: 'Afrobeats' },
  { id: 'celebrity', label: 'Celebrity' },
  { id: 'reality_tv', label: 'Reality TV' },
  { id: 'internet_trends', label: 'Trends' },
  { id: 'pop_culture', label: 'Pop Culture' },
];

export default function TrendingPage() {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['topics', category, page],
    queryFn: () => topicsApi.getAll({ page, category: category || undefined }),
  });

  const topics = data?.topics || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="page-container pt-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-navy">🔥 Trending Topics</h2>
        <p className="text-gray-500 text-sm">{total} topics collected</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategory(cat.id); setPage(1); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              category === cat.id
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Topics */}
      {isLoading ? (
        <LoadingSpinner text="Loading topics..." />
      ) : topics.length === 0 ? (
        <EmptyState icon="📭" title="No topics found" subtitle="Try a different category" />
      ) : (
        <div className="space-y-3">
          {topics.map((topic: any) => (
            <TopicCard
              key={topic._id}
              topic={topic}
              onClick={() => navigate(`/topics/${topic._id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 pb-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isFetching}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
