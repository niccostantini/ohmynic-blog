<script lang="ts">
  import { enhance } from '$app/forms';
  import Editor from '$lib/components/Editor.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let title = $state('');
  let content = $state('');
  let excerpt = $state('');
  let coverImage = $state('');
</script>

<svelte:head><title>Nuova pagina — OhMyNic!</title></svelte:head>

<div class="editor-page">
  <div class="editor-header">
    <h1>Nuova pagina</h1>
    {#if form?.error}<p class="error">{form.error}</p>{/if}
  </div>

  <form method="POST" use:enhance>
    <input type="hidden" name="content" value={content} />

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
      <Editor bind:content />
    </div>

    <div class="meta-fields">
      <div class="field">
        <label for="excerpt">Excerpt (opzionale)</label>
        <textarea id="excerpt" name="excerpt" rows="2" placeholder="Breve descrizione per SEO..." bind:value={excerpt}></textarea>
      </div>
      <div class="field">
        <label for="coverImage">Immagine di copertina (URL opzionale)</label>
        <input id="coverImage" name="coverImage" type="url" placeholder="https://..." bind:value={coverImage} />
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn-primary">Crea pagina</button>
    </div>
  </form>
</div>

<style>
  .editor-page { max-width: 860px; }
  .editor-header { margin-bottom: var(--space-6); }
  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
  }
  .error { color: #b91c1c; font-size: var(--text-sm); margin-top: var(--space-2); }

  .field { margin-bottom: var(--space-4); }
  label { display: block; font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-prugna); margin-bottom: var(--space-2); }

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
    margin-bottom: var(--space-6);
    background: white;
  }

  .meta-fields {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
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

  .form-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--space-4);
    border-top: 0.5px solid var(--color-bordo);
  }

  .btn-primary {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 9px 20px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .btn-primary:hover { background: var(--color-viola); }
</style>
