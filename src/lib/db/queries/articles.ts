import { eq, desc, and, ne, inArray, sql } from 'drizzle-orm';
import { db } from '../index';
import { articles, articleTranslations, articleTags, tags } from '../schema';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Flat article object with translation merged in — compatible with existing Svelte templates */
export type ArticleRow = {
  id: string;
  slug: string;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  locale: string;
  translationId: string;
  title: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  publishedAt: Date | null;
};

/** Single translation row, as stored in the DB */
export type TranslationRow = typeof articleTranslations.$inferSelect;

/** Article for admin list (includes badges for all locales) */
export type AdminArticleRow = {
  id: string;
  slug: string;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  published: boolean;
  publishedAt: Date | null;
  translations: { locale: string; published: boolean }[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Columns to select for a merged article+translation row */
const mergedCols = {
  id: articles.id,
  slug: articles.slug,
  coverImage: articles.coverImage,
  createdAt: articles.createdAt,
  updatedAt: articles.updatedAt,
  locale: articleTranslations.locale,
  translationId: articleTranslations.id,
  title: articleTranslations.title,
  content: articleTranslations.content,
  excerpt: articleTranslations.excerpt,
  published: articleTranslations.published,
  publishedAt: articleTranslations.publishedAt,
};

// ─── Public queries ───────────────────────────────────────────────────────────

export async function getPublishedArticles(page = 1, perPage = 10, locale = 'it') {
  const offset = (page - 1) * perPage;
  return db
    .select(mergedCols)
    .from(articles)
    .innerJoin(
      articleTranslations,
      and(
        eq(articleTranslations.articleId, articles.id),
        eq(articleTranslations.locale, locale),
        eq(articleTranslations.published, true),
      ),
    )
    .orderBy(desc(articleTranslations.publishedAt))
    .limit(perPage)
    .offset(offset);
}

export async function countPublishedArticles(locale = 'it') {
  const result = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(articles)
    .innerJoin(
      articleTranslations,
      and(
        eq(articleTranslations.articleId, articles.id),
        eq(articleTranslations.locale, locale),
        eq(articleTranslations.published, true),
      ),
    );
  return Number(result[0].count);
}

export async function getArticleBySlug(slug: string, locale = 'it'): Promise<ArticleRow | null> {
  const query = (loc: string) =>
    db
      .select(mergedCols)
      .from(articles)
      .innerJoin(
        articleTranslations,
        and(
          eq(articleTranslations.articleId, articles.id),
          eq(articleTranslations.locale, loc),
          eq(articleTranslations.published, true),
        ),
      )
      .where(eq(articles.slug, slug))
      .limit(1);

  const primary = await query(locale);
  if (primary[0]) return primary[0];

  // fall back to Italian if the requested locale has no published translation
  if (locale !== 'it') {
    const fallback = await query('it');
    return fallback[0] ?? null;
  }
  return null;
}

/** Returns all published locales for an article (for hreflang / language switcher) */
export async function getArticleAvailableLocales(articleId: string): Promise<string[]> {
  const rows = await db
    .select({ locale: articleTranslations.locale })
    .from(articleTranslations)
    .where(
      and(
        eq(articleTranslations.articleId, articleId),
        eq(articleTranslations.published, true),
      ),
    );
  return rows.map((r) => r.locale);
}

// ─── Admin queries ────────────────────────────────────────────────────────────

export async function getArticleById(id: string) {
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAllArticlesAdmin(): Promise<AdminArticleRow[]> {
  // Fetch all articles with their IT translation (LEFT JOIN so articles without IT still show)
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      coverImage: articles.coverImage,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      title: articleTranslations.title,
      published: articleTranslations.published,
      publishedAt: articleTranslations.publishedAt,
    })
    .from(articles)
    .leftJoin(
      articleTranslations,
      and(eq(articleTranslations.articleId, articles.id), eq(articleTranslations.locale, 'it')),
    )
    .orderBy(desc(articles.createdAt));

  // Fetch all translations to build locale badges
  const allTranslations = await db
    .select({
      articleId: articleTranslations.articleId,
      locale: articleTranslations.locale,
      published: articleTranslations.published,
    })
    .from(articleTranslations);

  const translationMap = new Map<string, { locale: string; published: boolean }[]>();
  for (const t of allTranslations) {
    const arr = translationMap.get(t.articleId) ?? [];
    arr.push({ locale: t.locale, published: t.published });
    translationMap.set(t.articleId, arr);
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    coverImage: row.coverImage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    title: row.title ?? '[No title]',
    published: row.published ?? false,
    publishedAt: row.publishedAt ?? null,
    translations: translationMap.get(row.id) ?? [],
  }));
}

