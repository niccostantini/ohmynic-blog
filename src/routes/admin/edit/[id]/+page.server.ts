import { fail, redirect, error } from '@sveltejs/kit';
import { base } from '$app/paths';
import { TRANSITION_CHECKLISTS } from '$lib/workflow/checklists';
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  generateSlug,
  getTagsForArticle,
  setArticleTags,
  changeArticleStatus,
  getArticleStatusLog,
  canTransitionStatus,
  readingTime,
} from '$lib/db/queries/articles';
import { findOrCreateTag, getAllTags } from '$lib/db/queries/tags';
import { getActiveReviewers, getActiveAdmins, getUserById } from '$lib/db/queries/users';
import { getEditorialComments, reconcileBlockComments } from '$lib/db/queries/editorial-comments';
import {
  notifyReviewSubmitted,
  notifyArticleApproved,
  notifyReturnedToDraft,
  notifyArticlePublished,
} from '$lib/email';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, depends }) => {
  depends('app:editorial-comments');
  const user = locals.user!;
  const [article, tags, articleTags, statusLog, editorialCommentsList] = await Promise.all([
    getArticleById(params.id),
    getAllTags(),
    getTagsForArticle(params.id),
    getArticleStatusLog(params.id),
    getEditorialComments(params.id),
  ]);

  if (!article) error(404, 'Articolo non trovato');

  if (user.role === 'contributor' && article.authorId !== user.id) {
    error(403, 'Non hai i permessi per modificare questo articolo');
  }

  return { article, tags, articleTags, statusLog, editorialComments: editorialCommentsList };
};

