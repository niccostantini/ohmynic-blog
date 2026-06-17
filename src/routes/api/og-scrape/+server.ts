import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) error(401, 'Non autorizzato');

  const targetUrl = url.searchParams.get('url')?.trim() ?? '';
  if (!targetUrl) error(400, 'Parametro url mancante');

  // Validate URL format
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      error(400, 'Protocollo non supportato');
    }
  } catch {
    error(400, 'URL non valida');
  }

  let html: string;
  try {
    const res = await fetch(parsed.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OhMyNicBot/1.0; +https://ohmynic.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) error(422, `URL non raggiungibile (${res.status})`);
    html = await res.text();
  } catch (e: any) {
    if (e?.status) throw e;
    error(500, 'Errore durante la scansione');
  }

  // Extract OG / Twitter meta tags with regex (no DOM parsing needed)
  function getMeta(property: string): string {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']twitter:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:${property}["']`, 'i'),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return '';
  }

  const title =
    getMeta('title') ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    '';

  // Resolve relative image URL to absolute
  let image = getMeta('image');
  if (image && !image.startsWith('http')) {
    try { image = new URL(image, parsed.origin).href; } catch { image = ''; }
  }

  return json({
    title: decodeHtmlEntities(title),
    description: decodeHtmlEntities(getMeta('description')),
    image,
    siteName: decodeHtmlEntities(getMeta('site_name')),
  });
};

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
