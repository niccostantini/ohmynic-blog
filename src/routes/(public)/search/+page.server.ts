import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import {
  searchArticles,
  countSearchResults,
  sanitizeSearchQuery,
  getTagsForArticle,
} from '$lib/db/queries/articles';
import { getTagsWithCount } from '$lib/db/queries/tags';
import type { PageServerLoad } from './$types';

const PER_PAGE = 12;

export const load: PageServerLoad = async ({ url }) => {
  const raw = url.searchParams.get('q') ?? '';
  const query = sanitizeSearchQuery(raw);
  if (!query) redirect(302, `${base}/`);

  const tagsParam = url.searchParams.get('tags') ?? '';
  const activeTags = tagsParam
    ? tagsParam.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  const [rawResults, total, allTags] = await Promise.all([
    searchArticles(query, { tagSlugs: activeTags, page, perPage: PER_PAGE }),
    countSearchResults(query, activeTags),
    getTagsWithCount(),
  ]);

  const results = await Promise.all(
    rawResults.map(async (article) => ({
      article,
      tags: await getTagsForArticle(article.id),
    }))
  );

  return {
    query,
    results,
    total,
    page,
    perPage: PER_PAGE,
    activeTags,
    allTags,
  };
};
