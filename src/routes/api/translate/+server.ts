import { json, error } from '@sveltejs/kit';
import { getArticleTranslation } from '$lib/db/queries/articles';
import { translateText, translateHtml } from '$lib/translate';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401, 'Non autorizzato');

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.articleId !== 'string' ||
    typeof body.fromLocale !== 'string' ||
    typeof body.toLocale !== 'string'
  ) {
    error(400, 'Parametri non validi');
  }

  const source = await getArticleTranslation(body.articleId, body.fromLocale);
  if (!source) error(404, 'Traduzione sorgente non trovata');

  const [title, content, excerpt] = await Promise.all([
    translateText(source.title, body.fromLocale, body.toLocale),
    translateHtml(source.content, body.fromLocale, body.toLocale),
    source.excerpt ? translateText(source.excerpt, body.fromLocale, body.toLocale) : Promise.resolve(null),
  ]);

  return json({ title, content, excerpt });
};
