export type InlineSpan = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

export type ChartSpec = {
  type: 'bar' | 'line' | 'pie';
  title?: string;
  labels: string[];
  series: { label: string; values: number[] }[];
};

export type MessageSegment =
  | { type: 'paragraph'; inlines: InlineSpan[] }
  | { type: 'code'; language: string; code: string }
  | { type: 'table'; headers: string[]; alignments: ('left' | 'center' | 'right')[]; rows: string[][] }
  | { type: 'chart'; chart: ChartSpec };

const FENCE_REGEX = /```(\w+)?\n([\s\S]*?)```/g;
const SEPARATOR_LINE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const INLINE_REGEX = /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\*(.+?)\*)/g;

// Full responses arrive whole (no streaming path in this app), so this never
// has to deal with an unclosed fence mid-generation.
export function parseMessageContent(raw: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  FENCE_REGEX.lastIndex = 0;
  while ((match = FENCE_REGEX.exec(raw))) {
    const before = raw.slice(lastIndex, match.index);
    if (before.trim()) segments.push(...parseProse(before));

    const lang = (match[1] ?? '').toLowerCase().trim();
    const body = match[2].replace(/\n$/, '');
    if (lang === 'chart') {
      const chart = tryParseChart(body);
      segments.push(chart ? { type: 'chart', chart } : { type: 'code', language: 'json', code: body });
    } else {
      segments.push({ type: 'code', language: lang || 'text', code: body });
    }
    lastIndex = match.index + match[0].length;
  }

  const rest = raw.slice(lastIndex);
  if (rest.trim()) segments.push(...parseProse(rest));

  return segments;
}

function tryParseChart(body: string): ChartSpec | null {
  try {
    const data = JSON.parse(body) as {
      type?: unknown;
      title?: unknown;
      labels?: unknown;
      series?: unknown;
    };
    if (data.type !== 'bar' && data.type !== 'line' && data.type !== 'pie') return null;
    if (!Array.isArray(data.labels) || !data.labels.every((label) => typeof label === 'string')) return null;
    if (!Array.isArray(data.series) || data.series.length === 0) return null;

    const series: ChartSpec['series'] = [];
    for (const entry of data.series) {
      if (typeof entry !== 'object' || entry === null) return null;
      const { label, values } = entry as { label?: unknown; values?: unknown };
      if (typeof label !== 'string') return null;
      if (!Array.isArray(values) || !values.every((value) => typeof value === 'number')) return null;
      series.push({ label, values });
    }

    return {
      type: data.type,
      title: typeof data.title === 'string' ? data.title : undefined,
      labels: data.labels,
      series,
    };
  } catch {
    return null;
  }
}

function splitTableCells(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((cell) => cell.trim());
}

function parseAlignment(cell: string): 'left' | 'center' | 'right' {
  const trimmed = cell.trim();
  const left = trimmed.startsWith(':');
  const right = trimmed.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  return 'left';
}

function parseProse(text: string): MessageSegment[] {
  const lines = text.split('\n');
  const segments: MessageSegment[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph() {
    const joined = paragraphLines.join('\n').trim();
    paragraphLines = [];
    if (!joined) return;
    for (const block of joined.split(/\n{2,}/)) {
      const trimmedBlock = block.trim();
      if (trimmedBlock) segments.push({ type: 'paragraph', inlines: parseInlines(trimmedBlock) });
    }
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];
    if (line.includes('|') && next !== undefined && SEPARATOR_LINE.test(next)) {
      const headers = splitTableCells(line);
      const alignments = splitTableCells(next).map(parseAlignment);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim() !== '' && lines[j].includes('|')) {
        rows.push(splitTableCells(lines[j]));
        j++;
      }
      flushParagraph();
      segments.push({ type: 'table', headers, alignments, rows });
      i = j;
      continue;
    }
    paragraphLines.push(line);
    i++;
  }
  flushParagraph();

  return segments;
}

function parseInlines(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_REGEX.lastIndex = 0;
  while ((match = INLINE_REGEX.exec(text))) {
    if (match.index > lastIndex) {
      spans.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) spans.push({ text: match[2], bold: true });
    else if (match[4] !== undefined) spans.push({ text: match[4], code: true });
    else if (match[6] !== undefined) spans.push({ text: match[6], italic: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) spans.push({ text: text.slice(lastIndex) });

  return spans.length > 0 ? spans : [{ text }];
}
