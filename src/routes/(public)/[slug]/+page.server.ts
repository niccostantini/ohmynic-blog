import { error, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import {
  getArticleBySlugWithAuthor,
  getArticleBySlugForPreview,
  getTagsForArticle,
  getRelatedArticles,
  readingTime,
} from '$lib/db/queries/articles';
import { getApprovedComments } from '$lib/db/queries/comments';
import { isBookmarked } from '$lib/db/queries/readers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const previewToken = url.searchParams.get('preview');

  const result = previewToken
    ? await getArticleBySlugForPreview(params.slug, previewToken)
    : await getArticleBySlugWithAuthor(params.slug);

  if (!result) error(404, 'Articolo non trovato');

  const { article, author } = result;

  // Visibility guard: fail-closed — null/empty visibleTo means private
  if (!previewToken) {
    const visibleTo: string[] = article.visibleTo?.length ? article.visibleTo : [];
    if (!visibleTo.includes('public')) {
      const user = locals.user;
      const reader = locals.reader;

      if (!user && !reader) {
        // Unauthenticated — send to login
        redirect(302, `${base}/login?redirect=${encodeURIComponent(`${base}/${params.slug}`)}`);
      }

      // Authenticated but wrong role — 403 (avoid redirect loop for logged-in readers)
      const role = user?.role ?? 'reader';
      if (role !== 'admin' && !visibleTo.includes(role)) {
        error(403, 'Accesso negato');
      }
    }
  }

  // Calculate reading time on the fly if not yet stored
  const readingTimeMinutes = article.readingTimeMinutes ?? readingTime(article.content);

  const [tags, comments, relatedRaw, bookmarked] = await Promise.all([
    getTagsForArticle(article.id),
    getApprovedComments(article.id),
    previewToken ? Promise.resolve([]) : getRelatedArticles(article.id),
    locals.reader ? isBookmarked(locals.reader.id, article.id) : Promise.resolve(false),
  ]);

  const related = previewToken ? [] : await Promise.all(
    relatedRaw.map(async ({ article: rel }) => ({
      article: rel,
      tags: await getTagsForArticle(rel.id),
    }))
  );

  return {
    article: { ...article, readingTimeMinutes },
    author,
    tags,
    comments,
    related,
    bookmarked,
    isPreview: !!previewToken,
  };
};
