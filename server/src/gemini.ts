import { GoogleGenAI } from '@google/genai';
import type { ChatMessage } from './store.js';

const SYSTEM_PROMPT =
  'You are ChaTin, a friendly and helpful AI chat assistant. Keep answers concise and conversational.';

let client: GoogleGenAI | null = null;

export async function generateReply(history: ChatMessage[]): Promise<string> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await client.models.generateContent({
    model: 'gemini-flash-latest',
    contents: history.map((message) => ({
      role: message.from === 'me' ? 'user' : 'model',
      parts: [{ text: message.text }],
    })),
    config: { systemInstruction: SYSTEM_PROMPT },
  });

  return response.text ?? '';
}
