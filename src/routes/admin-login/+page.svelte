<script lang="ts">
  import { enhance, applyAction } from '$app/forms';
  import { addToast, dismissToast } from '$lib/stores/toast';
  import Toast from '$lib/components/Toast.svelte';
  import type { ActionData, PageData } from './$types';
  import type { ActionResult } from '@sveltejs/kit';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let usernameError = $state(false);
  let passwordError = $state(false);
  let activeToastId = $state<string | undefined>();

  function showError(message: string) {
    if (activeToastId) dismissToast(activeToastId);
    activeToastId = addToast(message, 'error');
  }

  function loginEnhance({ formData, cancel }: { formData: FormData; cancel: () => void }) {
    const username = (formData.get('username') as string | null)?.trim();
    const password = formData.get('password') as string | null;

    usernameError = !username;
    passwordError = !password;

    if (!username || !password) {
      cancel();
      return;
    }

    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'failure') {
        const fe = result.data?.fieldError as string | undefined;
        usernameError = fe === 'username' || fe === 'both';
        passwordError = fe === 'password' || fe === 'both';
        showError((result.data?.error as string) ?? 'Errore durante il login.');
      } else {
        await applyAction(result);
      }
    };
  }
</script>

<svelte:head>
  <title>Login Admin — OhMyNic!</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="login-wrap">
  <div class="login-card">
    <div class="login-logo">Oh<em>My</em>Nic!</div>
    <h1>Pannello di amministrazione</h1>

    {#if data.passwordReset}
      <p class="success">Password reimpostata con successo. Puoi accedere ora.</p>
    {/if}

    <!-- Fallback no-JS: con use:enhance e senza update() form resta null lato client -->
    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}

    <form method="POST" use:enhance={loginEnhance}>
      <div class="field">
        <label for="username">Username</label>
        <input
          id="username" name="username" type="text"
          autocomplete="username" required
          value={form?.username ?? ''}
          class:input--error={usernameError}
          oninput={() => (usernameError = false)}
        />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input
          id="password" name="password" type="password"
          autocomplete="current-password" required
          class:input--error={passwordError}
          oninput={() => (passwordError = false)}
        />
      </div>
      <button type="submit" class="btn-primary">Entra</button>
    </form>

    <p class="forgot-link"><a href="/blog/admin-forgot-password">Password dimenticata?</a></p>
  </div>
</div>
<Toast />

<style>
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-nebbia); padding: var(--space-4); }
  .login-card { background: white; border: 0.5px solid var(--color-bordo); border-radius: var(--radius-xl); padding: var(--space-10) var(--space-8); width: 100%; max-width: 400px; box-shadow: var(--shadow-md); }
  .login-logo { font-family: var(--font-serif); font-weight: 600; font-size: var(--text-2xl); color: var(--color-notte); letter-spacing: var(--tracking-tight); margin-bottom: var(--space-2); text-align: center; }
  .login-logo em { font-style: italic; color: var(--color-lavanda); }
  h1 { font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-lilla); margin-bottom: var(--space-6); text-align: center; }
  .field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
  label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-prugna); }
  input {
    padding: 10px var(--space-3); border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md);
    font-family: var(--font-sans); font-size: var(--text-base); color: var(--color-notte);
    background: var(--color-nebbia); transition: border-color var(--transition-fast), background var(--transition-fast); outline: none;
  }
  input:focus { border-color: var(--color-lavanda); background: white; }
  input.input--error { border-color: #ef4444; background: #fef2f2; }
  input.input--error:focus { border-color: #dc2626; background: #fef2f2; }
  .error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); }
  .btn-primary { width: 100%; padding: 11px; margin-top: var(--space-2); background: var(--color-lavanda); color: white; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; transition: background var(--transition-fast); }
  .btn-primary:hover { background: var(--color-viola); }
  .success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); }
  .forgot-link { text-align: center; font-size: var(--text-xs); color: var(--color-lilla); margin-top: var(--space-4); }
  .forgot-link a { color: var(--color-viola); }

</style>
