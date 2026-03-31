import type { Genre, GroqMessage, StorySegment, BranchChoice, Character } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const GENRE_RULES: Record<Genre, string> = {
  'Fantasy': 'Use magical elements, mythical creatures, ancient prophecies, and epic quests. World-building is crucial — establish clear rules for magic systems.',
  'Sci-Fi': 'Ground the story in plausible future science and technology. Explore consequences of innovation. Use precise technical language balanced with human drama.',
  'Mystery': 'Plant clues carefully. Every detail may matter. Build tension through what is hidden, not revealed. The reader should always feel one step behind.',
  'Romance': 'Focus on emotional tension, longing, and character chemistry. Let small moments carry enormous weight. Dialogue should crackle with subtext.',
  'Horror': 'Build dread slowly. Use the unknown more than the explicit. Ordinary settings turned strange. Psychological horror over gore. Every sentence should feel slightly wrong.',
  'Comedy': 'Timing is everything. Use absurdist logic consistently. Characters should take ridiculous situations seriously. Subvert expectations, then subvert the subversion.',
};

function buildSystemPrompt(genre: Genre, title: string, characters: Character[]): string {
  const characterContext = characters.length > 0
    ? `\n\nKNOWN CHARACTERS (maintain strict consistency):\n${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}`
    : '';

  return `You are a masterful collaborative fiction writer working on a ${genre} story titled "${title}".

GENRE RULES — ${genre.toUpperCase()}:
${GENRE_RULES[genre]}

YOUR CORE RESPONSIBILITIES:
1. Stay 100% consistent with ALL previous events, character personalities, decisions, and world rules
2. NEVER contradict or retcon earlier story elements
3. Write in vivid, immersive third-person narrative voice
4. Match the tone and style established in previous segments
5. Keep prose concise but evocative — every word earns its place
6. Maintain narrative momentum and forward tension${characterContext}

WRITING STYLE:
- Show, don't tell — use sensory detail and action
- Vary sentence length for rhythm
- End segments with a hook that pulls the reader forward
- Never summarize what just happened — always push forward`;
}

function buildStoryContext(segments: StorySegment[]): GroqMessage[] {
  const messages: GroqMessage[] = [];

  for (const segment of segments) {
    if (segment.role === 'ai') {
      messages.push({ role: 'assistant', content: segment.content });
    } else {
      messages.push({ role: 'user', content: `[Player contribution]: ${segment.content}` });
    }
  }

  return messages;
}

async function callGroq(
  messages: GroqMessage[],
  temperature: number = 0.8,
  maxTokens: number = 600
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('NO_API_KEY');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('RATE_LIMIT');
    if (response.status === 401) throw new Error('INVALID_KEY');
    throw new Error(`API_ERROR:${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function generateOpening(
  title: string,
  genre: Genre,
  hook: string,
  temperature: number
): Promise<string> {
  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: buildSystemPrompt(genre, title, []),
    },
    {
      role: 'user',
      content: `Write a powerful opening paragraph (150-250 words) for a ${genre} story titled "${title}".

Story hook / setting provided by the author: "${hook}"

Requirements:
- Establish the world, tone, and at least one character immediately
- Create intrigue or tension from the very first sentence
- End with a compelling hook that demands the next paragraph
- Write ONLY the story text, no meta-commentary`,
    },
  ];

  return callGroq(messages, temperature, 500);
}

export async function continueStory(
  title: string,
  genre: Genre,
  segments: StorySegment[],
  characters: Character[],
  userInput: string,
  temperature: number
): Promise<string> {
  const systemPrompt = buildSystemPrompt(genre, title, characters);
  const historyMessages = buildStoryContext(segments);

  const userPrompt = userInput.trim()
    ? `The reader contributes: "${userInput}"\n\nContinue the story incorporating this contribution naturally. Write 1-2 vivid paragraphs that advance the plot. Write ONLY the story text.`
    : `Continue the story. Write 1-2 vivid paragraphs that advance the plot and deepen tension or character. Write ONLY the story text.`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: userPrompt },
  ];

  return callGroq(messages, temperature, 600);
}

export async function generateChoices(
  title: string,
  genre: Genre,
  segments: StorySegment[],
  characters: Character[],
  temperature: number
): Promise<BranchChoice[]> {
  const systemPrompt = buildSystemPrompt(genre, title, characters);
  const historyMessages = buildStoryContext(segments);

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    {
      role: 'user',
      content: `Generate exactly 3 distinct branching story choices for what happens next. Each should lead the story in a meaningfully different direction.

Respond ONLY with valid JSON in this exact format, no other text:
[
  {"label": "Choice A short title", "description": "1-2 sentence description of what happens"},
  {"label": "Choice B short title", "description": "1-2 sentence description of what happens"},
  {"label": "Choice C short title", "description": "1-2 sentence description of what happens"}
]`,
    },
  ];

  const raw = await callGroq(messages, temperature, 400);

  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Fallback if JSON parsing fails
    return [
      { label: 'Press Forward', description: 'The characters push ahead despite the danger.' },
      { label: 'Take a Different Path', description: 'An unexpected route reveals new possibilities.' },
      { label: 'Confront the Unknown', description: 'Someone decides to face the mystery head-on.' },
    ];
  }
}

export async function continueFromChoice(
  title: string,
  genre: Genre,
  segments: StorySegment[],
  characters: Character[],
  choice: BranchChoice,
  temperature: number
): Promise<string> {
  const systemPrompt = buildSystemPrompt(genre, title, characters);
  const historyMessages = buildStoryContext(segments);

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    {
      role: 'user',
      content: `The reader chose: "${choice.label}" — ${choice.description}

Write 1-2 vivid paragraphs continuing the story along this path. Make the chosen direction feel inevitable and satisfying. Write ONLY the story text.`,
    },
  ];

  return callGroq(messages, temperature, 600);
}

export async function remixGenre(
  title: string,
  originalGenre: Genre,
  targetGenre: Genre,
  lastSegment: string,
  characters: Character[],
  temperature: number
): Promise<string> {
  const characterContext = characters.length > 0
    ? `Characters involved: ${characters.map(c => c.name).join(', ')}.`
    : '';

  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: `You are a creative writer who specializes in genre transformation. Rewrite story passages in completely different genres while preserving all plot points and characters.`,
    },
    {
      role: 'user',
      content: `Rewrite the following ${originalGenre} story passage as ${targetGenre}, preserving all plot events and character actions but completely changing the tone, style, and genre conventions. ${characterContext}

ORIGINAL PASSAGE:
"${lastSegment}"

GENRE RULES FOR ${targetGenre.toUpperCase()}:
${GENRE_RULES[targetGenre]}

Write ONLY the rewritten passage, no meta-commentary. Keep roughly the same length.`,
    },
  ];

  return callGroq(messages, temperature, 600);
}

export async function extractCharacters(
  storyText: string,
  existingCharacters: Character[]
): Promise<Character[]> {
  const existing = existingCharacters.map(c => c.name).join(', ');

  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: 'You are a literary analyst who extracts character information from story text. Respond only with valid JSON.',
    },
    {
      role: 'user',
      content: `Extract all named characters from this story text. ${existing ? `Already known characters: ${existing} — update their descriptions if new info is revealed, and add any NEW characters found.` : 'Find all named characters.'}

STORY TEXT:
"${storyText}"

Respond ONLY with valid JSON array, no other text:
[{"name": "Character Name", "description": "brief 1-sentence description of who they are and their role"}]

If no characters found, return: []`,
    },
  ];

  try {
    const raw = await callGroq(messages, 0.3, 400);
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return existingCharacters;
  }
}
