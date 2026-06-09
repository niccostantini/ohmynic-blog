import { verifyReaderEmail } from '$lib/db/queries/readers';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token');
  if (!token) return { success: false, message: 'Link non valido.' };

  const reader = await verifyReaderEmail(token);
  if (!reader) return { success: false, message: 'Link non valido o già utilizzato.' };

  return { success: true };
};
