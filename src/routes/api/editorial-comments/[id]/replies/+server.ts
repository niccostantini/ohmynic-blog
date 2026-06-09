import { json, error } from '@sveltejs/kit';
import { createEditorialComment } from '$lib/db/queries/editorial-comments';
import { getArticleById } from '$lib/db/queries/articles';
import { getUserById } from '$lib/db/queries/users';
import { notifyEditorialCommentReply } from '$lib/email';
import { db } from '$lib/db/index';
import { editorialComments } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals, request }) => {
  const user = locals.user;
  if (!user) error(401, 'Non autorizzato');
  if (user.role === 'contributor') error(403, 'Solo editor e admin possono rispondere');

  const body = await request.json();
  const content = (body.content ?? '').trim();
  if (!content) error(400, 'Il contenuto è obbligatorio');

  const parent = await db
    .select()
    .from(editorialComments)
    .where(eq(editorialComments.id, params.id))
    .limit(1);
  if (!parent.length) error(404, 'Commento non trovato');
  const parentComment = parent[0];

  if (parentComment.parentId) error(400, 'Non puoi rispondere ad una risposta');

  const { id } = await createEditorialComment({
    articleId: parentComment.articleId,
    authorId: user.id,
    content,
    parentId: params.id,
  });

  // Fire-and-forget: notify original comment author (not self)
  const replierName = user.displayName ?? user.username;
  if (parentComment.authorId !== user.id) {
    getUserById(parentComment.authorId).then((originalAuthor) => {
      if (!originalAuthor?.email) return;
      getArticleById(parentComment.articleId).then((a) => {
        if (!a) return;
        notifyEditorialCommentReply({
          to: originalAuthor.email!,
          recipientName: originalAuthor.displayName ?? originalAuthor.username,
          articleTitle: a.title,
          articleId: a.id,
          replierName,
          originalContent: parentComment.content,
          replyContent: content,
        });
      });
    }).catch(() => {});
  }

  return json({ id }, { status: 201 });
};
