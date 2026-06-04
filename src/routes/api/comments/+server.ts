import { json, error } from '@sveltejs/kit';
import { createComment } from '$lib/db/queries/comments';
import { getArticleById } from '$lib/db/queries/articles';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.articleId !== 'string' || typeof body.content !== 'string') {
    error(400, 'Dati non validi');
  }

  if (!body.content.trim()) {
    error(400, 'Il commento non può essere vuoto');
  }

  const article = await getArticleById(body.articleId);
  if (!article || !article.published) {
    error(404, 'Articolo non trovato');
  }

  const comment = await createComment({
    articleId: body.articleId,
    content: body.content.trim(),
    authorName: typeof body.authorName === 'string' && body.authorName.trim() ? body.authorName.trim() : undefined,
    authorEmail: typeof body.authorEmail === 'string' && body.authorEmail.trim() ? body.authorEmail.trim() : undefined,
  });

  return json({ ok: true, id: comment.id }, { status: 201 });
};
