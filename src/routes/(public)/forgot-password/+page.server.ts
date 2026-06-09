import { fail } from '@sveltejs/kit';
import { getReaderByEmail, setReaderResetToken } from '$lib/db/queries/readers';
import { sendReaderPasswordReset } from '$lib/email';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
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
    const reader = await getReaderByEmail(email.trim().toLowerCase());

    if (reader && reader.emailVerified) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await setReaderResetToken(email.trim().toLowerCase(), token, expiresAt);
      sendReaderPasswordReset({
        to: reader.email,
        displayName: reader.displayName,
        token,
      });
    }

    return { sent: true };
  },
};
