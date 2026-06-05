import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { searchArticles, sanitizeSearchQuery, getTagsForArticle } from '$lib/db/queries/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const raw = url.searchParams.get('q') ?? '';
  const query = sanitizeSearchQuery(raw);

  if (!query) redirect(302, `${base}/`);

  const rawResults = await searchArticles(query);

  const results = await Promise.all(
    rawResults.map(async (article) => ({
      article,
      tags: await getTagsForArticle(article.id),
    }))
  );

  return { query, results };
};
