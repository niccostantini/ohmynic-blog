import { error } from '@sveltejs/kit';
import { getArticlesByTag, getTagsForArticle } from '$lib/db/queries/articles';
import { getTagBySlug, getTagsWithCount } from '$lib/db/queries/tags';
import { db } from '$lib/db/index';
import {
  articles as articlesTable,
  articleTags,
  tags as tagsTable,
  articleTranslations,
} from '$lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { detectLocale } from '$lib/translate';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, request }) => {
  const tag = await getTagBySlug(params.tag);
  if (!tag) error(404, 'Tag non trovato');

  const locale = detectLocale(url, request.headers.get('accept-language') ?? '');
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  const [rawArticles, countResult, allTags] = await Promise.all([
    getArticlesByTag(params.tag, page, 10, locale),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articlesTable)
      .innerJoin(articleTags, eq(articleTags.articleId, articlesTable.id))
      .innerJoin(tagsTable, eq(tagsTable.id, articleTags.tagId))
      .innerJoin(
        articleTranslations,
        and(
          eq(articleTranslations.articleId, articlesTable.id),
          eq(articleTranslations.locale, locale),
          eq(articleTranslations.published, true),
        ),
      )
      .where(eq(tagsTable.slug, params.tag)),
    getTagsWithCount(),
  ]);

  const articlesWithTags = await Promise.all(
    rawArticles.map(async (article) => ({
      article,
      tags: await getTagsForArticle(article.id),
    }))
  );

  return {
    tag,
    articles: articlesWithTags,
    total: Number(countResult[0].count),
    page,
    allTags,
  };
};
