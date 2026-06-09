import { sql, gte, and, isNotNull, desc, count, countDistinct } from 'drizzle-orm';
import { db } from '../index';
import { pageViews, articleReadCompletions, articles } from '../schema';

// ── Period helper ─────────────────────────────────────────────────────────────

export function getPeriodStart(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case '7d':  return new Date(now.getTime() - 7  * 86400_000);
    case '30d': return new Date(now.getTime() - 30 * 86400_000);
    case '3m':  return new Date(now.getTime() - 90 * 86400_000);
    default:    return null;
  }
}

function pvWhere(from: Date | null) {
  return from ? gte(pageViews.createdAt, from) : sql`true`;
}

function arcWhere(from: Date | null) {
  return from ? gte(articleReadCompletions.createdAt, from) : sql`true`;
}

// ── KPI ───────────────────────────────────────────────────────────────────────

export async function getTotalViews(from: Date | null): Promise<number> {
  const r = await db.select({ n: count() }).from(pageViews).where(pvWhere(from));
  return Number(r[0]?.n ?? 0);
}

export async function getUniqueVisitors(from: Date | null): Promise<number> {
  const r = await db
    .select({ n: countDistinct(pageViews.sessionId) })
    .from(pageViews)
    .where(pvWhere(from));
  return Number(r[0]?.n ?? 0);
}

export async function getTopArticle(from: Date | null): Promise<{ title: string; views: number } | null> {
  const r = await db
    .select({
      title: articles.title,
      views: count(pageViews.id),
    })
    .from(pageViews)
    .innerJoin(articles, sql`${articles.id} = ${pageViews.articleId}`)
    .where(and(isNotNull(pageViews.articleId), pvWhere(from)))
    .groupBy(articles.id, articles.title)
    .orderBy(desc(count(pageViews.id)))
    .limit(1);
  return r[0] ?? null;
}

export async function getAvgCompletion(from: Date | null): Promise<number> {
  const r = await db
    .select({ avg: sql<number>`round(avg(${articleReadCompletions.percentage}))` })
    .from(articleReadCompletions)
    .where(arcWhere(from));
  return Number(r[0]?.avg ?? 0);
}

// ── Time series ───────────────────────────────────────────────────────────────

export async function getDailyViews(from: Date | null): Promise<{ date: string; views: number }[]> {
  const r = await db.execute<{ date: string; views: string }>(
    sql`
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
        count(*)::int AS views
      FROM page_views
      WHERE ${from ? sql`created_at >= ${from}` : sql`true`}
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at) ASC
    `
  );
  return r.rows.map(row => ({ date: row.date, views: Number(row.views) }));
}

// ── Top articles ──────────────────────────────────────────────────────────────

export async function getTopArticlesByViews(from: Date | null, limit = 10) {
  const r = await db.execute<{ id: string; title: string; views: string }>(
    sql`
      SELECT
        a.id,
        a.title,
        count(pv.id)::int AS views
      FROM page_views pv
      JOIN articles a ON a.id = pv.article_id
      WHERE pv.article_id IS NOT NULL
        AND ${from ? sql`pv.created_at >= ${from}` : sql`true`}
      GROUP BY a.id, a.title
      ORDER BY views DESC
      LIMIT ${limit}
    `
  );
  return r.rows.map(row => ({ id: row.id, title: row.title, views: Number(row.views) }));
}

// ── Completion breakdown ──────────────────────────────────────────────────────

export async function getCompletionByTopArticles(from: Date | null, limit = 5) {
  const r = await db.execute<{
    id: string; title: string;
    p25: string; p50: string; p75: string; p100: string;
  }>(
    sql`
      SELECT
        a.id,
        a.title,
        count(*) FILTER (WHERE arc.percentage >= 25)  ::int AS p25,
        count(*) FILTER (WHERE arc.percentage >= 50)  ::int AS p50,
        count(*) FILTER (WHERE arc.percentage >= 75)  ::int AS p75,
        count(*) FILTER (WHERE arc.percentage = 100)  ::int AS p100
      FROM article_read_completions arc
      JOIN articles a ON a.id = arc.article_id
      WHERE ${from ? sql`arc.created_at >= ${from}` : sql`true`}
      GROUP BY a.id, a.title
      ORDER BY p25 DESC
      LIMIT ${limit}
    `
  );
  return r.rows.map(row => ({
    id: row.id,
    title: row.title,
    p25: Number(row.p25),
    p50: Number(row.p50),
    p75: Number(row.p75),
    p100: Number(row.p100),
  }));
}

// ── Traffic sources ───────────────────────────────────────────────────────────

export async function getReferrers(from: Date | null) {
  const r = await db.execute<{ referrer: string | null; n: string }>(
    sql`
      SELECT referrer, count(*)::int AS n
      FROM page_views
      WHERE ${from ? sql`created_at >= ${from}` : sql`true`}
      GROUP BY referrer
    `
  );
  return r.rows.map(row => ({ referrer: row.referrer ?? null, n: Number(row.n) }));
}

export function classifyReferrers(rows: { referrer: string | null; n: number }[]) {
  const groups: Record<string, number> = { Diretto: 0, Google: 0, Social: 0, Altro: 0 };
  const SOCIAL = /facebook|twitter|instagram|linkedin|t\.co|pinterest|youtube|tiktok|reddit/i;
  const GOOGLE = /google\.|bing\.|duckduckgo\.|yahoo\./i;

  for (const { referrer, n } of rows) {
    if (!referrer) { groups['Diretto'] += n; }
    else if (GOOGLE.test(referrer)) { groups['Google'] += n; }
    else if (SOCIAL.test(referrer)) { groups['Social'] += n; }
    else { groups['Altro'] += n; }
  }
  return groups;
}

// ── Full articles table ───────────────────────────────────────────────────────

export async function getArticleStatsTable(from: Date | null) {
  const r = await db.execute<{
    id: string; title: string; slug: string;
    views: string; unique_visitors: string; avg_completion: string | null;
  }>(
    sql`
      WITH pv_agg AS (
        SELECT
          article_id,
          count(*)::int                        AS views,
          count(DISTINCT session_id)::int      AS unique_visitors
        FROM page_views
        WHERE article_id IS NOT NULL
          AND ${from ? sql`created_at >= ${from}` : sql`true`}
        GROUP BY article_id
      ),
      arc_agg AS (
        SELECT article_id, round(avg(percentage))::int AS avg_pct
        FROM article_read_completions
        GROUP BY article_id
      )
      SELECT
        a.id,
        a.title,
        a.slug,
        pv.views,
        pv.unique_visitors,
        arc.avg_pct AS avg_completion
      FROM pv_agg pv
      JOIN articles a ON a.id = pv.article_id
      LEFT JOIN arc_agg arc ON arc.article_id = pv.article_id
      ORDER BY pv.views DESC
    `
  );
  return r.rows.map(row => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    views: Number(row.views),
    uniqueVisitors: Number(row.unique_visitors),
    avgCompletion: row.avg_completion !== null ? Number(row.avg_completion) : null,
  }));
}
