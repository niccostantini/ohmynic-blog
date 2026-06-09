import { fail } from '@sveltejs/kit';
import { getUserByEmail, setUserResetToken } from '$lib/db/queries/users';
import { sendAdminPasswordReset } from '$lib/email';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Already logged in — no need to reset
  return {};
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');

    if (typeof email !== 'string' || !email.trim()) {
      return fail(400, { error: "L'email è obbligatoria." });
    }

    // Always show success message to prevent user enumeration
    const user = await getUserByEmail(email.trim().toLowerCase());

    if (user && user.active) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await setUserResetToken(email.trim().toLowerCase(), token, expiresAt);
      sendAdminPasswordReset({
        to: user.email!,
        displayName: user.displayName ?? user.username,
        token,
      });
    }

    return { sent: true };
  },
};
