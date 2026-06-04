<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(d: Date | string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head><title>Admin — OhMyNic!</title></svelte:head>

<div class="page-header">
  <h1>Articoli</h1>
  <a href="/admin/new" class="btn-accent">+ Nuovo articolo</a>
</div>

{#if data.articles.length === 0}
  <p class="empty">Nessun articolo ancora. <a href="/admin/new">Scrivi il primo →</a></p>
{:else}
  <div class="article-table">
    <div class="table-head">
      <span>Titolo</span>
      <span>Stato</span>
      <span>Data</span>
      <span></span>
    </div>
    {#each data.articles as article}
      <div class="table-row">
        <span class="article-title">{article.title}</span>
        <span>
          {#if article.published}
            <span class="badge published">Pubblicato</span>
          {:else}
            <span class="badge draft">Bozza</span>
          {/if}
        </span>
        <span class="meta">{formatDate(article.published ? article.publishedAt : article.createdAt)}</span>
        <span class="actions">
          <a href="/admin/edit/{article.id}">Modifica</a>
          {#if article.published}
            <a href="/{article.slug}" target="_blank">Vedi →</a>
          {/if}
        </span>
      </div>
    {/each}
  </div>
{/if}

{#if data.pendingCount > 0}
  <div class="pending-banner">
    <span>💬 {data.pendingCount} commento{data.pendingCount > 1 ? 'i' : ''} in attesa di approvazione</span>
    <a href="/admin/comments">Gestisci →</a>
  </div>
{/if}

<style>
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-8);
  }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  .empty {
    color: var(--color-lilla);
    font-size: var(--text-base);
  }

  .article-table {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .table-head, .table-row {
    display: grid;
    grid-template-columns: 1fr 120px 140px 160px;
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

  .badge {
    display: inline-block;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
  }

  .badge.published {
    background: #d1fae5;
    color: #065f46;
  }

  .badge.draft {
    background: var(--color-iris);
    color: var(--color-viola);
  }

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
</style>
