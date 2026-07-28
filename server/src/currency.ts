// open.er-api.com is free and requires no API key, and - unlike most free
// exchange-rate APIs (Frankfurter, ECB-based ones) - covers the CFA franc
// (XOF/XAF), which matters here since a chunk of this app's users are in
// Francophone West/Central Africa: https://www.exchangerate-api.com/docs/free

type CacheEntry = { rate: number | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

export type ConversionResult = { rate: number; result: number };

async function fetchRate(from: string, to: string): Promise<number | null> {
  const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`open.er-api.com failed: ${response.status}`);
  const data = (await response.json()) as { result?: string; rates?: Record<string, number> };
  if (data.result !== 'success') throw new Error(`open.er-api.com returned result="${data.result}"`);
  const rate = data.rates?.[to];
  return typeof rate === 'number' ? rate : null;
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<ConversionResult | null> {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  if (fromCode === toCode) return { rate: 1, result: amount };

  const cacheKey = `${fromCode}_${toCode}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.rate === null ? null : { rate: cached.rate, result: amount * cached.rate };
  }

  try {
    const rate = await fetchRate(fromCode, toCode);
    cache.set(cacheKey, { rate, expiresAt: Date.now() + CACHE_TTL_MS });
    return rate === null ? null : { rate, result: amount * rate };
  } catch (error) {
    console.error(`Failed to fetch exchange rate ${fromCode}->${toCode}:`, error);
    // Don't cache failures from network/API errors - only cache confirmed "no such currency" lookups above.
    return null;
  }
}
