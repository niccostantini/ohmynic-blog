<script lang="ts">
  import { base } from '$app/paths';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import { THEME_COLORS } from '$lib/stores/theme';
  import { themeColor } from '$lib/stores/theme';
  import { addToast } from '$lib/stores/toast';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type NavItem = PageData['navItems'][number];
  type FeaturedItem = PageData['featured'][number];
  type SearchResult = { id: string; title: string; slug: string; type: string; publishedAt: string | null };

  let navItems = $state<NavItem[]>(data.navItems);
  let featuredItems = $state<FeaturedItem[]>(data.featured);
  let activeTab = $state<'aspetto' | 'navigazione' | 'evidenza'>('aspetto');

  // ── Drag and drop state ───────────────────────────────────────────────────
  let dragIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  function onDragStart(e: DragEvent, i: number) {
    dragIndex = i;
    e.dataTransfer!.effectAllowed = 'move';
  }

  function onDragOver(e: DragEvent, i: number) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    if (dragIndex === null || dragIndex === i) { dragOverIndex = i; return; }

    // Live reorder: move item as user drags
    const reordered = [...navItems];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(i, 0, moved);
    navItems = reordered;
    dragIndex = i;
    dragOverIndex = i;
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault();
    dragIndex = null;
    dragOverIndex = null;
    try {
      await fetch(`${base}/admin/api/nav-items/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(navItems.map((item, idx) => ({ id: item.id, position: idx }))),
      });
    } catch { addToast('Errore nel salvataggio ordine', 'error'); }
  }

  function onDragEnd() { dragIndex = null; dragOverIndex = null; }

  async function toggleVisible(item: NavItem) {
    const newVisible = !item.visible;
    navItems = navItems.map(i => i.id === item.id ? { ...i, visible: newVisible } : i);
    try {
      await fetch(`${base}/admin/api/nav-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: newVisible }),
      });
    } catch { addToast('Errore nel salvataggio', 'error'); }
  }

  async function deleteItem(id: string) {
    try {
      const res = await fetch(`${base}/admin/api/nav-items/${id}`, { method: 'DELETE' });
      if (res.ok) navItems = navItems.filter(i => i.id !== id);
      else addToast('Impossibile eliminare', 'error');
    } catch { addToast('Errore di rete', 'error'); }
  }

  // ── Add external link ────────────────────────────────────────────────────
  let newLabel = $state('');
  let newUrl = $state('');
  let newTab = $state(false);
  let addingLink = $state(false);

  async function addLink() {
    if (!newLabel.trim() || !newUrl.trim()) return;
    addingLink = true;
    try {
      const res = await fetch(`${base}/admin/api/nav-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim(), url: newUrl.trim(), openInNewTab: newTab }),
      });
      if (res.ok) {
        const item = await res.json() as NavItem;
        navItems = [...navItems, item];
        newLabel = '';
        newUrl = '';
        newTab = false;
        addToast('Link aggiunto', 'success');
      } else {
        addToast('Errore nell\'aggiunta', 'error');
      }
    } catch { addToast('Errore di rete', 'error'); }
    addingLink = false;
  }

  // ── Featured items ────────────────────────────────────────────────────────
  let featDragIndex = $state<number | null>(null);
  let featDragOverIndex = $state<number | null>(null);

  function featOnDragStart(e: DragEvent, i: number) {
    featDragIndex = i;
    e.dataTransfer!.effectAllowed = 'move';
  }

  function featOnDragOver(e: DragEvent, i: number) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    if (featDragIndex === null || featDragIndex === i) { featDragOverIndex = i; return; }
    const reordered = [...featuredItems];
    const [moved] = reordered.splice(featDragIndex, 1);
    reordered.splice(i, 0, moved);
    featuredItems = reordered;
    featDragIndex = i;
    featDragOverIndex = i;
  }

  async function featOnDrop(e: DragEvent) {
    e.preventDefault();
    featDragIndex = null;
    featDragOverIndex = null;
    try {
      await fetch(`${base}/admin/api/featured/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(featuredItems.map((item, idx) => ({ id: item.id, position: idx }))),
      });
    } catch { addToast('Errore nel salvataggio ordine', 'error'); }
  }

  function featOnDragEnd() { featDragIndex = null; featDragOverIndex = null; }

  async function removeFeatured(id: string) {
    try {
      const res = await fetch(`${base}/admin/api/featured/${id}`, { method: 'DELETE' });
      if (res.ok) {
        featuredItems = featuredItems.filter(i => i.id !== id);
        addToast('Rimosso dalla homepage', 'info');
      } else {
        addToast('Errore nella rimozione', 'error');
      }
    } catch { addToast('Errore di rete', 'error'); }
  }

  // ── Featured search ───────────────────────────────────────────────────────
  let searchQuery = $state('');
  let searchResults = $state<SearchResult[]>([]);
  let searchTimer: ReturnType<typeof setTimeout>;

  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      if (!searchQuery.trim()) { searchResults = []; return; }
      try {
        const res = await fetch(`${base}/admin/api/articles/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) searchResults = await res.json() as SearchResult[];
      } catch { /* ignore */ }
    }, 250);
  }

  async function addToFeatured(articleId: string) {
    try {
      const res = await fetch(`${base}/admin/api/featured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      if (res.ok) {
        // Refresh featured list
        const listRes = await fetch(`${base}/admin/api/featured`);
        if (listRes.ok) featuredItems = await listRes.json() as FeaturedItem[];
        searchQuery = '';
        searchResults = [];
        addToast('Aggiunto in evidenza', 'success');
      } else if (res.status === 409) {
        addToast('Già in evidenza o limite raggiunto', 'error');
      } else {
        addToast('Errore nell\'aggiunta', 'error');
      }
    } catch { addToast('Errore di rete', 'error'); }
  }

  function formatDate(d: string | Date | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

<div class="settings-page">
  <h1>Impostazioni</h1>

  <div class="tab-bar">
    <button class="tab-btn" class:active={activeTab === 'aspetto'} onclick={() => activeTab = 'aspetto'}>Aspetto</button>
    {#if data.user.role === 'admin'}
      <button class="tab-btn" class:active={activeTab === 'navigazione'} onclick={() => activeTab = 'navigazione'}>Navigazione</button>
      <button class="tab-btn" class:active={activeTab === 'evidenza'} onclick={() => activeTab = 'evidenza'}>In evidenza</button>
    {/if}
  </div>

  {#if activeTab === 'aspetto'}
  <section class="settings-section">
    <h2>Aspetto</h2>
    <p class="section-desc">
      Le preferenze visive sono salvate nel browser — ogni redattore può avere il suo tema.
    </p>

    <div class="setting-row">
      <div class="setting-info">
        <span class="setting-label">Modalità</span>
        <span class="setting-hint">Chiara, scura o segui il sistema operativo</span>
      </div>
      <ThemeToggle />
    </div>

    <div class="setting-row setting-row-color">
      <div class="setting-info">
        <span class="setting-label">Tema colore</span>
        <span class="setting-hint">
          Attivo: <strong>{THEME_COLORS.find(t => t.id === $themeColor)?.name ?? 'Ametista'}</strong>
        </span>
      </div>
      <ThemeSwitcher />
    </div>
  </section>
  {/if}

  {#if activeTab === 'navigazione' && data.user.role === 'admin'}
  <section class="settings-section nav-section">
    <h2>Gestione navbar</h2>
    <p class="section-desc">Trascina per riordinare. Le voci fisse non possono essere eliminate.</p>

    <ul class="nav-list">
      {#each navItems as item, i (item.id)}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <li
          class="nav-item"
          class:drag-over={dragOverIndex === i && dragIndex !== i}
          class:dragging={dragIndex === i}
          class:hidden-item={!item.visible}
          draggable="true"
          ondragstart={(e) => onDragStart(e, i)}
          ondragover={(e) => onDragOver(e, i)}
          ondrop={onDrop}
          ondragend={onDragEnd}
        >
          <span class="drag-handle" title="Trascina per riordinare">
            <i class="ti ti-grip-vertical"></i>
          </span>
          <div class="nav-item-info">
            <span class="nav-item-label">{item.label}</span>
            <span class="nav-item-url">{item.url ?? `pagina interna`}</span>
          </div>
          <div class="nav-item-actions">
            <button
              class="toggle-vis"
              class:is-visible={item.visible}
              onclick={() => toggleVisible(item)}
              title={item.visible ? 'Nascondi dalla navbar' : 'Mostra in navbar'}
            >
              <i class="ti {item.visible ? 'ti-eye' : 'ti-eye-off'}"></i>
            </button>
            {#if item.type !== 'fixed'}
              <button
                class="btn-del"
                onclick={() => deleteItem(item.id)}
                title="Elimina"
              >
                <i class="ti ti-trash"></i>
              </button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>

    <div class="add-link-form">
      <h3>Aggiungi link</h3>
      <div class="add-fields">
        <input
          type="text"
          placeholder="Etichetta (es. Contatti)"
          bind:value={newLabel}
          class="add-input"
        />
        <input
          type="url"
          placeholder="URL (es. https://...)"
          bind:value={newUrl}
          class="add-input"
        />
        <label class="new-tab-label">
          <input type="checkbox" bind:checked={newTab} />
          Nuova tab
        </label>
        <button
          class="btn-add"
          onclick={addLink}
          disabled={addingLink || !newLabel.trim() || !newUrl.trim()}
        >
          {addingLink ? 'Aggiunta…' : 'Aggiungi'}
        </button>
      </div>
    </div>
  </section>
  {/if}

  {#if activeTab === 'evidenza' && data.user.role === 'admin'}
  <section class="settings-section feat-section">
    <h2>Articoli in evidenza</h2>
    <p class="section-desc">
      Scegli fino a 3 articoli o pagine da mostrare in cima alla homepage. Trascina per riordinare.
      <a href="{base}/" target="_blank" rel="noopener" class="preview-link">Vedi homepage →</a>
    </p>

    {#if featuredItems.length === 0}
      <p class="feat-empty">Nessun articolo in evidenza — aggiungine uno dalla ricerca qui sotto.</p>
    {:else}
      <ul class="feat-list">
        {#each featuredItems as item, i (item.id)}
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <li
            class="feat-item"
            class:drag-over={featDragOverIndex === i && featDragIndex !== i}
            class:dragging={featDragIndex === i}
            draggable="true"
            ondragstart={(e) => featOnDragStart(e, i)}
            ondragover={(e) => featOnDragOver(e, i)}
            ondrop={featOnDrop}
            ondragend={featOnDragEnd}
          >
            <span class="drag-handle" title="Trascina per riordinare">
              <i class="ti ti-grip-vertical"></i>
            </span>
            <div class="feat-item-info">
              <span class="feat-item-title">{item.article.title}</span>
              <div class="feat-item-meta">
                <span class="feat-type-badge">{item.article.type === 'page' ? 'Pagina' : 'Articolo'}</span>
                {#if item.article.publishedAt}
                  <span class="feat-item-date">{formatDate(item.article.publishedAt)}</span>
                {/if}
              </div>
            </div>
            <button class="btn-remove-feat" onclick={() => removeFeatured(item.id)} title="Rimuovi">
              <i class="ti ti-x"></i>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if featuredItems.length < 3}
      <div class="feat-search-section">
        <h3>Aggiungi articolo o pagina</h3>
        <div class="feat-search-wrap">
          <input
            type="search"
            placeholder="Cerca per titolo..."
            bind:value={searchQuery}
            oninput={onSearchInput}
            class="feat-search-input"
            autocomplete="off"
          />
        </div>
        {#if searchResults.length > 0}
          <ul class="feat-results">
            {#each searchResults as result (result.id)}
              {@const alreadyFeatured = featuredItems.some(f => f.article.id === result.id)}
              <li class="feat-result-item" class:already-featured={alreadyFeatured}>
                <div class="feat-result-info">
                  <span class="feat-result-title">{result.title}</span>
                  <div class="feat-result-meta">
                    <span class="feat-type-badge">{result.type === 'page' ? 'Pagina' : 'Articolo'}</span>
                    <span class="feat-item-date">{formatDate(result.publishedAt)}</span>
                  </div>
                </div>
                <button
                  class="btn-add-feat"
                  onclick={() => addToFeatured(result.id)}
                  disabled={alreadyFeatured}
                  title={alreadyFeatured ? 'Già in evidenza' : 'Aggiungi'}
                >
                  {alreadyFeatured ? '✓' : '+'}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {:else}
      <p class="feat-max-msg">Hai raggiunto il massimo di 3 articoli in evidenza. Rimuovine uno per aggiungerne un altro.</p>
    {/if}
  </section>
  {/if}
</div>

<style>
  .settings-page {
    max-width: 640px;
  }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-8);
  }

  .settings-section {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
  }

  :global([data-theme='dark']) .settings-section {
    background: var(--color-iris);
  }

  h2 {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-2);
  }

  .section-desc {
    font-size: var(--text-sm);
    color: var(--color-lilla);
    margin-bottom: var(--space-6);
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
    padding: var(--space-4) 0;
    border-top: 0.5px solid var(--color-bordo);
  }

  .setting-row-color {
    align-items: flex-start;
    padding-top: var(--space-5);
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }

  .setting-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
  }

  .setting-hint {
    font-size: var(--text-xs);
    color: var(--color-lilla);
  }

  .setting-hint strong {
    color: var(--color-viola);
    font-weight: var(--weight-medium);
  }

  /* ── Tab bar ──────────────────────────────────────────────────────────── */
  .tab-bar {
    display: flex;
    gap: var(--space-1);
    margin-bottom: var(--space-6);
    border-bottom: 0.5px solid var(--color-bordo);
  }
  .tab-btn {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: none;
    border: none;
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -0.5px;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }
  .tab-btn:hover { color: var(--color-notte); }
  .tab-btn.active { color: var(--color-viola); border-bottom-color: var(--color-lavanda); }

  /* ── Nav section ─────────────────────────────────────────────────────── */
  .nav-section { max-width: 100%; }

  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--space-6);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo);
    background: white;
    transition: background var(--transition-fast);
  }
  .nav-item:last-child { border-bottom: none; }
  .nav-item:hover { background: var(--color-nebbia); }
  .nav-item.drag-over { background: var(--color-iris); border-color: var(--color-lavanda); }
  .nav-item.dragging { opacity: 0.4; }
  .nav-item.hidden-item { opacity: 0.55; }

  .drag-handle {
    color: var(--color-lilla);
    cursor: grab;
    font-size: 16px;
    flex-shrink: 0;
    line-height: 1;
  }
  .drag-handle:active { cursor: grabbing; }

  .nav-item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav-item-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
  }
  .nav-item-url {
    font-size: var(--text-xs);
    font-family: monospace;
    color: var(--color-lilla);
  }

  .nav-item-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  .toggle-vis, .btn-del {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    border-radius: var(--radius-sm);
    color: var(--color-lilla);
    line-height: 1;
    display: flex;
    align-items: center;
    transition: color var(--transition-fast);
  }
  .toggle-vis:hover { color: var(--color-notte); }
  .toggle-vis.is-visible { color: var(--color-viola); }
  .btn-del:hover { color: #b91c1c; }

  /* ── Add link form ────────────────────────────────────────────────────── */
  .add-link-form {
    padding-top: var(--space-5);
    border-top: 0.5px solid var(--color-bordo);
  }
  .add-link-form h3 {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-3);
  }
  .add-fields {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    align-items: center;
  }
  .add-input {
    padding: 8px var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: inherit;
    color: var(--color-notte);
    background: white;
    outline: none;
    flex: 1;
    min-width: 160px;
    transition: border-color var(--transition-fast);
  }
  .add-input:focus { border-color: var(--color-lavanda); }
  .new-tab-label {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--color-prugna);
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-add {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--transition-fast);
  }
  .btn-add:hover:not(:disabled) { background: var(--color-viola); }
  .btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── In evidenza ─────────────────────────────────────────────────────────── */
  .feat-section { max-width: 100%; }

  .preview-link {
    font-size: var(--text-xs);
    color: var(--color-viola);
    text-decoration: underline;
    margin-left: var(--space-2);
  }

  .feat-empty, .feat-max-msg {
    font-size: var(--text-sm);
    color: var(--color-lilla);
    padding: var(--space-4) 0;
  }

  .feat-list {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--space-5);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .feat-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo);
    background: white;
    transition: background var(--transition-fast);
  }
  .feat-item:last-child { border-bottom: none; }
  .feat-item:hover { background: var(--color-nebbia); }
  .feat-item.drag-over { background: var(--color-iris); border-color: var(--color-lavanda); }
  .feat-item.dragging { opacity: 0.4; }

  .feat-item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .feat-item-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .feat-item-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .feat-type-badge {
    font-size: 10px;
    font-weight: var(--weight-medium);
    color: var(--color-viola);
    background: var(--color-iris);
    border-radius: 99px;
    padding: 1px 7px;
    border: 0.5px solid var(--color-bordo);
  }
  .feat-item-date {
    font-size: var(--text-xs);
    color: var(--color-lilla);
  }

  .btn-remove-feat {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
    border-radius: var(--radius-sm);
    color: var(--color-lilla);
    line-height: 1;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    transition: color var(--transition-fast);
  }
  .btn-remove-feat:hover { color: #b91c1c; }

  .feat-search-section {
    border-top: 0.5px solid var(--color-bordo);
    padding-top: var(--space-5);
  }
  .feat-search-section h3 {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-3);
  }

  .feat-search-input {
    width: 100%;
    padding: 9px var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: inherit;
    color: var(--color-notte);
    background: white;
    outline: none;
    transition: border-color var(--transition-fast);
    margin-bottom: var(--space-2);
  }
  .feat-search-input:focus { border-color: var(--color-lavanda); }

  .feat-results {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .feat-result-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo);
    background: white;
  }
  .feat-result-item:last-child { border-bottom: none; }
  .feat-result-item.already-featured { opacity: 0.5; }

  .feat-result-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .feat-result-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .feat-result-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .btn-add-feat {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    background: var(--color-lavanda);
    color: white;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-fast);
  }
  .btn-add-feat:hover:not(:disabled) { background: var(--color-viola); }
  .btn-add-feat:disabled { background: #d1fae5; color: #065f46; cursor: default; font-size: var(--text-sm); }
</style>
