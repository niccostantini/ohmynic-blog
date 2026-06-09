<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { Select } from 'bits-ui';
  import { Chart, registerables } from 'chart.js';
  import type { PageData } from './$types';

  if (browser) Chart.register(...registerables);

  let { data }: { data: PageData } = $props();

  // ── Period selector ──────────────────────────────────────────────────────────
  const PERIOD_OPTIONS = [
    { value: '7d',  label: 'Ultimi 7 giorni' },
    { value: '30d', label: 'Ultimi 30 giorni' },
    { value: '3m',  label: 'Ultimi 3 mesi' },
    { value: 'all', label: 'Tutto' },
  ];
  const currentLabel = $derived(PERIOD_OPTIONS.find(o => o.value === data.period)?.label ?? 'Ultimi 7 giorni');

  function changePeriod(v: string | undefined) {
    if (v) goto(`?period=${v}`);
  }

  // ── CSS token reader (browser only) ─────────────────────────────────────────
  function token(name: string, fallback: string): string {
    if (!browser) return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  // ── Chart 1: visite giornaliere (line) ──────────────────────────────────────
  const lineData = $derived(() => {
    const viola   = token('--color-viola', '#7c55d4');
    const lavanda = token('--color-lavanda', '#9b6ff0');
    return {
      labels: data.dailyViews.map(d => {
        const [y, m, day] = d.date.split('-');
        return `${day}/${m}`;
      }),
      datasets: [{
        label: 'Visite',
        data: data.dailyViews.map(d => d.views),
        borderColor: viola,
        backgroundColor: lavanda + '22',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: data.dailyViews.length > 30 ? 0 : 3,
        fill: true,
      }],
    };
  });

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: any[]) => items[0]?.label ?? '',
          label: (item: any) => `${item.raw} visite`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { font: { size: 11 }, precision: 0 } },
    },
  };

  // ── Chart 2: top articoli (bar horizontal) ───────────────────────────────────
  const barData = $derived(() => {
    const lavanda = token('--color-lavanda', '#9b6ff0');
    return {
      labels: data.topArticles.map(a => a.title.length > 40 ? a.title.slice(0, 40) + '…' : a.title),
      datasets: [{
        label: 'Visite',
        data: data.topArticles.map(a => a.views),
        backgroundColor: lavanda + 'cc',
        borderRadius: 4,
      }],
    };
  });

  const barOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (i: any) => `${i.raw} visite` } },
    },
    scales: {
      x: { beginAtZero: true, ticks: { font: { size: 11 }, precision: 0 } },
      y: { ticks: { font: { size: 11 } } },
    },
    onClick: (_: any, elements: any[]) => {
      const idx = elements[0]?.index;
      if (idx != null) {
        const article = data.topArticles[idx];
        if (article) goto(`${base}/admin/edit/${article.id}`);
      }
    },
  };

  // ── Chart 3: completion lettura (bar raggruppate) ────────────────────────────
  const completionData = $derived(() => {
    return {
      labels: data.completionData.map(a => a.title.length > 25 ? a.title.slice(0, 25) + '…' : a.title),
      datasets: [
        { label: '25%',  data: data.completionData.map(a => a.p25),  backgroundColor: '#9b6ff0cc', borderRadius: 3 },
        { label: '50%',  data: data.completionData.map(a => a.p50),  backgroundColor: '#7c55d4cc', borderRadius: 3 },
        { label: '75%',  data: data.completionData.map(a => a.p75),  backgroundColor: '#5c3aaa99', borderRadius: 3 },
        { label: '100%', data: data.completionData.map(a => a.p100), backgroundColor: '#3d2280cc', borderRadius: 3 },
      ],
    };
  });

  const completionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { beginAtZero: true, ticks: { font: { size: 11 }, precision: 0 } },
    },
  };

  // ── Chart 4: fonti di traffico (doughnut) ────────────────────────────────────
  const doughnutData = $derived(() => {
    const src = data.trafficSources;
    return {
      labels: Object.keys(src),
      datasets: [{
        data: Object.values(src),
        backgroundColor: ['#9b6ff0', '#7c55d4', '#c9a8ff', '#d8d0f0'],
        borderWidth: 0,
        hoverOffset: 6,
      }],
    };
  });

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 11 } } },
      tooltip: { callbacks: { label: (i: any) => `${i.label}: ${i.raw} visite` } },
    },
  };

  // ── Tabella articoli — ordinamento + paginazione ─────────────────────────────
  type SortKey = 'views' | 'uniqueVisitors' | 'avgCompletion';
  let sortKey = $state<SortKey>('views');
  let sortAsc = $state(false);
  let tablePage = $state(1);
  const PAGE_SIZE = 10;

  const sortedTable = $derived(
    [...data.articleTable].sort((a, b) => {
      const va = a[sortKey] ?? -1;
      const vb = b[sortKey] ?? -1;
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    })
  );
  const totalPages = $derived(Math.ceil(sortedTable.length / PAGE_SIZE));
  const pagedTable = $derived(sortedTable.slice((tablePage - 1) * PAGE_SIZE, tablePage * PAGE_SIZE));

  function setSort(key: SortKey) {
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = false; }
    tablePage = 1;
  }
  function sortIcon(key: SortKey) {
    if (sortKey !== key) return '⇅';
    return sortAsc ? '↑' : '↓';
  }
