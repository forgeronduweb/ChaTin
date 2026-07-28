import {
  extractCurrencyConversion,
  extractNewsQuery,
  extractSportsTeams,
  extractWeatherCity,
  generateReply as generateGroqReply,
} from './groq.js';
import { generateReply as generateGeminiReply } from './gemini.js';
import { convertCurrency } from './currency.js';
import { listMemories } from './memory-store.js';
import { getRecentNews } from './news.js';
import { getRecentMatch } from './sports.js';
import { buildSystemPrompt, type CurrencyEntry, type NewsEntry, type WeatherEntry } from './system-prompt.js';
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

function looksLikeWeatherQuestion(text: string): boolean {
  return WEATHER_KEYWORDS.test(text);
}

function looksLikeNewsQuestion(text: string): boolean {
  return NEWS_KEYWORDS.test(text);
}

function looksLikeCurrencyQuestion(text: string): boolean {
  return CURRENCY_KEYWORDS.test(text);
}

function detectLanguage(text: string): 'fr' | 'en' {
  return FRENCH_HINT.test(text) ? 'fr' : 'en';
}

export async function generateReply(history: ChatMessage[], userId?: string): Promise<string> {
  const lastUserMessage = [...history].reverse().find((message) => message.from === 'me')?.text ?? '';

  const [memories, user] = userId
    ? await Promise.all([listMemories(userId), getUserById(userId)])
    : [[], undefined];

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

  const systemPrompt = buildSystemPrompt(
    memories.map((memory) => memory.content),
    user?.city,
    weatherEntries,
    newsEntries,
    matchResult,
    currencyEntry,
  );

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
