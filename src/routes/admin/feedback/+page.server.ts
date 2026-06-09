import { error, fail } from '@sveltejs/kit';
import { getAllFeedback, setFeedbackStatus } from '$lib/db/queries/feedback';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user?.role !== 'admin') error(403, 'Accesso negato');
  const items = await getAllFeedback();
  return { items };
};

export const actions: Actions = {
  setStatus: async ({ request, locals }) => {
    if (locals.user?.role !== 'admin') return fail(403);
    const data = await request.formData();
    const id = data.get('id');
    const status = data.get('status');
    if (typeof id !== 'string' || typeof status !== 'string') return fail(400);
    const valid = ['new', 'read', 'in_progress', 'done', 'wontfix'];
    if (!valid.includes(status)) return fail(400);
    await setFeedbackStatus(id, status as any);
    return { ok: true };
  },
};
