export type Genre = 'Fantasy' | 'Sci-Fi' | 'Mystery' | 'Romance' | 'Horror' | 'Comedy';

export type StorySegmentRole = 'ai' | 'user';

export interface StorySegment {
  id: string;
  role: StorySegmentRole;
  content: string;
  timestamp: Date;
  isChoice?: boolean;
  isRemixed?: boolean;
}

export interface Character {
  name: string;
  description: string;
  firstAppeared: number; // segment index
}

export interface StoryState {
  title: string;
  genre: Genre;
  hook: string;
  segments: StorySegment[];
  characters: Character[];
  temperature: number;
  isStarted: boolean;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BranchChoice {
  label: string;
  description: string;
}

export type AppView = 'setup' | 'story';
