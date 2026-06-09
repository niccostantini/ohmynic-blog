import { fail, redirect } from '@sveltejs/kit';
import { hash } from 'argon2';
import { base } from '$app/paths';
import { createReader, getReaderByEmail } from '$lib/db/queries/readers';
import { sendVerificationEmail } from '$lib/email';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.reader) redirect(302, `${base}/`);
  return {};
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const displayName = data.get('displayName');
    const email = data.get('email');
    const password = data.get('password');
    const confirm = data.get('confirm');
    const privacy = data.get('privacy');

    if (typeof displayName !== 'string' || !displayName.trim())
      return fail(400, { error: 'Il nome è obbligatorio.' });
    if (typeof email !== 'string' || !email.trim())
      return fail(400, { error: "L'email è obbligatoria." });
    if (typeof password !== 'string' || password.length < 12)
      return fail(400, { error: 'La password deve essere di almeno 12 caratteri.' });
    if (password !== confirm)
      return fail(400, { error: 'Le password non coincidono.' });
    if (!privacy)
      return fail(400, { error: 'Devi accettare la privacy policy.' });

    const cleanEmail = email.trim().toLowerCase();
    const existing = await getReaderByEmail(cleanEmail);
    if (existing) return fail(400, { error: 'Email già registrata.' });

    const passwordHash = await hash(password);
    const verificationToken = crypto.randomUUID();

    await createReader({
      email: cleanEmail,
      displayName: displayName.trim(),
      passwordHash,
      verificationToken,
    });

    sendVerificationEmail({
      to: cleanEmail,
      displayName: displayName.trim(),
      token: verificationToken,
    });

    return { sent: true };
  },
};
