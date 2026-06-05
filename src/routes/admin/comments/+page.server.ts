import { fail } from '@sveltejs/kit';
import {
  getAllCommentsWithArticle,
  approveComment,
  deleteComment,
} from '$lib/db/queries/comments';
import { getArticleById } from '$lib/db/queries/articles';
import { sendCommentReply } from '$lib/email';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const comments = await getAllCommentsWithArticle();
  return { comments };
};

export const actions: Actions = {
  approve: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id');
    if (typeof id !== 'string') return fail(400);
    await approveComment(id);
    return { success: true };
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id');
    if (typeof id !== 'string') return fail(400);
    await deleteComment(id);
    return { success: true };
  },

  reply: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id');
    const replyText = data.get('replyText');

    if (typeof id !== 'string' || typeof replyText !== 'string' || !replyText.trim()) {
      return fail(400, { replyError: 'Testo risposta mancante.', replyId: id });
    }

    // Load comment to get email + article info
    const all = await getAllCommentsWithArticle();
    const comment = all.find((c) => c.id === id);
    if (!comment) return fail(404, { replyError: 'Commento non trovato.', replyId: id });
    if (!comment.authorEmail) return fail(400, { replyError: 'Il commentatore non ha fornito un\'email.', replyId: id });

    sendCommentReply({
      to: comment.authorEmail,
      articleTitle: comment.articleTitle,
      articleSlug: comment.articleSlug,
      replyText: replyText.trim(),
    });

    return { replySent: true, replyId: id };
  },
};
