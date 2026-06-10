import { fail, redirect, error } from '@sveltejs/kit';
import { base } from '$app/paths';
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  generateSlug,
  readingTime,
  changeArticleStatus,
} from '$lib/db/queries/articles';
import { syncPageNavItem } from '$lib/db/queries/navItems';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (locals.user?.role !== 'admin') error(403, 'Accesso negato');

  const page = await getArticleById(params.id);
  if (!page) error(404, 'Pagina non trovata');
  if (page.type !== 'page') error(404, 'Non è una pagina');

  return { page };
};

export const actions: Actions = {
  save: async ({ request, params, locals }) => {
    if (locals.user?.role !== 'admin') return fail(403, { error: 'Accesso negato' });

    const data = await request.formData();
    const title = data.get('title');
    const content = data.get('content');
    const excerpt = data.get('excerpt');
    const coverImage = data.get('coverImage');
    const slugRaw = data.get('slug');
    const showComments = data.get('showComments') === 'on';
    const showInNavbar = data.get('showInNavbar') === 'on';
    const visibleToRaw = data.get('visibleTo');
    const visibleTo: string[] = visibleToRaw
      ? (() => { try { return JSON.parse(visibleToRaw as string); } catch { return ['public']; } })()
      : ['public'];

    if (typeof title !== 'string' || !title.trim()) {
      return fail(400, { error: 'Il titolo è obbligatorio.' });
    }
    if (typeof content !== 'string' || !content.trim() || content === '<p></p>') {
      return fail(400, { error: 'Il contenuto è obbligatorio.' });
    }

    const existing = await getArticleById(params.id);
    if (!existing || existing.type !== 'page') error(404, 'Pagina non trovata');

    // Use custom slug if provided, otherwise keep existing
    let slug = existing.slug;
    if (typeof slugRaw === 'string' && slugRaw.trim() && slugRaw.trim() !== existing.slug) {
      slug = await generateSlug(slugRaw.trim());
    } else if (existing.title !== title.trim()) {
      // Only regenerate slug if title changed and no custom slug provided
      slug = existing.slug; // keep slug stable for pages
    }

    const blocksJsonRaw = data.get('blocksJson');
    const blocksJson = typeof blocksJsonRaw === 'string' && blocksJsonRaw.length > 2
      ? blocksJsonRaw
      : null;

    const hasCoverImage = typeof coverImage === 'string' && coverImage.trim().length > 0;
    const showCoverInArticle = hasCoverImage ? data.get('showCoverInArticle') === 'on' : undefined;

    await updateArticle(params.id, {
      title: title.trim(),
      slug,
      content,
      blocksJson,
      excerpt: typeof excerpt === 'string' && excerpt.trim() ? excerpt.trim() : undefined,
      coverImage: hasCoverImage ? (coverImage as string).trim() : undefined,
      readingTimeMinutes: readingTime(content),
      showComments,
      showInNavbar,
      showCoverInArticle,
      visibleTo,
    });

    // Sync navbar item
    await syncPageNavItem(params.id, title.trim(), slug, showInNavbar && existing.status === 'published');

    return { saved: true };
  },

  publish: async ({ params, locals }) => {
    const user = locals.user!;
    if (user.role !== 'admin') return fail(403, { error: 'Accesso negato' });

    const existing = await getArticleById(params.id);
    if (!existing || existing.type !== 'page') error(404, 'Pagina non trovata');

    await changeArticleStatus(params.id, existing.status, 'published', user.id, 'Pagina pubblicata');

    // Sync navbar if showInNavbar
    if (existing.showInNavbar) {
      await syncPageNavItem(params.id, existing.title, existing.slug, true);
    }

    return { published: true };
  },

  unpublish: async ({ params, locals }) => {
    const user = locals.user!;
    if (user.role !== 'admin') return fail(403, { error: 'Accesso negato' });

    const existing = await getArticleById(params.id);
    if (!existing || existing.type !== 'page') error(404, 'Pagina non trovata');

    await updateArticle(params.id, { status: 'draft' });
    await syncPageNavItem(params.id, existing.title, existing.slug, false);

    return { unpublished: true };
  },

  delete: async ({ params, locals }) => {
    if (locals.user?.role !== 'admin') return fail(403, { error: 'Accesso negato' });
    const existing = await getArticleById(params.id);
    if (!existing || existing.type !== 'page') error(404, 'Pagina non trovata');
    await deleteArticle(params.id);
    redirect(302, `${base}/admin/pages`);
  },
};
