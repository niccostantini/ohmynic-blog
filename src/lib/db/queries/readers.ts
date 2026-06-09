import { and, eq, desc } from 'drizzle-orm';
import { db } from '../index';
import { readers, readerSessions, readerBookmarks, comments, articles } from '../schema';

// ── Reader CRUD ────────────────────────────────────────────────────────────────

export async function createReader(data: {
  email: string;
  displayName: string;
  passwordHash: string;
  verificationToken: string;
}) {
  const result = await db.insert(readers).values(data).returning();
  return result[0];
}

export async function getReaderByEmail(email: string) {
  const result = await db.select().from(readers).where(eq(readers.email, email)).limit(1);
  return result[0] ?? null;
}

export async function getReaderById(id: string) {
  const result = await db.select().from(readers).where(eq(readers.id, id)).limit(1);
  return result[0] ?? null;
}

export async function verifyReaderEmail(token: string) {
  const result = await db
    .update(readers)
    .set({ emailVerified: true, verificationToken: null })
    .where(eq(readers.verificationToken, token))
    .returning();
  return result[0] ?? null;
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function setReaderResetToken(email: string, token: string, expiresAt: Date) {
  await db
    .update(readers)
    .set({ resetToken: token, resetTokenExpiresAt: expiresAt })
    .where(eq(readers.email, email));
}

export async function getReaderByResetToken(token: string) {
  const result = await db.select().from(readers).where(eq(readers.resetToken, token)).limit(1);
  return result[0] ?? null;
}

export async function resetReaderPassword(token: string, passwordHash: string) {
  const result = await db
    .update(readers)
    .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
    .where(eq(readers.resetToken, token))
    .returning();
  return result[0] ?? null;
}

// ── Sessions ───────────────────────────────────────────────────────────────────

const SESSION_TTL_DAYS = 30;

export async function createReaderSession(readerId: string): Promise<string> {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(readerSessions).values({ id, readerId, expiresAt });
  return id;
}

export async function validateReaderSession(sessionId: string) {
  const result = await db
    .select({ reader: readers, session: readerSessions })
    .from(readerSessions)
    .innerJoin(readers, eq(readerSessions.readerId, readers.id))
    .where(eq(readerSessions.id, sessionId))
    .limit(1);

  const row = result[0];
  if (!row) return null;
  if (row.session.expiresAt < new Date()) {
    await db.delete(readerSessions).where(eq(readerSessions.id, sessionId));
    return null;
  }
  return row.reader;
}

export async function deleteReaderSession(sessionId: string) {
  await db.delete(readerSessions).where(eq(readerSessions.id, sessionId));
}

// ── Bookmarks ──────────────────────────────────────────────────────────────────

export async function isBookmarked(readerId: string, articleId: string): Promise<boolean> {
  const rows = await db
    .select({ readerId: readerBookmarks.readerId })
    .from(readerBookmarks)
    .where(and(eq(readerBookmarks.readerId, readerId), eq(readerBookmarks.articleId, articleId)))
    .limit(1);
  return rows.length > 0;
}

export async function toggleBookmark(readerId: string, articleId: string): Promise<boolean> {
  const already = await isBookmarked(readerId, articleId);
  if (already) {
    await db.delete(readerBookmarks).where(
      and(eq(readerBookmarks.readerId, readerId), eq(readerBookmarks.articleId, articleId))
    );
    return false;
  } else {
    await db.insert(readerBookmarks).values({ readerId, articleId });
    return true;
  }
}

export async function getBookmarkedArticles(readerId: string) {
  return db
    .select({ article: articles })
    .from(readerBookmarks)
    .innerJoin(articles, eq(readerBookmarks.articleId, articles.id))
    .where(eq(readerBookmarks.readerId, readerId))
    .orderBy(desc(readerBookmarks.createdAt))
    .then((rows) => rows.map((r) => r.article));
}

// ── Comments by reader ─────────────────────────────────────────────────────────

export async function getCommentsByReader(readerId: string) {
  return db
    .select({
      id: comments.id,
      content: comments.content,
      approved: comments.approved,
      createdAt: comments.createdAt,
      articleTitle: articles.title,
      articleSlug: articles.slug,
    })
    .from(comments)
    .innerJoin(articles, eq(comments.articleId, articles.id))
    .where(and(eq(comments.readerId, readerId), eq(comments.approved, true)))
    .orderBy(desc(comments.createdAt));
}
