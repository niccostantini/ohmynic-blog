<script lang="ts">
  import { enhance } from '$app/forms';
  import Editor from '$lib/components/Editor.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let title = $state('');
  let content = $state('');
  let excerpt = $state('');
  let coverImage = $state('');
  let tagInput = $state('');
  let selectedTags = $state<string[]>([]);

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
</script>

<svelte:head><title>Nuovo articolo — OhMyNic!</title></svelte:head>

<div class="editor-page">
  <div class="editor-header">
    <h1>Nuovo articolo</h1>
    {#if form?.error}<p class="error">{form.error}</p>{/if}
  </div>

  <form method="POST" use:enhance>
    <input type="hidden" name="content" value={content} />
    <input type="hidden" name="tags" value={selectedTags.join(',')} />

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
      <Editor bind:content />
    </div>

    <div class="meta-fields">
      <div class="field">
        <label>Estratto (opzionale)</label>
        <textarea
          name="excerpt"
          rows="3"
          placeholder="Se vuoto, verrà auto-generato dai primi 160 caratteri"
          bind:value={excerpt}
        ></textarea>
      </div>

      <div class="field">
        <label>Immagine copertina (URL)</label>
        <input
          name="coverImage"
          type="url"
          placeholder="https://..."
          bind:value={coverImage}
        />
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
              <li>
                <button type="button" onclick={() => addTag(s.name)}>{s.name}</button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" name="action" value="draft" class="btn-ghost">Salva bozza</button>
      <button type="submit" name="action" value="publish" class="btn-accent">Pubblica</button>
    </div>
  </form>
</div>

<style>
  .editor-page { max-width: 860px; margin: 0 auto; }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
  }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  .error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
  }

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
    gap: var(--space-3);
    padding-top: var(--space-4);
    border-top: 0.5px solid var(--color-bordo);
  }
</style>