export const actions: Actions = {
  save: async ({ request, params, locals }) => {
    const user = locals.user!;
    const data = await request.formData();
    const title = data.get('title');
    const content = data.get('content');
    const excerpt = data.get('excerpt');
    const coverImage = data.get('coverImage');
    const tagsRaw = data.get('tags');
    // Only update showCoverInArticle if a cover image URL is present (checkbox is visible)
    const hasCoverImage = typeof coverImage === 'string' && coverImage.trim().length > 0;
    const showCoverInArticle = hasCoverImage ? data.get('showCoverInArticle') === 'on' : undefined;

    if (typeof title !== 'string' || !title.trim()) {
      return fail(400, { error: 'Il titolo è obbligatorio.' });
    }
    if (typeof content !== 'string' || !content.trim() || content === '<p></p>') {
      return fail(400, { error: 'Il contenuto è obbligatorio.' });
    }

    const existing = await getArticleById(params.id);
    if (!existing) error(404, 'Articolo non trovato');

    if (user.role === 'contributor' && existing.authorId !== user.id) {
      error(403, 'Non hai i permessi per modificare questo articolo');
    }

    // Contributor can only edit draft articles
    if (user.role === 'contributor' && existing.status !== 'draft') {
      return fail(403, { error: 'Non puoi modificare un articolo già inviato in revisione.' });
    }

    const slug = existing.title !== title.trim() ? await generateSlug(title) : existing.slug;

    const finalExcerpt =
      typeof excerpt === 'string' && excerpt.trim()
        ? excerpt.trim()
        : content.replace(/<[^>]*>/g, '').slice(0, 160);

    // Parse blocksJson — used to preserve block IDs across sessions
    const blocksJsonRaw = data.get('blocksJson');
    const blocksJson = typeof blocksJsonRaw === 'string' && blocksJsonRaw.length > 2
      ? blocksJsonRaw
      : null;

    await updateArticle(params.id, {
      title: title.trim(),
      slug,
      content,
      blocksJson,
      excerpt: finalExcerpt,
      coverImage: typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : undefined,
      readingTimeMinutes: readingTime(content),
      showCoverInArticle,
    });

    if (typeof tagsRaw === 'string') {
      const tagNames = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
      const tagIds = await Promise.all(tagNames.map((name) => findOrCreateTag(name).then((t) => t.id)));
      await setArticleTags(params.id, tagIds);
    }

    // Fire-and-forget block comment reconciliation
    const blockSnapshotsRaw = data.get('blockSnapshots');
    if (typeof blockSnapshotsRaw === 'string' && blockSnapshotsRaw.length > 2) {
      try {
        const blockMap = JSON.parse(blockSnapshotsRaw) as Record<string, string>;
        if (Object.keys(blockMap).length > 0) {
          reconcileBlockComments(params.id, blockMap).catch(() => {});
        }
      } catch { /* ignore invalid JSON */ }
    }

    return { saved: true };
  },

  changeStatus: async ({ request, params, locals }) => {
    const user = locals.user!;
    const data = await request.formData();
    const toStatus = data.get('toStatus') as string;
    const note = typeof data.get('note') === 'string' ? (data.get('note') as string).trim() : '';

    const validStatuses = ['draft', 'review', 'approved', 'published'];
    if (!validStatuses.includes(toStatus)) {
      return fail(400, { statusError: 'Stato non valido.' });
    }

    const article = await getArticleById(params.id);
    if (!article) error(404, 'Articolo non trovato');

    const userForCheck = {
      role: user.role,
      canPublish: user.canPublish ?? false,
      userId: user.id,
    };

    if (!canTransitionStatus(userForCheck, article, toStatus)) {
      return fail(403, { statusError: 'Operazione non consentita per il tuo ruolo.' });
    }

    // Note required for → draft transitions
    if (toStatus === 'draft' && !note) {
      return fail(400, { statusError: 'La nota per l\'autore è obbligatoria.' });
    }

    // For approved→published: validate and save metadata before status change
    if (toStatus === 'published') {
      const publishTitle = (data.get('publishTitle') as string | null)?.trim() ?? '';
      const publishExcerpt = (data.get('publishExcerpt') as string | null)?.trim() ?? '';
      const publishedAtStr = data.get('publishedAt') as string | null;

      if (!publishTitle) return fail(400, { statusError: 'Il titolo è obbligatorio.' });
      if (!publishExcerpt) return fail(400, { statusError: "L'excerpt è obbligatorio." });

      const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date();
      if (isNaN(publishedAt.getTime())) {
        return fail(400, { statusError: 'Data di pubblicazione non valida.' });
      }

      // Update metadata — slug intentionally not regenerated to preserve existing links
      await updateArticle(params.id, { title: publishTitle, excerpt: publishExcerpt, publishedAt });
    }

    const fromStatus = article.status;

    const checklistRaw = data.get('checklistSnapshot');
    let checklistSnapshot: { label: string; checked: boolean }[] | null = null;

    const transitionKey = `${article.status}→${toStatus}`;
    const checklistDef = TRANSITION_CHECKLISTS[transitionKey];
    if (checklistDef) {
      if (!checklistRaw || typeof checklistRaw !== 'string') {
        return fail(400, { statusError: 'Checklist mancante.' });
      }
      try {
        checklistSnapshot = JSON.parse(checklistRaw);
      } catch {
        return fail(400, { statusError: 'Checklist non valida.' });
      }
      const allChecked = Array.isArray(checklistSnapshot) &&
        checklistSnapshot.length === checklistDef.items.length &&
        checklistSnapshot.every((item) => item.checked === true);
      if (!allChecked) {
        return fail(400, { statusError: 'Checklist incompleta. Spunta tutte le voci per procedere.' });
      }
    }

    await changeArticleStatus(
      params.id,
      fromStatus,
      toStatus as 'draft' | 'review' | 'approved' | 'published',
      user.id,
      note || null,
      checklistSnapshot,
    );

    // ── Async email notifications (fire-and-forget) ──────────────────────────
    const changerName = user.displayName ?? user.username;

    if (fromStatus === 'draft' && toStatus === 'review') {
      // Notify all editors and admins
      getActiveReviewers().then((reviewers) => {
        notifyReviewSubmitted({
          reviewers,
          articleTitle: article.title,
          articleId: article.id,
          authorName: changerName,
        });
      }).catch(() => {});
    }

    if (fromStatus === 'review' && toStatus === 'approved') {
      // Notify all admins
      getActiveAdmins().then((admins) => {
        notifyArticleApproved({
          admins,
          articleTitle: article.title,
          articleId: article.id,
          approvedByName: changerName,
        });
      }).catch(() => {});
    }

    if (toStatus === 'draft' && note) {
      // Notify article author
      if (article.authorId) {
        getUserById(article.authorId).then((author) => {
          if (author?.email) {
            notifyReturnedToDraft({
              to: author.email,
              authorName: author.displayName ?? author.username,
              articleTitle: article.title,
              articleId: article.id,
              note,
            });
          }
        }).catch(() => {});
      }
    }

    if (fromStatus === 'approved' && toStatus === 'published') {
      // Notify article author
      if (article.authorId) {
        getUserById(article.authorId).then((author) => {
          if (author?.email) {
            notifyArticlePublished({
              to: author.email,
              authorName: author.displayName ?? author.username,
              articleTitle: article.title,
              articleSlug: article.slug,
            });
          }
        }).catch(() => {});
      }
    }

    redirect(302, `${base}/admin/edit/${params.id}`);
  },

  delete: async ({ params, locals }) => {
    const user = locals.user!;
    const existing = await getArticleById(params.id);
    if (!existing) error(404, 'Articolo non trovato');

    if (user.role === 'contributor') {
      error(403, 'Non hai i permessi per eliminare articoli');
    }
    await deleteArticle(params.id);
    redirect(302, `${base}/admin`);
  },
};
