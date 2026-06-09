import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/index';
import { articles } from '$lib/db/schema';
import { eq, and, ilike, or } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (locals.user?.role !== 'admin') error(403);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const results = await db
    .select({ id: articles.id, title: articles.title, slug: articles.slug, type: articles.type, publishedAt: articles.publishedAt })
    .from(articles)
    .where(
      and(
        eq(articles.status, 'published'),
        q ? ilike(articles.title, `%${q}%`) : or(eq(articles.type, 'article'), eq(articles.type, 'page'))
      )
    )
    .orderBy(articles.publishedAt)
    .limit(20);
  return json(results);
};
