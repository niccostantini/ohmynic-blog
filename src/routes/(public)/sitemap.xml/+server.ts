import { getPublishedSlugsForSitemap } from '$lib/db/queries/articles';
import type { RequestHandler } from './$types';

const SITE = 'https://ohmynic.co';
const BLOG = `${SITE}/blog`;

// Static root-level pages on ohmynic.co (not managed by this SvelteKit app)
const ROOT_PAGES = [
  { loc: `${SITE}/`,            changefreq: 'monthly', priority: '1.0' },
  { loc: `${SITE}/lista-spesa/`, changefreq: 'monthly', priority: '0.5' },
];

function urlEntry(u: {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
}): string {
  return [
    '  <url>',
    `    <loc>${u.loc}</loc>`,
    u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
    `    <changefreq>${u.changefreq}</changefreq>`,
    `    <priority>${u.priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

export const GET: RequestHandler = async ({ setHeaders }) => {
  const rows = await getPublishedSlugsForSitemap();

  const blogUrls = [
    { loc: `${BLOG}/`, changefreq: 'daily', priority: '0.9' },
    ...rows.map(({ slug, updatedAt }) => ({
      loc: `${BLOG}/${slug}`,
      lastmod: updatedAt ? new Date(updatedAt).toISOString().split('T')[0] : undefined,
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...ROOT_PAGES, ...blogUrls].map(urlEntry).join('\n')}
</urlset>`;

  setHeaders({
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=3600',
  });

  return new Response(xml);
};
