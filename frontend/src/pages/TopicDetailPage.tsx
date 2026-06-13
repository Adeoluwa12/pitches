import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topicsApi, pitchesApi } from '../services/api';
import { PitchCard, CategoryBadge, TrendScore, LoadingSpinner, EmptyState } from '../components/ui';

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [savedPitches, setSavedPitches] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topic', id],
    queryFn: () => topicsApi.getById(id!),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: (pitchId: string) => pitchesApi.save(pitchId),
    onSuccess: (_data, pitchId) => {
      setSavedPitches((prev) => new Set([...prev, pitchId]));
    },
  });

  const handleGenerateMore = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      await pitchesApi.generate(id);
      queryClient.invalidateQueries({ queryKey: ['topic', id] });
    } catch (err) {
      console.error('Generation failed', err);
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading topic..." />;
  if (!topic) return <EmptyState icon="❓" title="Topic not found" />;

  const pitches = topic.pitches || [];

  return (
    <div className="page-container pt-4 space-y-5">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="text-navy font-medium text-sm flex items-center gap-1">
        ← Back
      </button>

      {/* Topic header */}
      <div className="card space-y-3">
        {topic.image && (
          <img
            src={topic.image}
            alt=""
            className="w-full h-44 object-cover rounded-xl bg-gray-100"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={topic.category} />
          {topic.trendScore >= 70 && (
            <span className="badge bg-red-50 text-red-600">🔥 HOT</span>
          )}
        </div>

        <h1 className="font-bold text-navy text-xl leading-snug">{topic.title}</h1>

        {topic.description && (
          <p className="text-gray-600 text-sm leading-relaxed">{topic.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Trend Score</p>
            <TrendScore score={topic.trendScore} />
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Source</p>
            <p className="text-sm font-medium text-gray-700">{topic.source}</p>
          </div>
        </div>

        {/* Score breakdown */}
        {topic.scoreBreakdown && (
          <details className="group">
            <summary className="text-xs text-gray-400 cursor-pointer select-none hover:text-gray-600">
              Score breakdown ▸
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(topic.scoreBreakdown).map(([key, val]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="font-bold text-navy text-sm">{val as number}</p>
                </div>
              ))}
            </div>
          </details>
        )}

        {topic.url && (
          <a
            href={topic.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-navy-light font-medium flex items-center gap-1"
          >
            Read source article ↗
          </a>
        )}
      </div>

      {/* Pitches section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy text-lg">
            💡 Article Pitches ({pitches.length})
          </h2>
          <button
            onClick={handleGenerateMore}
            disabled={generating}
            className="text-sm text-coral font-semibold disabled:opacity-50 flex items-center gap-1"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-coral/30 border-t-coral rounded-full animate-spin inline-block" />
                Generating...
              </>
            ) : (
              '+ Generate More'
            )}
          </button>
        </div>

        {pitches.length === 0 ? (
          <div className="card text-center space-y-3 py-8">
            <div className="text-4xl">🤖</div>
            <p className="text-gray-600 font-medium">No pitches yet for this topic</p>
            <button
              onClick={handleGenerateMore}
              disabled={generating}
              className="btn-primary mx-auto disabled:opacity-50"
            >
              {generating ? 'Generating with AI...' : 'Generate Pitches with AI'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pitches.map((pitch: any) => (
              <PitchCard
                key={pitch._id}
                pitch={pitch}
                onSave={(pitchId) => saveMutation.mutate(pitchId)}
                saved={savedPitches.has(pitch._id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
