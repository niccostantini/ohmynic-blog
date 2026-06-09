import { json, error } from '@sveltejs/kit';
import { getEditorialComments, createEditorialComment } from '$lib/db/queries/editorial-comments';
import { getArticleById } from '$lib/db/queries/articles';
import { getAllUsers } from '$lib/db/queries/users';
import { notifyNewEditorialComment } from '$lib/email';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Non autorizzato');
  const comments = await getEditorialComments(params.id);
  return json(comments);
};

export const POST: RequestHandler = async ({ params, locals, request }) => {
  const user = locals.user;
  if (!user) error(401, 'Non autorizzato');
  if (user.role === 'contributor') error(403, 'Solo editor e admin possono commentare');

  const body = await request.json();
  const content = (body.content ?? '').trim();
  if (!content) error(400, 'Il contenuto è obbligatorio');

  const article = await getArticleById(params.id);
  if (!article) error(404, 'Articolo non trovato');

  const blockId: string | null = body.blockId ?? null;
  const blockSnapshot: string | null = body.blockSnapshot ?? null;
  const blockType: string | null = body.blockType ?? null;

  const { id } = await createEditorialComment({
    articleId: params.id,
    authorId: user.id,
    content,
    blockId,
    blockSnapshot,
    blockType,
  });

  // Fire-and-forget notification
  const authorName = user.displayName ?? user.username;
  getAllUsers().then((allUsers) => {
    const targets = allUsers.filter(
      (u) =>
        u.id !== user.id &&
        u.email &&
        (u.role === 'editor' || u.role === 'admin' || u.id === article.authorId),
    );
    const recipients = targets.map((u) => ({ email: u.email, displayName: u.displayName }));
    if (recipients.length > 0) {
      notifyNewEditorialComment({
        recipients,
        articleTitle: article.title,
        articleId: params.id,
        authorName,
        commentContent: content,
        blockSnapshot,
      });
    }
  }).catch(() => {});

  return json({ id }, { status: 201 });
};
