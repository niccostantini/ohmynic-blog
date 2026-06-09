import { error } from '@sveltejs/kit';
import { getAllPagesAdmin } from '$lib/db/queries/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user?.role !== 'admin') error(403, 'Accesso negato');
  const pages = await getAllPagesAdmin();
  return { pages };
};
