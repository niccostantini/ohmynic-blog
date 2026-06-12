import { json, error } from '@sveltejs/kit';
import { getAllPollsWithArticles } from '$lib/db/queries/polls';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) error(401, 'Non autorizzato');
  const polls = await getAllPollsWithArticles();
  return json(polls);
};
