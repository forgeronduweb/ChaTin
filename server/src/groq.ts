import Groq, { toFile } from 'groq-sdk';
import type { ChatMessage } from './store.js';

const SYSTEM_PROMPT =
  'You are ChaTin, a friendly and helpful AI chat assistant. Keep answers concise and conversational.';

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

export async function generateReply(history: ChatMessage[]): Promise<string> {
  const response = await getClient().chat.completions.create({
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
