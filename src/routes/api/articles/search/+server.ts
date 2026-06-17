import { json, error } from '@sveltejs/kit';
import { ilike, and, eq, or, isNull, lte } from 'drizzle-orm';
import { db } from '$lib/db';
import { articles } from '$lib/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) error(401, 'Non autorizzato');

  const q = url.searchParams.get('q')?.trim() ?? '';
  if (!q) return json([]);

  const results = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      coverImage: articles.coverImage,
    })
    .from(articles)
    .where(and(
      eq(articles.status, 'published'),
      or(isNull(articles.publishedAt), lte(articles.publishedAt, new Date())),
      ilike(articles.title, `%${q}%`),
    ))
    .orderBy(articles.title)
    .limit(8);

  return json(results);
};
