import { fail, redirect } from '@sveltejs/kit';
import { verify } from 'argon2';
import { base } from '$app/paths';
import { getReaderByEmail, createReaderSession } from '$lib/db/queries/readers';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.reader) redirect(302, `${base}/`);
  return {
    passwordReset: url.searchParams.get('reset') === '1',
    redirectTo: url.searchParams.get('redirect'),
  };
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');

    if (typeof email !== 'string' || !email.trim())
      return fail(400, { error: "L'email è obbligatoria.", email: '', fieldError: 'email' as const });
    if (typeof password !== 'string' || !password)
      return fail(400, { error: 'La password è obbligatoria.', email: '', fieldError: 'password' as const });

    const cleanEmail = email.trim().toLowerCase();
    const reader = await getReaderByEmail(cleanEmail);

    if (!reader) {
      return fail(400, { error: 'Email o password non corretti.', email: cleanEmail, fieldError: 'both' as const });
    }

    let valid = false;
    try {
      valid = await verify(reader.passwordHash, password);
    } catch {
      return fail(500, { error: 'Errore durante il login. Riprova.', email: cleanEmail, fieldError: 'both' as const });
    }

    if (!valid) {
      return fail(400, { error: 'Email o password non corretti.', email: cleanEmail, fieldError: 'both' as const });
    }

    if (!reader.emailVerified) {
      return fail(400, {
        error: 'Verifica la tua email prima di accedere. Controlla la posta in arrivo.',
        email: cleanEmail,
        notVerified: true,
        fieldError: 'none' as const,
      });
    }

    const sessionId = await createReaderSession(reader.id);
    cookies.set('reader_session', sessionId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    const redirectTo = url.searchParams.get('redirect') ?? `${base}/`;
    redirect(302, redirectTo);
  },
};
