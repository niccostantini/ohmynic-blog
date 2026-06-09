import { json } from '@sveltejs/kit';
import { getFeaturedItems } from '$lib/db/queries/featuredItems';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const items = await getFeaturedItems();
  return json(items);
};
