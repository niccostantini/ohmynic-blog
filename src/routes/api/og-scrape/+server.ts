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

  // Block SSRF: refuse requests to private/loopback/link-local addresses
  if (isPrivateHost(parsed.hostname)) {
    error(400, 'URL non consentita');
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

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '::1' || h === '0000::1') return true;

  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 0) return true;                             // 0.x.x.x
    if (a === 10) return true;                            // 10.x.x.x
    if (a === 127) return true;                           // 127.x.x.x loopback
    if (a === 169 && b === 254) return true;              // 169.254.x.x link-local / metadata
    if (a === 172 && b >= 16 && b <= 31) return true;    // 172.16–31.x.x
    if (a === 192 && b === 168) return true;              // 192.168.x.x
    if (a === 198 && (b === 18 || b === 19)) return true; // 198.18–19.x.x benchmarking
    if (a === 240) return true;                           // 240.x.x.x reserved
    if (a === 255 && h === '255.255.255.255') return true;
  }

  return false;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
