import { eq, desc, and, inArray } from 'drizzle-orm';
import { db } from '../index';
import { feedback, users, readers } from '../schema';

export type FeedbackStatus = 'new' | 'read' | 'in_progress' | 'done' | 'wontfix';
export type FeedbackType = 'bug' | 'suggestion' | 'other';

export async function createFeedback(data: {
  type: FeedbackType;
  title: string;
  description: string;
  url?: string | null;
  authorId?: string | null;
  readerId?: string | null;
}) {
  const result = await db.insert(feedback).values(data).returning();
  return result[0];
}

export async function getAllFeedback() {
  return db
    .select({
      id: feedback.id,
      type: feedback.type,
      title: feedback.title,
      description: feedback.description,
      url: feedback.url,
      status: feedback.status,
      createdAt: feedback.createdAt,
      authorName: users.displayName,
      readerName: readers.displayName,
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.authorId, users.id))
    .leftJoin(readers, eq(feedback.readerId, readers.id))
    .orderBy(desc(feedback.createdAt));
}

export async function countNewFeedback(): Promise<number> {
  const result = await db
    .select({ id: feedback.id })
    .from(feedback)
    .where(eq(feedback.status, 'new'));
  return result.length;
}

export async function setFeedbackStatus(id: string, status: FeedbackStatus) {
  await db.update(feedback).set({ status }).where(eq(feedback.id, id));
}
