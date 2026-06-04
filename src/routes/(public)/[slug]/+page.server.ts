import { error } from '@sveltejs/kit';
import { getArticleBySlug, getTagsForArticle } from '$lib/db/queries/articles';
import { getApprovedComments } from '$lib/db/queries/comments';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const article = await getArticleBySlug(params.slug);
  if (!article) error(404, 'Articolo non trovato');

  const [tags, comments] = await Promise.all([
    getTagsForArticle(article.id),
    getApprovedComments(article.id),
  ]);

  return { article, tags, comments };
};
