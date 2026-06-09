<script lang="ts">
  import { base } from '$app/paths';

  let {
    articleId,
    reader = null,
  }: {
    articleId: string;
    reader?: { id: string; displayName: string; email: string; emailVerified: boolean } | null;
  } = $props();

  let submitted = $state(false);
  let loading = $state(false);
  let error = $state('');

  let name = $state('');
  let email = $state('');
  let content = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!content.trim()) { error = 'Il commento non può essere vuoto.'; return; }
    loading = true;
    error = '';
    try {
      const res = await fetch(`${base}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          authorName: reader ? reader.displayName : (name || undefined),
          authorEmail: reader ? reader.email : (email || undefined),
          content,
        }),
      });
      if (!res.ok) throw new Error('Errore invio');
      submitted = true;
    } catch {
      error = 'Errore durante l\'invio. Riprova.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="comment-form-wrap">
  <h3>Lascia un commento</h3>

  {#if !reader}
    <div class="disclaimer">
      <em>Nome ed email sono facoltativi. Se inseriti, il nome appare accanto al commento e l'email viene usata solo per contattarti in risposta. I commenti sono moderati prima della pubblicazione.</em>
    </div>
  {:else}
    <div class="reader-info">
      Stai commentando come <strong>{reader.displayName}</strong>.
      <a href="{base}/account">Non sei tu?</a>
    </div>
  {/if}

  {#if submitted}
    <div class="success">
      Grazie! Il tuo commento è in attesa di approvazione.
    </div>
  {:else}
    <form onsubmit={handleSubmit}>
      {#if error}
        <p class="error">{error}</p>
      {/if}
      {#if !reader}
        <div class="form-row">
          <div class="field">
            <label for="comment-name">Nome <span class="optional">(opzionale)</span></label>
            <input id="comment-name" type="text" placeholder="Il tuo nome" bind:value={name} />
          </div>
          <div class="field">
            <label for="comment-email">Email <span class="optional">(opzionale)</span></label>
            <input id="comment-email" type="email" placeholder="la@tua.email" bind:value={email} />
          </div>
        </div>
      {/if}
      <div class="field">
        <label for="comment-content">Commento</label>
        <textarea id="comment-content" rows="5" placeholder="Scrivi qui il tuo commento..." bind:value={content} required></textarea>
      </div>
      <button type="submit" class="btn-accent" disabled={loading}>
        {loading ? 'Invio...' : 'Invia commento'}
      </button>
    </form>
  {/if}
</div>

<style>
  .comment-form-wrap {
    padding-top: var(--space-8);
    border-top: 0.5px solid var(--color-bordo);
  }
  h3 {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-4);
  }
  .disclaimer {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    line-height: var(--leading-relaxed);
    padding: var(--space-3) var(--space-4);
    background: var(--color-iris);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--color-lavanda);
    margin-bottom: var(--space-6);
  }
  .reader-info {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-prugna);
    padding: var(--space-3) var(--space-4);
    background: var(--color-iris);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--color-lavanda);
    margin-bottom: var(--space-6);
  }
  .reader-info a { color: var(--color-viola); }
  .success {
    padding: var(--space-4);
    background: #d1fae5;
    color: #065f46;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
  }
  .error {
    padding: var(--space-3) var(--space-4);
    background: #fef2f2;
    color: #b91c1c;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    margin-bottom: var(--space-4);
  }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
  .field { margin-bottom: var(--space-4); }
  label {
    display: block;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-prugna);
    margin-bottom: var(--space-2);
  }
  .optional { color: var(--color-lilla); font-weight: var(--weight-normal); }
  input, textarea {
    width: 100%;
    padding: 10px var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    color: var(--color-notte);
    background: white;
    outline: none;
    resize: vertical;
    transition: border-color var(--transition-fast);
  }
  input:focus, textarea:focus { border-color: var(--color-lavanda); }
  .btn-accent {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 9px 20px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    letter-spacing: var(--tracking-wide);
    transition: background var(--transition-fast);
  }
  .btn-accent:hover:not(:disabled) { background: var(--color-viola); }
  .btn-accent:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 600px) {
    .form-row { grid-template-columns: 1fr; }
  }
</style>
