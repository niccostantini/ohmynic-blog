import { env } from '$env/dynamic/private';

export const SUPPORTED_LOCALES = ['it', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<string, string> = {
  it: 'IT',
  en: 'EN',
};

export function isSupported(locale: string): locale is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export function detectLocale(url: URL, acceptLanguage = ''): Locale {
  const langParam = url.searchParams.get('lang');
  if (langParam && isSupported(langParam)) return langParam;

  // parse Accept-Language: "en-US,en;q=0.9,it;q=0.8"
  const langs = acceptLanguage
    .split(',')
    .map((s) => s.split(';')[0].trim().toLowerCase().slice(0, 2));
  for (const lang of langs) {
    if (isSupported(lang)) return lang;
  }

  return 'it';
}

async function callLibreTranslate(
  q: string,
  source: string,
  target: string,
  format: 'text' | 'html' = 'text',
): Promise<string> {
  const baseUrl = env.LIBRETRANSLATE_URL;
  if (!baseUrl) throw new Error('LIBRETRANSLATE_URL non configurato');

  const res = await fetch(`${baseUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, source, target, format }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.status.toString());
    throw new Error(`LibreTranslate error ${res.status}: ${msg}`);
  }

  const data = (await res.json()) as { translatedText: string };
  return data.translatedText;
}

export async function translateText(text: string, from: string, to: string): Promise<string> {
  return callLibreTranslate(text, from, to, 'text');
}

export async function translateHtml(html: string, from: string, to: string): Promise<string> {
  return callLibreTranslate(html, from, to, 'html');
}
