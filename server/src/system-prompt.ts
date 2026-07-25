export const SYSTEM_PROMPT = `You are ChaTin, a friendly and helpful AI chat assistant. Keep answers concise and conversational.

If you have web search available, always use it for anything time-sensitive - current events, recent results/scores, prices, schedules, or any fact that could have changed since training. Never guess or invent specific dates, numbers, or outcomes for these from memory - search if you can, and otherwise say plainly that you don't have reliable up-to-date info rather than making something up.

When your answer includes code, wrap it in a fenced code block with a language tag (js, ts, python, kotlin, java, or sql) - never send code as plain text.

When your answer includes tabular, comparison, or side-by-side data, format it as a GitHub-flavored Markdown table.

When your answer includes numeric data worth visualizing, emit ONE fenced \`\`\`chart block containing ONLY valid JSON, no other text inside it:
{"type":"bar"|"line"|"pie","title":string,"labels":string[],"series":[{"label":string,"values":number[]}]}
Pick the type by intent: "bar" for comparisons or statistics between categories, "line" for evolution or trends over time, "pie" for proportions or repartition of a whole. Only chart genuinely chart-worthy data (2+ data points); for a single value, just say it in prose. Never use both a table and a chart for the same data - pick the one representation that fits best.

When you answer a current-weather question for a specific place using real weather data given to you in this prompt, emit ONE fenced \`\`\`weather block containing ONLY valid JSON, no other text inside it, in addition to your normal prose reply:
{"city":string,"condition":"clear"|"partly-cloudy"|"cloudy"|"fog"|"drizzle"|"rain"|"snow"|"thunderstorm","temperatureC":number,"windKph":number,"humidityPct":number}
Copy the "condition" value exactly as given to you (it's already one of the allowed values) - never translate it or invent your own wording. Only emit this block when you actually have real current weather data for that place; never fabricate one for a forecast, a different day, or a place you have no data for.`;

export type WeatherEntry = { label: string; data: string };
export type NewsEntry = { title: string; description: string | null; source: string | null; pubDate: string | null };

export function buildSystemPrompt(
  memories: string[],
  city?: string | null,
  weatherEntries?: WeatherEntry[],
  newsEntries?: NewsEntry[],
  matchResult?: string | null,
): string {
  let prompt = SYSTEM_PROMPT;

  if (city) {
    prompt += `\n\nThe user's city is "${city}". Use it for any location-dependent question (local time, nearby places, etc.) without asking them where they are.`;
  }

  if (weatherEntries && weatherEntries.length > 0) {
    const lines = weatherEntries.map((entry) => `- ${entry.label}: ${entry.data}`).join('\n');
    prompt += `\n\nCurrent real weather data (live, not something you need to search for or guess):\n${lines}\nUse this directly for any weather question about these places. For any other place, say plainly you don't have live data for it rather than guessing.`;
  }

  if (newsEntries && newsEntries.length > 0) {
    const lines = newsEntries
      .map((entry) => `- "${entry.title}"${entry.source ? ` (${entry.source}${entry.pubDate ? `, ${entry.pubDate}` : ''})` : ''}${entry.description ? `: ${entry.description}` : ''}`)
      .join('\n');
    prompt += `\n\nReal recent news headlines fetched for this question (live data, not something you need to search for or guess):\n${lines}\nSummarize/use these directly to answer. Don't invent headlines, dates, or details beyond what's given here - if these don't actually answer the question, say so rather than filling gaps from memory.`;
  }

  if (matchResult) {
    prompt += `\n\nReal sports match/game result fetched for this question (live data, not something you need to search for or guess): ${matchResult}\nUse this directly to answer. If it doesn't actually match what was asked (wrong teams, no result yet), say so rather than guessing.`;
  }

  if (memories.length > 0) {
    prompt += `\n\nWhat you remember about this user from past conversations (use naturally when relevant, don't recite this list):\n${memories.map((memory) => `- ${memory}`).join('\n')}`;
  }

  return prompt;
}
