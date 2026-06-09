import { getVisibleNavItems } from '$lib/db/queries/navItems';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const navItems = await getVisibleNavItems();
  return {
    reader: locals.reader ?? null,
    navItems,
  };
};
