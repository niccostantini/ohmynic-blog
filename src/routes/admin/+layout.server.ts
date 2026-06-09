import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { countNewFeedback } from '$lib/db/queries/feedback';
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

  return { user: locals.user, newFeedbackCount };
};