</script>

<div class="analytics-page">

  <!-- Header -->
  <div class="page-head">
    <h1>Analytics</h1>

    <Select.Root type="single" value={data.period} onValueChange={changePeriod}>
      <Select.Trigger class="period-trigger">
        <span>{currentLabel}</span>
        <i class="ti ti-chevron-down" style="font-size:12px; margin-left:4px"></i>
      </Select.Trigger>
      <Select.Content class="period-content">
        <Select.Viewport>
          {#each PERIOD_OPTIONS as opt}
            <Select.Item value={opt.value} label={opt.label} class="period-item">
              {opt.label}
            </Select.Item>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Root>
  </div>

  <!-- KPI cards -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <span class="kpi-label">Visite totali</span>
      <span class="kpi-value">{data.kpis.totalViews.toLocaleString('it-IT')}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">Lettori unici</span>
      <span class="kpi-value">{data.kpis.uniqueVisitors.toLocaleString('it-IT')}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">Articolo più letto</span>
      {#if data.kpis.topArticle}
        <span class="kpi-value kpi-value-sm">{data.kpis.topArticle.title}</span>
        <span class="kpi-sub">{data.kpis.topArticle.views} visite</span>
      {:else}
        <span class="kpi-value kpi-empty">—</span>
      {/if}
    </div>
    <div class="kpi-card">
      <span class="kpi-label">Completamento medio</span>
      <span class="kpi-value">{data.kpis.avgCompletion > 0 ? data.kpis.avgCompletion + '%' : '—'}</span>
    </div>
  </div>

  <!-- Charts row 1 -->
  <div class="charts-grid charts-grid-70-30">
    <div class="chart-card">
      <h2 class="chart-title">Visite nel tempo</h2>
      {#if browser}
        {#await import('svelte-chartjs') then { Line }}
          {#if data.dailyViews.length > 0}
            <div class="chart-wrap chart-tall">
              <Line data={lineData()} options={lineOptions} />
            </div>
          {:else}
            <p class="chart-empty">Nessun dato nel periodo selezionato.</p>
          {/if}
        {/await}
      {/if}
    </div>
    <div class="chart-card">
      <h2 class="chart-title">Fonti di traffico</h2>
      {#if browser}
        {#await import('svelte-chartjs') then { Doughnut }}
          {#if Object.values(data.trafficSources).some(v => v > 0)}
            <div class="chart-wrap chart-tall">
              <Doughnut data={doughnutData()} options={doughnutOptions} />
            </div>
          {:else}
            <p class="chart-empty">Nessun dato.</p>
          {/if}
        {/await}
      {/if}
    </div>
  </div>

  <!-- Charts row 2 -->
  <div class="charts-grid charts-grid-50-50">
    <div class="chart-card">
      <h2 class="chart-title">Top 10 articoli più letti</h2>
      {#if browser}
        {#await import('svelte-chartjs') then { Bar }}
          {#if data.topArticles.length > 0}
            <div class="chart-wrap" style="height: {Math.max(200, data.topArticles.length * 36)}px">
              <Bar data={barData()} options={barOptions} />
            </div>
          {:else}
            <p class="chart-empty">Nessun dato.</p>
          {/if}
        {/await}
      {/if}
    </div>
    <div class="chart-card">
      <h2 class="chart-title">Completamento lettura — top 5</h2>
      {#if browser}
        {#await import('svelte-chartjs') then { Bar }}
          {#if data.completionData.length > 0}
            <div class="chart-wrap chart-tall">
              <Bar data={completionData()} options={completionOptions} />
            </div>
          {:else}
            <p class="chart-empty">Nessun dato.</p>
          {/if}
        {/await}
      {/if}
    </div>
  </div>

  <!-- Tabella articoli -->
  {#if data.articleTable.length > 0}
    <div class="table-section">
      <h2 class="section-title">Dettaglio articoli</h2>
      <div class="table-wrap">
        <table class="analytics-table">
          <thead>
            <tr>
              <th class="th-title">Titolo</th>
              <th class="th-sort" onclick={() => setSort('views')}>
                Visite {sortIcon('views')}
              </th>
              <th class="th-sort" onclick={() => setSort('uniqueVisitors')}>
                Unici {sortIcon('uniqueVisitors')}
              </th>
              <th class="th-sort" onclick={() => setSort('avgCompletion')}>
                Completamento {sortIcon('avgCompletion')}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each pagedTable as row}
              <tr>
                <td class="td-title">{row.title}</td>
                <td class="td-num">{row.views}</td>
                <td class="td-num">{row.uniqueVisitors}</td>
                <td class="td-num">
                  {#if row.avgCompletion !== null}
                    <span class="completion-badge" style="--pct: {row.avgCompletion}%">
                      {row.avgCompletion}%
                    </span>
                  {:else}
                    <span class="text-muted">—</span>
                  {/if}
                </td>
                <td class="td-actions">
                  <a href="{base}/admin/edit/{row.id}" class="link-edit">Modifica</a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Paginazione bits-ui -->
      {#if totalPages > 1}
        {#await import('bits-ui') then { Pagination }}
          <Pagination.Root
            count={sortedTable.length}
            perPage={PAGE_SIZE}
            page={tablePage}
            onPageChange={(p) => (tablePage = p)}
          >
            {#snippet children({ pages, range })}
              <div class="pagination">
                <Pagination.PrevButton class="pg-btn">‹</Pagination.PrevButton>
                {#each pages as pg}
                  {#if pg.type === 'ellipsis'}
                    <span class="pg-ellipsis">…</span>
                  {:else}
                    <Pagination.Page page={pg} class="pg-btn {pg.value === tablePage ? 'pg-active' : ''}">
                      {pg.value}
                    </Pagination.Page>
                  {/if}
                {/each}
                <Pagination.NextButton class="pg-btn">›</Pagination.NextButton>
                <span class="pg-info">{range.start}–{range.end} di {sortedTable.length}</span>
              </div>
            {/snippet}
          </Pagination.Root>
        {/await}
      {/if}

    </div>
  {/if}

</div>

<style>
  .analytics-page { max-width: 1100px; }

  /* ── Header ───────────────────────────────────────────────────────────────── */
  .page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
    gap: var(--space-4);
  }
  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  /* ── Period select (bits-ui) ─────────────────────────────────────────────── */
  :global(.period-trigger) {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 7px 14px;
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-notte);
    cursor: pointer;
    transition: border-color var(--transition-fast);
  }
  :global([data-theme='dark'] .period-trigger) {
    background: var(--color-iris);
  }
  :global(.period-trigger:hover) {
    border-color: var(--color-lavanda);
  }
  :global(.period-content) {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    padding: var(--space-1) 0;
    z-index: 50;
    min-width: 180px;
  }
  :global([data-theme='dark'] .period-content) {
    background: var(--color-iris);
  }
  :global(.period-item) {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-notte);
    cursor: pointer;
    transition: background var(--transition-fast);
    font-family: var(--font-sans);
  }
  :global(.period-item:hover),
  :global(.period-item[data-highlighted]) {
    background: var(--color-iris);
  }
  :global([data-theme='dark'] .period-item:hover),
  :global([data-theme='dark'] .period-item[data-highlighted]) {
    background: var(--color-bordo);
  }

  /* ── KPI grid ────────────────────────────────────────────────────────────── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }
  @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .kpi-grid { grid-template-columns: 1fr; } }

  .kpi-card {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  :global([data-theme='dark']) .kpi-card { background: var(--color-iris); }

  .kpi-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
  }
  .kpi-value {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    line-height: 1.2;
  }
  .kpi-value-sm { font-size: var(--text-base); }
  .kpi-sub { font-size: var(--text-xs); color: var(--color-lilla); }
  .kpi-empty { color: var(--color-lilla); }

  /* ── Charts grid ─────────────────────────────────────────────────────────── */
  .charts-grid {
    display: grid;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }
  .charts-grid-70-30 { grid-template-columns: 2fr 1fr; }
  .charts-grid-50-50 { grid-template-columns: 1fr 1fr; }
  @media (max-width: 800px) {
    .charts-grid-70-30, .charts-grid-50-50 { grid-template-columns: 1fr; }
  }

  .chart-card {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
  }
  :global([data-theme='dark']) .chart-card { background: var(--color-iris); }

  .chart-title {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-4);
  }

  .chart-wrap { position: relative; }
  .chart-tall { height: 240px; }
  .chart-empty { font-size: var(--text-sm); color: var(--color-lilla); padding: var(--space-8) 0; text-align: center; }

  /* ── Table section ───────────────────────────────────────────────────────── */
  .table-section {
    margin-top: var(--space-6);
  }
  .section-title {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-4);
  }

  .table-wrap {
    overflow-x: auto;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    background: white;
  }
  :global([data-theme='dark']) .table-wrap { background: var(--color-iris); }

  .analytics-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }
  .analytics-table th {
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
  .th-sort {
    cursor: pointer;
    user-select: none;
    transition: color var(--transition-fast);
  }
  .th-sort:hover { color: var(--color-notte); }
  .analytics-table td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo);
    color: var(--color-notte);
  }
  .analytics-table tr:last-child td { border-bottom: none; }
  .td-title { max-width: 340px; }
  .td-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .td-actions { text-align: right; white-space: nowrap; }

  .completion-badge {
    display: inline-block;
    padding: 1px 7px;
    border-radius: var(--radius-pill);
    background: var(--color-iris);
    color: var(--color-viola);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
  }
  .text-muted { color: var(--color-lilla); }
  .link-edit {
    font-size: var(--text-xs);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    transition: color var(--transition-fast);
  }
  .link-edit:hover { color: var(--color-viola); }

  /* ── Pagination ──────────────────────────────────────────────────────────── */
  .pagination {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
  }
  :global(.pg-btn) {
    min-width: 32px;
    height: 32px;
    padding: 0 var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-sm);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-notte);
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }
  :global([data-theme='dark'] .pg-btn) { background: var(--color-iris); }
  :global(.pg-btn:hover) { border-color: var(--color-lavanda); }
  :global(.pg-btn.pg-active),
  :global(.pg-btn[data-selected]) {
    background: var(--color-lavanda);
    color: white;
    border-color: transparent;
  }
  :global(.pg-btn:disabled) { opacity: 0.4; cursor: not-allowed; }
  .pg-ellipsis { padding: 0 var(--space-1); color: var(--color-lilla); }
  .pg-info { font-size: var(--text-xs); color: var(--color-lilla); margin-left: var(--space-2); }
</style>
