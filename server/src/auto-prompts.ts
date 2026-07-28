import { getRecentUserMessageTexts, replaceAutoPrompts, type PromptInput } from './admin-store.js';
import { generatePromptSuggestions } from './groq.js';

// Keep in sync with COLORS in server/src/admin-dashboard-html.ts.
const CARD_COLORS = ['#F6C445', '#F3A7C7', '#3FBE7A', '#8EC5FC', '#C9A7F3', '#FFB4A2', '#FFD6A5', '#A0E7E5', '#B8E0D2'];
const PROMPT_COUNT = 8;

// Groq only, deliberately - this is a once-a-day background job, not a
// user-facing reply, so it must never compete with real chat traffic for
// the shared Gemini quota. The tradeoff is no live web-search grounding for
// "current trends"; suggestions lean on the recent-questions sample plus
// the model's general knowledge instead.
export async function generateAutoPrompts(): Promise<void> {
  if (!process.env.GROQ_API_KEY) return;

  const recentQuestions = await getRecentUserMessageTexts(150);
  const sample = recentQuestions.slice(0, 60).map((text) => text.slice(0, 200));
  const userContent =
    sample.length > 0
      ? `Real recent user questions (sample):\n${sample.map((text) => `- ${text}`).join('\n')}`
      : 'No usage data yet - use general knowledge for varied, useful suggestions.';

  let parsed = await generatePromptSuggestions(userContent);
  parsed = parsed.slice(0, PROMPT_COUNT);
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
