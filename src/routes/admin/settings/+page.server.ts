import { getAllNavItems } from '$lib/db/queries/navItems';
import { getFeaturedItems } from '$lib/db/queries/featuredItems';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const isAdmin = locals.user?.role === 'admin';
  const [navItems, featured] = await Promise.all([
    isAdmin ? getAllNavItems() : Promise.resolve([]),
    isAdmin ? getFeaturedItems() : Promise.resolve([]),
  ]);
  return { user: locals.user!, navItems, featured };
};
