import { eq, desc, and, ne, inArray, sql, lte, or, isNull } from 'drizzle-orm';
import { db } from '../index';
import { articles, articleTags, tags, users, articleStatusLog, editorialComments } from '../schema';

export async function getPublishedSlugsForSitemap() {
  return db
    .select({ slug: articles.slug, updatedAt: articles.updatedAt, type: articles.type })
    .from(articles)
    .where(and(
      eq(articles.status, 'published'),
      or(isNull(articles.publishedAt), lte(articles.publishedAt, new Date()))
    ))
    .orderBy(desc(articles.updatedAt));
}

export function readingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Articoli visibili al pubblico: published + publishedAt <= now (o null per vecchi record)
function publishedAndVisible() {
  return and(
    eq(articles.status, 'published'),
    eq(articles.showInFeed, true),
    or(isNull(articles.publishedAt), lte(articles.publishedAt, new Date()))
  );
}

// Per le route slug: include sia articoli che pagine statiche (showInFeed non rilevante)
function publishedBySlug() {
  return and(
    eq(articles.status, 'published'),
    or(isNull(articles.publishedAt), lte(articles.publishedAt, new Date()))
  );
}

type ArticleStatus = 'draft' | 'review' | 'approved' | 'published';

export async function getAllPublishedArticles() {
  return db
    .select()
    .from(articles)
    .where(and(
      eq(articles.status, 'published'),
      eq(articles.type, 'article'),
      or(isNull(articles.publishedAt), lte(articles.publishedAt, new Date()))
    ))
    .orderBy(desc(articles.publishedAt));
}

export async function getPublishedArticles(page = 1, perPage = 10) {
  const offset = (page - 1) * perPage;
  return db
    .select()
    .from(articles)
    .where(publishedAndVisible())
    .orderBy(desc(articles.publishedAt))
    .limit(perPage)
    .offset(offset);
}

export async function countPublishedArticles() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(publishedAndVisible());
  return Number(result[0].count);
}

export async function getArticleBySlug(slug: string) {
  const result = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), publishedAndVisible()))
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

export async function getAllArticlesAdmin(authorId?: string, status?: ArticleStatus) {
  const conditions: ReturnType<typeof eq>[] = [eq(articles.type, 'article')];
  if (authorId) conditions.push(eq(articles.authorId, authorId));
  if (status) conditions.push(eq(articles.status, status));

  return db.select().from(articles).where(and(...conditions)).orderBy(desc(articles.createdAt));
}

export async function createArticle(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  coverImageFocus?: string;
  status?: ArticleStatus;
  publishedAt?: Date;
  authorId?: string;
}) {
  const { randomUUID } = await import('node:crypto');
  const result = await db.insert(articles).values({
    ...data,
    status: data.status ?? 'draft',
    previewToken: randomUUID(),
    readingTimeMinutes: readingTime(data.content),
  }).returning();
  return result[0];
}

export async function updateArticle(id: string, data: Partial<{
  title: string;
  slug: string;
  content: string;
  blocksJson: string | null;
  excerpt: string;
  coverImage: string | null;
  coverImageFocus: string | null;
  status: ArticleStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  authorId: string;
  readingTimeMinutes: number;
  showCoverInArticle: boolean;
  type: 'article' | 'page';
  showComments: boolean;
  showInFeed: boolean;
  showInNavbar: boolean;
  visibleTo: string[];
}>) {
  const result = await db
    .update(articles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(articles.id, id))
    .returning();
  return result[0];
}

// ── Status transitions ─────────────────────────────────────────────────────────

const WORKFLOW_EVENTS: Record<string, Record<string, string>> = {
  draft: { review: 'sent_to_review' },
  review: { approved: 'approved', draft: 'rejected' },
  approved: { published: 'published', draft: 'rejected' },
  published: { draft: 'rejected' },
};

const WORKFLOW_DEFAULT_CONTENT: Record<string, string> = {
  sent_to_review: 'Articolo inviato in revisione.',
  approved: 'Articolo approvato.',
  published: 'Articolo pubblicato.',
  rejected: 'Articolo rimandato in bozza.',
};

