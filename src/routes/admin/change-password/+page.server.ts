import { fail, redirect } from '@sveltejs/kit';
import { hash } from 'argon2';
import { base } from '$app/paths';
import { updateUserPassword } from '$lib/db/queries/users';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Se non ha mustChangePassword e non è il cambio volontario, redirect
  if (!locals.user?.mustChangePassword) {
    redirect(302, `${base}/admin`);
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const user = locals.user!;
    const data = await request.formData();
    const password = data.get('password');
    const confirm = data.get('confirm');

    if (typeof password !== 'string' || password.length < 8) {
      return fail(400, { error: 'La password deve essere di almeno 8 caratteri.' });
    }
    if (password !== confirm) {
      return fail(400, { error: 'Le password non coincidono.' });
    }

    const passwordHash = await hash(password);
    await updateUserPassword(user.id, passwordHash);

    redirect(302, `${base}/admin`);
  },
};
