import { json } from '@sveltejs/kit';
import { getVisibleNavItems } from '$lib/db/queries/navItems';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const items = await getVisibleNavItems();
  return json(items);
};
