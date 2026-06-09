import { json, error } from '@sveltejs/kit';
import { createComment } from '$lib/db/queries/comments';
import { getArticleById } from '$lib/db/queries/articles';
import { notifyNewComment } from '$lib/email';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.articleId !== 'string' || typeof body.content !== 'string') {
    error(400, 'Dati non validi');
  }

  if (!body.content.trim()) {
    error(400, 'Il commento non può essere vuoto');
  }

  const article = await getArticleById(body.articleId);
  if (!article || article.status !== 'published') {
    error(404, 'Articolo non trovato');
  }

  // If the reader is logged in, use their identity; otherwise use submitted name/email
  const reader = locals.reader ?? null;
  const authorName = reader
    ? reader.displayName
    : (typeof body.authorName === 'string' && body.authorName.trim() ? body.authorName.trim() : undefined);
  const authorEmail = reader
    ? reader.email
    : (typeof body.authorEmail === 'string' && body.authorEmail.trim() ? body.authorEmail.trim() : undefined);

  const comment = await createComment({
    articleId: body.articleId,
    content: body.content.trim(),
    authorName,
    authorEmail,
    readerId: reader?.id ?? undefined,
  });

  notifyNewComment({
    articleTitle: article.title,
    articleSlug: article.slug,
    authorName: comment.authorName ?? undefined,
    authorEmail: comment.authorEmail ?? undefined,
    content: comment.content,
  });

  return json({ ok: true, id: comment.id }, { status: 201 });
};
