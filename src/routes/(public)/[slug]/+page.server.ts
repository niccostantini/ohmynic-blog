import { error } from '@sveltejs/kit';
import { getArticleBySlug, getTagsForArticle, getRelatedArticles } from '$lib/db/queries/articles';
import { getApprovedComments } from '$lib/db/queries/comments';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const article = await getArticleBySlug(params.slug);
  if (!article) error(404, 'Articolo non trovato');

  const [tags, comments, relatedRaw] = await Promise.all([
    getTagsForArticle(article.id),
    getApprovedComments(article.id),
    getRelatedArticles(article.id),
  ]);

  const related = await Promise.all(
    relatedRaw.map(async ({ article: rel }) => ({
      article: rel,
      tags: await getTagsForArticle(rel.id),
    }))
  );

  return { article, tags, comments, related };
};
