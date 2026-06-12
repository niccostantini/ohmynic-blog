import { json } from '@sveltejs/kit';
import { db } from '$lib/db/index';
import { articleReadCompletions } from '$lib/db/schema';
import { lt } from 'drizzle-orm';
import type { RequestHandler } from './$types';

const VALID_PERCENTAGES = new Set([25, 50, 75, 100]);
const RETENTION_MONTHS = 13;

async function pruneOldCompletions() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  await db.delete(articleReadCompletions).where(lt(articleReadCompletions.createdAt, cutoff));
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    if (request.headers.get('dnt') === '1') {
      return json({ ok: true });
    }

    const { articleId, sessionId, percentage } = await request.json();

    if (!articleId || !sessionId || !VALID_PERCENTAGES.has(Number(percentage))) {
      return json({ ok: true });
    }

    await db.insert(articleReadCompletions).values({
      articleId: String(articleId),
      sessionId: String(sessionId).slice(0, 64),
      percentage: Number(percentage),
    });

    // Probabilistic retention cleanup (~1% of requests)
    if (Math.random() < 0.01) {
      pruneOldCompletions().catch(() => {});
    }
  } catch {
    // Never block the user
  }

  return json({ ok: true });
};
