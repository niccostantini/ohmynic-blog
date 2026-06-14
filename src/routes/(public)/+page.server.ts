import { getAllPublishedArticles, getTagsForArticle } from '$lib/db/queries/articles';
import { getTagsWithCount } from '$lib/db/queries/tags';
import { getFeaturedItems } from '$lib/db/queries/featuredItems';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [rawArticles, tags, featuredRaw] = await Promise.all([
    getAllPublishedArticles(),
    getTagsWithCount(),
    getFeaturedItems(),
  ]);

  const [featured, articles] = await Promise.all([
    Promise.all(featuredRaw.map(async (item) => ({
      ...item,
      tags: item.article.type === 'article' ? await getTagsForArticle(item.article.id) : [],
    }))),
    Promise.all(rawArticles.map(async (article) => ({
      article,
      tags: await getTagsForArticle(article.id),
    }))),
  ]);

  return { featured, articles, tags };
};
