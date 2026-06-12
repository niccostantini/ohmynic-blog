import { json } from '@sveltejs/kit';
import { db } from '$lib/db/index';
import { pageViews } from '$lib/db/schema';
import { lt } from 'drizzle-orm';
import type { RequestHandler } from './$types';

const RETENTION_MONTHS = 13;

async function pruneOldPageviews() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  await db.delete(pageViews).where(lt(pageViews.createdAt, cutoff));
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    if (request.headers.get('dnt') === '1') {
      return json({ ok: true });
    }

    const { path, articleId, referrer, sessionId } = await request.json();

    if (!path || !sessionId) return json({ ok: true });

    if (String(path).startsWith('/blog/admin')) return json({ ok: true });

    const country = request.headers.get('cf-ipcountry') ?? null;

    await db.insert(pageViews).values({
      path: String(path).slice(0, 512),
      articleId: articleId ?? null,
      referrer: referrer ? String(referrer).slice(0, 512) : null,
      sessionId: String(sessionId).slice(0, 64),
      country,
      userAgent: null,
      readerId: locals.reader?.id ?? null,
    });

    // Probabilistic retention cleanup (~1% of requests)
    if (Math.random() < 0.01) {
      pruneOldPageviews().catch(() => {});
    }
  } catch {
    // Mai bloccare l'utente per un errore di analytics
  }

  return json({ ok: true });
};
