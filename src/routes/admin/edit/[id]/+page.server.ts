import { fail, redirect, error } from '@sveltejs/kit';
import { base } from '$app/paths';
import {
  getArticleById,
  getArticleTranslation,
  getAllTranslationsForArticle,
  updateArticleBase,
  upsertArticleTranslation,
  deleteArticle,
  generateSlug,
  getTagsForArticle,
  setArticleTags,
} from '$lib/db/queries/articles';
import { findOrCreateTag, getAllTags } from '$lib/db/queries/tags';
import { SUPPORTED_LOCALES } from '$lib/translate';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const localeParam = url.searchParams.get('locale') ?? 'it';
  const locale =
    (SUPPORTED_LOCALES as readonly string[]).includes(localeParam) ? localeParam : 'it';

  const [article, translation, allTranslations, allTags, articleTagsList] = await Promise.all([
    getArticleById(params.id),
    getArticleTranslation(params.id, locale),
    getAllTranslationsForArticle(params.id),
    getAllTags(),
    getTagsForArticle(params.id),
  ]);

  if (!article) error(404, 'Articolo non trovato');

  return { article, translation, allTranslations, locale, tags: allTags, articleTags: articleTagsList };
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
    const locale = data.get('locale') as string ?? 'it';

    if (typeof title !== 'string' || !title.trim()) {
      return fail(400, { error: 'Il titolo è obbligatorio.' });
    }
    if (typeof content !== 'string' || !content.trim() || content === '<p></p>') {
      return fail(400, { error: 'Il contenuto è obbligatorio.' });
    }

    const existing = await getArticleById(params.id);
    if (!existing) error(404, 'Articolo non trovato');

    const existingTranslation = await getArticleTranslation(params.id, locale);
    const published = action === 'publish';

    const finalExcerpt =
      typeof excerpt === 'string' && excerpt.trim()
        ? excerpt.trim()
        : content.replace(/<[^>]*>/g, '').slice(0, 160);

    // Update slug only if IT title changed
    let slug = existing.slug;
    if (locale === 'it' && existingTranslation && existingTranslation.title !== title.trim()) {
      slug = await generateSlug(title);
    }

    // Update base article (slug + coverImage)
    await updateArticleBase(params.id, {
      slug,
      coverImage:
        typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : null,
    });

    // Upsert translation
    await upsertArticleTranslation(params.id, locale, {
      title: title.trim(),
      content,
      excerpt: finalExcerpt,
      published,
      publishedAt:
        published && !existingTranslation?.publishedAt
          ? new Date()
          : existingTranslation?.publishedAt ?? null,
    });

    if (typeof tagsRaw === 'string') {
      const tagNames = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
      const tagIds = await Promise.all(
        tagNames.map((name) => findOrCreateTag(name).then((t) => t.id)),
      );
      await setArticleTags(params.id, tagIds);
    }

    redirect(302, `${base}/admin/edit/${params.id}?locale=${locale}`);
  },

  delete: async ({ params }) => {
    await deleteArticle(params.id);
    redirect(302, `${base}/admin`);
  },
};
