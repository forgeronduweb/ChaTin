import { generateReply as generateGeminiReply } from './gemini.js';
import { generateReply as generateGroqReply } from './groq.js';
import { listMemories } from './memory-store.js';
import { buildSystemPrompt } from './system-prompt.js';
import type { ChatMessage } from './store.js';
import { getUserById } from './users-store.js';

export async function generateReply(history: ChatMessage[], userId?: string): Promise<string> {
  let systemPrompt = buildSystemPrompt([]);
  if (userId) {
    const [memories, user] = await Promise.all([listMemories(userId), getUserById(userId)]);
    systemPrompt = buildSystemPrompt(
      memories.map((memory) => memory.content),
      user?.city,
    );
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateGeminiReply(history, systemPrompt);
    } catch (error) {
      console.error('Gemini failed, falling back:', error);
      if (!process.env.GROQ_API_KEY) throw error;
    }
  }
  if (process.env.GROQ_API_KEY) {
    return generateGroqReply(history, systemPrompt);
  }
  return generateMockReply(history);
}

function generateMockReply(history: ChatMessage[]): string {
  const lastUserMessage = [...history].reverse().find((message) => message.from === 'me');
  const text = lastUserMessage?.text.trim() ?? '';
  return `(mode hors ligne) J'ai bien reçu : "${text}". Ajoute GEMINI_API_KEY ou GROQ_API_KEY dans server/.env pour activer les vraies réponses IA.`;
}
