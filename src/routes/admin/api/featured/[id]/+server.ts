import { json, error } from '@sveltejs/kit';
import { removeFeaturedItem } from '$lib/db/queries/featuredItems';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (locals.user?.role !== 'admin') error(403);
  await removeFeaturedItem(params.id);
  return json({ ok: true });
};
