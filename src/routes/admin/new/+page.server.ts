import { fail, redirect } from '@sveltejs/kit';
import { createArticle, generateSlug, setArticleTags } from '$lib/db/queries/articles';
import { findOrCreateTag, getAllTags } from '$lib/db/queries/tags';
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

    if (typeof title !== 'string' || !title.trim()) {
      return fail(400, { error: 'Il titolo è obbligatorio.' });
    }
    if (typeof content !== 'string' || !content.trim() || content === '<p></p>') {
      return fail(400, { error: 'Il contenuto è obbligatorio.' });
    }

    const published = action === 'publish';
    const slug = await generateSlug(title);

    const finalExcerpt =
      typeof excerpt === 'string' && excerpt.trim()
        ? excerpt.trim()
        : content.replace(/<[^>]*>/g, '').slice(0, 160);

    const article = await createArticle({
      title: title.trim(),
      slug,
      content,
      excerpt: finalExcerpt,
      coverImage: typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : undefined,
      published,
      publishedAt: published ? new Date() : undefined,
    });

    if (typeof tagsRaw === 'string' && tagsRaw.trim()) {
      const tagNames = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
      const tagIds = await Promise.all(tagNames.map((name) => findOrCreateTag(name).then((t) => t.id)));
      await setArticleTags(article.id, tagIds);
    }

    redirect(302, '/admin');
  },
};
