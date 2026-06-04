import { fail } from '@sveltejs/kit';
import { getPendingComments, approveComment, deleteComment } from '$lib/db/queries/comments';
import { db } from '$lib/db/index';
import { articles } from '$lib/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [comments, allArticles] = await Promise.all([
    getPendingComments(),
    db.select({ id: articles.id, slug: articles.slug }).from(articles),
  ]);

  const articleSlugs: Record<string, string> = {};
  for (const a of allArticles) {
    articleSlugs[a.id] = a.slug;
  }

  return { comments, articleSlugs };
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
};
