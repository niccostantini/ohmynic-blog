<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Item = PageData['items'][number];

  const TYPE_META = {
    bug:        { label: '🐛 Bug',          bg: '#fde8e8', color: '#7f1d1d' },
    suggestion: { label: '💡 Suggerimento', bg: '#fef9c3', color: '#854d0e' },
    other:      { label: '💬 Altro',        bg: '#ece7fa', color: '#3b2f5e' },
  };

  const STATUS_META = {
    new:         { label: 'Nuovo',       bg: '#fde8e8', color: '#7f1d1d' },
    read:        { label: 'Letto',       bg: '#f1efe8', color: '#666' },
    in_progress: { label: 'In corso',   bg: '#fef9c3', color: '#854d0e' },
    done:        { label: 'Risolto',    bg: '#d1fae5', color: '#065f46' },
    wontfix:     { label: 'Non fixato', bg: '#e5e7eb', color: '#374151' },
  };

  const STATUS_OPTIONS = ['new', 'read', 'in_progress', 'done', 'wontfix'] as const;

  let filter = $state<'all' | 'new' | 'bug' | 'suggestion'>('all');
  let expandedId = $state<string | null>(null);

  const filtered = $derived.by(() => {
    if (filter === 'all') return data.items;
    if (filter === 'new') return data.items.filter(i => i.status === 'new');
    return data.items.filter(i => i.type === filter);
  });

  function truncate(s: string | null | undefined, n = 50) {
    if (!s) return '—';
    try { s = new URL(s).pathname; } catch { /* keep as-is */ }
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

<div class="page-head">
  <h1 class="page-title">Feedback</h1>
  <span class="total-count">{data.items.length} totali</span>
</div>

<div class="filter-bar">
  {#each [['all','Tutti'],['new','Nuovi'],['bug','Bug'],['suggestion','Suggerimenti']] as [val, label]}
    <button
      class="filter-pill"
      class:active={filter === val}
      onclick={() => filter = val as typeof filter}
    >{label}</button>
  {/each}
</div>

{#if filtered.length === 0}
  <p class="empty">Nessun elemento.</p>
{:else}
  <div class="feedback-table-wrap">
    <table class="feedback-table">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Titolo</th>
          <th>Da</th>
          <th>Pagina</th>
          <th>Data</th>
          <th>Stato</th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as item (item.id)}
          {@const tm = TYPE_META[item.type as keyof typeof TYPE_META]}
          {@const sm = STATUS_META[item.status as keyof typeof STATUS_META]}
          <tr
            class="feedback-row"
            class:expanded={expandedId === item.id}
            onclick={() => expandedId = expandedId === item.id ? null : item.id}
          >
            <td>
              <span class="type-badge" style="background:{tm.bg};color:{tm.color}">{tm.label}</span>
            </td>
            <td class="td-title">{item.title}</td>
            <td class="td-author">{item.authorName ?? item.readerName ?? 'Anonimo'}</td>
            <td class="td-url">
              {#if item.url}
                <a href={item.url} target="_blank" rel="noopener" onclick={e => e.stopPropagation()} class="url-link">
                  {truncate(item.url)}
                </a>
              {:else}
                <span class="td-empty">—</span>
              {/if}
            </td>
            <td class="td-date">{formatDate(item.createdAt)}</td>
            <td onclick={e => e.stopPropagation()}>
              <form method="POST" action="?/setStatus" use:enhance>
                <input type="hidden" name="id" value={item.id} />
                <select
                  name="status"
                  class="status-select status-{item.status}"
                  style="background:{sm.bg};color:{sm.color}"
                  onchange={function(e) { (e.currentTarget.closest('form') as HTMLFormElement).requestSubmit(); }}
                >
                  {#each STATUS_OPTIONS as s}
                    <option value={s} selected={item.status === s}>
                      {STATUS_META[s].label}
                    </option>
                  {/each}
                </select>
              </form>
            </td>
          </tr>
          {#if expandedId === item.id}
            <tr class="detail-row">
              <td colspan="6">
                <div class="detail-body">
                  <p class="detail-description">{item.description}</p>
                  {#if item.url}
                    <p class="detail-url">
                      <strong>URL:</strong>
                      <a href={item.url} target="_blank" rel="noopener">{item.url}</a>
                    </p>
                  {/if}
                </div>
              </td>
            </tr>
          {/if}
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
  .total-count { font-size: var(--text-sm); color: var(--color-lilla); }

  .filter-bar {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-5);
    flex-wrap: wrap;
  }
  .filter-pill {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: 99px;
    padding: 4px 14px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .filter-pill:hover { color: var(--color-notte); border-color: var(--color-lavanda); }
  .filter-pill.active { background: var(--color-iris); color: var(--color-viola); border-color: var(--color-lavanda); }

  .empty { font-size: var(--text-sm); color: var(--color-lilla); padding: var(--space-8) 0; }

  .feedback-table-wrap {
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: white;
  }
  .feedback-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }
  .feedback-table th {
    text-align: left;
    padding: var(--space-3) var(--space-4);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: var(--color-nebbia);
    border-bottom: 0.5px solid var(--color-bordo);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
    white-space: nowrap;
  }
  .feedback-table td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo);
    vertical-align: middle;
  }
  .feedback-table tr:last-child td { border-bottom: none; }

  .feedback-row { cursor: pointer; transition: background var(--transition-fast); }
  .feedback-row:hover { background: var(--color-nebbia); }
  .feedback-row.expanded { background: var(--color-iris); }

  .type-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: var(--weight-medium);
    padding: 2px 8px;
    border-radius: 99px;
    white-space: nowrap;
  }

  .td-title { font-weight: var(--weight-medium); color: var(--color-notte); max-width: 240px; }
  .td-author { color: var(--color-lilla); white-space: nowrap; }
  .td-date { color: var(--color-lilla); white-space: nowrap; font-size: var(--text-xs); }
  .td-url { max-width: 180px; }
  .td-empty { color: var(--color-bordo); }

  .url-link {
    font-size: var(--text-xs);
    color: var(--color-viola);
    text-decoration: none;
    font-family: monospace;
  }
  .url-link:hover { text-decoration: underline; }

  .status-select {
    border: 0.5px solid currentColor;
    border-radius: 99px;
    font-size: 11px;
    font-weight: var(--weight-medium);
    font-family: inherit;
    padding: 2px 8px;
    cursor: pointer;
    appearance: none;
    outline: none;
  }

  .detail-row td { padding: 0; border-bottom: 0.5px solid var(--color-bordo); }
  .detail-body {
    padding: var(--space-4) var(--space-5);
    background: var(--color-nebbia);
    border-top: 0.5px solid var(--color-bordo);
  }
  .detail-description {
    font-size: var(--text-sm);
    color: var(--color-prugna);
    line-height: var(--leading-relaxed);
    white-space: pre-wrap;
    margin: 0 0 var(--space-2);
  }
  .detail-url {
    font-size: var(--text-xs);
    color: var(--color-lilla);
    margin: 0;
    word-break: break-all;
  }
  .detail-url a { color: var(--color-viola); }
</style>
