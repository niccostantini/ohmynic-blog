<script lang="ts">
  import { enhance } from '$app/forms';
  import { base } from '$app/paths';
  import Editor from '$lib/components/Editor.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const LOCALES: { code: string; label: string }[] = [
    { code: 'it', label: '🇮🇹 IT' },
    { code: 'en', label: '🇬🇧 EN' },
  ];

  // Current translation state
  let title = $state(data.translation?.title ?? '');
  let content = $state(data.translation?.content ?? '');
  let excerpt = $state(data.translation?.excerpt ?? '');
  let coverImage = $state(data.article.coverImage ?? '');
  let tagInput = $state('');
  let selectedTags = $state<string[]>(data.articleTags.map((t) => t.name));

  // Editor ref for programmatic reload
  let editorRef = $state<{ reload: (html: string) => void } | null>(null);

  // Auto-translate state
  let translating = $state(false);
  let translateError = $state('');

  // Original (IT) translation for reference panel
  const itTranslation = $derived(data.allTranslations.find((t) => t.locale === 'it') ?? null);
  const showOriginal = $derived(data.locale !== 'it' && itTranslation !== null);
  const isNewTranslation = $derived(!data.translation);

  function localeStatus(code: string) {
    const t = data.allTranslations.find((x) => x.locale === code);
    if (!t) return 'missing';
    return t.published ? 'published' : 'draft';
  }

  let suggestions = $derived(
    tagInput.length > 0
      ? data.tags.filter(
          (t) =>
            t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
            !selectedTags.includes(t.name)
        )
      : []
  );

  function addTag(name: string) {
    const trimmed = name.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      selectedTags = [...selectedTags, trimmed];
    }
    tagInput = '';
  }

  function removeTag(name: string) {
    selectedTags = selectedTags.filter((t) => t !== name);
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  async function autoTranslate() {
    translating = true;
    translateError = '';
    try {
      const res = await fetch(`${base}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: data.article.id,
          fromLocale: 'it',
          toLocale: data.locale,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message ?? `Errore ${res.status} nella traduzione automatica`);
      }
      const result = await res.json();
      title = result.title ?? title;
      excerpt = result.excerpt ?? excerpt;
      if (result.content) {
        editorRef?.reload(result.content);
      }
    } catch (err) {
      translateError = err instanceof Error ? err.message : 'Errore sconosciuto';
    } finally {
      translating = false;
    }
  }
</script>

<svelte:head><title>Modifica — {data.translation?.title ?? 'Nuovo'} — OhMyNic!</title></svelte:head>

<div class="editor-page">
  <!-- Header -->
  <div class="editor-header">
    <h1>Modifica articolo</h1>
    <div class="header-actions">
      {#if data.translation?.published}
        <a href="{base}/{data.article.slug}{data.locale !== 'it' ? '?lang=' + data.locale : ''}" target="_blank" class="btn-ghost">
          Vedi pubblicato →
        </a>
      {/if}
    </div>
  </div>

  <!-- Locale tab bar -->
  <div class="locale-bar">
    {#each LOCALES as loc}
      {@const status = localeStatus(loc.code)}
      <a
        href="{base}/admin/edit/{data.article.id}?locale={loc.code}"
        class="locale-tab"
        class:active={data.locale === loc.code}
        class:published={status === 'published'}
        class:draft={status === 'draft'}
        class:missing={status === 'missing'}
      >
        {loc.label}
        <span class="locale-tab-status {status}"></span>
      </a>
    {/each}
  </div>

  {#if form?.error}<p class="error">{form.error}</p>{/if}

  <!-- Auto-translate banner (only for non-IT, when IT translation exists) -->
  {#if showOriginal && isNewTranslation}
    <div class="translate-banner">
      <span>
        Nessuna traduzione in <strong>{data.locale.toUpperCase()}</strong> ancora.
        Vuoi tradurre automaticamente dall'italiano?
      </span>
      <button type="button" class="btn-accent-sm" onclick={autoTranslate} disabled={translating}>
        {translating ? 'Traduzione in corso…' : 'Traduci automaticamente IT → ' + data.locale.toUpperCase()}
      </button>
      {#if translateError}
        <p class="translate-error">{translateError}</p>
      {/if}
    </div>
  {:else if showOriginal}
    <div class="translate-banner translate-banner-refresh">
      <span>Traduzione {data.locale.toUpperCase()} esistente.</span>
      <button type="button" class="btn-ghost-sm" onclick={autoTranslate} disabled={translating}>
        {translating ? 'Traduzione in corso…' : 'Rigenera da IT'}
      </button>
      {#if translateError}
        <p class="translate-error">{translateError}</p>
      {/if}
    </div>
  {/if}

  <!-- Side-by-side layout when editing a translation -->
  <div class="edit-layout" class:side-by-side={showOriginal}>
    {#if showOriginal && itTranslation}
      <div class="original-panel">
        <div class="panel-label">Originale (IT)</div>
        <div class="original-title">{itTranslation.title}</div>
        <div class="original-content prose">{@html itTranslation.content}</div>
      </div>
    {/if}

    <div class="edit-col">
      <form method="POST" action="?/save" use:enhance>
        <input type="hidden" name="content" value={content} />
        <input type="hidden" name="tags" value={selectedTags.join(',')} />
        <input type="hidden" name="locale" value={data.locale} />

        <div class="field">
          <input
            name="title"
            type="text"
            placeholder="Titolo dell'articolo"
            class="title-input"
            bind:value={title}
            required
          />
        </div>

        <div class="field">
          <Editor bind:content bind:this={editorRef} />
        </div>

        <div class="meta-fields">
          <div class="field">
            <label>Estratto (opzionale)</label>
            <textarea name="excerpt" rows="3" bind:value={excerpt}></textarea>
          </div>
          {#if data.locale === 'it'}
            <div class="field">
              <label>Immagine copertina (URL)</label>
              <input name="coverImage" type="url" bind:value={coverImage} />
            </div>
            <div class="field">
              <label>Tag</label>
              <div class="tag-input-wrap">
                {#each selectedTags as tag}
                  <span class="tag-pill">
                    {tag}
                    <button type="button" onclick={() => removeTag(tag)}>×</button>
                  </span>
                {/each}
                <input
                  type="text"
                  placeholder="Aggiungi tag..."
                  bind:value={tagInput}
                  onkeydown={handleTagKeydown}
                />
              </div>
              {#if suggestions.length > 0}
                <ul class="suggestions">
                  {#each suggestions as s}
                    <li><button type="button" onclick={() => addTag(s.name)}>{s.name}</button></li>
                  {/each}
                </ul>
              {/if}
            </div>
          {:else}
            <input type="hidden" name="coverImage" value={coverImage} />
          {/if}
        </div>

        <div class="form-actions">
          <button type="submit" name="action" value="draft" class="btn-ghost">Salva bozza</button>
          <button type="submit" name="action" value="publish" class="btn-accent">
            {data.translation?.published ? 'Aggiorna' : 'Pubblica'}
          </button>
        </div>
      </form>
    </div>
  </div>

  {#if data.locale === 'it'}
    <form method="POST" action="?/delete" use:enhance class="delete-form">
      <button
        type="submit"
        class="btn-danger"
        onclick={(e) => { if (!confirm('Eliminare definitivamente questo articolo e tutte le sue traduzioni?')) e.preventDefault(); }}
      >
        Elimina articolo
      </button>
    </form>
  {/if}
</div>

<style>
  .editor-page { max-width: 1200px; margin: 0 auto; }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .header-actions { display: flex; gap: var(--space-3); }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  /* ── Locale tab bar ── */
  .locale-bar {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-6);
    border-bottom: 0.5px solid var(--color-bordo);
    padding-bottom: var(--space-3);
  }

  .locale-tab {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    padding: 6px 14px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    background: white;
    color: var(--color-prugna);
    text-decoration: none;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .locale-tab.active {
    border-color: var(--color-lavanda);
    background: var(--color-iris);
    color: var(--color-viola);
  }

  .locale-tab-status {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .locale-tab-status.published { background: #10b981; }
  .locale-tab-status.draft { background: var(--color-lavanda); }
  .locale-tab-status.missing { background: var(--color-bordo); }

  /* ── Translate banner ── */
  .translate-banner {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
    padding: var(--space-3) var(--space-5);
    background: #eff6ff;
    border: 0.5px solid #bfdbfe;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: #1e40af;
    margin-bottom: var(--space-5);
  }

  .translate-banner-refresh {
    background: var(--color-iris);
    border-color: var(--color-bordo);
    color: var(--color-prugna);
  }

  .translate-error {
    width: 100%;
    color: #b91c1c;
    font-size: var(--text-xs);
    margin: 0;
  }

  .btn-accent-sm {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 5px 12px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--transition-fast);
  }
  .btn-accent-sm:hover:not(:disabled) { background: var(--color-viola); }
  .btn-accent-sm:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-ghost-sm {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    background: transparent;
    color: var(--color-prugna);
    padding: 5px 12px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color var(--transition-fast);
  }
  .btn-ghost-sm:hover:not(:disabled) { border-color: var(--color-lavanda); }
  .btn-ghost-sm:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Side-by-side layout ── */
  .edit-layout { max-width: 860px; }

  .edit-layout.side-by-side {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-8);
    max-width: 100%;
    align-items: start;
  }

  .original-panel {
    position: sticky;
    top: 80px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    background: var(--color-nebbia);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
  }

  .panel-label {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-lilla);
    margin-bottom: var(--space-3);
  }

  .original-title {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-4);
    line-height: var(--leading-tight);
  }

  .original-content {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
    color: var(--color-prugna);
    pointer-events: none;
    user-select: none;
  }

  /* ── Error ── */
  .error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    margin-bottom: var(--space-4);
  }

  /* ── Form fields ── */
  .field { margin-bottom: var(--space-5); }

  .title-input {
    width: 100%;
    font-family: var(--font-serif);
    font-size: var(--text-3xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    border: none;
    border-bottom: 0.5px solid var(--color-bordo);
    background: transparent;
    padding: var(--space-2) 0;
    outline: none;
    letter-spacing: var(--tracking-tight);
  }
  .title-input::placeholder { color: var(--color-lilla); }

  label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-prugna);
    margin-bottom: var(--space-2);
  }

  textarea, input[type="url"], input[type="text"]:not(.title-input) {
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
  textarea:focus, input[type="url"]:focus { border-color: var(--color-lavanda); }

  .tag-input-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    background: white;
    min-height: 44px;
  }

  .tag-input-wrap input {
    border: none;
    padding: 2px 4px;
    outline: none;
    font-size: var(--text-sm);
    min-width: 120px;
    flex: 1;
  }

  .tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--color-iris);
    color: var(--color-viola);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
  }

  .tag-pill button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-viola);
    font-size: 14px;
    line-height: 1;
    padding: 0;
  }

  .suggestions {
    list-style: none;
    margin-top: var(--space-1);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    background: white;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .suggestions li button {
    display: block;
    width: 100%;
    text-align: left;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-notte);
    background: none;
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .suggestions li button:hover { background: var(--color-iris); }

  .meta-fields {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-3);
    padding-top: var(--space-4);
    border-top: 0.5px solid var(--color-bordo);
  }

  .delete-form { margin-top: var(--space-4); }

  .btn-danger {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: transparent;
    color: #b91c1c;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    border: 0.5px solid #fecaca;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .btn-danger:hover { background: #fef2f2; }

  @media (max-width: 1024px) {
    .edit-layout.side-by-side {
      grid-template-columns: 1fr;
    }
    .original-panel {
      position: static;
      max-height: 300px;
    }
  }
</style>
