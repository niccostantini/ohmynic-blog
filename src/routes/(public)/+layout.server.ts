import { getVisibleNavItems } from '$lib/db/queries/navItems';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const allNavItems = await getVisibleNavItems();

  // Determine the current user's role for visibility filtering
  const role: string | null = locals.user?.role ?? (locals.reader ? 'reader' : null);

  const navItems = allNavItems.filter(item => {
    // Links not tied to a page (external, fixed) are always visible
    if (!item.pageId || !item.pageVisibleTo) return true;
    // Page is public — visible to everyone
    if (item.pageVisibleTo.includes('public')) return true;
    // No logged-in session → hide
    if (!role) return false;
    // Admin sees everything
    if (role === 'admin') return true;
    // Check role match
    return item.pageVisibleTo.includes(role);
  });

  // Strip pageVisibleTo before sending to client (internal data)
  const clientNavItems = navItems.map(({ pageVisibleTo: _, ...item }) => item);

  return {
    reader: locals.reader ?? null,
    navItems: clientNavItems,
  };
};
