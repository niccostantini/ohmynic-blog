import { eq, desc, and, ne, inArray, sql } from 'drizzle-orm';
import { db } from '../index';
import { articles, articleTags, tags } from '../schema';

export async function getPublishedArticles(page = 1, perPage = 10) {
  const offset = (page - 1) * perPage;
  return db
    .select()
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.publishedAt))
    .limit(perPage)
    .offset(offset);
}

export async function countPublishedArticles() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.published, true));
  return Number(result[0].count);
}

export async function getArticleBySlug(slug: string) {
  const result = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.published, true)))
    .limit(1);
  return result[0] ?? null;
}

export async function getArticleById(id: string) {
  const result = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getAllArticlesAdmin() {
  return db
    .select()
    .from(articles)
    .orderBy(desc(articles.createdAt));
}

export async function createArticle(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published: boolean;
  publishedAt?: Date;
}) {
  const result = await db.insert(articles).values(data).returning();
  return result[0];
}

export async function updateArticle(id: string, data: Partial<{
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  published: boolean;
  publishedAt: Date;
  updatedAt: Date;
}>) {
  const result = await db
    .update(articles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(articles.id, id))
    .returning();
  return result[0];
}

export async function deleteArticle(id: string) {
  await db.delete(articles).where(eq(articles.id, id));
}

export async function generateSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const existing = await db
    .select({ slug: articles.slug })
    .from(articles)
    .where(sql`${articles.slug} ~ ${'^' + base + '(-[0-9]+)?$'}`);

  if (existing.length === 0) return base;

  const slugs = existing.map((r) => r.slug);
  if (!slugs.includes(base)) return base;

  let i = 2;
  while (slugs.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function getArticlesByTag(tagSlug: string, page = 1, perPage = 10) {
  const offset = (page - 1) * perPage;
  return db
    .select({ article: articles })
    .from(articles)
    .innerJoin(articleTags, eq(articleTags.articleId, articles.id))
    .innerJoin(tags, eq(tags.id, articleTags.tagId))
    .where(and(eq(tags.slug, tagSlug), eq(articles.published, true)))
    .orderBy(desc(articles.publishedAt))
    .limit(perPage)
    .offset(offset)
    .then((rows) => rows.map((r) => r.article));
}

export async function getTagsForArticle(articleId: string) {
  return db
    .select({ tag: tags })
    .from(tags)
    .innerJoin(articleTags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, articleId))
    .then((rows) => rows.map((r) => r.tag));
}

export async function getRelatedArticles(articleId: string, limit = 3) {
  const currentTags = await db
    .select({ tagId: articleTags.tagId })
    .from(articleTags)
    .where(eq(articleTags.articleId, articleId));

  if (currentTags.length === 0) return [];

  const tagIds = currentTags.map((t) => t.tagId);

  return db
    .select({
      article: articles,
      sharedCount: sql<number>`cast(count(*) as int)`.as('shared_count'),
    })
    .from(articles)
    .innerJoin(articleTags, eq(articleTags.articleId, articles.id))
    .where(
      and(
        ne(articles.id, articleId),
        eq(articles.published, true),
        inArray(articleTags.tagId, tagIds),
      )
    )
    .groupBy(articles.id)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function setArticleTags(articleId: string, tagIds: string[]) {
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
  if (tagIds.length > 0) {
    await db.insert(articleTags).values(tagIds.map((tagId) => ({ articleId, tagId })));
  }
}