export async function changeArticleStatus(
  articleId: string,
  fromStatus: string | null,
  toStatus: ArticleStatus,
  changedBy: string,
  note?: string | null,
  checklistSnapshot?: { label: string; checked: boolean }[] | null,
) {
  const workflowEvent = fromStatus ? (WORKFLOW_EVENTS[fromStatus]?.[toStatus] ?? null) : null;
  const commentContent =
    note?.trim() ||
    (workflowEvent ? WORKFLOW_DEFAULT_CONTENT[workflowEvent] : null) ||
    `${fromStatus} → ${toStatus}`;

  const updates: Partial<{ status: ArticleStatus; publishedAt: Date | null }> = { status: toStatus };
  if (toStatus === 'published') {
    const current = await getArticleById(articleId);
    if (current && !current.publishedAt) updates.publishedAt = new Date();
  }

  await db.transaction(async (tx) => {
    await tx.update(articles).set({ ...updates, updatedAt: new Date() }).where(eq(articles.id, articleId));
    await tx.insert(articleStatusLog).values({ articleId, fromStatus, toStatus, changedBy, checklistSnapshot: checklistSnapshot ?? null });
    await tx.insert(editorialComments).values({
      articleId,
      authorId: changedBy,
      content: commentContent,
      workflowEvent,
      fromStatus,
      toStatus,
    });
  });
}

export async function getArticleStatusLog(articleId: string) {
  return db
    .select({
      id: articleStatusLog.id,
      fromStatus: articleStatusLog.fromStatus,
      toStatus: articleStatusLog.toStatus,
      createdAt: articleStatusLog.createdAt,
      checklistSnapshot: articleStatusLog.checklistSnapshot,
      changedByUsername: users.username,
      changedByDisplayName: users.displayName,
    })
    .from(articleStatusLog)
    .leftJoin(users, eq(articleStatusLog.changedBy, users.id))
    .where(eq(articleStatusLog.articleId, articleId))
    .orderBy(desc(articleStatusLog.createdAt));
}

// ── Permission helper ──────────────────────────────────────────────────────────

