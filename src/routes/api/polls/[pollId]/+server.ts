import { json, error } from '@sveltejs/kit';
import { getPollWithOptions } from '$lib/db/queries/polls';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Non autorizzato');
  const poll = await getPollWithOptions(params.pollId);
  if (!poll) error(404, 'Sondaggio non trovato');
  return json(poll);
};
