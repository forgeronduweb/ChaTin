import { GoogleGenAI } from '@google/genai';
import type { ChatMessage } from './store.js';

let client: GoogleGenAI | null = null;

export type ImageAttachment = { mimeType: string; data: Buffer };

// Attaches the image to the last message's parts (that's always the current
// user turn - see ai.ts) rather than trying to carry it across the whole
// history, matching how an extracted document's text is only ever added to
// this one AI call and not persisted into future turns.
function buildContents(history: ChatMessage[], image: ImageAttachment | undefined) {
  return history.map((message, index) => {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: message.text },
    ];
    if (image && index === history.length - 1) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data.toString('base64') } });
    }
    return { role: message.from === 'me' ? 'user' : 'model', parts };
  });
}

export async function generateReply(history: ChatMessage[], systemPrompt: string, image?: ImageAttachment): Promise<string> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await client.models.generateContent({
    model: 'gemini-flash-latest',
    contents: buildContents(history, image),
    config: { systemInstruction: systemPrompt, tools: [{ googleSearch: {} }] },
  });

  return response.text ?? '';
}

export async function* generateReplyStream(
  history: ChatMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): AsyncGenerator<string> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const stream = await client.models.generateContentStream({
    model: 'gemini-flash-latest',
    contents: buildContents(history, image),
    config: { systemInstruction: systemPrompt, tools: [{ googleSearch: {} }] },
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}
