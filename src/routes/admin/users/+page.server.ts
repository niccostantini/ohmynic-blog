import { fail, error } from '@sveltejs/kit';
import { hash } from 'argon2';
import {
  getAllUsers,
  createUser,
  updateUser,
  setUserActive,
  isUsernameTaken,
  isEmailTaken,
} from '$lib/db/queries/users';
import { sendWelcomeEmail } from '$lib/email';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user?.role !== 'admin') error(403, 'Accesso negato');
  const users = await getAllUsers();
  return { users };
};

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (locals.user?.role !== 'admin') return fail(403);

    const data = await request.formData();
    const displayName = data.get('displayName');
    const username = data.get('username');
    const email = data.get('email');
    const role = data.get('role');

    if (typeof displayName !== 'string' || !displayName.trim())
      return fail(400, { createError: 'Il nome è obbligatorio.' });
    if (typeof username !== 'string' || !username.trim())
      return fail(400, { createError: 'Lo username è obbligatorio.' });
    if (typeof email !== 'string' || !email.trim())
      return fail(400, { createError: "L'email è obbligatoria." });
    if (!['admin', 'editor', 'contributor'].includes(role as string))
      return fail(400, { createError: 'Ruolo non valido.' });

    const tempPassword = generateTempPassword();
    const passwordHash = await hash(tempPassword);
    const id = crypto.randomUUID();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    try {
      await createUser({
        id,
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: role as 'admin' | 'editor' | 'contributor',
        displayName: displayName.trim(),
        mustChangePassword: true,
      });
    } catch (e: any) {
      if (e.message?.includes('unique') || e.code === '23505') {
        return fail(400, { createError: 'Username o email già in uso.' });
      }
      throw e;
    }

    sendWelcomeEmail({
      to: cleanEmail,
      displayName: displayName.trim(),
      username: cleanUsername,
      tempPassword,
    });

    return { created: true, tempPassword, createdUsername: cleanUsername };
  },

  update: async ({ request, locals }) => {
    if (locals.user?.role !== 'admin') return fail(403);

    const data = await request.formData();
    const id = data.get('id');
    if (typeof id !== 'string') return fail(400);

    const displayName = data.get('displayName');
    const username = data.get('username');
    const email = data.get('email');
    const bio = data.get('bio');
    const avatarUrl = data.get('avatarUrl');
    const role = data.get('role');
    const password = data.get('password');
    const confirm = data.get('confirm');

    if (typeof displayName !== 'string' || !displayName.trim())
      return fail(400, { editId: id, editError: 'Il nome è obbligatorio.' });
    if (typeof username !== 'string' || !username.trim())
      return fail(400, { editId: id, editError: 'Lo username è obbligatorio.' });
    if (!['admin', 'editor', 'contributor'].includes(role as string))
      return fail(400, { editId: id, editError: 'Ruolo non valido.' });

    // Admin non può cambiare il proprio ruolo
    if (id === locals.user!.id && role !== locals.user!.role)
      return fail(400, { editId: id, editError: 'Non puoi cambiare il tuo stesso ruolo.' });

    const cleanUsername = (username as string).trim().toLowerCase();
    const cleanEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;

    // Unicità username
    if (await isUsernameTaken(cleanUsername, id))
      return fail(400, { editId: id, editError: 'username_taken' });

    // Unicità email
    if (cleanEmail && await isEmailTaken(cleanEmail, id))
      return fail(400, { editId: id, editError: 'email_taken' });

    // Validazione password opzionale
    let passwordHash: string | undefined;
    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 12)
        return fail(400, { editId: id, editError: 'La nuova password deve essere di almeno 12 caratteri.' });
      if (password !== confirm)
        return fail(400, { editId: id, editError: 'Le password non coincidono.' });
      passwordHash = await hash(password);
    }

    // canPublish only applies to editors; reset it for other roles
    const newRole = role as 'admin' | 'editor' | 'contributor';
    const canPublishRaw = data.get('canPublish');
    const canPublish = newRole === 'editor' ? canPublishRaw === 'true' : false;

    await updateUser(id, {
      displayName: (displayName as string).trim(),
      username: cleanUsername,
      email: cleanEmail,
      bio: typeof bio === 'string' && bio.trim() ? bio.trim() : null,
      avatarUrl: typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl.trim() : null,
      role: newRole,
      canPublish,
      ...(passwordHash ? { passwordHash, mustChangePassword: false } : {}),
    });

    return { updated: true, updatedId: id };
  },

  toggleActive: async ({ request, locals }) => {
    if (locals.user?.role !== 'admin') return fail(403);
    const data = await request.formData();
    const id = data.get('id');
    const active = data.get('active') === 'true';
    if (typeof id !== 'string') return fail(400);
    if (id === locals.user!.id)
      return fail(400, { editId: id, editError: 'Non puoi disattivare il tuo stesso account.' });
    await setUserActive(id, active);
    return { toggled: true, toggledId: id };
  },
};
