import { fail, redirect } from '@sveltejs/kit';
import { verify } from 'argon2';
import { lucia } from '$lib/auth';
import { db } from '$lib/db/index';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { base } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) redirect(302, `${base}/admin`);
  return { passwordReset: url.searchParams.get('reset') === '1' };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');

    if (typeof username !== 'string' || typeof password !== 'string') {
      return fail(400, { error: 'Dati non validi.', username: '' });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user) {
      return fail(400, { error: 'Username o password errati.', username });
    }

    const validPassword = await verify(user.passwordHash, password);
    if (!validPassword) {
      return fail(400, { error: 'Username o password errati.', username });
    }

    if (!user.active) {
      return fail(403, { error: 'Account disattivato. Contatta un amministratore.', username });
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '/',
      ...sessionCookie.attributes,
    });

    redirect(302, `${base}/admin`);
  },
};