export async function getArticleTranslation(
  articleId: string,
  locale: string,
): Promise<TranslationRow | null> {
  const result = await db
    .select()
    .from(articleTranslations)
    .where(
      and(eq(articleTranslations.articleId, articleId), eq(articleTranslations.locale, locale)),
    )
    .limit(1);
  return result[0] ?? null;
}

export async function getAllTranslationsForArticle(articleId: string): Promise<TranslationRow[]> {
  return db
    .select()
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, articleId));
}

// ─── Write queries ────────────────────────────────────────────────────────────

export async function createArticle(data: {
  slug: string;
  coverImage?: string;
  locale: string;
  title: string;
  content: string;
  excerpt?: string;
  published: boolean;
  publishedAt?: Date;
}) {
  const { slug, coverImage, locale, title, content, excerpt, published, publishedAt } = data;

  const [article] = await db
    .insert(articles)
    .values({ slug, coverImage })
    .returning();

  const [translation] = await db
    .insert(articleTranslations)
    .values({ articleId: article.id, locale, title, content, excerpt, published, publishedAt })
    .returning();

  return { ...article, ...translation };
}

export async function upsertArticleTranslation(
  articleId: string,
  locale: string,
  data: {
    title: string;
    content: string;
    excerpt?: string;
    published: boolean;
    publishedAt?: Date | null;
  },
): Promise<TranslationRow> {
  const existing = await getArticleTranslation(articleId, locale);

  if (existing) {
    const [updated] = await db
      .update(articleTranslations)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(articleTranslations.articleId, articleId),
          eq(articleTranslations.locale, locale),
        ),
      )
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(articleTranslations)
      .values({ articleId, locale, ...data })
      .returning();
    return created;
  }
}

export async function updateArticleBase(
  id: string,
  data: { slug?: string; coverImage?: string | null },
) {
  const [updated] = await db
    .update(articles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(articles.id, id))
    .returning();
  return updated;
}

export async function deleteArticle(id: string) {
  await db.delete(articles).where(eq(articles.id, id));
}

// ─── Slug generation ──────────────────────────────────────────────────────────

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

// ─── Tag queries ──────────────────────────────────────────────────────────────

export async function getArticlesByTag(tagSlug: string, page = 1, perPage = 10, locale = 'it') {
  const offset = (page - 1) * perPage;
  return db
    .select(mergedCols)
    .from(articles)
    .innerJoin(
      articleTranslations,
      and(
        eq(articleTranslations.articleId, articles.id),
        eq(articleTranslations.locale, locale),
        eq(articleTranslations.published, true),
      ),
    )
    .innerJoin(articleTags, eq(articleTags.articleId, articles.id))
    .innerJoin(tags, eq(tags.id, articleTags.tagId))
    .where(eq(tags.slug, tagSlug))
    .orderBy(desc(articleTranslations.publishedAt))
    .limit(perPage)
    .offset(offset);
}

export async function getTagsForArticle(articleId: string) {
  return db
    .select({ tag: tags })
    .from(tags)
    .innerJoin(articleTags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, articleId))
    .then((rows) => rows.map((r) => r.tag));
}

export async function setArticleTags(articleId: string, tagIds: string[]) {
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
  if (tagIds.length > 0) {
    await db.insert(articleTags).values(tagIds.map((tagId) => ({ articleId, tagId })));
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

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
      .having(sql`count(distinct ${articleTags.tagId}) = ${tagSlugs.length}`),
  );
}

