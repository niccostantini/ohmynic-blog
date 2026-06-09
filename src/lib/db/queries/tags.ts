import { eq, sql } from 'drizzle-orm';
import { db } from '../index';
import { tags, articleTags, articles } from '../schema';

export async function getAllTags() {
  return db.select().from(tags).orderBy(tags.name);
}

export async function getTagBySlug(slug: string) {
  const result = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function findOrCreateTag(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  const existing = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  if (existing[0]) return existing[0];

  const result = await db.insert(tags).values({ name, slug }).returning();
  return result[0];
}

export async function getTagsWithCount() {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      count: sql<number>`count(${articleTags.articleId})`,
    })
    .from(tags)
    .leftJoin(articleTags, eq(articleTags.tagId, tags.id))
    .leftJoin(articles, eq(articles.id, articleTags.articleId))
    .where(sql`${articles.status} = 'published' OR ${articles.id} IS NULL`)
    .groupBy(tags.id, tags.name, tags.slug)
    .orderBy(tags.name);
}
