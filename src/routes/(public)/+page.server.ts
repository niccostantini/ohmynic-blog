import { getPublishedArticles, countPublishedArticles, getTagsForArticle } from '$lib/db/queries/articles';
import { getTagsWithCount } from '$lib/db/queries/tags';
import { detectLocale } from '$lib/translate';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, request }) => {
  const locale = detectLocale(url, request.headers.get('accept-language') ?? '');
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  const [rawArticles, total, tags] = await Promise.all([
    getPublishedArticles(page, 10, locale),
    countPublishedArticles(locale),
    getTagsWithCount(),
  ]);

  const articles = await Promise.all(
    rawArticles.map(async (article) => ({
      article,
      tags: await getTagsForArticle(article.id),
    }))
  );

  return { articles, total, page, tags, locale };
};
