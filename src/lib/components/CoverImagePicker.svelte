<script lang="ts">
  import { base } from '$app/paths';
  import ArticleCard from './ArticleCard.svelte';
  import FeaturedCard from './FeaturedCard.svelte';

  let {
    initialUrl = '',
    initialFocus = '50% 50%',
    initialShowInArticle = true,
    showArticleToggle = true,
    disabled = false,
    title = '',
    excerpt = '',
    slug = '',
    tagSlug = 'default',
  }: {
    initialUrl?: string;
    initialFocus?: string;
    initialShowInArticle?: boolean;
    showArticleToggle?: boolean;
    disabled?: boolean;
    title?: string;
    excerpt?: string;
    slug?: string;
    tagSlug?: string;
  } = $props();

  let url = $state(initialUrl);
  let focus = $state(initialFocus || '50% 50%');
  let showInArticle = $state(initialShowInArticle);
  let uploading = $state(false);
  let uploadKey = $state(0);
  let pickerEl = $state<HTMLElement | null>(null);
  let dragging = $state(false);

  let focusX = $derived(parseFloat(focus.split(' ')[0]) || 50);
  let focusY = $derived(parseFloat(focus.split(' ')[1]) || 50);

  // Fake article for previews — updates live as title/excerpt/url/focus change
  let previewArticle = $derived({
    id: 'preview',
    title: title || 'Titolo dell\'articolo',
    slug: slug || 'preview',
    excerpt: excerpt || 'Qui apparirà l\'estratto del tuo articolo…',
    coverImage: url || null,
    coverImageFocus: focus,
    publishedAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    readingTimeMinutes: 5,
    type: 'article',
  });
  // Tag minimale per il colore del placeholder
  let previewTags = $derived(
    tagSlug !== 'default' ? [{ id: 'preview-tag', name: '', slug: tagSlug }] : []
  );

  async function handleFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    uploading = true;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${base}/api/upload`, { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        url = data.url;
      }
    } finally {
      uploading = false;
      uploadKey++;
    }
  }

  function setFocusFromPointer(e: MouseEvent) {
    if (!pickerEl) return;
    const rect = pickerEl.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
    focus = `${x}% ${y}%`;
  }

  function onPickerMouseDown(e: MouseEvent) {
    if (disabled) return;
    e.preventDefault();
    dragging = true;
    setFocusFromPointer(e);
  }

  function onWindowMouseMove(e: MouseEvent) {
    if (dragging) setFocusFromPointer(e);
  }

  function onWindowMouseUp() { dragging = false; }
</script>

<svelte:window onmousemove={onWindowMouseMove} onmouseup={onWindowMouseUp} />

<!-- Hidden form fields for submit -->
<input type="hidden" name="coverImage" value={url} />
<input type="hidden" name="coverImageFocus" value={focus} />

<div class="cover-picker">
  <!-- Upload row -->
  <div class="upload-row">
    {#if !disabled}
      <label class="upload-btn" class:uploading>
        {#key uploadKey}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onchange={handleFileSelect}
          />
        {/key}
        {uploading ? '⏳ Caricamento…' : '⬆ Carica immagine'}
      </label>
    {/if}
    <input
      type="text"
      class="url-input"
      placeholder="o incolla URL..."
      value={url}
      {disabled}
      oninput={(e) => { url = (e.target as HTMLInputElement).value; }}
    />
    {#if url && !disabled}
      <button
        type="button"
        class="remove-btn"
        title="Rimuovi immagine"
        onclick={() => { url = ''; focus = '50% 50%'; }}
      >✕</button>
    {/if}
  </div>

  {#if url}
    <!-- Focus picker: full image with crosshair dot -->
    <div class="picker-section">
      <p class="section-label">
        Punto focale
        <span class="section-hint">clicca o trascina per impostare il centro del crop</span>
        <span class="focus-coords">{focusX}% {focusY}%</span>
      </p>
      <div
        class="focus-picker"
        bind:this={pickerEl}
        onmousedown={onPickerMouseDown}
        style="cursor: {disabled ? 'default' : 'crosshair'}"
        role="presentation"
      >
        <!-- object-contain so the full image is visible, dot overlaid precisely -->
        <img src={url} alt="Copertina" draggable="false" />
        <div
          class="focus-dot"
          style="left: {focusX}%; top: {focusY}%"
        ></div>
      </div>
    </div>

    {#if showArticleToggle}
      <label class="article-toggle" class:disabled>
        <input
          type="checkbox"
          name="showCoverInArticle"
          bind:checked={showInArticle}
          {disabled}
        />
        Mostra nell'articolo
      </label>
    {/if}
  {/if}

  <!-- Previews: sempre visibili (placeholder se no copertina, immagine se caricata) -->
  <div class="previews-grid">

    <!-- Primo in evidenza — usa FeaturedCard reale -->
    <div class="preview-col preview-col-featured">
      <p class="preview-label">Primo in evidenza</p>
      <div class="card-preview-wrap">
        <FeaturedCard article={previewArticle} tags={previewTags} variant="main" href="#" />
      </div>
    </div>

    <!-- Card homepage — usa l'ArticleCard reale -->
    <div class="preview-col preview-col-card">
      <p class="preview-label">Card homepage</p>
      <div class="card-preview-wrap">
        <ArticleCard article={previewArticle} tags={previewTags} />
      </div>
    </div>

  </div>
</div>

<style>
  .cover-picker {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  /* ── Upload row ── */
  .upload-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .upload-btn {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    font-size: 0.8rem;
    font-family: var(--font-sans);
    background: var(--color-iris, #ece7fa);
    color: var(--color-viola, #7c55d4);
    border: 0.5px solid var(--color-bordo, #c9b8f0);
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .upload-btn:hover:not(.uploading) { background: var(--color-bordo, #c9b8f0); }
  .upload-btn.uploading { opacity: 0.7; cursor: wait; }
  .upload-btn input { display: none; }

  .url-input {
    flex: 1;
    min-width: 0;
    padding: 6px 10px;
    font-size: 0.82rem;
    font-family: var(--font-sans);
    border: 0.5px solid var(--color-bordo, #c9b8f0);
    border-radius: 6px;
    background: white;
    color: var(--color-notte, #1a1030);
    outline: none;
  }
  .url-input:focus { border-color: var(--color-viola, #7c55d4); }
  .url-input:disabled { background: #f8f6ff; color: #b0a4d0; }

  .remove-btn {
    padding: 4px 8px;
    font-size: 0.8rem;
    color: #b0a4d0;
    background: transparent;
    border: 0.5px solid var(--color-bordo, #c9b8f0);
    border-radius: 6px;
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.15s, border-color 0.15s;
  }
  .remove-btn:hover { color: #e05555; border-color: #e05555; }

  /* ── Focus picker ── */
  .picker-section { display: flex; flex-direction: column; gap: 0.4rem; }

  .section-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-lilla, #8e82b0);
    font-family: var(--font-sans);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .section-hint { font-weight: 400; color: #b0a4d0; }
  .focus-coords {
    margin-left: auto;
    font-family: monospace;
    font-size: 0.72rem;
    color: #b0a4d0;
    font-weight: 400;
  }

  .focus-picker {
    position: relative;
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--color-bordo, #c9b8f0);
    overflow: hidden;
    user-select: none;
    background: #f0ecf9;
  }

  /* Show full image so the focus dot maps 1:1 to the actual image pixels */
  .focus-picker img {
    width: 100%;
    max-height: 260px;
    object-fit: contain;
    display: block;
    pointer-events: none;
  }

  .focus-dot {
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(124, 85, 212, 0.85);
    border: 2.5px solid white;
    box-shadow: 0 0 0 1.5px rgba(124, 85, 212, 0.5), 0 2px 8px rgba(0,0,0,0.25);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  /* ── Previews grid ── */
  .previews-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 1rem;
    align-items: start;
  }

  .preview-col { display: flex; flex-direction: column; gap: 0.35rem; }

  .preview-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #b0a4d0;
    margin: 0;
    font-family: var(--font-sans);
  }

  /* Both previews use the real components — pointer-events off for admin */
  .card-preview-wrap {
    pointer-events: none;
    user-select: none;
  }

  /* ── Toggle ── */
  .article-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    font-family: var(--font-sans);
    color: var(--color-lilla, #8e82b0);
    cursor: pointer;
    user-select: none;
  }
  .article-toggle.disabled { cursor: default; opacity: 0.6; }
  .article-toggle input { cursor: pointer; accent-color: var(--color-viola, #7c55d4); }

  @media (max-width: 640px) {
    .previews-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
