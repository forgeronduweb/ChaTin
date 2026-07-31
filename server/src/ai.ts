import {
  extractCurrencyConversion,
  extractNewsQuery,
  extractSportsTeams,
  extractWeatherCity,
  generateReply as generateGroqReply,
  generateReplyStream as generateGroqReplyStream,
} from './groq.js';
import {
  generateReply as generateGeminiReply,
  generateReplyStream as generateGeminiReplyStream,
  type ImageAttachment,
} from './gemini.js';
import { convertCurrency } from './currency.js';
import { listMemories } from './memory-store.js';
import { getRecentNews } from './news.js';
import { getRecentMatch } from './sports.js';
import { buildSystemPrompt, type ConversationMode, type CurrencyEntry, type NewsEntry, type WeatherEntry } from './system-prompt.js';
import type { ChatMessage } from './store.js';
import { getUserById } from './users-store.js';
import { getCurrentWeather } from './weather.js';

// Cheap local pre-filters so the (slower, Groq-billed) extraction calls below
// only run for messages that plausibly need them, not every single message.
const WEATHER_KEYWORDS =
  /m[ée]t[ée]o|temps (qu'?il|fait)|quel temps|degr[ée]s?|°c|pleu|neige|orage|ensoleill|nuageux|humidit[ée]|climat|weather|forecast|temperature|humidity|rain(s|ing|y)?|snow(s|ing|y)?|sunny|cloudy/i;
const NEWS_KEYWORDS =
  /actualit|nouvelles?|derni[èe]res? (infos?|nouvelles?)|que se passe|info sur|news|breaking|headlines?|what'?s happening|latest on|r[ée]sultats?|score|match|classement|standings?|qui a gagn[ée]|who won/i;
const CURRENCY_KEYWORDS =
  /convert(is|ir)?|conversion|combien (fait|vaut|co[ûu]te)|taux de change|exchange rate|devises?|currency|dollars?|euros?|livres? sterling|yens?|fcfa|francs? cfa|cedis?|nairas?|dirhams?|\$|€|£/i;
const FRENCH_HINT = /[éèàçùâêîôûëïü]|qu'est|c'est|les |des |quel/i;
// Marketing-mode only (see generateReply/generateReplyStream) - a request
// for competitor/market/trend research is the one marketing ask that
// genuinely needs Gemini's live web search, unlike content writing which
// Groq handles just as well without it.
const COMPETITIVE_RESEARCH_KEYWORDS =
  /concurrent|concurrence|veille|tendances? (actuelles?|du moment|2025|2026)|march[ée]|secteur|competitor|market research|industry trends?|what'?s trending/i;

function looksLikeWeatherQuestion(text: string): boolean {
  return WEATHER_KEYWORDS.test(text);
}

function looksLikeNewsQuestion(text: string): boolean {
  return NEWS_KEYWORDS.test(text);
}

function looksLikeCurrencyQuestion(text: string): boolean {
  return CURRENCY_KEYWORDS.test(text);
}

function looksLikeCompetitiveResearchQuestion(text: string): boolean {
  return COMPETITIVE_RESEARCH_KEYWORDS.test(text);
}

function detectLanguage(text: string): 'fr' | 'en' {
  return FRENCH_HINT.test(text) ? 'fr' : 'en';
}

async function buildSystemPromptForHistory(
  history: ChatMessage[],
  userId: string | undefined,
  mode: ConversationMode,
): Promise<string> {
  const lastUserMessage = [...history].reverse().find((message) => message.from === 'me')?.text ?? '';

  const [memories, user] = userId
    ? await Promise.all([listMemories(userId), getUserById(userId)])
    : [[], undefined];

  // Weather/news/currency/sports tool-calling is chat-mode only - a
  // marketer asking about "current events" almost always means their
  // industry or competitors, not something these narrow keyword-triggered
  // lookups (a specific city's weather, a specific match score) would ever
  // catch, so running them here would just be wasted Groq calls.
  if (mode === 'marketing') {
    return buildSystemPrompt(mode, memories.map((memory) => memory.content));
  }

  let askedCity: string | null = null;
  if (looksLikeWeatherQuestion(lastUserMessage) && process.env.GROQ_API_KEY) {
    try {
      askedCity = await extractWeatherCity(lastUserMessage);
    } catch (error) {
      console.error('Weather city extraction failed:', error);
    }
  }

  let newsQuery: string | null = null;
  let sportsTeams: Awaited<ReturnType<typeof extractSportsTeams>> = null;
  if (looksLikeNewsQuestion(lastUserMessage) && process.env.GROQ_API_KEY) {
    const [newsResult, sportsResult] = await Promise.allSettled([
      extractNewsQuery(lastUserMessage),
      extractSportsTeams(lastUserMessage),
    ]);
    if (newsResult.status === 'fulfilled') newsQuery = newsResult.value;
    else console.error('News query extraction failed:', newsResult.reason);
    if (sportsResult.status === 'fulfilled') sportsTeams = sportsResult.value;
    else console.error('Sports teams extraction failed:', sportsResult.reason);
  }

  let currencyQuestion: Awaited<ReturnType<typeof extractCurrencyConversion>> = null;
  if (looksLikeCurrencyQuestion(lastUserMessage) && process.env.GROQ_API_KEY) {
    try {
      currencyQuestion = await extractCurrencyConversion(lastUserMessage);
    } catch (error) {
      console.error('Currency conversion extraction failed:', error);
    }
  }

  const [ownWeather, askedWeather, news, matchResult, conversion] = await Promise.all([
    user?.city ? getCurrentWeather(user.city) : Promise.resolve(null),
    askedCity && askedCity.toLowerCase() !== user?.city?.toLowerCase() ? getCurrentWeather(askedCity) : Promise.resolve(null),
    newsQuery !== null ? getRecentNews(newsQuery, detectLanguage(lastUserMessage)) : Promise.resolve(null),
    sportsTeams ? getRecentMatch(sportsTeams.sport, sportsTeams.team1, sportsTeams.team2) : Promise.resolve(null),
    currencyQuestion
      ? convertCurrency(currencyQuestion.amount, currencyQuestion.from, currencyQuestion.to)
      : Promise.resolve(null),
  ]);
  const currencyEntry: CurrencyEntry | null = conversion && currencyQuestion
    ? { amount: currencyQuestion.amount, from: currencyQuestion.from, to: currencyQuestion.to, rate: conversion.rate, result: conversion.result }
    : null;
  const weatherEntries: WeatherEntry[] = [];
  if (ownWeather && user?.city) weatherEntries.push({ label: `the user's city (${user.city})`, data: ownWeather });
  if (askedWeather && askedCity) weatherEntries.push({ label: askedCity, data: askedWeather });

  const newsEntries: NewsEntry[] | undefined = news?.map((item) => ({
    title: item.title,
    description: item.description,
    source: item.source,
    pubDate: item.pubDate,
  }));

  return buildSystemPrompt(
    mode,
    memories.map((memory) => memory.content),
    user?.city,
    weatherEntries,
    newsEntries,
    matchResult,
    currencyEntry,
  );
}

export type { ImageAttachment, ConversationMode };

const NO_VISION_FALLBACK_REPLY =
  "Désolé, je n'arrive pas à analyser l'image pour le moment - réessaie un peu plus tard.";
const NO_VISION_CONFIGURED_REPLY =
  "Je ne peux pas encore analyser les images sur ce serveur (il faut configurer une clé Gemini).";

// Vision needs Gemini - Groq has no equivalent, so an image always routes
// there. Everything else defaults to Groq instead: weather/news/currency/
// sports facts are already fetched via their own dedicated APIs (see
// buildSystemPromptForHistory above) and injected into the system prompt
// for whichever provider ends up answering, so Gemini's own web search adds
// nothing for those - reserving Gemini for images keeps the quota it shares
// with every user's chat free for the one thing only it can do.
export async function generateReply(
  history: ChatMessage[],
  userId?: string,
  image?: ImageAttachment,
  mode: ConversationMode = 'chat',
): Promise<string> {
  const systemPrompt = await buildSystemPromptForHistory(history, userId, mode);

  if (image) {
    if (!process.env.GEMINI_API_KEY) return NO_VISION_CONFIGURED_REPLY;
    try {
      return await generateGeminiReply(history, systemPrompt, image);
    } catch (error) {
      console.error('Gemini failed:', error);
      return NO_VISION_FALLBACK_REPLY;
    }
  }

  // The one marketing ask that genuinely needs Gemini's live web search
  // (see COMPETITIVE_RESEARCH_KEYWORDS) - everything else in marketing mode
  // still defaults to Groq like chat mode does.
  const lastUserMessage = [...history].reverse().find((message) => message.from === 'me')?.text ?? '';
  const preferGemini =
    mode === 'marketing' && looksLikeCompetitiveResearchQuestion(lastUserMessage) && Boolean(process.env.GEMINI_API_KEY);

  if (preferGemini) {
    try {
      return await generateGeminiReply(history, systemPrompt);
    } catch (error) {
      console.error('Gemini failed, falling back to Groq:', error);
      if (!process.env.GROQ_API_KEY) throw error;
      return generateGroqReply(history, systemPrompt);
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      return await generateGroqReply(history, systemPrompt);
    } catch (error) {
      console.error('Groq failed, falling back:', error);
      if (!process.env.GEMINI_API_KEY) throw error;
    }
  }
  if (process.env.GEMINI_API_KEY) {
    return generateGeminiReply(history, systemPrompt);
  }
  return generateMockReply(history);
}

// Same routing as generateReply, but yields text deltas as they arrive
// instead of waiting for the full reply. A provider failure only falls back
// to the other one if it happens before any chunk was yielded - once real
// text has reached the client, switching providers mid-stream would either
// duplicate or lose text, so a failure past that point just ends the stream.
export async function* generateReplyStream(
  history: ChatMessage[],
  userId?: string,
  image?: ImageAttachment,
  mode: ConversationMode = 'chat',
): AsyncGenerator<string> {
  const systemPrompt = await buildSystemPromptForHistory(history, userId, mode);

  if (image) {
    if (!process.env.GEMINI_API_KEY) {
      yield NO_VISION_CONFIGURED_REPLY;
      return;
    }
    let yieldedAny = false;
    try {
      for await (const delta of generateGeminiReplyStream(history, systemPrompt, image)) {
        yieldedAny = true;
        yield delta;
      }
      return;
    } catch (error) {
      console.error('Gemini streaming failed:', error);
      if (yieldedAny) throw error;
      yield NO_VISION_FALLBACK_REPLY;
      return;
    }
  }

  const lastUserMessage = [...history].reverse().find((message) => message.from === 'me')?.text ?? '';
  const preferGemini =
    mode === 'marketing' && looksLikeCompetitiveResearchQuestion(lastUserMessage) && Boolean(process.env.GEMINI_API_KEY);

  if (preferGemini) {
    let yieldedAny = false;
    try {
      for await (const delta of generateGeminiReplyStream(history, systemPrompt)) {
        yieldedAny = true;
        yield delta;
      }
      return;
    } catch (error) {
      console.error('Gemini streaming failed, falling back to Groq:', error);
      if (yieldedAny || !process.env.GROQ_API_KEY) throw error;
      yield* generateGroqReplyStream(history, systemPrompt);
      return;
    }
  }

  if (process.env.GROQ_API_KEY) {
    let yieldedAny = false;
    try {
      for await (const delta of generateGroqReplyStream(history, systemPrompt)) {
        yieldedAny = true;
        yield delta;
      }
      return;
    } catch (error) {
      console.error('Groq streaming failed, falling back:', error);
      if (yieldedAny || !process.env.GEMINI_API_KEY) throw error;
    }
  }
  if (process.env.GEMINI_API_KEY) {
    yield* generateGeminiReplyStream(history, systemPrompt);
    return;
  }
  yield generateMockReply(history);
}

function generateMockReply(history: ChatMessage[]): string {
  const lastUserMessage = [...history].reverse().find((message) => message.from === 'me');
  const text = lastUserMessage?.text.trim() ?? '';
  return `(mode hors ligne) J'ai bien reçu : "${text}". Ajoute GEMINI_API_KEY ou GROQ_API_KEY dans server/.env pour activer les vraies réponses IA.`;
}
