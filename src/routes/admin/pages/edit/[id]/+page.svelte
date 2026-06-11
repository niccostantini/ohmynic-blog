<script lang="ts">
  import { enhance } from '$app/forms';
  import { base } from '$app/paths';
  import Editor from '$lib/components/Editor.svelte';
  import VisibilityChips from '$lib/components/VisibilityChips.svelte';
  import { addToast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let title = $state(data.page.title);
  let slug = $state(data.page.slug);
  let excerpt = $state(data.page.excerpt ?? '');
  let coverImage = $state(data.page.coverImage ?? '');
  let showCoverInArticle = $state(data.page.showCoverInArticle ?? true);
  let showComments = $state(data.page.showComments ?? false);
  let showInNavbar = $state(data.page.showInNavbar ?? false);
  let visibleTo = $state<string[]>(data.page.visibleTo ?? ['public']);
  let content = $state(data.page.content);
  let blocksJson = $state<string | null>(data.page.blocksJson ?? null);

  $effect(() => {
    title = data.page.title;
    slug = data.page.slug;
    excerpt = data.page.excerpt ?? '';
    coverImage = data.page.coverImage ?? '';
    showCoverInArticle = data.page.showCoverInArticle ?? true;
    showComments = data.page.showComments ?? false;
    showInNavbar = data.page.showInNavbar ?? false;
    visibleTo = data.page.visibleTo ?? ['public'];
  });

  let getContentFn: (() => string) | null = null;
  let getBlocksJsonFn: (() => string) | null = null;

  let saving = $state(false);
  let publishing = $state(false);
  let deleteConfirm = $state(false);

  $effect(() => {
    if (form?.saved) addToast('Pagina salvata', 'success');
    if (form?.published) addToast('Pagina pubblicata!', 'success');
    if (form?.unpublished) addToast('Pagina tornata in bozza', 'info');
    if (form?.error) addToast(form.error, 'error');
  });

  function beforeSave(input: { formData: FormData }) {
    if (getContentFn) content = getContentFn();
    if (getBlocksJsonFn) blocksJson = getBlocksJsonFn();
    input.formData.set('content', content);
    input.formData.set('blocksJson', blocksJson ?? '');
    input.formData.set('visibleTo', JSON.stringify(visibleTo));
  }

  const isPublished = $derived(data.page.status === 'published');
</script>

<svelte:head><title>{data.page.title} — Pagine — OhMyNic!</title></svelte:head>

<div class="editor-page">
  <div class="editor-header">
    <div class="header-left">
      <a href="{base}/admin/pages" class="back-link">← Pagine</a>
      <h1>{data.page.title}</h1>
    </div>
    <div class="header-right">
      {#if isPublished}
        <span class="status-badge status-published">Pubblicata</span>
        <a href="https://ohmynic.co/blog/{data.page.slug}" target="_blank" rel="noopener" class="btn-ghost">Vedi →</a>
      {:else}
        <span class="status-badge status-draft">Bozza</span>
      {/if}
    </div>
  </div>

  <!-- Save form — id referenced by buttons below -->
  <form
    id="save-form"
    method="POST"
    action="?/save"
    use:enhance={({ formData }) => {
      beforeSave({ formData });
      saving = true;
      return async ({ update }) => { saving = false; await update(); };
    }}
  >
    <input type="hidden" name="content" value={content} />
    <input type="hidden" name="blocksJson" value={blocksJson ?? ''} />
    <input type="hidden" name="visibleTo" value={JSON.stringify(visibleTo)} />

    <div class="field">
      <input
        name="title"
        type="text"
        class="title-input"
        placeholder="Titolo della pagina"
        bind:value={title}
        required
      />
    </div>

    <div class="editor-wrap">
      <Editor
        bind:content
        blocksJson={blocksJson ?? undefined}
        onReadyGetContentFn={(fn) => (getContentFn = fn)}
        onReadyGetBlocksJsonFn={(fn) => (getBlocksJsonFn = fn)}
      />
    </div>

    <div class="meta-fields">
      <div class="meta-row">
        <div class="field">
          <label for="slug">Slug (URL)</label>
          <div class="slug-wrap">
            <span class="slug-prefix">/blog/</span>
            <input id="slug" name="slug" type="text" bind:value={slug} />
          </div>
        </div>
        <div class="field">
          <label for="excerpt">Excerpt (SEO)</label>
          <textarea id="excerpt" name="excerpt" rows="2" placeholder="Breve descrizione..." bind:value={excerpt}></textarea>
        </div>
      </div>

      <div class="meta-row">
        <div class="field">
          <label for="coverImage">Immagine di copertina (URL)</label>
          <input id="coverImage" name="coverImage" type="url" placeholder="https://..." bind:value={coverImage} />
        </div>
        {#if coverImage}
          <div class="field field-inline">
            <label class="checkbox-label">
              <input type="checkbox" name="showCoverInArticle" bind:checked={showCoverInArticle} />
              Mostra copertina nell'articolo
            </label>
          </div>
        {/if}
      </div>

      <div class="visibility-field">
        <span class="visibility-label">Visibile a</span>
        <VisibilityChips bind:selected={visibleTo} />
        <p class="visibility-hint">
          {#if visibleTo.includes('public')}
            Questa pagina è visibile a tutti i visitatori.
          {:else}
            Questa pagina richiede accesso — gli utenti non autorizzati vengono reindirizzati al login.
          {/if}
        </p>
      </div>

      <div class="toggles-row">
        <label class="toggle-label">
          <input type="checkbox" name="showComments" bind:checked={showComments} />
          <span class="toggle-text">Mostra commenti</span>
          <span class="toggle-hint">Permetti commenti pubblici su questa pagina</span>
        </label>

        <label class="toggle-label">
          <input type="checkbox" name="showInNavbar" bind:checked={showInNavbar} />
          <span class="toggle-text">Mostra in navbar</span>
          <span class="toggle-hint">
            {#if showInNavbar}
              Apparirà come "<strong>{title || data.page.title}</strong>" nella navbar pubblica
            {:else}
              Non apparirà nella navbar pubblica
            {/if}
          </span>
        </label>
      </div>
    </div>
  </form>

  <!-- Sibling forms for publish / unpublish / delete — avoids nested <form> -->
  <form
    id="publish-form"
    method="POST"
    action="?/publish"
    use:enhance={({ formData }) => {
      beforeSave({ formData });
      publishing = true;
      return async ({ update }) => { publishing = false; await update(); };
    }}
    style="display:none"
  >
    <input type="hidden" name="content" value={content} />
    <input type="hidden" name="blocksJson" value={blocksJson ?? ''} />
    <input type="hidden" name="visibleTo" value={JSON.stringify(visibleTo)} />
  </form>

  <form id="unpublish-form" method="POST" action="?/unpublish" use:enhance style="display:none"></form>

  <form id="delete-form" method="POST" action="?/delete" use:enhance style="display:none"></form>

  <div class="form-actions">
    <div class="actions-left">
      {#if deleteConfirm}
        <span class="delete-confirm-text">Eliminare definitivamente?</span>
        <button type="submit" form="delete-form" class="btn-danger">Sì, elimina</button>
        <button type="button" class="btn-ghost" onclick={() => deleteConfirm = false}>Annulla</button>
      {:else}
        <button type="button" class="btn-delete" onclick={() => deleteConfirm = true}>Elimina pagina</button>
      {/if}
    </div>
    <div class="actions-right">
      {#if isPublished}
        <button type="submit" form="unpublish-form" class="btn-ghost">Torna a bozza</button>
      {:else}
        <button type="submit" form="publish-form" class="btn-publish" disabled={publishing}>
          {publishing ? 'Pubblicazione…' : 'Pubblica'}
        </button>
      {/if}
      <button type="submit" form="save-form" class="btn-save" disabled={saving}>
        {saving ? 'Salvataggio…' : 'Salva bozza'}
      </button>
    </div>
  </div>
</div>

<style>
  .editor-page { max-width: 860px; }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
    gap: var(--space-4);
    flex-wrap: wrap;
  }
  .header-left { display: flex; flex-direction: column; gap: var(--space-1); }
  .header-right { display: flex; align-items: center; gap: var(--space-3); }

  .back-link {
    font-size: var(--text-xs);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    transition: color var(--transition-fast);
  }
  .back-link:hover { color: var(--color-notte); }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
  }

  .status-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: var(--weight-medium);
    padding: 3px 10px;
    border-radius: 99px;
  }
  .status-published { background: #d1fae5; color: #065f46; }
  .status-draft { background: var(--color-nebbia); color: var(--color-lilla); border: 0.5px solid var(--color-bordo); }

  .btn-ghost {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: transparent;
    color: var(--color-notte);
    padding: 7px 16px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }
  .btn-ghost:hover { border-color: var(--color-lavanda); background: var(--color-iris); }

  label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-prugna);
    margin-bottom: var(--space-2);
  }

  .title-input {
    width: 100%;
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    background: white;
    border: none;
    border-bottom: 1px solid var(--color-bordo);
    padding: var(--space-2) 0;
    outline: none;
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-6);
  }
  .title-input:focus { border-bottom-color: var(--color-lavanda); }

  .editor-wrap {
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: white;
    margin-bottom: var(--space-6);
  }

  .meta-fields {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .meta-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
  @media (max-width: 640px) { .meta-row { grid-template-columns: 1fr; } }

  .field { display: flex; flex-direction: column; }
  .field-inline { justify-content: flex-end; padding-bottom: var(--space-2); }

  .slug-wrap {
    display: flex;
    align-items: center;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition: border-color var(--transition-fast);
  }
  .slug-wrap:focus-within { border-color: var(--color-lavanda); }
  .slug-prefix {
    padding: 10px var(--space-2) 10px var(--space-3);
    background: var(--color-nebbia);
    font-family: monospace;
    font-size: var(--text-sm);
    color: var(--color-lilla);
    border-right: 0.5px solid var(--color-bordo);
    white-space: nowrap;
  }
  .slug-wrap input {
    flex: 1;
    padding: 10px var(--space-3);
    border: none;
    font-family: monospace;
    font-size: var(--text-sm);
    color: var(--color-notte);
    background: white;
    outline: none;
  }

  textarea, input[type="url"] {
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

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-prugna);
    cursor: pointer;
    margin-bottom: 0;
  }

  .visibility-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-bottom: var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo);
  }
  .visibility-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-prugna);
  }
  .visibility-hint {
    font-size: var(--text-xs);
    color: var(--color-lilla);
    margin: 0;
  }

  .toggles-row {
    display: flex;
    gap: var(--space-6);
    flex-wrap: wrap;
    padding-top: var(--space-2);
    border-top: 0.5px solid var(--color-bordo);
  }

  .toggle-label {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    cursor: pointer;
    margin-bottom: 0;
  }
  .toggle-label input[type='checkbox'] { margin-top: 2px; flex-shrink: 0; }
  .toggle-text {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
    display: block;
  }
  .toggle-hint {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-lilla);
    font-weight: var(--weight-normal);
    margin-top: 2px;
  }
  .toggle-hint strong { color: var(--color-viola); font-weight: var(--weight-medium); }

  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    padding-top: var(--space-4);
    border-top: 0.5px solid var(--color-bordo);
    flex-wrap: wrap;
  }
  .actions-left { display: flex; align-items: center; gap: var(--space-3); }
  .actions-right { display: flex; align-items: center; gap: var(--space-3); }

  .btn-save {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-notte);
    color: var(--color-nebbia);
    padding: 9px 20px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .btn-save:hover:not(:disabled) { background: var(--color-prugna); }
  .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-publish {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: #3b6d11;
    color: white;
    padding: 9px 20px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .btn-publish:hover:not(:disabled) { background: #2a4f0c; }
  .btn-publish:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-delete {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color var(--transition-fast);
  }
  .btn-delete:hover { color: #b91c1c; }

  .btn-danger {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: #b91c1c;
    color: white;
    padding: 7px 16px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
  }

  .delete-confirm-text {
    font-size: var(--text-sm);
    color: #b91c1c;
  }
</style>
