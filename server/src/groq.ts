import Groq, { toFile } from 'groq-sdk';
import type { ChatMessage } from './store.js';

let client: Groq | null = null;

function getClient(): Groq {
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

export async function transcribeAudio(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const file = await toFile(buffer, filename, { type: mimeType });
  const transcription = await getClient().audio.transcriptions.create({
    model: 'whisper-large-v3-turbo',
    file,
  });
  return transcription.text;
}

export async function generateReply(history: ChatMessage[], systemPrompt: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((message) => ({
        role: (message.from === 'me' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: message.text,
      })),
    ],
  });

  return response.choices[0]?.message.content ?? '';
}

const MEMORY_EXTRACTION_PROMPT = `You extract durable facts worth remembering about a user across separate future conversations, from one chat exchange.

Only extract things that will still be true/useful later: their name, job, city, ongoing projects, preferences, constraints, or similar lasting personal facts. Never extract one-off questions, small talk, or facts only relevant to this single exchange.

You are given the user's current list of remembered facts, then the new exchange. Reply with ONLY a JSON object, no other text:
{"add": string[], "remove": string[]}
"add": new facts worth remembering, written as short standalone sentences, not already covered by an existing fact. Empty array if nothing new.
"remove": facts from the EXISTING list (copied verbatim) that this exchange shows are now outdated or contradicted. Empty array if none.
If nothing qualifies, reply {"add": [], "remove": []}.`;

export type MemoryExtraction = { add: string[]; remove: string[] };

export async function extractMemoryFacts(
  userText: string,
  botText: string,
  existingMemories: string[],
): Promise<MemoryExtraction> {
  const existingList = existingMemories.length > 0 ? existingMemories.map((memory) => `- ${memory}`).join('\n') : '(none)';

  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: MEMORY_EXTRACTION_PROMPT },
      {
        role: 'user',
        content: `Existing remembered facts:\n${existingList}\n\nNew exchange:\nUser: ${userText}\nAssistant: ${botText}`,
      },
    ],
  });

  try {
    const parsed = JSON.parse(response.choices[0]?.message.content ?? '{}');
    return {
      add: Array.isArray(parsed.add) ? parsed.add.filter((item: unknown): item is string => typeof item === 'string') : [],
      remove: Array.isArray(parsed.remove)
        ? parsed.remove.filter((item: unknown): item is string => typeof item === 'string')
        : [],
    };
  } catch {
    return { add: [], remove: [] };
  }
}
