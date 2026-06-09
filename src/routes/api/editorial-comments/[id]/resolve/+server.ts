import { json, error } from '@sveltejs/kit';
import { resolveEditorialComment } from '$lib/db/queries/editorial-comments';
import { db } from '$lib/db/index';
import { editorialComments } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) error(401, 'Non autorizzato');
  if (user.role === 'contributor') error(403, 'Solo editor e admin possono risolvere commenti');

  const rows = await db
    .select({ id: editorialComments.id })
    .from(editorialComments)
    .where(eq(editorialComments.id, params.id))
    .limit(1);
  if (!rows.length) error(404, 'Commento non trovato');

  await resolveEditorialComment(params.id);
  return json({ ok: true });
};
