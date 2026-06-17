import { error, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import {
  getArticleBySlugWithAuthor,
  getArticleBySlugForPreview,
  getTagsForArticle,
  getRelatedArticles,
  readingTime,
  getArticlesBySlugList,
} from '$lib/db/queries/articles';
import { getApprovedComments } from '$lib/db/queries/comments';
import { isBookmarked } from '$lib/db/queries/readers';
import { getPollById, getPollResults, getVoterOptions } from '$lib/db/queries/polls';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const previewToken = url.searchParams.get('preview');

  const result = previewToken
    ? await getArticleBySlugForPreview(params.slug, previewToken)
    : await getArticleBySlugWithAuthor(params.slug);

  if (!result) error(404, 'Articolo non trovato');

  const { article, author } = result;

  // Visibility guard: fail-closed — null/empty visibleTo means private
  if (!previewToken) {
    const visibleTo: string[] = article.visibleTo?.length ? article.visibleTo : [];
    if (!visibleTo.includes('public')) {
      const user = locals.user;
      const reader = locals.reader;

      if (!user && !reader) {
        // Unauthenticated — send to login
        redirect(302, `${base}/login?redirect=${encodeURIComponent(`${base}/${params.slug}`)}`);
      }

      // Authenticated but wrong role — 403 (avoid redirect loop for logged-in readers)
      const role = user?.role ?? 'reader';
      if (role !== 'admin' && !visibleTo.includes(role)) {
        error(403, 'Accesso negato');
      }
    }
  }

  // Calculate reading time on the fly if not yet stored
  const readingTimeMinutes = article.readingTimeMinutes ?? readingTime(article.content);

  const [tags, comments, relatedRaw, bookmarked] = await Promise.all([
    getTagsForArticle(article.id),
    getApprovedComments(article.id),
    previewToken ? Promise.resolve([]) : getRelatedArticles(article.id),
    locals.reader ? isBookmarked(locals.reader.id, article.id) : Promise.resolve(false),
  ]);

  const related = previewToken ? [] : await Promise.all(
    relatedRaw.map(async ({ article: rel }) => ({
      article: rel,
      tags: await getTagsForArticle(rel.id),
    }))
  );

  // Load poll data and linked article cards in parallel
  const [polls, linkedArticles] = await Promise.all([
    loadPollsFromBlocks(article.blocksJson ?? null, locals.reader?.id ?? null),
    loadLinkedArticles(article.blocksJson ?? null),
  ]);

  return {
    article: { ...article, readingTimeMinutes },
    author,
    tags,
    comments,
    related,
    bookmarked,
    isPreview: !!previewToken,
    polls,
    linkedArticles,
  };
};

// ── Linked article cards loader ───────────────────────────────────────────────

async function loadLinkedArticles(
  blocksJson: string | null,
): Promise<Record<string, { id: string; title: string; slug: string; excerpt: string | null; coverImage: string | null; coverImageFocus: string | null }>> {
  if (!blocksJson) return {};

  function extractSlugs(blocks: any[]): string[] {
    const slugs: string[] = [];
    for (const b of blocks) {
      if (b.type === 'articleCard' && b.props?.cardType === 'internal' && b.props?.url) {
        slugs.push(b.props.url as string);
      }
      if (Array.isArray(b.children)) slugs.push(...extractSlugs(b.children));
    }
    return slugs;
  }

  let slugs: string[];
  try {
    slugs = [...new Set(extractSlugs(JSON.parse(blocksJson)))];
  } catch {
    return {};
  }

  if (slugs.length === 0) return {};

  try {
    const rows = await getArticlesBySlugList(slugs);
    return Object.fromEntries(rows.map((a) => [a.slug, a]));
  } catch {
    return {};
  }
}

// ── Poll loader helper ────────────────────────────────────────────────────────

type PollPageData = {
  poll: { question: string; allowMultiple: boolean; closed: boolean };
  results: Awaited<ReturnType<typeof getPollResults>>;
  userVotedOptionIds: string[];
};

async function loadPollsFromBlocks(
  blocksJson: string | null,
  readerId: string | null,
): Promise<Record<string, PollPageData>> {
  if (!blocksJson) return {};

  function extractPollIds(blocks: any[]): string[] {
    const ids: string[] = [];
    for (const b of blocks) {
      if (b.type === 'poll' && b.props?.pollId) ids.push(b.props.pollId as string);
      if (Array.isArray(b.children)) ids.push(...extractPollIds(b.children));
    }
    return ids;
  }

  let pollIds: string[];
  try {
    pollIds = extractPollIds(JSON.parse(blocksJson));
  } catch {
    return {};
  }

  if (pollIds.length === 0) return {};

  const entries = await Promise.all(
    pollIds.map(async (pollId) => {
      try {
        // Check poll exists before fetching results (avoids querying non-existent tables)
        const poll = await getPollById(pollId);
        if (!poll) return null;

        const [results, userVotedOptionIds] = await Promise.all([
          getPollResults(pollId),
          readerId ? getVoterOptions(pollId, readerId) : Promise.resolve([]),
        ]);

        return [
          pollId,
          {
            poll: { question: poll.question, allowMultiple: poll.allowMultiple, closed: poll.closed },
            results,
            userVotedOptionIds,
          },
        ] as const;
      } catch {
        // Polls table may not exist yet (migration pending) — skip gracefully
        return null;
      }
    }),
  );

  return Object.fromEntries(entries.filter((e): e is NonNullable<typeof e> => e !== null));
}
