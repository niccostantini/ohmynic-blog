import { json, error } from '@sveltejs/kit';
import { createFeedback } from '$lib/db/queries/feedback';
import { notifyNewFeedback } from '$lib/email';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json().catch(() => null);
  if (!body) error(400, 'Invalid JSON');

  const { type, title, description, url } = body;

  if (!['bug', 'suggestion', 'other'].includes(type))
    error(400, 'Tipo non valido');
  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 100)
    error(400, 'Titolo non valido');
  if (typeof description !== 'string' || description.trim().length < 20)
    error(400, 'Descrizione troppo breve (min 20 caratteri)');
  if (description.length > 2000)
    error(400, 'Descrizione troppo lunga (max 2000 caratteri)');

  const authorId = locals.user?.id ?? null;
  const readerId = locals.reader?.id ?? null;

  const entry = await createFeedback({
    type,
    title: title.trim(),
    description: description.trim(),
    url: typeof url === 'string' && url.trim() ? url.trim() : null,
    authorId,
    readerId,
  });

  const authorName = locals.user?.displayName ?? locals.reader?.displayName ?? null;

  notifyNewFeedback({ type, title: title.trim(), description: description.trim(), url, authorName });

  return json({ ok: true, id: entry.id });
};
