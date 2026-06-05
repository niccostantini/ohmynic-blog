import { fail, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { createArticle, generateSlug, setArticleTags } from '$lib/db/queries/articles';
import { findOrCreateTag, getAllTags } from '$lib/db/queries/tags';
import { SUPPORTED_LOCALES } from '$lib/translate';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const tags = await getAllTags();
  return { tags };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const title = data.get('title');
    const content = data.get('content');
    const excerpt = data.get('excerpt');
    const coverImage = data.get('coverImage');
    const tagsRaw = data.get('tags');
    const action = data.get('action');
    const localeRaw = data.get('locale');

    if (typeof title !== 'string' || !title.trim()) {
      return fail(400, { error: 'Il titolo è obbligatorio.' });
    }
    if (typeof content !== 'string' || !content.trim() || content === '<p></p>') {
      return fail(400, { error: 'Il contenuto è obbligatorio.' });
    }

    const locale =
      typeof localeRaw === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(localeRaw)
        ? localeRaw
        : 'it';

    const published = action === 'publish';
    const slug = await generateSlug(title);

    const finalExcerpt =
      typeof excerpt === 'string' && excerpt.trim()
        ? excerpt.trim()
        : content.replace(/<[^>]*>/g, '').slice(0, 160);

    const article = await createArticle({
      slug,
      coverImage: typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : undefined,
      locale,
      title: title.trim(),
      content,
      excerpt: finalExcerpt,
      published,
      publishedAt: published ? new Date() : undefined,
    });

    if (typeof tagsRaw === 'string' && tagsRaw.trim()) {
      const tagNames = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
      const tagIds = await Promise.all(tagNames.map((name) => findOrCreateTag(name).then((t) => t.id)));
      await setArticleTags(article.id, tagIds);
    }

    redirect(302, `${base}/admin`);
  },
};
