import { getArticlesForHomepage, getTagsForArticles } from '$lib/db/queries/articles';
import { getTagsWithCount } from '$lib/db/queries/tags';
import { getFeaturedItems } from '$lib/db/queries/featuredItems';
import type { PageServerLoad } from './$types';

// Module-level cache: avoids re-querying the DB on every homepage request.
// TTL 30s — stale for at most half a minute after publish/featured changes.
type CachedData = {
  rawArticles: Awaited<ReturnType<typeof getArticlesForHomepage>>;
  tags: Awaited<ReturnType<typeof getTagsWithCount>>;
  featuredRaw: Awaited<ReturnType<typeof getFeaturedItems>>;
  tagsMap: Awaited<ReturnType<typeof getTagsForArticles>>;
};

let _cache: { data: CachedData; expires: number } | null = null;
const CACHE_TTL = 30_000;

async function getHomepageData(): Promise<CachedData> {
  if (_cache && Date.now() < _cache.expires) return _cache.data;

  const [rawArticles, tags, featuredRaw] = await Promise.all([
    getArticlesForHomepage(),
    getTagsWithCount(),
    getFeaturedItems(),
  ]);

  const allIds = [
    ...featuredRaw.filter(f => f.article.type === 'article').map(f => f.article.id),
    ...rawArticles.map(a => a.id),
  ];

  const tagsMap = await getTagsForArticles(allIds);

  const data: CachedData = { rawArticles, tags, featuredRaw, tagsMap };
  _cache = { data, expires: Date.now() + CACHE_TTL };
  return data;
}

export const load: PageServerLoad = async () => {
  const { rawArticles, tags, featuredRaw, tagsMap } = await getHomepageData();

  const featured = featuredRaw.map((item) => ({
    ...item,
    tags: item.article.type === 'article' ? (tagsMap[item.article.id] ?? []) : [],
  }));

  const articles = rawArticles.map((article) => ({
    article,
    tags: tagsMap[article.id] ?? [],
  }));

  return { featured, articles, tags };
};