export async function searchArticles(
  query: string,
  opts: { tagSlugs?: string[]; page?: number; perPage?: number; locale?: string } = {},
) {
  const clean = sanitizeSearchQuery(query);
  const { tagSlugs = [], page = 1, perPage = 12, locale = 'it' } = opts;
  const tagFilter = buildTagFilter(tagSlugs);

  const joinCond = and(
    eq(articleTranslations.articleId, articles.id),
    eq(articleTranslations.locale, locale),
    eq(articleTranslations.published, true),
  );

  if (!clean) {
    return db
      .select(mergedCols)
      .from(articles)
      .innerJoin(articleTranslations, joinCond)
      .where(and(tagFilter))
      .orderBy(desc(articleTranslations.publishedAt))
      .limit(perPage)
      .offset((page - 1) * perPage);
  }

  const vector = sql`to_tsvector('simple',
    coalesce(${articleTranslations.title}, '') || ' ' ||
    coalesce(${articleTranslations.excerpt}, '') || ' ' ||
    coalesce(${articleTranslations.content}, ''))`;
  const tsq = sql`plainto_tsquery('simple', ${clean})`;

  return db
    .select(mergedCols)
    .from(articles)
    .innerJoin(articleTranslations, joinCond)
    .where(and(sql`${vector} @@ ${tsq}`, tagFilter))
    .orderBy(desc(sql`ts_rank(${vector}, ${tsq})`))
    .limit(perPage)
    .offset((page - 1) * perPage);
}

export async function countSearchResults(
  query: string,
  tagSlugs?: string[],
  locale = 'it',
) {
  const clean = sanitizeSearchQuery(query);
  const tagFilter = buildTagFilter(tagSlugs ?? []);

  const joinCond = and(
    eq(articleTranslations.articleId, articles.id),
    eq(articleTranslations.locale, locale),
    eq(articleTranslations.published, true),
  );

  if (!clean) {
    const result = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(articles)
      .innerJoin(articleTranslations, joinCond)
      .where(and(tagFilter));
    return result[0]?.count ?? 0;
  }

  const vector = sql`to_tsvector('simple',
    coalesce(${articleTranslations.title}, '') || ' ' ||
    coalesce(${articleTranslations.excerpt}, '') || ' ' ||
    coalesce(${articleTranslations.content}, ''))`;
  const tsq = sql`plainto_tsquery('simple', ${clean})`;

  const result = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(articles)
    .innerJoin(articleTranslations, joinCond)
    .where(and(sql`${vector} @@ ${tsq}`, tagFilter));
  return result[0]?.count ?? 0;
}

// ─── Related articles ─────────────────────────────────────────────────────────

export async function getRelatedArticles(articleId: string, limit = 3, locale = 'it') {
  const currentTags = await db
    .select({ tagId: articleTags.tagId })
    .from(articleTags)
    .where(eq(articleTags.articleId, articleId));

  if (currentTags.length === 0) return [];

  const tagIds = currentTags.map((t) => t.tagId);

  return db
    .select({
      ...mergedCols,
      sharedCount: sql<number>`cast(count(*) as int)`.as('shared_count'),
    })
    .from(articles)
    .innerJoin(
      articleTranslations,
      and(
        eq(articleTranslations.articleId, articles.id),
        eq(articleTranslations.locale, locale),
        eq(articleTranslations.published, true),
      ),
    )
    .innerJoin(articleTags, eq(articleTags.articleId, articles.id))
    .where(
      and(
        ne(articles.id, articleId),
        inArray(articleTags.tagId, tagIds),
      ),
    )
    .groupBy(
      articles.id,
      articles.slug,
      articles.coverImage,
      articles.createdAt,
      articles.updatedAt,
      articleTranslations.id,
      articleTranslations.locale,
      articleTranslations.title,
      articleTranslations.content,
      articleTranslations.excerpt,
      articleTranslations.published,
      articleTranslations.publishedAt,
    )
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}
