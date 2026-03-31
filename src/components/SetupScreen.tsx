import type { StoryState, Genre } from '../types';

const GENRES: { value: Genre; emoji: string; desc: string }[] = [
  { value: 'Fantasy', emoji: '🧙', desc: 'Magic, myths & epic quests' },
  { value: 'Sci-Fi', emoji: '🚀', desc: 'Future worlds & technology' },
  { value: 'Mystery', emoji: '🔍', desc: 'Clues, secrets & suspense' },
  { value: 'Romance', emoji: '💌', desc: 'Love, longing & connection' },
  { value: 'Horror', emoji: '🕯️', desc: 'Dread, darkness & fear' },
  { value: 'Comedy', emoji: '🎭', desc: 'Absurdity & unexpected laughs' },
];

interface Props {
  story: StoryState;
  isLoading: boolean;
  error: string | null;
  onFieldChange: (field: keyof StoryState, value: string | number) => void;
  onStart: () => void;
  onClearError: () => void;
}

export function SetupScreen({ story, isLoading, error, onFieldChange, onStart, onClearError }: Props) {
  const canStart = story.title.trim().length > 0 && story.hook.trim().length > 0;
  const activeGenre = GENRES.find(g => g.value === story.genre);

  return (
    <div className="setup-screen">
      <div className="setup-bg-orbs" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="setup-container">
        <header className="setup-header">
          <span className="logo-mark">✦</span>
          <h1 className="logo-title">Story Weaver</h1>
          <p className="logo-sub">AI Collaborative Fiction</p>
        </header>

        <div className="setup-card">
          {error && (
            <div className="error-banner" onClick={onClearError}>
              <span>⚠ {error}</span>
              <button className="error-close">✕</button>
            </div>
          )}

          <div className="setup-row">
            <div className="field-group field-group--grow">
              <label className="field-label">Story Title</label>
              <input
                className="field-input"
                type="text"
                placeholder="The Last Lighthouse Keeper…"
                value={story.title}
                onChange={e => onFieldChange('title', e.target.value)}
              />
            </div>
            <div className="field-group field-group--fixed">
              <label className="field-label">
                Creativity <span className="temp-badge">{story.temperature.toFixed(1)}</span>
              </label>
              <div className="slider-row">
                <span className="slider-label">Low</span>
                <input
                  type="range" className="slider"
                  min="0.3" max="1.4" step="0.1"
                  value={story.temperature}
                  onChange={e => onFieldChange('temperature', parseFloat(e.target.value))}
                />
                <span className="slider-label">High</span>
              </div>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">
              Genre
              {activeGenre && <span className="genre-active-badge">{activeGenre.emoji} {activeGenre.desc}</span>}
            </label>
            <div className="genre-grid">
              {GENRES.map(g => (
                <button
                  key={g.value}
                  className={`genre-card ${story.genre === g.value ? 'genre-card--active' : ''}`}
                  onClick={() => onFieldChange('genre', g.value)}
                >
                  <span className="genre-emoji">{g.emoji}</span>
                  <span className="genre-name">{g.value}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Opening Hook</label>
            <textarea
              className="field-textarea"
              placeholder="A lighthouse keeper discovers a message in a bottle sent from the future, warning of a catastrophe only they can prevent…"
              value={story.hook}
              onChange={e => onFieldChange('hook', e.target.value)}
              rows={3}
            />
            <p className="field-hint">Describe the setting or tension — the AI crafts the opening from this.</p>
          </div>

          <button className="btn-start" onClick={onStart} disabled={!canStart || isLoading}>
            {isLoading
              ? <><span className="spinner" /> Weaving the opening…</>
              : <><span>✦</span> Begin the Story</>
            }
          </button>
        </div>

        <p className="setup-footer">For an immersive storytelling experience</p>
      </div>
    </div>
  );
}
