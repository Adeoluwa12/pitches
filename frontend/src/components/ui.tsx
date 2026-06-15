// ─── TrendScore ────────────────────────────────────────────────────
export function TrendScore({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-coral' : score >= 60 ? 'bg-orange-400' : score >= 40 ? 'bg-yellow-400' : 'bg-gray-300';

  return (
    <div className="flex items-center gap-2">
      <div className="score-bar w-24 flex-shrink-0">
        <div className={`h-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold ${score >= 70 ? 'text-coral' : 'text-gray-600'}`}>
        {score}
      </span>
    </div>
  );
}

// ─── CategoryBadge ─────────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, string> = {
  nollywood: 'bg-red-100 text-red-700',
  music: 'bg-teal-100 text-teal-700',
  afrobeats: 'bg-emerald-100 text-emerald-700',
  celebrity: 'bg-orange-100 text-orange-700',
  reality_tv: 'bg-purple-100 text-purple-700',
  internet_trends: 'bg-blue-100 text-blue-700',
  pop_culture: 'bg-pink-100 text-pink-700',
  movie_review: 'bg-red-100 text-red-700',
};

export function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${style}`}>
      {category.replace('_', ' ')}
    </span>
  );
}

// ─── LoadingSpinner ─────────────────────────────────────────────────
export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
      <span className="text-5xl">{icon}</span>
      <h3 className="font-bold text-gray-700 text-lg">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 max-w-xs">{subtitle}</p>}
    </div>
  );
}

// ─── PitchCard ─────────────────────────────────────────────────────
interface PitchCardProps {
  pitch: {
    _id: string;
    headline: string;
    angle: string;
    summary: string;
    whyNow: string;
    structure: string[];
    targetAudience: string;
  };
  onSave?: (id: string) => void;
  saved?: boolean;
}

export function PitchCard({ pitch, onSave, saved }: PitchCardProps) {
  return (
    <div className="card border-l-4 border-l-coral space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-navy text-base leading-snug flex-1">{pitch.headline}</h3>
        {onSave && (
          <button
            onClick={() => onSave(pitch._id)}
            className={`text-xl flex-shrink-0 transition-transform active:scale-90 ${saved ? 'opacity-50' : ''}`}
            disabled={saved}
          >
            {saved ? '✅' : '🔖'}
          </button>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-coral uppercase tracking-wide">Angle</p>
        <p className="text-sm text-gray-700 italic">{pitch.angle}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Summary</p>
        <p className="text-sm text-gray-600 leading-relaxed">{pitch.summary}</p>
      </div>

      {pitch.whyNow && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <p className="text-xs font-semibold text-amber-700 mb-1">⚡ Why Now</p>
          <p className="text-sm text-amber-800">{pitch.whyNow}</p>
        </div>
      )}

      {pitch.structure?.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Structure</p>
          <div className="flex flex-col gap-1">
            {pitch.structure.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-navy font-bold flex-shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pitch.targetAudience && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-gray-400">👥</span>
          <p className="text-xs text-gray-500">{pitch.targetAudience}</p>
        </div>
      )}
    </div>
  );
}

// ─── TopicCard ─────────────────────────────────────────────────────
interface TopicCardProps {
  topic: {
    _id: string;
    title: string;
    description?: string;
    category: string;
    trendScore: number;
    source: string;
    image?: string;
    status?: string;
  };
  onClick?: () => void;
}

// export function TopicCard({ topic, onClick }: TopicCardProps) {
//   return (
//     <div
//       className="card active:scale-[0.98] transition-transform cursor-pointer"
//       onClick={onClick}
//     >
//       <div className="flex gap-3">
//         {topic.image && (
//           <img
//             src={topic.image}
//             alt=""
//             className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
//             onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
//           />
//         )}
//         <div className="flex-1 min-w-0 space-y-1.5">
//           <div className="flex items-center gap-2 flex-wrap">
//             <CategoryBadge category={topic.category} />
//             {topic.trendScore >= 70 && (
//               <span className="badge bg-red-50 text-red-600">🔥 Hot</span>
//             )}
//           </div>
//           <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
//             {topic.title}
//           </h3>
//           <div className="flex items-center justify-between">
//             <span className="text-xs text-gray-400">{topic.source}</span>
//             <TrendScore score={topic.trendScore} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

export function TopicCard({ topic, onClick }: TopicCardProps) {
  const isHot = topic.trendScore >= 45 || topic.status === 'hot';

  return (
    <div
      className="card active:scale-[0.98] transition-transform cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-3">
        {topic.image && (
          <img
            src={topic.image}
            alt=""
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={topic.category} />
            {isHot && (
              <span className="badge bg-red-50 text-red-600">🔥 Hot</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {topic.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{topic.source}</span>
            <TrendScore score={topic.trendScore} />
          </div>
        </div>
      </div>
    </div>
  );
}