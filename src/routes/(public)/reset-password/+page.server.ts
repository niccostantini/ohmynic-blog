import { fail, redirect } from '@sveltejs/kit';
import { hash } from 'argon2';
import { base } from '$app/paths';
import { getReaderByResetToken, resetReaderPassword } from '$lib/db/queries/readers';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';

  if (!token) {
    return { valid: false, token: '' };
  }

  const reader = await getReaderByResetToken(token);

  if (!reader || !reader.resetTokenExpiresAt || reader.resetTokenExpiresAt < new Date()) {
    return { valid: false, token };
  }

  return { valid: true, token };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const token = data.get('token');
    const password = data.get('password');
    const passwordConfirm = data.get('passwordConfirm');

    if (typeof token !== 'string' || !token) {
      return fail(400, { error: 'Token mancante.' });
    }

    if (typeof password !== 'string' || password.length < 12) {
      return fail(400, { error: 'La password deve essere di almeno 12 caratteri.', token });
    }

    if (password !== passwordConfirm) {
      return fail(400, { error: 'Le password non coincidono.', token });
    }

    const reader = await getReaderByResetToken(token);

    if (!reader || !reader.resetTokenExpiresAt || reader.resetTokenExpiresAt < new Date()) {
      return fail(400, { error: 'Link scaduto o non valido. Richiedi un nuovo reset.', token });
    }

    const passwordHash = await hash(password);
    await resetReaderPassword(token, passwordHash);

    redirect(302, `${base}/login?reset=1`);
  },
};
