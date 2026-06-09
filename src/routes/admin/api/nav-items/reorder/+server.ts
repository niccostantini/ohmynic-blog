import { json, error } from '@sveltejs/kit';
import { reorderNavItems } from '$lib/db/queries/navItems';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
  if (locals.user?.role !== 'admin') error(403);
  const body = await request.json();
  if (!Array.isArray(body)) error(400, 'Array richiesto');
  await reorderNavItems(body as { id: string; position: number }[]);
  return json({ ok: true });
};
