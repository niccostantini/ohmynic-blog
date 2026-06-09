import { error } from '@sveltejs/kit';
import { getUserByUsername } from '$lib/db/queries/users';
import {
  getPublishedArticlesByAuthor,
  countPublishedArticlesByAuthor,
  getTagsForArticle,
} from '$lib/db/queries/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const author = await getUserByUsername(params.username);
  if (!author) error(404, 'Autore non trovato');

  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const perPage = 10;

  const [articlesRaw, total] = await Promise.all([
    getPublishedArticlesByAuthor(params.username, page, perPage),
    countPublishedArticlesByAuthor(params.username),
  ]);

  const articles = await Promise.all(
    articlesRaw.map(async (article) => ({
      article,
      tags: await getTagsForArticle(article.id),
    }))
  );

  return {
    author: {
      username: author.username,
      displayName: author.displayName,
      bio: author.bio,
      avatarUrl: author.avatarUrl,
    },
    articles,
    total,
    page,
  };
};
