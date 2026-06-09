import { getPublishedArticles, countPublishedArticles, getTagsForArticle } from '$lib/db/queries/articles';
import { getTagsWithCount } from '$lib/db/queries/tags';
import { getFeaturedItems } from '$lib/db/queries/featuredItems';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  const [rawArticles, total, tags, featuredRaw] = await Promise.all([
    getPublishedArticles(page, 10),
    countPublishedArticles(),
    getTagsWithCount(),
    getFeaturedItems(),
  ]);

  const [articles, featured] = await Promise.all([
    Promise.all(rawArticles.map(async (article) => ({
      article,
      tags: await getTagsForArticle(article.id),
    }))),
    Promise.all(featuredRaw.map(async (item) => ({
      ...item,
      tags: item.article.type === 'article' ? await getTagsForArticle(item.article.id) : [],
    }))),
  ]);

  return { articles, total, page, tags, featured };
};
