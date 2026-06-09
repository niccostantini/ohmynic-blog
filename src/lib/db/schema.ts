import { pgTable, text, timestamp, boolean, uuid, primaryKey, jsonb, integer, index, type AnyPgColumn } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'contributor'] }).notNull().default('contributor'),
  displayName: text('display_name'),
  email: text('email').unique(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  active: boolean('active').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  canPublish: boolean('can_publish').notNull().default(false),
  resetToken: text('reset_token'),
  resetTokenExpiresAt: timestamp('reset_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  coverImage: text('cover_image'),
  blocksJson: text('blocks_json'),
  status: text('status', { enum: ['draft', 'review', 'approved', 'published'] }).notNull().default('draft'),
  publishedAt: timestamp('published_at'),
  authorId: text('author_id').references(() => users.id),
  previewToken: text('preview_token'),
  readingTimeMinutes: integer('reading_time_minutes'),
  showCoverInArticle: boolean('show_cover_in_article').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const articleStatusLog = pgTable('article_status_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  changedBy: text('changed_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  checklistSnapshot: jsonb('checklist_snapshot').$type<{ label: string; checked: boolean }[]>(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const articleTags = pgTable('article_tags', {
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

// ── Readers (lettori registrati, separati dagli utenti admin) ─────────────────
export const readers = pgTable('readers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  resetToken: text('reset_token'),
  resetTokenExpiresAt: timestamp('reset_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const readerSessions = pgTable('reader_sessions', {
  id: text('id').primaryKey(),
  readerId: uuid('reader_id').notNull().references(() => readers.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const readerBookmarks = pgTable('reader_bookmarks', {
  readerId: uuid('reader_id').notNull().references(() => readers.id, { onDelete: 'cascade' }),
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.readerId, t.articleId] })]);

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  authorName: text('author_name'),
  authorEmail: text('author_email'),
  content: text('content').notNull(),
  readerId: uuid('reader_id').references(() => readers.id),
  approved: boolean('approved').default(false).notNull(),
  replyText: text('reply_text'),
  repliedAt: timestamp('replied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const editorialComments = pgTable('editorial_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => editorialComments.id),
  workflowEvent: text('workflow_event'),
  fromStatus: text('from_status'),
  toStatus: text('to_status'),
  blockId: text('block_id'),
  blockSnapshot: text('block_snapshot'),
  blockType: text('block_type'),
  blockOrphaned: boolean('block_orphaned').notNull().default(false),
  blockContentChanged: boolean('block_content_changed').notNull().default(false),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Analytics ─────────────────────────────────────────────────────────────────

export const pageViews = pgTable('page_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'set null' }),
  path: text('path').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  country: text('country'),
  readerId: uuid('reader_id').references(() => readers.id, { onDelete: 'set null' }),
  sessionId: text('session_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('pv_created_at_idx').on(t.createdAt),
  index('pv_article_id_idx').on(t.articleId),
  index('pv_session_id_idx').on(t.sessionId),
]);

export const articleReadCompletions = pgTable('article_read_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  percentage: integer('percentage').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('arc_article_id_idx').on(t.articleId),
]);
