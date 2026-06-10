<script lang="ts">
  import { base } from '$app/paths';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const STATUS_FILTERS = [
    { value: null, label: 'Tutti' },
    { value: 'draft', label: 'Bozze' },
    { value: 'review', label: 'In revisione' },
    { value: 'approved', label: 'Approvati' },
    { value: 'published', label: 'Pubblicati' },
  ] as const;

  const STATUS_META: Record<string, { label: string; cls: string }> = {
    draft:     { label: 'Bozza',        cls: 'draft' },
    review:    { label: 'In revisione', cls: 'review' },
    approved:  { label: 'Approvato',    cls: 'approved' },
    published: { label: 'Pubblicato',   cls: 'published' },
  };

  function filterUrl(status: string | null) {
    return status ? `${base}/admin?status=${status}` : `${base}/admin`;
  }

  function formatDate(d: Date | string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function articleDate(a: PageData['articles'][number]) {
    return a.status === 'published' ? a.publishedAt : a.updatedAt ?? a.createdAt;
  }
</script>

<svelte:head><title>Admin — OhMyNic!</title></svelte:head>

<div class="page-header">
  <h1>Articoli</h1>
  <a href="{base}/admin/new" class="btn-accent">+ Nuovo articolo</a>
</div>

<!-- Status filter tabs -->
<div class="filter-tabs">
  {#each STATUS_FILTERS as f}
    <a
      href={filterUrl(f.value)}
      class="filter-tab"
      class:active={data.statusFilter === f.value}
    >{f.label}</a>
  {/each}
</div>

{#if data.articles.length === 0}
  <p class="empty">
    {data.statusFilter ? `Nessun articolo con stato "${STATUS_META[data.statusFilter]?.label}".` : 'Nessun articolo ancora.'}
    {#if !data.statusFilter}
      <a href="{base}/admin/new">Scrivi il primo →</a>
    {/if}
  </p>
{:else}
  <div class="article-table">
    <div class="table-head">
      <span>Titolo</span>
      <span>Stato</span>
      <span>Data</span>
      <span></span>
    </div>
    {#each data.articles as article}
      {@const isScheduled = article.status === 'published' && !!article.publishedAt && new Date(article.publishedAt) > new Date()}
      {@const meta = isScheduled
        ? { label: 'Programmato', cls: 'scheduled' }
        : (STATUS_META[article.status] ?? { label: article.status, cls: 'draft' })}
      <div class="table-row">
        <span class="article-title">{article.title}</span>
        <span>
          <span class="badge badge-{meta.cls}">{meta.label}</span>
        </span>
        <span class="meta">{formatDate(articleDate(article))}</span>
        <span class="actions">
          <a href="{base}/admin/edit/{article.id}">Modifica</a>
          {#if article.status === 'published' && !isScheduled}
            <a href="{base}/{article.slug}" target="_blank">Vedi →</a>
          {/if}
        </span>
      </div>
    {/each}
  </div>
{/if}

{#if data.pendingCount > 0}
  <div class="pending-banner">
    <span>💬 {data.pendingCount} commento{data.pendingCount > 1 ? 'i' : ''} in attesa di approvazione</span>
    <a href="{base}/admin/comments">Gestisci →</a>
  </div>
{/if}

<style>
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-5);
  }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  /* ── Filter tabs ─────────────────────────────────────────────────────── */
  .filter-tabs {
    display: flex;
    gap: 0;
    border-bottom: 0.5px solid var(--color-bordo);
    margin-bottom: var(--space-6);
  }
  .filter-tab {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: var(--space-2) var(--space-4);
    transition: color var(--transition-fast);
  }
  .filter-tab:hover { color: var(--color-notte); }
  .filter-tab.active { color: var(--color-viola); border-bottom-color: var(--color-lavanda); }

  .empty {
    color: var(--color-lilla);
    font-size: var(--text-base);
    padding: var(--space-8) 0;
    text-align: center;
  }

  .article-table {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .table-head, .table-row {
    display: grid;
    grid-template-columns: 1fr 130px 140px 160px;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
  }

  .table-head {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-lilla);
    border-bottom: 0.5px solid var(--color-bordo);
    background: var(--color-nebbia);
  }

  .table-row {
    border-bottom: 0.5px solid var(--color-bordo-soft);
    transition: background var(--transition-fast);
  }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: var(--color-nebbia); }

  .article-title {
    font-weight: var(--weight-medium);
    color: var(--color-notte);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Status badges ───────────────────────────────────────────────────── */
  .badge {
    display: inline-block;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    white-space: nowrap;
  }
  .badge-draft     { background: #f1efe8; color: #6b5f8a; }
  .badge-review    { background: #faeeda; color: #854f0b; }
  .badge-approved  { background: #e6f1fb; color: #0c447c; }
  .badge-published { background: #eaf3de; color: #3b6d11; }
  .badge-scheduled { background: #fef9c3; color: #854d0e; }

  .meta { font-size: var(--text-sm); color: var(--color-lilla); }

  .actions {
    display: flex;
    gap: var(--space-4);
    font-size: var(--text-sm);
  }

  .pending-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--space-6);
    padding: var(--space-4) var(--space-5);
    background: #fffbeb;
    border: 0.5px solid #fde68a;
    border-radius: var(--radius-lg);
    font-size: var(--text-sm);
    color: #92400e;
  }

  .btn-accent {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    text-decoration: none;
    border: none;
    transition: background var(--transition-fast);
  }
  .btn-accent:hover { background: var(--color-viola); }

  /* ── Mobile card stack ───────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .page-header { margin-bottom: var(--space-4); }
    .table-head { display: none; }
    .article-table { border-radius: var(--radius-md); }
    .table-row {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4);
    }
    .article-title {
      font-size: var(--text-base);
      white-space: normal;
    }
    .table-row .meta { font-size: var(--text-xs); }
    .table-row > span:nth-child(2),
    .table-row > span:nth-child(3) {
      display: inline;
    }
    .table-row > span:nth-child(2) { margin-right: var(--space-2); }
    .actions { gap: var(--space-3); }
    .actions a {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-viola);
      text-decoration: none;
    }
  }
</style>
