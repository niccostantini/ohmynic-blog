<script lang="ts">
  import { base } from '$app/paths';

  let {
    initialUrl = '',
    initialFocus = '50% 50%',
    initialShowInArticle = true,
    showArticleToggle = true,
    disabled = false,
  }: {
    initialUrl?: string;
    initialFocus?: string;
    initialShowInArticle?: boolean;
    showArticleToggle?: boolean;
    disabled?: boolean;
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

<!-- Hidden form fields -->
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
    <div class="picker-area">
      <!-- Focus picker -->
      <div class="picker-section">
        <p class="section-label">
          Punto focale
          <span class="section-hint">clicca o trascina per impostare il centro del crop</span>
        </p>
        <div
          class="focus-picker"
          bind:this={pickerEl}
          onmousedown={onPickerMouseDown}
          style="cursor: {disabled ? 'default' : 'crosshair'}"
          role="presentation"
        >
          <img src={url} alt="Copertina" draggable="false" />
          <div
            class="focus-dot"
            style="left: {focusX}%; top: {focusY}%"
            aria-label="Punto focale: {focusX}%, {focusY}%"
          ></div>
        </div>
      </div>

      <!-- Previews -->
      <div class="previews-row">
        <div class="preview-item">
          <p class="preview-label">Header articolo</p>
          <div class="preview-header">
            <img src={url} alt="" style="object-position: {focus}" draggable="false" />
          </div>
        </div>
        <div class="preview-item">
          <p class="preview-label">Card lista</p>
          <div class="preview-card">
            <img src={url} alt="" style="object-position: {focus}" draggable="false" />
          </div>
        </div>
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
</div>

<style>
  .cover-picker {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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

  /* ── Picker area ── */
  .picker-area {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

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

  .section-hint {
    font-weight: 400;
    color: #b0a4d0;
  }

  /* Focus picker: full image with dot overlay */
  .focus-picker {
    position: relative;
    display: inline-block;
    width: 100%;
    max-height: 240px;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid var(--color-bordo, #c9b8f0);
    user-select: none;
  }

  .focus-picker img {
    width: 100%;
    height: 240px;
    object-fit: contain;
    background: #f0ecf9;
    display: block;
    pointer-events: none;
  }

  .focus-dot {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(124, 85, 212, 0.85);
    border: 2.5px solid white;
    box-shadow: 0 0 0 1.5px rgba(124, 85, 212, 0.5), 0 2px 8px rgba(0,0,0,0.25);
    transform: translate(-50%, -50%);
    pointer-events: none;
    transition: left 0.05s, top 0.05s;
  }

  /* ── Previews ── */
  .previews-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .preview-item { display: flex; flex-direction: column; gap: 0.3rem; }

  .preview-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #b0a4d0;
    margin: 0;
    font-family: var(--font-sans);
  }

  .preview-header {
    width: 100%;
    height: 90px;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid var(--color-bordo, #c9b8f0);
  }
  .preview-header img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .preview-card {
    width: 100%;
    height: 60px;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid var(--color-bordo, #c9b8f0);
  }
  .preview-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
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
</style>
