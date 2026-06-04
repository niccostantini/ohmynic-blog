import { lucia } from '$lib/auth';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies }) => {
  if (!locals.session) {
    redirect(302, '/login');
  }

  await lucia.invalidateSession(locals.session.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  cookies.set(sessionCookie.name, sessionCookie.value, {
    path: '/',
    ...sessionCookie.attributes,
  });

  redirect(302, '/login');
};
