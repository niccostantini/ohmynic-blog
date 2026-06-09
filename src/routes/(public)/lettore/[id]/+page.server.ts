import { error } from '@sveltejs/kit';
import { getPublicReaderProfile } from '$lib/db/queries/readers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const profile = await getPublicReaderProfile(params.id);
  if (!profile || !profile.active) error(404, 'Profilo non trovato');
  return { profile };
};
