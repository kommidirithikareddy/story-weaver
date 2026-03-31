import type { Genre } from '../types';

interface Props {
  genre: Genre;
  segmentCount: number;
}

const GENRE_MOODS: Record<Genre, { label: string; color: string; icon: string; pulseColor: string }> = {
  'Fantasy': { label: 'Epic', color: '#a78bfa', pulseColor: 'rgba(167,139,250,0.3)', icon: '⚔️' },
  'Sci-Fi': { label: 'Tense', color: '#38bdf8', pulseColor: 'rgba(56,189,248,0.3)', icon: '🌌' },
  'Mystery': { label: 'Suspenseful', color: '#f59e0b', pulseColor: 'rgba(245,158,11,0.3)', icon: '🔍' },
  'Romance': { label: 'Yearning', color: '#f472b6', pulseColor: 'rgba(244,114,182,0.3)', icon: '💌' },
  'Horror': { label: 'Dreadful', color: '#ef4444', pulseColor: 'rgba(239,68,68,0.3)', icon: '🕯️' },
  'Comedy': { label: 'Playful', color: '#34d399', pulseColor: 'rgba(52,211,153,0.3)', icon: '🎭' },
};

export function MoodIndicator({ genre, segmentCount }: Props) {
  const mood = GENRE_MOODS[genre];
  const intensity = Math.min(segmentCount / 10, 1); // 0 to 1 based on story length

  return (
    <div className="mood-indicator">
      <div className="mood-label-row">
        <span className="sidebar-label">Story Mood</span>
        <span className="mood-icon">{mood.icon}</span>
      </div>
      <div className="mood-name" style={{ color: mood.color }}>{mood.label}</div>
      <div className="mood-bar-track">
        <div
          className="mood-bar-fill"
          style={{
            width: `${Math.max(intensity * 100, 10)}%`,
            background: `linear-gradient(90deg, ${mood.color}88, ${mood.color})`,
            boxShadow: `0 0 8px ${mood.pulseColor}`,
          }}
        />
      </div>
      <div className="mood-sub">
        {intensity < 0.3 ? 'Just beginning…' : intensity < 0.6 ? 'Building tension…' : 'Reaching climax!'}
      </div>
    </div>
  );
}
