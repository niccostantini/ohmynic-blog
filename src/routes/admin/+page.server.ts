import type { PageServerLoad } from './$types';
import { getAllArticlesAdmin } from '$lib/db/queries/articles';
import { getPendingComments } from '$lib/db/queries/comments';

type ArticleStatus = 'draft' | 'review' | 'approved' | 'published';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user!;
  const authorId = user.role === 'contributor' ? user.id : undefined;
  const statusFilter = url.searchParams.get('status') as ArticleStatus | null;
  const validStatuses: ArticleStatus[] = ['draft', 'review', 'approved', 'published'];
  const status = statusFilter && validStatuses.includes(statusFilter) ? statusFilter : undefined;

  const [articles, pending] = await Promise.all([
    getAllArticlesAdmin(authorId, status),
    user.role !== 'contributor' ? getPendingComments() : Promise.resolve([]),
  ]);

  return {
    user,
    articles,
    pendingCount: pending.length,
    statusFilter: status ?? null,
  };
};
