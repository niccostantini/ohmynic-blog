import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { countNewFeedback } from '$lib/db/queries/feedback';
import { getVisibleNavItems } from '$lib/db/queries/navItems';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    redirect(302, `${base}/admin-login`);
  }

  // Forza cambio password prima di qualsiasi altra pagina admin
  const isChangePwd = url.pathname.endsWith('/admin/change-password');
  if (locals.user.mustChangePassword && !isChangePwd) {
    redirect(302, `${base}/admin/change-password`);
  }

  const newFeedbackCount = locals.user.role === 'admin' ? await countNewFeedback() : 0;

  // Carica i navItems pubblici con le stesse regole di visibilità del layout pubblico
  const role = locals.user.role;
  const allNavItems = await getVisibleNavItems();
  const navItems = allNavItems
    .filter(item => {
      if (!item.pageId || !item.pageVisibleTo) return true;
      if (item.pageVisibleTo.includes('public')) return true;
      if (role === 'admin') return true;
      return item.pageVisibleTo.includes(role);
    })
    .map(({ pageVisibleTo: _, ...item }) => item);

  return { user: locals.user, newFeedbackCount, navItems };
};
