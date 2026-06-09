import { json, error } from '@sveltejs/kit';
import { toggleBookmark } from '$lib/db/queries/readers';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.reader) error(401, 'Accesso non autorizzato');

  const body = await request.json().catch(() => null);
  if (!body || typeof body.articleId !== 'string') error(400, 'Dati non validi');

  const bookmarked = await toggleBookmark(locals.reader.id, body.articleId);
  return json({ bookmarked });
};
