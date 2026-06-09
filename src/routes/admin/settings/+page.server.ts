import { getAllNavItems } from '$lib/db/queries/navItems';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const navItems = locals.user?.role === 'admin' ? await getAllNavItems() : [];
  return { user: locals.user!, navItems };
};
