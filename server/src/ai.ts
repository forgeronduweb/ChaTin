import { generateReply as generateGeminiReply } from './gemini.js';
import { generateReply as generateGroqReply } from './groq.js';
import type { ChatMessage } from './store.js';

export async function generateReply(history: ChatMessage[]): Promise<string> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateGeminiReply(history);
    } catch (error) {
      console.error('Gemini failed, falling back:', error);
      if (!process.env.GROQ_API_KEY) throw error;
    }
  }
  if (process.env.GROQ_API_KEY) {
    return generateGroqReply(history);
  }
  return generateMockReply(history);
}

function generateMockReply(history: ChatMessage[]): string {
  const lastUserMessage = [...history].reverse().find((message) => message.from === 'me');
  const text = lastUserMessage?.text.trim() ?? '';
  return `(mode hors ligne) J'ai bien reçu : "${text}". Ajoute GEMINI_API_KEY ou GROQ_API_KEY dans server/.env pour activer les vraies réponses IA.`;
}
