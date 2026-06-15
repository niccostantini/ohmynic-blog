<script lang="ts">
  import { enhance } from '$app/forms';
  import { base } from '$app/paths';
  import { addToast, dismissToast } from '$lib/stores/toast';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let emailError = $state(false);
  let passwordError = $state(false);
  let activeToastId = $state<string | undefined>();

  function showError(message: string) {
    if (activeToastId) dismissToast(activeToastId);
    activeToastId = addToast(message, 'error');
  }

  function loginEnhance({ formData, cancel }: { formData: FormData; cancel: () => void }) {
    const email = (formData.get('email') as string | null)?.trim();
    const password = formData.get('password') as string | null;

    emailError = !email;
    passwordError = !password;

    if (!email || !password) {
      cancel();
      return;
    }

    return async ({ result }: { result: { type: string; data?: Record<string, unknown> } }) => {
      if (result.type === 'failure') {
        const fe = result.data?.fieldError as string | undefined;
        emailError = fe === 'email' || fe === 'both';
        passwordError = fe === 'password' || fe === 'both';
        showError((result.data?.error as string) ?? 'Errore durante il login.');
      }
    };
  }
</script>

<svelte:head>
  <title>Accedi — OhMyNic!</title>
</svelte:head>

<div class="auth-wrap">
  <div class="auth-card">
    <div class="auth-logo">Oh<em>My</em>Nic!</div>
    <h1>Bentornato</h1>

    {#if data.redirectTo}
      <p class="access-hint">Accedi per visualizzare questa pagina.</p>
    {/if}

    {#if data.passwordReset}
      <p class="success">Password reimpostata con successo. Puoi accedere ora.</p>
    {/if}

    <!-- Fallback no-JS: con use:enhance e senza update() form resta null lato client -->
    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}

    <form method="POST" use:enhance={loginEnhance}>
      <div class="field">
        <label for="email">Email</label>
        <input
          id="email" name="email" type="email" required
          placeholder="la@tua.email" autocomplete="email"
          value={form?.email ?? ''}
          class:input--error={emailError}
          oninput={() => (emailError = false)}
        />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input
          id="password" name="password" type="password" required
          autocomplete="current-password"
          class:input--error={passwordError}
          oninput={() => (passwordError = false)}
        />
      </div>
      <button type="submit" class="btn-primary">Accedi</button>
    </form>

    <p class="auth-link">Non hai un account? <a href="{base}/register">Registrati</a></p>
    <p class="auth-link small">Password dimenticata? <a href="{base}/forgot-password">Reimposta</a></p>
  </div>
</div>

<style>
  .auth-wrap { min-height: calc(100vh - 60px); display: flex; align-items: center; justify-content: center; padding: var(--space-8) var(--space-4); }
  .auth-card { background: white; border: 0.5px solid var(--color-bordo); border-radius: var(--radius-xl); padding: var(--space-10) var(--space-8); width: 100%; max-width: 420px; box-shadow: var(--shadow-md); }
  .auth-logo { font-family: var(--font-serif); font-weight: 600; font-size: var(--text-2xl); color: var(--color-notte); letter-spacing: var(--tracking-tight); margin-bottom: var(--space-2); text-align: center; }
  .auth-logo em { font-style: italic; color: var(--color-lavanda); }
  h1 { font-family: var(--font-sans); font-size: var(--text-xl); font-weight: var(--weight-semibold); color: var(--color-notte); margin-bottom: var(--space-6); text-align: center; }
  .field { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-4); }
  label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-prugna); }
  input[type="email"], input[type="password"] {
    padding: 10px var(--space-3); border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md);
    font-family: var(--font-sans); font-size: var(--text-base); color: var(--color-notte);
    background: var(--color-nebbia); transition: border-color var(--transition-fast), background var(--transition-fast); outline: none; width: 100%;
  }
  input:focus { border-color: var(--color-lavanda); background: white; }
  input.input--error { border-color: #ef4444; background: #fef2f2; }
  input.input--error:focus { border-color: #dc2626; background: #fef2f2; }
  .btn-primary { width: 100%; padding: 11px; background: var(--color-lavanda); color: white; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; transition: background var(--transition-fast); margin-top: var(--space-2); }
  .btn-primary:hover { background: var(--color-viola); }
  .error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); }
  .auth-link { text-align: center; font-size: var(--text-sm); color: var(--color-lilla); margin-top: var(--space-5); }
  .auth-link.small { margin-top: var(--space-2); font-size: var(--text-xs); }
  .auth-link a { color: var(--color-viola); font-weight: var(--weight-medium); }
  .success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); }
  .access-hint { background: var(--color-nebbia); color: var(--color-prugna); border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); text-align: center; }

</style>
