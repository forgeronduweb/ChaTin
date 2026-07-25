// NewsData.io free tier explicitly allows commercial/production use (unlike
// GNews's free tier or Google News RSS, both restricted to personal/non-
// commercial use): https://newsdata.io/documentation/latest-news
// Requires NEWSDATA_API_KEY - sign up free at https://newsdata.io/register

export type NewsItem = {
  title: string;
  description: string | null;
  source: string | null;
  pubDate: string | null;
  link: string;
};

type CacheEntry = { items: NewsItem[] | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function getRecentNews(query: string, language: 'fr' | 'en' = 'fr'): Promise<NewsItem[] | null> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) return null;

  const cacheKey = `${language}:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.items;

  try {
    const queryParam = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : '';
    const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}${queryParam}&language=${language}&size=5`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`NewsData.io failed: ${response.status}`);
    const data = (await response.json()) as {
      results?: {
        title: string;
        description?: string | null;
        source_id?: string | null;
        pubDate?: string | null;
        link: string;
      }[];
    };

    const items: NewsItem[] = (data.results ?? []).map((article) => ({
      title: article.title,
      description: article.description ?? null,
      source: article.source_id ?? null,
      pubDate: article.pubDate ?? null,
      link: article.link,
    }));

    cache.set(cacheKey, { items, expiresAt: Date.now() + CACHE_TTL_MS });
    return items;
  } catch (error) {
    console.error(`Failed to fetch news for "${query}":`, error);
    return null;
  }
}
