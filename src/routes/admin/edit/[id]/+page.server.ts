import { fail, redirect, error } from '@sveltejs/kit';
import { base } from '$app/paths';
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  generateSlug,
  getTagsForArticle,
  setArticleTags,
} from '$lib/db/queries/articles';
import { findOrCreateTag, getAllTags } from '$lib/db/queries/tags';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [article, tags, articleTags] = await Promise.all([
    getArticleById(params.id),
    getAllTags(),
    getTagsForArticle(params.id),
  ]);

  if (!article) error(404, 'Articolo non trovato');

  return { article, tags, articleTags };
};

export const actions: Actions = {
  save: async ({ request, params }) => {
    const data = await request.formData();
    const title = data.get('title');
    const content = data.get('content');
    const excerpt = data.get('excerpt');
    const coverImage = data.get('coverImage');
    const tagsRaw = data.get('tags');
    const action = data.get('action');

    if (typeof title !== 'string' || !title.trim()) {
      return fail(400, { error: 'Il titolo è obbligatorio.' });
    }
    if (typeof content !== 'string' || !content.trim() || content === '<p></p>') {
      return fail(400, { error: 'Il contenuto è obbligatorio.' });
    }

    const existing = await getArticleById(params.id);
    if (!existing) error(404, 'Articolo non trovato');

    const published = action === 'publish';
    const slug =
      existing.title !== title.trim() ? await generateSlug(title) : existing.slug;

    const finalExcerpt =
      typeof excerpt === 'string' && excerpt.trim()
        ? excerpt.trim()
        : content.replace(/<[^>]*>/g, '').slice(0, 160);

    await updateArticle(params.id, {
      title: title.trim(),
      slug,
      content,
      excerpt: finalExcerpt,
      coverImage: typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : undefined,
      published,
      publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt ?? undefined,
    });

    if (typeof tagsRaw === 'string') {
      const tagNames = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
      const tagIds = await Promise.all(tagNames.map((name) => findOrCreateTag(name).then((t) => t.id)));
      await setArticleTags(params.id, tagIds);
    }

    redirect(302, `${base}/admin`);
  },

  delete: async ({ params }) => {
    await deleteArticle(params.id);
    redirect(302, `${base}/admin`);
  },
};
