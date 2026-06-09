import { json, error } from '@sveltejs/kit';
import { getFeaturedItems, addFeaturedItem } from '$lib/db/queries/featuredItems';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) error(401);
  const items = await getFeaturedItems();
  return json(items);
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (locals.user?.role !== 'admin') error(403);
  const { articleId } = await request.json() as { articleId: string };
  if (!articleId) error(400, 'articleId obbligatorio');
  try {
    const item = await addFeaturedItem(articleId);
    return json(item, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'MAX_FEATURED') {
      error(409, 'Massimo 3 articoli in evidenza');
    }
    throw e;
  }
};
