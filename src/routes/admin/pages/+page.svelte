<script lang="ts">
  import { base } from '$app/paths';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(d: Date | string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head><title>Pagine — OhMyNic!</title></svelte:head>

<div class="page-head">
  <h1 class="page-title">Pagine</h1>
  <span class="total-count">{data.pages.length} totali</span>
  <a href="{base}/admin/pages/new" class="btn-new">+ Nuova pagina</a>
</div>

{#if data.pages.length === 0}
  <div class="empty-state">
    <p>Nessuna pagina ancora. <a href="{base}/admin/pages/new">Creane una.</a></p>
  </div>
{:else}
  <div class="pages-table-wrap">
    <table class="pages-table">
      <thead>
        <tr>
          <th>Titolo</th>
          <th>Slug</th>
          <th>Stato</th>
          <th>Aggiornata</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        {#each data.pages as page (page.id)}
          <tr class="page-row">
            <td class="td-title">{page.title}</td>
            <td class="td-slug">
              <a href="https://ohmynic.co/blog/{page.slug}" target="_blank" rel="noopener" class="slug-link">
                /{page.slug}
              </a>
            </td>
            <td>
              {#if page.status === 'published'}
                <span class="status-badge status-published">Pubblicata</span>
              {:else}
                <span class="status-badge status-draft">Bozza</span>
              {/if}
            </td>
            <td class="td-date">{formatDate(page.updatedAt)}</td>
            <td class="td-actions">
              <a href="{base}/admin/pages/edit/{page.id}" class="action-link">Modifica</a>
              {#if page.status === 'published'}
                <a href="https://ohmynic.co/blog/{page.slug}" target="_blank" rel="noopener" class="action-link">Vedi →</a>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .page-head {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
  }
  .page-title {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
  }
  .total-count { font-size: var(--text-sm); color: var(--color-lilla); flex: 1; }

  .btn-new {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 7px 16px;
    border-radius: var(--radius-md);
    text-decoration: none;
    border: none;
    transition: background var(--transition-fast);
  }
  .btn-new:hover { background: var(--color-viola); border-bottom: none; }

  .empty-state {
    padding: var(--space-12) 0;
    font-size: var(--text-sm);
    color: var(--color-lilla);
  }
  .empty-state a { color: var(--color-viola); }

  .pages-table-wrap {
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: white;
  }
  .pages-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }
  .pages-table th {
    text-align: left;
    padding: var(--space-3) var(--space-4);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: var(--color-nebbia);
    border-bottom: 0.5px solid var(--color-bordo);
    border-right: 0.5px solid var(--color-bordo);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
    white-space: nowrap;
  }
  .pages-table th:last-child { border-right: none; }
  .pages-table td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo-soft);
    border-right: 0.5px solid var(--color-bordo-soft);
    vertical-align: middle;
  }
  .pages-table td:last-child { border-right: none; }
  .pages-table tr:last-child td { border-bottom: none; }

  .page-row:hover td { background: var(--color-nebbia); }

  .td-title { font-weight: var(--weight-medium); color: var(--color-notte); max-width: 300px; }
  .td-slug { max-width: 220px; }
  .td-date { color: var(--color-lilla); white-space: nowrap; font-size: var(--text-xs); }
  .td-actions { white-space: nowrap; }

  .slug-link {
    font-family: monospace;
    font-size: var(--text-xs);
    color: var(--color-viola);
    text-decoration: none;
    border: none;
  }
  .slug-link:hover { text-decoration: underline; }

  .status-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: var(--weight-medium);
    padding: 2px 8px;
    border-radius: 99px;
  }
  .status-published { background: #d1fae5; color: #065f46; }
  .status-draft { background: var(--color-nebbia); color: var(--color-lilla); border: 0.5px solid var(--color-bordo); }

  .action-link {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--color-viola);
    text-decoration: none;
    border: none;
    margin-right: var(--space-3);
    transition: color var(--transition-fast);
  }
  .action-link:hover { color: var(--color-lavanda); }

  /* ── Mobile card stack ───────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .pages-table-wrap { border-radius: var(--radius-md); }
    .pages-table thead { display: none; }
    .pages-table tbody, .pages-table tr, .pages-table td { display: block; }
    .page-row {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4);
      border-bottom: 0.5px solid var(--color-bordo);
    }
    .page-row:last-child { border-bottom: none; }
    .pages-table td {
      padding: 0;
      border-bottom: none;
    }
    .td-title { max-width: 100%; font-size: var(--text-base); }
    .td-slug { max-width: 100%; }
    .td-date, .td-actions { display: inline; }
    .td-date { margin-right: var(--space-3); }
    .td-actions { white-space: normal; }
  }
</style>
