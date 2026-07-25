// Open-Meteo is free and requires no API key for non-commercial use:
// https://open-meteo.com/en/docs and https://open-meteo.com/en/docs/geocoding-api

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'clear sky',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'depositing rime fog',
  51: 'light drizzle',
  53: 'moderate drizzle',
  55: 'dense drizzle',
  56: 'light freezing drizzle',
  57: 'dense freezing drizzle',
  61: 'slight rain',
  63: 'moderate rain',
  65: 'heavy rain',
  66: 'light freezing rain',
  67: 'heavy freezing rain',
  71: 'slight snow fall',
  73: 'moderate snow fall',
  75: 'heavy snow fall',
  77: 'snow grains',
  80: 'slight rain showers',
  81: 'moderate rain showers',
  82: 'violent rain showers',
  85: 'slight snow showers',
  86: 'heavy snow showers',
  95: 'thunderstorm',
  96: 'thunderstorm with slight hail',
  99: 'thunderstorm with heavy hail',
};

// Matches the WeatherCondition enum the app's UI knows how to illustrate
// (src/lib/message-content.ts) - keep the two in sync.
function conditionCategory(code: number): string {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'cloudy';
}

type CacheEntry = { text: string | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000;

type GeocodeResult = { latitude: number; longitude: number; name: string };

async function geocodeCity(city: string): Promise<GeocodeResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = (await response.json()) as { results?: { latitude: number; longitude: number; name: string }[] };
  const result = data.results?.[0];
  return result ? { latitude: result.latitude, longitude: result.longitude, name: result.name } : null;
}

export async function getCurrentWeather(city: string): Promise<string | null> {
  const cached = cache.get(city);
  if (cached && cached.expiresAt > Date.now()) return cached.text;

  try {
    const location = await geocodeCity(city);
    if (!location) {
      cache.set(city, { text: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo forecast failed: ${response.status}`);
    const data = (await response.json()) as {
      current?: {
        temperature_2m: number;
        weather_code: number;
        wind_speed_10m: number;
        relative_humidity_2m: number;
        time: string;
      };
    };
    const current = data.current;
    if (!current) throw new Error('Open-Meteo response missing current weather');

    const description = WMO_DESCRIPTIONS[current.weather_code] ?? 'unknown conditions';
    const condition = conditionCategory(current.weather_code);
    const text =
      `city="${location.name}", condition="${condition}" (${description}), temperatureC=${current.temperature_2m}, ` +
      `windKph=${current.wind_speed_10m}, humidityPct=${current.relative_humidity_2m} (as of ${current.time} local time)`;

    cache.set(city, { text, expiresAt: Date.now() + CACHE_TTL_MS });
    return text;
  } catch (error) {
    console.error(`Failed to fetch weather for "${city}":`, error);
    // Don't cache failures from network/API errors - only cache confirmed "no such city" lookups above.
    return null;
  }
}
