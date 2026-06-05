import { error } from '@sveltejs/kit';
import {
  getArticleBySlug,
  getTagsForArticle,
  getRelatedArticles,
  getArticleAvailableLocales,
} from '$lib/db/queries/articles';
import { getApprovedComments } from '$lib/db/queries/comments';
import { detectLocale } from '$lib/translate';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, request }) => {
  const locale = detectLocale(url, request.headers.get('accept-language') ?? '');
  const article = await getArticleBySlug(params.slug, locale);
  if (!article) error(404, 'Articolo non trovato');

  const [tags, comments, relatedRaw, availableLocales] = await Promise.all([
    getTagsForArticle(article.id),
    getApprovedComments(article.id),
    getRelatedArticles(article.id, 3, locale),
    getArticleAvailableLocales(article.id),
  ]);

  const related = await Promise.all(
    relatedRaw.map(async (rel) => ({
      article: rel,
      tags: await getTagsForArticle(rel.id),
    }))
  );

  return { article, tags, comments, related, locale, availableLocales };
};
