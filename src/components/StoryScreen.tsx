import { useState, useRef, useEffect } from 'react';
import type { StoryState, Genre, BranchChoice } from '../types';
import { downloadMarkdown } from '../utils/export';
import { CharacterTracker } from './CharacterTracker';
import { MoodIndicator } from './MoodIndicator';

const ALL_GENRES: Genre[] = ['Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'Comedy'];

interface Props {
  story: StoryState;
  isLoading: boolean;
  error: string | null;
  choices: BranchChoice[] | null;
  onContinue: (userInput: string) => void;
  onGetChoices: () => void;
  onSelectChoice: (choice: BranchChoice) => void;
  onRemix: (genre: Genre) => void;
  onUndo: () => void;
  onTemperatureChange: (val: number) => void;
  onRestart: () => void;
  onClearError: () => void;
}

export function StoryScreen({
  story,
  isLoading,
  error,
  choices,
  onContinue,
  onGetChoices,
  onSelectChoice,
  onRemix,
  onUndo,
  onTemperatureChange,
  onRestart,
  onClearError,
}: Props) {
  const [userInput, setUserInput] = useState('');
  const [showRemix, setShowRemix] = useState(false);
  const [showChars, setShowChars] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [story.segments, choices]);

  const handleContinue = () => {
    onContinue(userInput);
    setUserInput('');
  };

  const handleChoices = () => {
    setUserInput('');
    onGetChoices();
  };

  const wordCount = story.segments
    .map(s => s.content.split(/\s+/).length)
    .reduce((a, b) => a + b, 0);

  const otherGenres = ALL_GENRES.filter(g => g !== story.genre);

  return (
    <div className="story-screen">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <button className="btn-icon" onClick={onRestart} title="New Story">
            ✦
          </button>
          <span className="sidebar-title">Story Weaver</span>
        </div>

        <div className="sidebar-section">
          <div className="story-meta">
            <h2 className="story-title-small">{story.title}</h2>
            <div className="genre-pill">{story.genre}</div>
          </div>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label">Creativity</label>
          <div className="slider-row compact">
            <span className="slider-label">Low</span>
            <input
              type="range"
              className="slider"
              min="0.3"
              max="1.4"
              step="0.1"
              value={story.temperature}
              onChange={e => onTemperatureChange(parseFloat(e.target.value))}
            />
            <span className="slider-label">High</span>
          </div>
          <div className="temp-value">{story.temperature.toFixed(1)}</div>
        </div>

        <div className="sidebar-section">
          <MoodIndicator genre={story.genre} segmentCount={story.segments.length} />
        </div>

        <div className="sidebar-section">
          <div className="stat-row">
            <span className="stat-label">Words written</span>
            <span className="stat-value">{wordCount.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Story turns</span>
            <span className="stat-value">{story.segments.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Characters found</span>
            <span className="stat-value">{story.characters.length}</span>
          </div>
        </div>

        <div className="sidebar-actions">
          <button
            className="btn-sidebar"
            onClick={() => setShowChars(v => !v)}
          >
            👥 Characters {story.characters.length > 0 && `(${story.characters.length})`}
          </button>
          <button
            className="btn-sidebar"
            onClick={() => setShowRemix(v => !v)}
          >
            🎭 Genre Remix
          </button>
          <button
            className="btn-sidebar"
            onClick={() => downloadMarkdown(story)}
          >
            📤 Export Story
          </button>
          <button
            className="btn-sidebar btn-sidebar--danger"
            onClick={onUndo}
            disabled={story.segments.length <= 1}
          >
            ↩ Undo Last Turn
          </button>
        </div>

        {showRemix && (
          <div className="remix-panel">
            <p className="remix-hint">Rewrite last passage as…</p>
            {otherGenres.map(g => (
              <button
                key={g}
                className="btn-remix-genre"
                onClick={() => { onRemix(g); setShowRemix(false); }}
                disabled={isLoading}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {showChars && (
          <CharacterTracker characters={story.characters} />
        )}
      </aside>

      {/* Main story area */}
      <main className="story-main">
        {error && (
          <div className="error-banner story-error" onClick={onClearError}>
            <span>⚠ {error}</span>
            <button className="error-close">✕</button>
          </div>
        )}

        <div className="story-scroll">
          <div className="story-content">
            {story.segments.map((seg, i) => (
              <div
                key={seg.id}
                className={`segment ${seg.role === 'user' ? 'segment--user' : 'segment--ai'} ${seg.isRemixed ? 'segment--remixed' : ''} ${seg.isChoice ? 'segment--choice' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {seg.role === 'user' && (
                  <div className="segment-meta">You wrote</div>
                )}
                {seg.isRemixed && (
                  <div className="segment-meta segment-meta--remix">✦ Genre Remix</div>
                )}
                {seg.isChoice && (
                  <div className="segment-meta segment-meta--choice">↳ Chosen path</div>
                )}
                <p className="segment-text">{seg.content}</p>
              </div>
            ))}

            {choices && (
              <div className="choices-panel">
                <h3 className="choices-title">What happens next?</h3>
                <div className="choices-grid">
                  {choices.map((c, i) => (
                    <button
                      key={i}
                      className="choice-card"
                      onClick={() => onSelectChoice(c)}
                      disabled={isLoading}
                    >
                      <span className="choice-label">{c.label}</span>
                      <span className="choice-desc">{c.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="loading-segment">
                <div className="loading-dots">
                  <span /><span /><span />
                </div>
                <span className="loading-text">Weaving the story…</span>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="story-input"
              placeholder="Add your own sentence to the story, or leave blank and let the AI continue…"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.metaKey) handleContinue();
              }}
              rows={2}
              disabled={isLoading}
            />
          </div>
          <div className="action-buttons">
            <button
              className="btn-action btn-continue"
              onClick={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? <span className="spinner" /> : '✦'}
              Continue with AI
            </button>
            <button
              className="btn-action btn-choices"
              onClick={handleChoices}
              disabled={isLoading}
            >
              ⊹ Give Me Choices
            </button>
          </div>
          <p className="input-hint">⌘+Enter to continue · {userInput.length} chars</p>
        </div>
      </main>
    </div>
  );
}
