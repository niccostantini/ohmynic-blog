import { eq, and, desc } from 'drizzle-orm';
import { db } from '../index';
import { comments } from '../schema';

export async function getApprovedComments(articleId: string) {
  return db
    .select()
    .from(comments)
    .where(and(eq(comments.articleId, articleId), eq(comments.approved, true)))
    .orderBy(desc(comments.createdAt));
}

export async function getPendingComments() {
  return db
    .select()
    .from(comments)
    .where(eq(comments.approved, false))
    .orderBy(desc(comments.createdAt));
}

export async function createComment(data: {
  articleId: string;
  authorName?: string;
  authorEmail?: string;
  content: string;
}) {
  const result = await db.insert(comments).values(data).returning();
  return result[0];
}

export async function approveComment(id: string) {
  const result = await db
    .update(comments)
    .set({ approved: true })
    .where(eq(comments.id, id))
    .returning();
  return result[0];
}

export async function deleteComment(id: string) {
  await db.delete(comments).where(eq(comments.id, id));
}
