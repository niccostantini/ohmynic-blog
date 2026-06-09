<script lang="ts">
  import { base } from '$app/paths';
  import { enhance } from '$app/forms';
  import { COUNTRIES } from '$lib/i18n/countries';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let tab = $state<'bookmarks' | 'comments' | 'settings'>('bookmarks');
  let showPasswordFields = $state(false);

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  async function logout() {
    await fetch(`${base}/api/reader-logout`, { method: 'POST' });
    window.location.href = `${base}/`;
  }
</script>

<svelte:head>
  <title>Il mio account — OhMyNic!</title>
</svelte:head>

<div class="account-wrap">
  <header class="account-header">
    <div class="account-avatar">
      {data.reader?.displayName?.charAt(0).toUpperCase() ?? '?'}
    </div>
    <div>
      <h1 class="account-name">{data.reader?.displayName}</h1>
      <p class="account-email">{data.reader?.email}</p>
    </div>
    <button class="btn-logout" onclick={logout}>Esci</button>
  </header>

  <nav class="tab-nav">
    <button class:active={tab === 'bookmarks'} onclick={() => tab = 'bookmarks'}>
      Salvati <span class="count">{data.bookmarks.length}</span>
    </button>
    <button class:active={tab === 'comments'} onclick={() => tab = 'comments'}>
      Commenti <span class="count">{data.comments.length}</span>
    </button>
    <button class:active={tab === 'settings'} onclick={() => tab = 'settings'}>Impostazioni</button>
  </nav>

  {#if tab === 'bookmarks'}
    <section class="tab-panel">
      {#if data.bookmarks.length === 0}
        <p class="empty">Nessun articolo salvato.</p>
      {:else}
        <ul class="article-list">
          {#each data.bookmarks as article}
            <li class="article-item">
              {#if article.coverImage}
                <img src={article.coverImage} alt={article.title} class="article-thumb" />
              {/if}
              <div class="article-info">
                <a href="{base}/{article.slug}" class="article-title">{article.title}</a>
                {#if article.publishedAt}
                  <time class="article-date">{formatDate(article.publishedAt)}</time>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

  {:else if tab === 'comments'}
    <section class="tab-panel">
      {#if data.comments.length === 0}
        <p class="empty">Nessun commento pubblicato.</p>
      {:else}
        <ul class="comment-list">
          {#each data.comments as comment}
            <li class="comment-item">
              <div class="comment-meta">
                <a href="{base}/{comment.articleSlug}" class="comment-article">{comment.articleTitle}</a>
                <time class="comment-date">{formatDate(comment.createdAt)}</time>
              </div>
              <p class="comment-content">{comment.content}</p>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

  {:else if tab === 'settings'}
    <section class="tab-panel settings-panel">

      <!-- Profilo pubblico -->
      <h2>Profilo pubblico</h2>
      <p class="section-note">Le informazioni che inserisci sono opzionali e visibili pubblicamente accanto ai tuoi commenti.</p>

      {#if form?.profileSaved}
        <div class="success">Profilo pubblico aggiornato.</div>
      {/if}

      <form method="POST" action="?/updatePublicProfile" use:enhance class="profile-form">
        <div class="field-row">
          <div class="field">
            <label for="country">Paese</label>
            <select id="country" name="country">
              <option value="">— Seleziona —</option>
              {#each COUNTRIES as c}
                <option value={c.code} selected={data.reader?.country === c.code}>{c.name}</option>
              {/each}
            </select>
          </div>
          <div class="field">
            <label for="city">Città</label>
            <input id="city" name="city" type="text" placeholder="Milano" value={data.reader?.city ?? ''} />
          </div>
        </div>

        <div class="field">
          <label for="website">Sito web</label>
          <input id="website" name="website" type="url" placeholder="https://tuosito.com" value={data.reader?.website ?? ''} />
        </div>

        <div class="field-row">
          <div class="field">
            <label for="twitter">Twitter / X</label>
            <input id="twitter" name="twitter" type="text" placeholder="@handle" value={data.reader?.twitter ? '@' + data.reader.twitter : ''} />
          </div>
          <div class="field">
            <label for="instagram">Instagram</label>
            <input id="instagram" name="instagram" type="text" placeholder="@handle" value={data.reader?.instagram ? '@' + data.reader.instagram : ''} />
          </div>
        </div>

        <div class="field">
          <label for="linkedin">LinkedIn</label>
          <input id="linkedin" name="linkedin" type="text" placeholder="URL o handle" value={data.reader?.linkedin ?? ''} />
        </div>

        <button type="submit" class="btn-primary">Salva profilo</button>
      </form>

      <hr class="settings-divider" />

      <!-- Impostazioni account -->
      <h2>Impostazioni account</h2>

      {#if form?.saved}
        <div class="success">Modifiche salvate.</div>
      {/if}
      {#if form?.error}
        <div class="error">{form.error}</div>
      {/if}

      <form method="POST" action="?/updateProfile" use:enhance>
        <div class="field">
          <label for="displayName">Nome</label>
          <input id="displayName" name="displayName" type="text" required
            value={data.reader?.displayName ?? ''} />
        </div>

        <div class="password-toggle">
          <button type="button" class="link-btn" onclick={() => showPasswordFields = !showPasswordFields}>
            {showPasswordFields ? '— Annulla cambio password' : '+ Cambia password'}
          </button>
        </div>

        {#if showPasswordFields}
          <div class="field">
            <label for="password">Nuova password <span class="hint">min. 12 caratteri</span></label>
            <input id="password" name="password" type="password" minlength="12" autocomplete="new-password" />
          </div>
          <div class="field">
            <label for="confirm">Conferma nuova password</label>
            <input id="confirm" name="confirm" type="password" minlength="12" autocomplete="new-password" />
          </div>
        {/if}

        <button type="submit" class="btn-primary">Salva modifiche</button>
      </form>
    </section>
  {/if}
</div>

<style>
  .account-wrap { max-width: 760px; margin: 0 auto; padding: var(--space-12) var(--space-8); }

  .account-header {
    display: flex; align-items: center; gap: var(--space-4);
    margin-bottom: var(--space-8);
    padding-bottom: var(--space-8);
    border-bottom: 0.5px solid var(--color-bordo);
  }
  .account-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--color-lavanda); color: white;
    font-family: var(--font-serif); font-size: var(--text-xl); font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .account-name { font-family: var(--font-serif); font-size: var(--text-xl); font-weight: 600; color: var(--color-notte); margin: 0; }
  .account-email { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-lilla); margin: var(--space-1) 0 0; }
  .btn-logout { margin-left: auto; font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-lilla); background: none; border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md); padding: 6px 14px; cursor: pointer; transition: color var(--transition-fast), border-color var(--transition-fast); }
  .btn-logout:hover { color: #b91c1c; border-color: #fecaca; }

  .tab-nav { display: flex; gap: 0; border-bottom: 0.5px solid var(--color-bordo); margin-bottom: var(--space-8); }
  .tab-nav button {
    font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
    color: var(--color-lilla); background: none; border: none; border-bottom: 2px solid transparent;
    padding: var(--space-3) var(--space-5); cursor: pointer; transition: color var(--transition-fast);
    display: flex; align-items: center; gap: var(--space-2);
  }
  .tab-nav button:hover { color: var(--color-notte); }
  .tab-nav button.active { color: var(--color-viola); border-bottom-color: var(--color-lavanda); }
  .count { font-size: var(--text-xs); background: var(--color-iris); color: var(--color-viola); border-radius: 99px; padding: 1px 7px; }

  .tab-panel { min-height: 200px; }
  .empty { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-lilla); padding: var(--space-8) 0; text-align: center; }

  .article-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--space-4); }
  .article-item { display: flex; gap: var(--space-4); align-items: flex-start; padding: var(--space-4); border: 0.5px solid var(--color-bordo); border-radius: var(--radius-lg); background: white; }
  .article-thumb { width: 80px; height: 60px; object-fit: cover; border-radius: var(--radius-md); flex-shrink: 0; }
  .article-info { flex: 1; }
  .article-title { font-family: var(--font-sans); font-size: var(--text-base); font-weight: var(--weight-medium); color: var(--color-notte); text-decoration: none; display: block; margin-bottom: var(--space-1); }
  .article-title:hover { color: var(--color-viola); }
  .article-date { font-family: var(--font-sans); font-size: var(--text-xs); color: var(--color-lilla); }

  .comment-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--space-4); }
  .comment-item { padding: var(--space-4); border: 0.5px solid var(--color-bordo); border-radius: var(--radius-lg); background: white; }
  .comment-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2); }
  .comment-article { font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-viola); text-decoration: none; }
  .comment-article:hover { color: var(--color-lavanda); }
  .comment-date { font-family: var(--font-sans); font-size: var(--text-xs); color: var(--color-lilla); }
  .comment-content { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-prugna); line-height: var(--leading-relaxed); margin: 0; }

  .settings-panel h2 { font-family: var(--font-serif); font-size: var(--text-xl); font-weight: 600; color: var(--color-notte); margin-bottom: var(--space-3); }
  .section-note { font-size: var(--text-sm); color: var(--color-lilla); margin-bottom: var(--space-5); line-height: 1.5; }
  .profile-form { margin-bottom: var(--space-2); }
  .settings-divider { border: none; border-top: 0.5px solid var(--color-bordo); margin: var(--space-8) 0; }
  .field-row { display: flex; gap: var(--space-3); }
  .field-row .field { flex: 1; }
  .field { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-4); }
  label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-prugna); }
  .hint { font-weight: normal; color: var(--color-lilla); font-size: var(--text-xs); }
  input[type="text"], input[type="password"], input[type="url"], select {
    padding: 10px var(--space-3); border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md);
    font-family: var(--font-sans); font-size: var(--text-base); color: var(--color-notte);
    background: var(--color-nebbia); transition: border-color var(--transition-fast); outline: none; width: 100%;
  }
  input:focus { border-color: var(--color-lavanda); background: white; }
  .password-toggle { margin-bottom: var(--space-4); }
  .link-btn { background: none; border: none; font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-viola); cursor: pointer; padding: 0; }
  .link-btn:hover { color: var(--color-lavanda); }
  .btn-primary { padding: 10px 24px; background: var(--color-lavanda); color: white; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; transition: background var(--transition-fast); margin-top: var(--space-2); }
  .btn-primary:hover { background: var(--color-viola); }
  .success { background: #d1fae5; color: #065f46; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); }
  .error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); }

  @media (max-width: 640px) {
    .account-wrap { padding: var(--space-8) var(--space-4); }
    .account-header { flex-wrap: wrap; }
    .btn-logout { order: 3; width: 100%; text-align: center; }
    .tab-nav { overflow-x: auto; }
  }
</style>
