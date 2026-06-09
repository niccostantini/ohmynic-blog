import { json, error } from '@sveltejs/kit';
import { deleteEditorialComment } from '$lib/db/queries/editorial-comments';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) error(401, 'Non autorizzato');

  const result = await deleteEditorialComment(params.id, user.id, user.role);
  if (!result.ok) {
    if (result.error === 'not_found') error(404, 'Commento non trovato');
    if (result.error === 'forbidden') error(403, 'Non autorizzato');
  }

  return json({ ok: true });
};
