import type { Character } from '../types';

interface Props {
  characters: Character[];
}

const AVATAR_COLORS = [
  '#c084fc', '#fb923c', '#34d399', '#60a5fa', '#f472b6', '#a78bfa',
];

export function CharacterTracker({ characters }: Props) {
  if (characters.length === 0) {
    return (
      <div className="char-tracker">
        <p className="char-empty">Characters will appear as the story unfolds…</p>
      </div>
    );
  }

  return (
    <div className="char-tracker">
      {characters.map((char, i) => (
        <div key={char.name} className="char-card">
          <div
            className="char-avatar"
            style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
          >
            {char.name[0].toUpperCase()}
          </div>
          <div className="char-info">
            <div className="char-name">{char.name}</div>
            <div className="char-desc">{char.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
