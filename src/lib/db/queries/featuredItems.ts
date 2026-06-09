import { eq, asc } from 'drizzle-orm';
import { db } from '../index';
import { featuredItems, articles } from '../schema';

export async function getFeaturedItems() {
  return db
    .select({
      id: featuredItems.id,
      position: featuredItems.position,
      article: {
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        coverImage: articles.coverImage,
        publishedAt: articles.publishedAt,
        type: articles.type,
        status: articles.status,
      },
    })
    .from(featuredItems)
    .innerJoin(articles, eq(featuredItems.articleId, articles.id))
    .orderBy(asc(featuredItems.position));
}

export async function countFeaturedItems() {
  const result = await db.select({ id: featuredItems.id }).from(featuredItems);
  return result.length;
}

export async function addFeaturedItem(articleId: string) {
  const count = await countFeaturedItems();
  if (count >= 3) throw new Error('MAX_FEATURED');

  const result = await db
    .insert(featuredItems)
    .values({ articleId, position: count })
    .returning();
  return result[0];
}

export async function removeFeaturedItem(id: string) {
  await db.delete(featuredItems).where(eq(featuredItems.id, id));
}

export async function reorderFeaturedItems(items: { id: string; position: number }[]) {
  await db.transaction(async (tx) => {
    for (const { id, position } of items) {
      await tx.update(featuredItems).set({ position }).where(eq(featuredItems.id, id));
    }
  });
}
