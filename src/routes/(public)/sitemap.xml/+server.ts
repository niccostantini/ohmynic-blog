import { getPublishedSlugsForSitemap } from '$lib/db/queries/articles';
import type { RequestHandler } from './$types';

const BASE = 'https://ohmynic.co/blog';

export const GET: RequestHandler = async ({ setHeaders }) => {
  const rows = await getPublishedSlugsForSitemap();

  const urls = [
    // Homepage
    `  <url>\n    <loc>${BASE}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    // Articles and pages
    ...rows.map(({ slug, updatedAt }) => {
      const lastmod = updatedAt ? new Date(updatedAt).toISOString().split('T')[0] : undefined;
      return [
        '  <url>',
        `    <loc>${BASE}/${slug}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
      ].filter(Boolean).join('\n');
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  setHeaders({
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=3600',
  });

  return new Response(xml);
};
