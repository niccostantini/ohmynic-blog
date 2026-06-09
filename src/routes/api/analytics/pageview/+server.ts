import { json } from '@sveltejs/kit';
import { db } from '$lib/db/index';
import { pageViews } from '$lib/db/schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Rispetta Do Not Track
    if (request.headers.get('dnt') === '1') {
      return json({ ok: true });
    }

    const { path, articleId, referrer, sessionId } = await request.json();

    if (!path || !sessionId) return json({ ok: true });

    // Non tracciare route admin
    if (String(path).startsWith('/blog/admin')) return json({ ok: true });

    const country = request.headers.get('cf-ipcountry') ?? null;
    const userAgent = request.headers.get('user-agent')?.slice(0, 512) ?? null;

    await db.insert(pageViews).values({
      path: String(path).slice(0, 512),
      articleId: articleId ?? null,
      referrer: referrer ? String(referrer).slice(0, 512) : null,
      sessionId: String(sessionId).slice(0, 64),
      country,
      userAgent,
      readerId: locals.reader?.id ?? null,
    });
  } catch {
    // Mai bloccare l'utente per un errore di analytics
  }

  return json({ ok: true });
};
