import { GoogleGenAI } from '@google/genai';
import type { ChatMessage } from './store.js';

let client: GoogleGenAI | null = null;

export async function generateReply(history: ChatMessage[], systemPrompt: string): Promise<string> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await client.models.generateContent({
    model: 'gemini-flash-latest',
    contents: history.map((message) => ({
      role: message.from === 'me' ? 'user' : 'model',
      parts: [{ text: message.text }],
    })),
    config: { systemInstruction: systemPrompt, tools: [{ googleSearch: {} }] },
  });

  return response.text ?? '';
}
