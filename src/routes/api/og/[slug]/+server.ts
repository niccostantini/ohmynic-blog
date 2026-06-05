import type { RequestHandler } from './$types';
import { getArticleBySlug } from '$lib/db/queries/articles';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const ACCENT = '#7c5cbf';
const BG = '#1e1630';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.length > maxChars ? word.slice(0, maxChars - 1) + '…' : word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && current && !lines[maxLines - 1].endsWith('…')) {
    const last = lines[maxLines - 1];
    if (last.length > maxChars - 1) {
      lines[maxLines - 1] = last.slice(0, maxChars - 1) + '…';
    }
  }
  return lines;
}

function buildSvg(title: string): string {
  const lines = wrapLines(title, 38, 3);
  const fontSize = 62;
  const lineHeight = 78;
  const blockH = lines.length * lineHeight;
  const blockY = (H - blockH) / 2 - 20;

  const textRows = lines
    .map(
      (line, i) =>
        `<text x="80" y="${blockY + i * lineHeight + fontSize}" ` +
        `font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" ` +
        `font-size="${fontSize}" font-weight="700" fill="white" ` +
        `letter-spacing="-1">${escapeXml(line)}</text>`
    )
    .join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- background -->
  <rect width="${W}" height="${H}" fill="${BG}"/>

  <!-- subtle grid overlay -->
  <defs>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- accent bar -->
  <rect x="80" y="${blockY - 24}" width="56" height="5" rx="2.5" fill="${ACCENT}"/>

  <!-- title lines -->
  ${textRows}

  <!-- domain label -->
  <text x="80" y="${H - 48}"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-size="22" font-weight="600" fill="${ACCENT}"
    letter-spacing="3">OHMYNIC.CO</text>

  <!-- right decoration -->
  <circle cx="${W - 80}" cy="${H / 2}" r="120" fill="rgba(124,92,191,0.08)"/>
  <circle cx="${W - 80}" cy="${H / 2}" r="72" fill="rgba(124,92,191,0.06)"/>
</svg>`;
}

export const GET: RequestHandler = async ({ params, setHeaders }) => {
  const article = await getArticleBySlug(params.slug);
  if (!article) return new Response('Not found', { status: 404 });

  const svg = buildSvg(article.title);

  try {
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    setHeaders({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    });
    return new Response(png);
  } catch {
    setHeaders({
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    });
    return new Response(svg);
  }
};
