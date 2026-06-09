import { json } from '@sveltejs/kit';
import { db } from '$lib/db/index';
import { articleReadCompletions } from '$lib/db/schema';
import type { RequestHandler } from './$types';

const VALID_PERCENTAGES = new Set([25, 50, 75, 100]);

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
  } catch {
    // Never block the user
  }

  return json({ ok: true });
};
