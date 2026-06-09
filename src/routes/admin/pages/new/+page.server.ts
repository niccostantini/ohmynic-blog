import { fail, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { createPage, generateSlug } from '$lib/db/queries/articles';
import { syncPageNavItem } from '$lib/db/queries/navItems';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user?.role !== 'admin') {
    redirect(302, `${base}/admin`);
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (locals.user?.role !== 'admin') return fail(403, { error: 'Accesso negato' });

    const user = locals.user;
    const data = await request.formData();
    const title = data.get('title');
    const content = data.get('content');
    const excerpt = data.get('excerpt');
    const coverImage = data.get('coverImage');

    if (typeof title !== 'string' || !title.trim()) {
      return fail(400, { error: 'Il titolo è obbligatorio.' });
    }
    if (typeof content !== 'string' || !content.trim() || content === '<p></p>') {
      return fail(400, { error: 'Il contenuto è obbligatorio.' });
    }

    const slug = await generateSlug(title);
    const page = await createPage({
      title: title.trim(),
      slug,
      content,
      excerpt: typeof excerpt === 'string' && excerpt.trim() ? excerpt.trim() : undefined,
      coverImage: typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : undefined,
      authorId: user.id,
    });

    redirect(302, `${base}/admin/pages/edit/${page.id}`);
  },
};
