// API-Sports (api-sports.io / api-football.com) free tier: 100 requests/day
// PER sport, no card required to sign up, same key works across all of their
// sport-specific APIs. Their terms restrict *redistributing* competition data
// commercially (broadcasting, betting, fantasy sports) - conversationally
// mentioning a score in a chat reply is a different, lower-risk use, but
// it's still not as unambiguously clear as Open-Meteo/NewsData.io's terms.
// Sign up free at https://dashboard.api-football.com/register

export const SPORTS = [
  'football',
  'basketball',
  'baseball',
  'hockey',
  'handball',
  'volleyball',
  'rugby',
  'american-football',
] as const;
export type Sport = (typeof SPORTS)[number];

// Football uniquely uses "/fixtures" and nests date/status under "fixture";
// every other sport in the API-Sports family uses "/games" with date/status
// on the game object directly - both patterns are handled in formatGame().
const SPORT_SUBDOMAIN: Record<Sport, string> = {
  football: 'v3.football.api-sports.io',
  basketball: 'v1.basketball.api-sports.io',
  baseball: 'v1.baseball.api-sports.io',
  hockey: 'v1.hockey.api-sports.io',
  handball: 'v1.handball.api-sports.io',
  volleyball: 'v1.volleyball.api-sports.io',
  rugby: 'v1.rugby.api-sports.io',
  'american-football': 'v1.american-football.api-sports.io',
};

type CacheEntry = { text: string | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function headers(): HeadersInit {
  return { 'x-apisports-key': process.env.APISPORTS_KEY ?? '' };
}

// Reserve/youth/women's sides often outrank the actual first team in the
// API's own search relevance for a club's full name (e.g. searching
// "Olympique Marseille" returns "Olympique Marseille II" first) - skip those
// unless they're literally the only match, so a plain club name search
// doesn't silently resolve to the wrong squad's result.
const NON_FIRST_TEAM = /\b(II|U1[0-9]|U2[0-3]|B|W|Women|Reserves?|Youth|Academy)\b/i;

async function searchTeamId(sport: Sport, name: string): Promise<{ id: number; name: string } | null> {
  if (name.trim().length < 3) return null; // the API rejects shorter queries outright
  const base = `https://${SPORT_SUBDOMAIN[sport]}`;
  const response = await fetch(`${base}/teams?search=${encodeURIComponent(name)}`, { headers: headers() });
  if (!response.ok) throw new Error(`API-Sports team search failed (${sport}): ${response.status}`);
  const data = (await response.json()) as { response?: ({ team?: { id: number; name: string } } | { id: number; name: string })[] };
  const teams = (data.response ?? [])
    .map((entry) => ('team' in entry && entry.team ? entry.team : (entry as { id: number; name: string })))
    .filter((team): team is { id: number; name: string } => Boolean(team?.id));
  if (teams.length === 0) return null;
  return teams.find((team) => !NON_FIRST_TEAM.test(team.name)) ?? teams[0];
}

// Tolerant of the two response shapes across the API-Sports family: football
// nests date/status under "fixture" and calls the score "goals"; every other
// sport puts date/status on the game object directly and calls it "scores".
type Game = Record<string, unknown>;

function pick(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => (current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined), obj);
}

function gameScore(game: Game): [number, number] | null {
  const homeScore = pick(game, ['goals', 'home']) ?? pick(game, ['scores', 'home', 'total']) ?? pick(game, ['scores', 'home']);
  const awayScore = pick(game, ['goals', 'away']) ?? pick(game, ['scores', 'away', 'total']) ?? pick(game, ['scores', 'away']);
  const home = typeof homeScore === 'number' ? homeScore : typeof homeScore === 'string' ? Number(homeScore) : NaN;
  const away = typeof awayScore === 'number' ? awayScore : typeof awayScore === 'string' ? Number(awayScore) : NaN;
  return Number.isFinite(home) && Number.isFinite(away) ? [home, away] : null;
}

function gameDate(game: Game): Date | null {
  const raw = pick(game, ['fixture', 'date']) ?? pick(game, ['date']);
  if (typeof raw !== 'string') return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

// The API returns h2h history in no guaranteed order and includes future
// fixtures - pick the most recent one that has actually been played (has a
// real score) and isn't in the future.
function pickMostRecentFinished(games: Game[]): Game | null {
  const now = Date.now();
  const finished = games
    .map((game) => ({ game, date: gameDate(game), score: gameScore(game) }))
    .filter((entry): entry is { game: Game; date: Date; score: [number, number] } => entry.date !== null && entry.score !== null && entry.date.getTime() <= now)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  return finished[0]?.game ?? null;
}

function formatGame(game: Game): string | null {
  const home = pick(game, ['teams', 'home', 'name']);
  const away = pick(game, ['teams', 'away', 'name']);
  if (typeof home !== 'string' || typeof away !== 'string') return null;

  const date = pick(game, ['fixture', 'date']) ?? pick(game, ['date']);
  const status = pick(game, ['fixture', 'status', 'long']) ?? pick(game, ['status', 'long']);
  const league = pick(game, ['league', 'name']);
  const [homeScore, awayScore] = gameScore(game) ?? [];
  const score = homeScore !== undefined && awayScore !== undefined ? `${homeScore}-${awayScore}` : 'score not available';

  const parts = [`${home} vs ${away}: ${score}`];
  const meta = [status, league, date].filter((value): value is string => typeof value === 'string');
  if (meta.length > 0) parts.push(`(${meta.join(', ')})`);
  return parts.join(' ');
}

async function fetchHeadToHead(sport: Sport, homeId: number, awayId: number): Promise<Game[]> {
  const base = `https://${SPORT_SUBDOMAIN[sport]}`;
  // Football uniquely has a dedicated "/fixtures/headtohead" route - every
  // other sport in the family accepts "h2h" as a plain query param on the
  // main "/games" resource instead.
  const url = sport === 'football' ? `${base}/fixtures/headtohead?h2h=${homeId}-${awayId}` : `${base}/games?h2h=${homeId}-${awayId}`;
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) throw new Error(`API-Sports h2h failed (${sport}): ${response.status}`);
  const data = (await response.json()) as { response?: Game[] };
  return data.response ?? [];
}

// Only head-to-head (both teams named) is reliable on the free API-Sports
// plan: the "last"/"next" convenience params it would take for a single
// team's most recent match are paid-plan-only, and the season-based fallback
// is locked to old seasons on the free plan (stale by well over a year) -
// so a single-team query intentionally returns null rather than surfacing
// outdated data as if it were current.
export async function getRecentMatch(sport: Sport, team1: string, team2?: string | null): Promise<string | null> {
  const apiKey = process.env.APISPORTS_KEY;
  if (!apiKey || !team2) return null;

  const cacheKey = `${sport}:${team1.toLowerCase()}:${team2.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.text;

  try {
    // Sequential, not parallel: the free plan has a per-second burst limit
    // tighter than the 100/day quota, and firing both searches at once trips it.
    const homeId = await searchTeamId(sport, team1);
    const awayId = await searchTeamId(sport, team2);
    if (!homeId || !awayId) {
      cache.set(cacheKey, { text: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }

    const games = await fetchHeadToHead(sport, homeId.id, awayId.id);
    const game = pickMostRecentFinished(games);
    const text = game ? formatGame(game) : null;
    cache.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS });
    return text;
  } catch (error) {
    console.error(`Failed to fetch ${sport} match result for "${team1}" vs "${team2}":`, error);
    return null;
  }
}
