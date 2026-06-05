import { getPublishedArticles, countPublishedArticles } from '$lib/db/queries/articles';
import type { RequestHandler } from './$types';

const SITE_URL = 'https://ohmynic.co/blog';
const SITE_TITLE = 'OhMyNic!';
const SITE_DESCRIPTION = 'Pensieri, idee e articoli di OhMyNic!';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async () => {
  const total = await countPublishedArticles();
  const articles = await getPublishedArticles(1, total || 100);

  const items = articles
    .map((article) => {
      const pubDate = new Date(article.publishedAt ?? article.createdAt).toUTCString();
      const link = `${SITE_URL}/${article.slug}`;
      const excerpt = article.excerpt
        ? escapeXml(article.excerpt)
        : escapeXml(article.content.replace(/<[^>]*>/g, '').slice(0, 160));

      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${excerpt}</description>
    </item>`;
    })
    .join('');

  const lastBuildDate =
    articles.length > 0
      ? new Date(articles[0].publishedAt ?? articles[0].createdAt).toUTCString()
      : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>it</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
