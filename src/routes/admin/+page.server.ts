import type { PageServerLoad } from './$types';
import { getAllArticlesAdmin } from '$lib/db/queries/articles';
import { getPendingComments } from '$lib/db/queries/comments';

export const load: PageServerLoad = async ({ locals }) => {
  const [articles, pending] = await Promise.all([
    getAllArticlesAdmin(),
    getPendingComments(),
  ]);
  return {
    user: locals.user!,
    articles,
    pendingCount: pending.length,
  };
};
