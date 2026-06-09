import { lucia } from '$lib/auth';
import { validateReaderSession } from '$lib/db/queries/readers';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // ── Admin session (Lucia) ──────────────────────────────────────────────────
  const sessionId = event.cookies.get(lucia.sessionCookieName);

  if (!sessionId) {
    event.locals.user = null;
    event.locals.session = null;
  } else {
    const { session, user } = await lucia.validateSession(sessionId);

    if (session?.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      event.cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '/',
        ...sessionCookie.attributes,
      });
    }
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      event.cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '/',
        ...sessionCookie.attributes,
      });
    }

    event.locals.user = user;
    event.locals.session = session;
  }

  // ── Reader session (manuale) ───────────────────────────────────────────────
  const readerSessionId = event.cookies.get('reader_session');
  event.locals.reader = null;
  event.locals.readerSessionId = null;

  if (readerSessionId) {
    const reader = await validateReaderSession(readerSessionId);
    if (reader) {
      event.locals.reader = {
        id: reader.id,
        email: reader.email,
        displayName: reader.displayName,
        emailVerified: reader.emailVerified,
        active: reader.active,
        country: reader.country,
        city: reader.city,
        website: reader.website,
        twitter: reader.twitter,
        linkedin: reader.linkedin,
        instagram: reader.instagram,
      };
      event.locals.readerSessionId = readerSessionId;
    } else {
      // sessione scaduta o invalida → cancella il cookie
      event.cookies.delete('reader_session', { path: '/' });
    }
  }

  return resolve(event);
};
