import { json, error } from '@sveltejs/kit';
import { getAllNavItems, updateNavItem, deleteNavItem } from '$lib/db/queries/navItems';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  if (locals.user?.role !== 'admin') error(403);
  const body = await request.json() as Parameters<typeof updateNavItem>[1];
  const item = await updateNavItem(params.id, body);
  if (!item) error(404);
  return json(item);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (locals.user?.role !== 'admin') error(403);
  const all = await getAllNavItems();
  const item = all.find((i) => i.id === params.id);
  if (!item) error(404);
  if (item.type === 'fixed') error(403, 'Le voci fisse non possono essere eliminate');
  await deleteNavItem(params.id);
  return json({ ok: true });
};
