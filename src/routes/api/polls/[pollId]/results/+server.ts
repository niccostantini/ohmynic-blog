import { json, error } from '@sveltejs/kit';
import { getPollById, getPollResults, getVoterOptions } from '$lib/db/queries/polls';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  const poll = await getPollById(params.pollId);
  if (!poll) error(404, 'Sondaggio non trovato');

  const [results, userVotedOptionIds] = await Promise.all([
    getPollResults(params.pollId),
    locals.reader ? getVoterOptions(params.pollId, locals.reader.id) : Promise.resolve([]),
  ]);

  return json({ ...results, userVotedOptionIds });
};
