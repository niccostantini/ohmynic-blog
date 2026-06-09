import { error } from '@sveltejs/kit';
import { getArticlesByTag, getTagsForArticle } from '$lib/db/queries/articles';
import { getTagBySlug, getTagsWithCount } from '$lib/db/queries/tags';
import { db } from '$lib/db/index';
import { articles as articlesTable, articleTags, tags as tagsTable } from '$lib/db/schema';
import { eq, and, sql, lte, or, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const tag = await getTagBySlug(params.tag);
  if (!tag) error(404, 'Tag non trovato');

  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  const [rawArticles, countResult, allTags] = await Promise.all([
    getArticlesByTag(params.tag, page, 10),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articlesTable)
      .innerJoin(articleTags, eq(articleTags.articleId, articlesTable.id))
      .innerJoin(tagsTable, eq(tagsTable.id, articleTags.tagId))
      .where(and(
        eq(tagsTable.slug, params.tag),
        eq(articlesTable.status, 'published'),
        or(isNull(articlesTable.publishedAt), lte(articlesTable.publishedAt, new Date()))
      )),
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
