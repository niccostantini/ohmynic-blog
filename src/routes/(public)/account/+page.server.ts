import { redirect, fail } from '@sveltejs/kit';
import { verify, hash } from 'argon2';
import { base } from '$app/paths';
import { getBookmarkedArticles, getCommentsByReader, getReaderById } from '$lib/db/queries/readers';
import { db } from '$lib/db/index';
import { readers } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.reader) redirect(302, `${base}/login`);

  const [bookmarks, readerComments] = await Promise.all([
    getBookmarkedArticles(locals.reader.id),
    getCommentsByReader(locals.reader.id),
  ]);

  return {
    bookmarks,
    comments: readerComments,
  };
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    if (!locals.reader) redirect(302, `${base}/login`);

    const data = await request.formData();
    const displayName = data.get('displayName');
    const password = data.get('password');
    const confirm = data.get('confirm');

    if (typeof displayName !== 'string' || !displayName.trim())
      return fail(400, { error: 'Il nome è obbligatorio.' });

    const updates: Record<string, unknown> = { displayName: displayName.trim() };

    if (typeof password === 'string' && password) {
      if (password.length < 12)
        return fail(400, { error: 'La nuova password deve essere di almeno 12 caratteri.' });
      if (password !== confirm)
        return fail(400, { error: 'Le password non coincidono.' });

      const reader = await getReaderById(locals.reader.id);
      if (!reader) redirect(302, `${base}/login`);

      let sameAsOld = false;
      try { sameAsOld = await verify(reader.passwordHash, password); } catch { /* ok */ }
      if (sameAsOld)
        return fail(400, { error: 'La nuova password deve essere diversa da quella attuale.' });

      updates.passwordHash = await hash(password);
    }

    await db.update(readers).set(updates).where(eq(readers.id, locals.reader.id));
    return { saved: true };
  },
};
