import { error, fail } from '@sveltejs/kit';
import { getAllPollsWithArticles, togglePollClosed } from '$lib/db/queries/polls';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) error(401, 'Non autenticato');
  const pollsList = await getAllPollsWithArticles();
  return { pollsList };
};

export const actions: Actions = {
  toggle: async ({ request, locals }) => {
    if (!locals.user) error(401, 'Non autenticato');
    const data = await request.formData();
    const pollId = data.get('pollId');
    const closed = data.get('closed') === 'true';
    if (typeof pollId !== 'string' || !pollId) return fail(400, { error: 'pollId mancante' });
    await togglePollClosed(pollId, closed);
    return { ok: true };
  },
};
