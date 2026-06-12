import { json, error } from '@sveltejs/kit';
import { getPollById, castVote } from '$lib/db/queries/polls';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, locals }) => {
  if (!locals.reader) {
    error(401, 'Devi effettuare il login per votare');
  }

  const body = await request.json().catch(() => null);

  if (!body || !Array.isArray(body.optionIds) || body.optionIds.length === 0) {
    error(400, 'Seleziona almeno un\'opzione');
  }

  const poll = await getPollById(params.pollId);
  if (!poll) error(404, 'Sondaggio non trovato');
  if (poll.closed) error(403, 'La votazione è chiusa');

  if (!poll.allowMultiple && body.optionIds.length > 1) {
    error(400, 'Puoi selezionare una sola opzione');
  }

  await castVote(params.pollId, body.optionIds as string[], locals.reader.id);

  return json({ ok: true });
};
