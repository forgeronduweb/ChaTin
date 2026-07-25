import Groq, { toFile } from 'groq-sdk';
import { SPORTS, type Sport } from './sports.js';
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
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((message) => ({
      role: (message.from === 'me' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: message.text,
    })),
  ];

  // groq/compound-mini adds web search but proved unreliable on the free tier:
  // intermittent "request_too_large" 413s unrelated to actual request size,
  // and worse, it sometimes skips the search and fabricates a plausible-looking
  // answer (complete with fake dates and fake source citations) instead of
  // admitting it doesn't know. A plain static model that honestly says "I
  // don't have that" is safer than one that convincingly makes things up.
  const response = await getClient().chat.completions.create({ model: 'llama-3.3-70b-versatile', messages });
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

const WEATHER_CITY_PROMPT = `You detect whether a message is asking about the weather for a specific named place (a city, region, or country other than "here"/"my city"/wherever the user already is).

Reply with ONLY JSON, no other text: {"city": string|null}
- If the message asks about weather for a place it names (e.g. "temps à Paris", "weather in Tokyo", "il pleut à Lyon ?"), reply with that place name, fixing obvious typos, in a form suitable for a geocoding lookup (e.g. "Paris", "Tokyo", "Lyon").
- If the message asks about weather but for the user's own current location ("chez moi", "ici", "my city", "here", or no place mentioned at all), reply {"city": null}.
- If the message isn't about weather at all, reply {"city": null}.`;

export async function extractWeatherCity(userText: string): Promise<string | null> {
  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: WEATHER_CITY_PROMPT },
      { role: 'user', content: userText },
    ],
  });

  try {
    const parsed = JSON.parse(response.choices[0]?.message.content ?? '{}');
    return typeof parsed.city === 'string' && parsed.city.trim() ? parsed.city.trim() : null;
  } catch {
    return null;
  }
}

const NEWS_QUERY_PROMPT = `You detect whether a message is asking about current/recent news or events, and if so extract a short search query for a news API.

Reply with ONLY JSON, no other text: {"isNewsQuestion": boolean, "query": string}
- If the message asks about recent news, a current event, a sports result/score, or "what's happening with X" and NAMES a subject (e.g. "dernières nouvelles sur l'IA", "what's the latest on the World Cup", "des nouvelles de la bourse ?", "score du match PSG OM", "qui a gagné le match Lakers hier ?"), reply {"isNewsQuestion": true, "query": "<subject only>"} - the SUBJECT only (1-3 words: a topic, team/player names, or event name). Never include generic words like "actualités", "nouvelles", "news", "dernières", "actu", "score", "résultat", "match" themselves in the query, since those won't appear in article text and would return zero results. E.g. "dernières actualités sur l'intelligence artificielle" -> "intelligence artificielle"; "what's the latest on the World Cup" -> "World Cup"; "score du match PSG OM" -> "PSG OM".
- If the message asks for general/top news with no named subject (e.g. "actu du jour", "what's in the news today"), reply {"isNewsQuestion": true, "query": ""}.
- If the message is a general weather question, or doesn't ask about news/current events at all, reply {"isNewsQuestion": false, "query": ""}.`;

export async function extractNewsQuery(userText: string): Promise<string | null> {
  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: NEWS_QUERY_PROMPT },
      { role: 'user', content: userText },
    ],
  });

  try {
    const parsed = JSON.parse(response.choices[0]?.message.content ?? '{}');
    if (parsed.isNewsQuestion !== true) return null;
    return typeof parsed.query === 'string' ? parsed.query.trim() : '';
  } catch {
    return null;
  }
}

const SPORTS_LIST = SPORTS.join('|');

const SPORTS_TEAMS_PROMPT = `You detect whether a message is asking about a team sport's match result or score for one or two named teams (club or national team), and which sport.

Reply with ONLY JSON, no other text: {"isMatchQuestion": boolean, "sport": string, "team1": string, "team2": string}
- If the message asks for a match/game result or score between two named teams, reply {"isMatchQuestion": true, "sport": "<sport>", "team1": "<first team>", "team2": "<second team>"}.
- If it asks about one team's most recent match/result with only one team named, reply {"isMatchQuestion": true, "sport": "<sport>", "team1": "<team>", "team2": ""}.
- "sport" must be exactly one of: ${SPORTS_LIST}. Infer it from context (team names, league mentioned) - default to "football" (soccer) if genuinely ambiguous, since it's the most commonly meant sport worldwide. "american-football" is specifically NFL/college football, not soccer.
- If it's not about a team sport's match result at all (a whole tournament/competition standings with no specific team named, an individual sport like tennis/F1/boxing, or general news), reply {"isMatchQuestion": false, "sport": "", "team1": "", "team2": ""}.
- CRITICAL: team1/team2 feed a sports database search that requires at least 3 characters and only matches a team's short common name, never an abbreviation or acronym. You MUST always expand any abbreviation/acronym/nickname to that real short name - never output an abbreviation as-is. Examples: "score du match PSG OM" -> team1: "Paris Saint Germain", team2: "Marseille" (NOT "PSG"/"OM"); "qui a gagné France Argentine ?" -> team1: "France", team2: "Argentina"; "who won Lakers vs Celtics?" -> team1: "Los Angeles Lakers", team2: "Boston Celtics"; "résultat du dernier match de l'OM" -> team1: "Marseille"; "Barça" -> "Barcelona" (NOT "FC Barcelona", full legal names often fail to match too).`;

export type SportsTeams = { sport: Sport; team1: string; team2: string | null } | null;

export async function extractSportsTeams(userText: string): Promise<SportsTeams> {
  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SPORTS_TEAMS_PROMPT },
      { role: 'user', content: userText },
    ],
  });

  try {
    const parsed = JSON.parse(response.choices[0]?.message.content ?? '{}');
    if (
      parsed.isMatchQuestion !== true ||
      typeof parsed.team1 !== 'string' ||
      !parsed.team1.trim() ||
      typeof parsed.sport !== 'string' ||
      !(SPORTS as readonly string[]).includes(parsed.sport)
    ) {
      return null;
    }
    return {
      sport: parsed.sport,
      team1: parsed.team1.trim(),
      team2: typeof parsed.team2 === 'string' && parsed.team2.trim() ? parsed.team2.trim() : null,
    };
  } catch {
    return null;
  }
}

