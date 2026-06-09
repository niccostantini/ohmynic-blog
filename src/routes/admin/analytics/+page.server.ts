import { error } from '@sveltejs/kit';
import {
  getPeriodStart,
  getTotalViews,
  getUniqueVisitors,
  getTopArticle,
  getAvgCompletion,
  getDailyViews,
  getTopArticlesByViews,
  getCompletionByTopArticles,
  getReferrers,
  classifyReferrers,
  getArticleStatsTable,
} from '$lib/db/queries/analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user!.role === 'contributor') {
    error(403, 'Accesso negato');
  }

  const period = url.searchParams.get('period') ?? '7d';
  const from   = getPeriodStart(period);

  const [
    totalViews,
    uniqueVisitors,
    topArticle,
    avgCompletion,
    dailyViews,
    topArticles,
    completionData,
    referrerRows,
    articleTable,
  ] = await Promise.all([
    getTotalViews(from),
    getUniqueVisitors(from),
    getTopArticle(from),
    getAvgCompletion(from),
    getDailyViews(from),
    getTopArticlesByViews(from, 10),
    getCompletionByTopArticles(from, 5),
    getReferrers(from),
    getArticleStatsTable(from),
  ]);

  const trafficSources = classifyReferrers(referrerRows);

  return {
    period,
    kpis: { totalViews, uniqueVisitors, topArticle, avgCompletion },
    dailyViews,
    topArticles,
    completionData,
    trafficSources,
    articleTable,
  };
};
