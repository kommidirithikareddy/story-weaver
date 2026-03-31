import { useState, useCallback } from 'react';
import type { StoryState, Genre, AppView, StorySegment, BranchChoice } from './types';
import { SetupScreen } from './components/SetupScreen';
import { StoryScreen } from './components/StoryScreen';
import {
  generateOpening,
  continueStory,
  generateChoices,
  continueFromChoice,
  remixGenre,
  extractCharacters,
} from './utils/groq';
import './styles.css';

const initialState: StoryState = {
  title: '',
  genre: 'Fantasy',
  hook: '',
  segments: [],
  characters: [],
  temperature: 0.8,
  isStarted: false,
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function App() {
  const [view, setView] = useState<AppView>('setup');
  const [story, setStory] = useState<StoryState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<BranchChoice[] | null>(null);

  const clearError = () => setError(null);

  const handleError = (err: unknown) => {
    const e = err as Error;
    if (e.message === 'RATE_LIMIT') {
      setError('Rate limit reached — Groq is catching its breath! Wait a moment and try again.');
    } else if (e.message === 'NO_API_KEY') {
      setError('No API key found. Add your Groq API key to the .env file as VITE_GROQ_API_KEY.');
    } else if (e.message === 'INVALID_KEY') {
      setError('Invalid API key. Double-check your Groq API key in the .env file.');
    } else {
      setError(`Something went wrong: ${e.message}. Please try again.`);
    }
  };

  const handleSetupChange = useCallback((field: keyof StoryState, value: string | number) => {
    setStory(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleStartStory = useCallback(async () => {
    if (!story.title || !story.hook) return;
    setIsLoading(true);
    setError(null);
    try {
      const opening = await generateOpening(story.title, story.genre, story.hook, story.temperature);
      const segment: StorySegment = {
        id: makeId(),
        role: 'ai',
        content: opening,
        timestamp: new Date(),
      };
      const chars = await extractCharacters(opening, []);
      setStory(prev => ({
        ...prev,
        segments: [segment],
        characters: chars,
        isStarted: true,
      }));
      setView('story');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [story]);

  const handleContinue = useCallback(async (userInput: string) => {
    setIsLoading(true);
    setError(null);
    setChoices(null);

    const newSegments = [...story.segments];

    if (userInput.trim()) {
      newSegments.push({
        id: makeId(),
        role: 'user',
        content: userInput,
        timestamp: new Date(),
      });
    }

    try {
      const continuation = await continueStory(
        story.title, story.genre, newSegments, story.characters, userInput, story.temperature
      );
      const aiSegment: StorySegment = {
        id: makeId(),
        role: 'ai',
        content: continuation,
        timestamp: new Date(),
      };
      const allSegments = [...newSegments, aiSegment];
      const fullText = allSegments.map(s => s.content).join(' ');
      const chars = await extractCharacters(fullText, story.characters);
      setStory(prev => ({ ...prev, segments: allSegments, characters: chars }));
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [story]);

  const handleGetChoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const branchChoices = await generateChoices(
        story.title, story.genre, story.segments, story.characters, story.temperature
      );
      setChoices(branchChoices);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [story]);

  const handleSelectChoice = useCallback(async (choice: BranchChoice) => {
    setIsLoading(true);
    setError(null);
    setChoices(null);
    try {
      const continuation = await continueFromChoice(
        story.title, story.genre, story.segments, story.characters, choice, story.temperature
      );
      const aiSegment: StorySegment = {
        id: makeId(),
        role: 'ai',
        content: continuation,
        timestamp: new Date(),
        isChoice: true,
      };
      const allSegments = [...story.segments, aiSegment];
      const fullText = allSegments.map(s => s.content).join(' ');
      const chars = await extractCharacters(fullText, story.characters);
      setStory(prev => ({ ...prev, segments: allSegments, characters: chars }));
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [story]);

  const handleRemix = useCallback(async (targetGenre: Genre) => {
    const lastAiSegment = [...story.segments].reverse().find(s => s.role === 'ai');
    if (!lastAiSegment) return;
    setIsLoading(true);
    setError(null);
    try {
      const remixed = await remixGenre(
        story.title, story.genre, targetGenre, lastAiSegment.content, story.characters, story.temperature
      );
      const remixSegment: StorySegment = {
        id: makeId(),
        role: 'ai',
        content: remixed,
        timestamp: new Date(),
        isRemixed: true,
      };
      setStory(prev => ({ ...prev, segments: [...prev.segments, remixSegment] }));
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [story]);

  const handleUndo = useCallback(() => {
    setChoices(null);
    setStory(prev => {
      const segs = [...prev.segments];
      // Remove last AI segment (and user segment before it if present)
      while (segs.length > 1 && segs[segs.length - 1].role === 'ai') {
        segs.pop();
      }
      if (segs.length > 1 && segs[segs.length - 1].role === 'user') {
        segs.pop();
      }
      return { ...prev, segments: segs };
    });
  }, []);

  const handleTemperatureChange = useCallback((val: number) => {
    setStory(prev => ({ ...prev, temperature: val }));
  }, []);

  const handleRestart = useCallback(() => {
    setStory(initialState);
    setView('setup');
    setChoices(null);
    setError(null);
  }, []);

  return (
    <div className="app">
      {view === 'setup' ? (
        <SetupScreen
          story={story}
          isLoading={isLoading}
          error={error}
          onFieldChange={handleSetupChange}
          onStart={handleStartStory}
          onClearError={clearError}
        />
      ) : (
        <StoryScreen
          story={story}
          isLoading={isLoading}
          error={error}
          choices={choices}
          onContinue={handleContinue}
          onGetChoices={handleGetChoices}
          onSelectChoice={handleSelectChoice}
          onRemix={handleRemix}
          onUndo={handleUndo}
          onTemperatureChange={handleTemperatureChange}
          onRestart={handleRestart}
          onClearError={clearError}
        />
      )}
    </div>
  );
}
