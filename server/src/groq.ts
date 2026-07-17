import Groq from 'groq-sdk';
import type { ChatMessage } from './store.js';

const SYSTEM_PROMPT =
  'You are ChaTin, a friendly and helpful AI chat assistant. Keep answers concise and conversational.';

let client: Groq | null = null;

export async function generateReply(history: ChatMessage[]): Promise<string> {
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((message) => ({
        role: (message.from === 'me' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: message.text,
      })),
    ],
  });

  return response.choices[0]?.message.content ?? '';
}
