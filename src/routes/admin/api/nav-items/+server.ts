import { json, error } from '@sveltejs/kit';
import { getAllNavItems, createNavItem } from '$lib/db/queries/navItems';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) error(401);
  const items = await getAllNavItems();
  return json(items);
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.user?.role !== 'admin') error(403);
  const body = await request.json();
  const { label, url, openInNewTab } = body as { label: string; url: string; openInNewTab?: boolean };
  if (!label?.trim() || !url?.trim()) error(400, 'label e url sono obbligatori');
  const item = await createNavItem({ label: label.trim(), url: url.trim(), type: 'external', openInNewTab: openInNewTab ?? false });
  return json(item, { status: 201 });
};