export function canTransitionStatus(
  user: { role: string; canPublish: boolean; userId: string },
  article: { status: string; authorId: string | null },
  toStatus: string,
): boolean {
  const { role, canPublish, userId } = user;
  const from = article.status;

  // draft → review: Contributor (own), Editor, Admin
  if (from === 'draft' && toStatus === 'review') {
    if (role === 'contributor') return article.authorId === userId;
    return role === 'editor' || role === 'admin';
  }

  // review → approved: Editor, Admin
  if (from === 'review' && toStatus === 'approved') {
    return role === 'editor' || role === 'admin';
  }

  // review → draft: Editor, Admin
  if (from === 'review' && toStatus === 'draft') {
    return role === 'editor' || role === 'admin';
  }

  // approved → published: Admin, Editor (canPublish)
  if (from === 'approved' && toStatus === 'published') {
    if (role === 'admin') return true;
    return role === 'editor' && canPublish;
  }

  // approved → draft: Editor, Admin
  if (from === 'approved' && toStatus === 'draft') {
    return role === 'editor' || role === 'admin';
  }

  // published → draft (unpublish): Admin, Editor (canPublish)
  if (from === 'published' && toStatus === 'draft') {
    if (role === 'admin') return true;
    return role === 'editor' && canPublish;
  }

  return false;
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
    .where(and(eq(tags.slug, tagSlug), publishedAndVisible()))
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

export function sanitizeSearchQuery(raw: string): string {
  return raw
    .trim()
    .replace(/[<>'";\\]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 200);
}

function buildTagFilter(tagSlugs: string[]) {
  if (tagSlugs.length === 0) return undefined;
  return inArray(
    articles.id,
    db
      .select({ id: articleTags.articleId })
      .from(articleTags)
      .innerJoin(tags, eq(tags.id, articleTags.tagId))
      .where(inArray(tags.slug, tagSlugs))
      .groupBy(articleTags.articleId)
      .having(sql`count(distinct ${articleTags.tagId}) = ${tagSlugs.length}`)
  );
}

export async function searchArticles(
  query: string,
  opts: { tagSlugs?: string[]; page?: number; perPage?: number } = {}
) {
  const clean = sanitizeSearchQuery(query);
  const { tagSlugs = [], page = 1, perPage = 12 } = opts;
  const tagFilter = buildTagFilter(tagSlugs);

  if (!clean) {
    return db
      .select()
      .from(articles)
      .where(and(publishedAndVisible(), tagFilter))
      .orderBy(desc(articles.publishedAt))
      .limit(perPage)
      .offset((page - 1) * perPage);
  }

  const vector = sql`to_tsvector('italian',
    coalesce(${articles.title}, '') || ' ' ||
    coalesce(${articles.excerpt}, '') || ' ' ||
    coalesce(${articles.content}, ''))`;
  const tsq = sql`plainto_tsquery('italian', ${clean})`;

  return db
    .select()
    .from(articles)
    .where(and(publishedAndVisible(), sql`${vector} @@ ${tsq}`, tagFilter))
    .orderBy(desc(sql`ts_rank(${vector}, ${tsq})`))
    .limit(perPage)
    .offset((page - 1) * perPage);
}

export async function countSearchResults(query: string, tagSlugs?: string[]) {
  const clean = sanitizeSearchQuery(query);
  const tagFilter = buildTagFilter(tagSlugs ?? []);

  if (!clean) {
    const result = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(articles)
      .where(and(publishedAndVisible(), tagFilter));
    return result[0]?.count ?? 0;
  }

  const vector = sql`to_tsvector('italian',
    coalesce(${articles.title}, '') || ' ' ||
    coalesce(${articles.excerpt}, '') || ' ' ||
    coalesce(${articles.content}, ''))`;
  const tsq = sql`plainto_tsquery('italian', ${clean})`;

  const result = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(articles)
    .where(and(publishedAndVisible(), sql`${vector} @@ ${tsq}`, tagFilter));
  return result[0]?.count ?? 0;
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
        publishedAndVisible(),
        inArray(articleTags.tagId, tagIds),
      )
    )
    .groupBy(articles.id)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getArticleBySlugWithAuthor(slug: string) {
  const result = await db
    .select({
      article: articles,
      author: {
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
      },
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.slug, slug), publishedBySlug()))
    .limit(1);
  return result[0] ?? null;
}

export async function getArticleBySlugForPreview(slug: string, token: string) {
  const result = await db
    .select({
      article: articles,
      author: {
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
      },
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.slug, slug), eq(articles.previewToken, token)))
    .limit(1);
  return result[0] ?? null;
}

export async function getPublishedArticlesByAuthor(username: string, page = 1, perPage = 10) {
  const offset = (page - 1) * perPage;
  return db
    .select({ article: articles })
    .from(articles)
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(users.username, username), publishedAndVisible()))
    .orderBy(desc(articles.publishedAt))
    .limit(perPage)
    .offset(offset)
    .then((rows) => rows.map((r) => r.article));
}

export async function countPublishedArticlesByAuthor(username: string) {
  const result = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(articles)
    .innerJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(users.username, username), publishedAndVisible()));
  return result[0]?.count ?? 0;
}

export async function setArticleTags(articleId: string, tagIds: string[]) {
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
  if (tagIds.length > 0) {
    await db.insert(articleTags).values(tagIds.map((tagId) => ({ articleId, tagId })));
  }
}

export async function getAllPagesAdmin() {
  return db
    .select()
    .from(articles)
    .where(eq(articles.type, 'page'))
    .orderBy(desc(articles.updatedAt));
}

export async function createPage(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId?: string;
}) {
  const { randomUUID } = await import('node:crypto');
  const result = await db.insert(articles).values({
    ...data,
    type: 'page',
    status: 'draft',
    showInFeed: false,
    showComments: false,
    showInNavbar: false,
    visibleTo: ['public'],
    previewToken: randomUUID(),
    readingTimeMinutes: readingTime(data.content),
  }).returning();
  return result[0];
}
