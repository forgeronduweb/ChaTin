import { GoogleGenAI } from '@google/genai';
import { getRecentUserMessageTexts, replaceAutoPrompts, type PromptInput } from './admin-store.js';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

// Mirrors the pastel card palette used on the client's home/prompts screens.
const CARD_COLORS = ['#F3A7C7', '#F6C445', '#3FBE7A', '#8FCBEA', '#C9A7F3'];
const PROMPT_COUNT = 8;

const SYSTEM_INSTRUCTION = `You produce short "starter prompt" suggestions for a general-purpose AI chat app (ChaTin), shown to users as tappable cards on the home screen.

You are given a sample of real, recent questions asked by real users of the app, and you have live web search access to check what's trending right now.

Combine both sources: some suggestions should reflect what users are actually asking about, others should reflect genuinely current events or trends worth surfacing (news, culture, season-appropriate topics). Never invent fake news, numbers, or dates - only reference things you can verify are real via search.

Reply with ONLY a JSON array, no other text, of exactly ${PROMPT_COUNT} objects: {"title": string, "category": string, "emoji": string}
- "title": the prompt itself, phrased as something a user would tap to start a conversation (a question or request, max ~70 characters), in French.
- "category": a short 1-2 word topic label in French, e.g. "Actualité", "Cuisine", "Productivité".
- "emoji": one single emoji representing the topic.`;

type RawPrompt = { title: string; category: string; emoji: string };

function parsePromptList(raw: string): RawPrompt[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const data = JSON.parse(match[0]);
    if (!Array.isArray(data)) return [];
    return data
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry) => ({
        title: typeof entry.title === 'string' ? entry.title.trim() : '',
        category: typeof entry.category === 'string' ? entry.category.trim() : '',
        emoji: typeof entry.emoji === 'string' ? entry.emoji.trim() : '',
      }))
      .filter((entry) => entry.title.length > 0);
  } catch {
    return [];
  }
}

export async function generateAutoPrompts(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) return;

  const recentQuestions = await getRecentUserMessageTexts(150);
  const sample = recentQuestions.slice(0, 60).map((text) => text.slice(0, 200));
  const userContent =
    sample.length > 0
      ? `Real recent user questions (sample):\n${sample.map((text) => `- ${text}`).join('\n')}`
      : 'No usage data yet - base suggestions entirely on current web trends.';

  const response = await getClient().models.generateContent({
    model: 'gemini-flash-latest',
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }] },
  });

  const parsed = parsePromptList(response.text ?? '').slice(0, PROMPT_COUNT);
  if (parsed.length === 0) return;

  const inputs: PromptInput[] = parsed.map((entry, index) => ({
    title: entry.title,
    author: 'ChaTin',
    category: entry.category || 'Général',
    color: CARD_COLORS[index % CARD_COLORS.length],
    emoji: entry.emoji || null,
    featured: index < 2,
  }));

  await replaceAutoPrompts(inputs);
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function scheduleAutoPromptGeneration(): void {
  const run = () => void generateAutoPrompts().catch((error) => console.error('Auto prompt generation failed:', error));
  run();
  setInterval(run, DAY_MS);
}
