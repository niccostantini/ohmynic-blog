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

  let navItems = $state<NavItem[]>(data.navItems);
  let activeTab = $state<'aspetto' | 'navigazione'>('aspetto');

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
</script>

<div class="settings-page">
  <h1>Impostazioni</h1>

  <div class="tab-bar">
    <button class="tab-btn" class:active={activeTab === 'aspetto'} onclick={() => activeTab = 'aspetto'}>Aspetto</button>
    {#if data.user.role === 'admin'}
      <button class="tab-btn" class:active={activeTab === 'navigazione'} onclick={() => activeTab = 'navigazione'}>Navigazione</button>
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
</style>
