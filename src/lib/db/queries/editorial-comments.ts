import { and, desc, eq, isNull, isNotNull, sql } from 'drizzle-orm';
import { db } from '../index';
import { editorialComments, users } from '../schema';

export type EditorialCommentRow = {
  id: string;
  articleId: string;
  authorId: string;
  authorDisplayName: string | null;
  authorUsername: string;
  content: string;
  parentId: string | null;
  workflowEvent: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  blockId: string | null;
  blockSnapshot: string | null;
  blockType: string | null;
  blockOrphaned: boolean;
  blockContentChanged: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
  replies?: EditorialCommentRow[];
};

export async function getEditorialComments(articleId: string): Promise<EditorialCommentRow[]> {
  const rows = await db
    .select({
      id: editorialComments.id,
      articleId: editorialComments.articleId,
      authorId: editorialComments.authorId,
      authorDisplayName: users.displayName,
      authorUsername: users.username,
      content: editorialComments.content,
      parentId: editorialComments.parentId,
      workflowEvent: editorialComments.workflowEvent,
      fromStatus: editorialComments.fromStatus,
      toStatus: editorialComments.toStatus,
      blockId: editorialComments.blockId,
      blockSnapshot: editorialComments.blockSnapshot,
      blockType: editorialComments.blockType,
      blockOrphaned: editorialComments.blockOrphaned,
      blockContentChanged: editorialComments.blockContentChanged,
      resolvedAt: editorialComments.resolvedAt,
      createdAt: editorialComments.createdAt,
    })
    .from(editorialComments)
    .leftJoin(users, eq(editorialComments.authorId, users.id))
    .where(eq(editorialComments.articleId, articleId))
    .orderBy(editorialComments.createdAt);

  // Build threaded structure (1 level deep)
  const roots: EditorialCommentRow[] = [];
  const replyMap = new Map<string, EditorialCommentRow[]>();

  for (const row of rows) {
    const comment: EditorialCommentRow = {
      id: row.id,
      articleId: row.articleId,
      authorId: row.authorId,
      authorDisplayName: row.authorDisplayName,
      authorUsername: row.authorUsername ?? '',
      content: row.content,
      parentId: row.parentId,
      workflowEvent: row.workflowEvent,
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      blockId: row.blockId,
      blockSnapshot: row.blockSnapshot,
      blockType: row.blockType,
      blockOrphaned: row.blockOrphaned,
      blockContentChanged: row.blockContentChanged,
      resolvedAt: row.resolvedAt,
      createdAt: row.createdAt,
      replies: [],
    };

    if (row.parentId) {
      const list = replyMap.get(row.parentId) ?? [];
      list.push(comment);
      replyMap.set(row.parentId, list);
    } else {
      roots.push(comment);
    }
  }

  for (const root of roots) {
    root.replies = replyMap.get(root.id) ?? [];
  }

  return roots;
}

export async function createEditorialComment(data: {
  articleId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  workflowEvent?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  blockId?: string | null;
  blockSnapshot?: string | null;
  blockType?: string | null;
}): Promise<{ id: string }> {
  const result = await db
    .insert(editorialComments)
    .values({
      articleId: data.articleId,
      authorId: data.authorId,
      content: data.content,
      parentId: data.parentId ?? null,
      workflowEvent: data.workflowEvent ?? null,
      fromStatus: data.fromStatus ?? null,
      toStatus: data.toStatus ?? null,
      blockId: data.blockId ?? null,
      blockSnapshot: data.blockSnapshot ?? null,
      blockType: data.blockType ?? null,
    })
    .returning({ id: editorialComments.id });
  return result[0];
}

export async function resolveEditorialComment(id: string): Promise<void> {
  await db
    .update(editorialComments)
    .set({ resolvedAt: new Date() })
    .where(eq(editorialComments.id, id));
}

export async function deleteEditorialComment(
  id: string,
  requesterId: string,
  requesterRole: string,
): Promise<{ ok: boolean; error?: string }> {
  // Check it exists and fetch
  const rows = await db
    .select({
      id: editorialComments.id,
      authorId: editorialComments.authorId,
    })
    .from(editorialComments)
    .where(eq(editorialComments.id, id))
    .limit(1);

  if (!rows.length) return { ok: false, error: 'not_found' };
  const comment = rows[0];

  // Permission check
  if (requesterRole !== 'admin' && comment.authorId !== requesterId) {
    return { ok: false, error: 'forbidden' };
  }

  // Check for replies
  const replies = await db
    .select({ id: editorialComments.id })
    .from(editorialComments)
    .where(eq(editorialComments.parentId, id))
    .limit(1);

  if (replies.length > 0) {
    // Soft delete: replace content
    await db
      .update(editorialComments)
      .set({ content: '[Commento eliminato]' })
      .where(eq(editorialComments.id, id));
  } else {
    await db.delete(editorialComments).where(eq(editorialComments.id, id));
  }

  return { ok: true };
}

// ── Block reconciliation ───────────────────────────────────────────────────────

export async function reconcileBlockComments(
  articleId: string,
  blockMap: Record<string, string>,
): Promise<void> {
  const blocks = new Map(Object.entries(blockMap));

  const commentsWithBlocks = await db
    .select({
      id: editorialComments.id,
      blockId: editorialComments.blockId,
      blockSnapshot: editorialComments.blockSnapshot,
      blockOrphaned: editorialComments.blockOrphaned,
    })
    .from(editorialComments)
    .where(
      and(
        eq(editorialComments.articleId, articleId),
        isNotNull(editorialComments.blockId),
      ),
    );

  for (const comment of commentsWithBlocks) {
    if (!comment.blockId || comment.blockOrphaned) continue;

    const currentText = blocks.get(comment.blockId);

    if (currentText === undefined) {
      await db
        .update(editorialComments)
        .set({ blockOrphaned: true })
        .where(eq(editorialComments.id, comment.id));
    } else if (
      comment.blockSnapshot &&
      currentText !== comment.blockSnapshot &&
      currentText !== ''
    ) {
      await db
        .update(editorialComments)
        .set({ blockContentChanged: true })
        .where(eq(editorialComments.id, comment.id));
    }
  }
}
