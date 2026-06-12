<script lang="ts">
  import { base } from '$app/paths';
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { PollResults } from '$lib/db/queries/polls';

  let { data }: { data: PageData } = $props();

  // ── Modal state ─────────────────────────────────────────────────────────────

  type ActivePoll = typeof data.pollsList[0];

  let dialogEl = $state<HTMLDialogElement | null>(null);
  let activePoll = $state<ActivePoll | null>(null);
  let results = $state<PollResults | null>(null);
  let loadingResults = $state(false);
  let chartType = $state<'anello' | 'torta' | 'colonne'>('anello');

  // ── Chart colours ────────────────────────────────────────────────────────────

  const COLORS = ['#7c55d4','#5bc8af','#f0a500','#e05572','#4a9de0','#7db862','#c9a8ff','#f47c3c'];

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  async function openResults(poll: ActivePoll) {
    activePoll = poll;
    results = null;
    loadingResults = true;
    chartType = 'anello';
    dialogEl?.showModal();
    try {
      const res = await fetch(`${base}/api/polls/${poll.id}/results`);
      if (res.ok) {
        const json = await res.json();
        results = { options: json.options, totalVoters: json.totalVoters };
      }
    } finally {
      loadingResults = false;
    }
  }

  function closeModal() {
    dialogEl?.close();
    activePoll = null;
    results = null;
  }

  // ── SVG chart helpers ─────────────────────────────────────────────────────────

  function fracToXY(cx: number, cy: number, r: number, fraction: number) {
    const angle = fraction * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function pieSlicePath(cx: number, cy: number, r: number, start: number, end: number) {
    if (end - start >= 1) end = start + 0.9999;
    const s = fracToXY(cx, cy, r, start);
    const e = fracToXY(cx, cy, r, end);
    const large = end - start > 0.5 ? 1 : 0;
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
  }

  function getSlices(opts: PollResults['options']) {
    const total = opts.reduce((s, o) => s + o.votes, 0);
    let cum = 0;
    return opts.map((o, i) => {
      const frac = total > 0 ? o.votes / total : 1 / opts.length;
      const s = { ...o, frac, start: cum, end: cum + frac, color: COLORS[i % COLORS.length] };
      cum += frac;
      return s;
    });
  }

  // For donut: circumference-based stroke offsets
  const DONUT_R = 54;
  const DONUT_CX = 80;
  const DONUT_CY = 80;
  const DONUT_CIRC = 2 * Math.PI * DONUT_R;

  function donutSlices(opts: PollResults['options']) {
    const total = opts.reduce((s, o) => s + o.votes, 0);
    let offset = 0;
    return opts.map((o, i) => {
      const frac = total > 0 ? o.votes / total : 1 / opts.length;
      const arcLen = frac * DONUT_CIRC;
      const sl = { ...o, arcLen, dashOffset: -offset, color: COLORS[i % COLORS.length] };
      offset += arcLen;
      return sl;
    });
  }

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head><title>Sondaggi — OhMyNic!</title></svelte:head>

<div class="page-wrap">
  <div class="page-header">
    <h1 class="page-title"><i class="ti ti-chart-bar"></i> Sondaggi</h1>
    <p class="page-subtitle">{data.pollsList.length} sondagg{data.pollsList.length === 1 ? 'io' : 'i'} totali</p>
  </div>

  {#if data.pollsList.length === 0}
    <div class="empty-state">
      <i class="ti ti-chart-bar" style="font-size:2.5rem; color:var(--color-lilla)"></i>
      <p>Nessun sondaggio ancora. Aggiungine uno dall'editor articoli.</p>
    </div>
  {:else}
    <div class="table-wrap">
      <table class="polls-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Domanda</th>
            <th>Articolo</th>
            <th>Votanti</th>
            <th>Stato</th>
            <th>Risultati</th>
          </tr>
        </thead>
        <tbody>
          {#each data.pollsList as poll (poll.id)}
            <tr>
              <td class="col-id">
                <code class="id-chip">{poll.id.slice(0, 8)}</code>
              </td>
              <td class="col-question">{poll.question}</td>
              <td class="col-article">
                {#if poll.articleSlug}
                  <a href="{base}/{poll.articleSlug}" target="_blank" class="article-link">
                    {poll.articleTitle ?? poll.articleId}
                    <i class="ti ti-external-link"></i>
                  </a>
                {:else}
                  <span class="no-article">—</span>
                {/if}
              </td>
              <td class="col-voters">{poll.totalVoters}</td>
              <td class="col-status">
                <form method="POST" action="?/toggle" use:enhance>
                  <input type="hidden" name="pollId" value={poll.id} />
                  <input type="hidden" name="closed" value={String(!poll.closed)} />
                  <button
                    type="submit"
                    class="status-btn"
                    class:open={!poll.closed}
                    class:closed={poll.closed}
                    title={poll.closed ? 'Clicca per riaprire' : 'Clicca per chiudere'}
                  >
                    {#if poll.closed}
                      <i class="ti ti-lock"></i> Chiuso
                    {:else}
                      <i class="ti ti-lock-open"></i> Aperto
                    {/if}
                  </button>
                </form>
              </td>
              <td class="col-results">
                <button
                  class="results-btn"
                  onclick={() => openResults(poll)}
                >
                  <i class="ti ti-chart-pie"></i> Risultati
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- ── Results modal ─────────────────────────────────────────────────────────── -->

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialogEl}
  class="results-dialog"
  onclose={closeModal}
  onclick={(e) => { if (e.target === dialogEl) closeModal(); }}
>
  {#if activePoll}
    <div class="dialog-inner">
      <div class="dialog-header">
        <h2 class="dialog-title">Risultati sondaggio</h2>
        <button class="dialog-close" onclick={closeModal} aria-label="Chiudi">
          <i class="ti ti-x"></i>
        </button>
      </div>

      <!-- Charts section -->
      {#if loadingResults}
        <div class="loading-state">
          <i class="ti ti-loader-2 spin"></i> Caricamento risultati…
        </div>
      {:else if !results}
        <div class="loading-state">Nessun dato disponibile per questo sondaggio.</div>
      {:else if results.options.length > 0}
        <div class="charts-section">
          <div class="chart-switcher" role="group" aria-label="Tipo di grafico">
            {#each (['anello', 'torta', 'colonne'] as const) as type}
              <button
                class="chart-tab"
                class:active={chartType === type}
                onclick={() => chartType = type}
              >
                {#if type === 'anello'}<i class="ti ti-circle-dashed"></i>{/if}
                {#if type === 'torta'}<i class="ti ti-chart-pie"></i>{/if}
                {#if type === 'colonne'}<i class="ti ti-chart-bar"></i>{/if}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            {/each}
          </div>

          <div class="chart-area">
            {#if chartType === 'anello'}
              {@const slices = donutSlices(results.options)}
              <div class="chart-with-legend">
                <svg viewBox="0 0 160 160" width="160" height="160" class="chart-svg">
                  {#if results.totalVoters === 0}
                    <circle cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
                      fill="none" stroke="var(--color-bordo)" stroke-width="22" />
                  {:else}
                    {#each slices as sl}
                      <circle
                        cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
                        fill="none"
                        stroke={sl.color}
                        stroke-width="22"
                        stroke-dasharray="{sl.arcLen} {DONUT_CIRC}"
                        stroke-dashoffset={sl.dashOffset}
                        transform="rotate(-90 {DONUT_CX} {DONUT_CY})"
                      />
                    {/each}
                  {/if}
                  <text x={DONUT_CX} y={DONUT_CY - 6} text-anchor="middle" class="donut-center-num">
                    {results.totalVoters}
                  </text>
                  <text x={DONUT_CX} y={DONUT_CY + 12} text-anchor="middle" class="donut-center-label">
                    votanti
                  </text>
                </svg>
                <div class="chart-legend">
                  {#each slices as sl, i}
                    <div class="legend-row">
                      <span class="legend-dot" style="background:{sl.color}"></span>
                      <span class="legend-label">{sl.label}</span>
                      <span class="legend-pct">{sl.percentage}%</span>
                    </div>
                  {/each}
                </div>
              </div>

            {:else if chartType === 'torta'}
              {@const slices = getSlices(results.options)}
              <div class="chart-with-legend">
                <svg viewBox="0 0 160 160" width="160" height="160" class="chart-svg">
                  {#if results.totalVoters === 0}
                    <circle cx="80" cy="80" r="72" fill="var(--color-bordo)" />
                  {:else}
                    {#each slices as sl}
                      <path
                        d={pieSlicePath(80, 80, 72, sl.start, sl.end)}
                        fill={sl.color}
                        stroke="var(--poll-bg, var(--color-nebbia))"
                        stroke-width="1.5"
                      />
                    {/each}
                  {/if}
                </svg>
                <div class="chart-legend">
                  {#each slices as sl}
                    <div class="legend-row">
                      <span class="legend-dot" style="background:{sl.color}"></span>
                      <span class="legend-label">{sl.label}</span>
                      <span class="legend-pct">{sl.percentage}%</span>
                    </div>
                  {/each}
                </div>
              </div>

            {:else}
              <!-- Bar chart -->
              <div class="bar-chart">
                {#each results.options as opt, i}
                  <div class="bar-row">
                    <span class="bar-label">{opt.label}</span>
                    <div class="bar-track">
                      <div
                        class="bar-fill"
                        style="width:{opt.percentage}%; background:{COLORS[i % COLORS.length]}"
                      ></div>
                    </div>
                    <span class="bar-meta">{opt.votes} <span class="bar-pct">({opt.percentage}%)</span></span>
                  </div>
                {/each}
                <p class="bar-total">{results.totalVoters} votant{results.totalVoters === 1 ? 'e' : 'i'} totali</p>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <div class="dialog-footer">
        <a
          href="{base}/api/polls/{activePoll.id}/export"
          download
          class="btn-accent"
        >
          <i class="ti ti-download"></i> Esporta CSV
        </a>
        <button class="btn-ghost" onclick={closeModal}>Chiudi</button>
      </div>
    </div>
  {/if}
</dialog>

<style>
  .page-wrap {
    max-width: 960px;
    margin: 0 auto;
    padding: var(--space-8);
  }

  .page-header {
    margin-bottom: var(--space-6);
  }

  .page-title {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin: 0 0 var(--space-1);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .page-subtitle {
    font-size: var(--text-sm);
    color: var(--color-lilla);
    margin: 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-16) 0;
    color: var(--color-lilla);
    font-size: var(--text-sm);
  }

  /* ── Table ─────────────────────────────────────────────────────────────── */

  .table-wrap {
    overflow-x: auto;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
  }

  .polls-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  .polls-table th {
    background: var(--color-iris);
    color: var(--color-lilla);
    font-weight: var(--weight-medium);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
    padding: var(--space-3) var(--space-4);
    text-align: left;
    border-bottom: 0.5px solid var(--color-bordo);
  }

  .polls-table td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo-soft);
    color: var(--color-prugna);
    vertical-align: middle;
  }

  .polls-table tbody tr:last-child td {
    border-bottom: none;
  }

  .polls-table tbody tr:hover td {
    background: var(--color-nebbia);
  }

  .col-id { width: 90px; }
  .col-voters { width: 80px; text-align: center; }
  .col-status { width: 120px; }
  .col-results { width: 110px; }

  .id-chip {
    font-family: monospace;
    font-size: 11px;
    background: var(--color-iris);
    color: var(--color-lilla);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

  .col-question {
    font-weight: var(--weight-medium);
    color: var(--color-notte);
    max-width: 280px;
  }

  .article-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--color-viola);
    font-size: var(--text-sm);
    border-bottom: none;
    text-decoration: none;
  }
  .article-link:hover { color: var(--color-lavanda); }
  .article-link i { font-size: 11px; opacity: 0.7; }

  .no-article { color: var(--color-lilla); }

  /* Status toggle button */
  .status-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--text-xs);
    font-family: var(--font-sans);
    font-weight: var(--weight-medium);
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    border: 0.5px solid;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .status-btn.open {
    color: #1a6b3a;
    background: #d4f0e0;
    border-color: #8fd4b0;
  }
  .status-btn.open:hover {
    background: #f5e0d8;
    color: #7a2010;
    border-color: #e0a898;
  }

  .status-btn.closed {
    color: #7a2010;
    background: #f5e0d8;
    border-color: #e0a898;
  }
  .status-btn.closed:hover {
    background: #d4f0e0;
    color: #1a6b3a;
    border-color: #8fd4b0;
  }

  .results-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--text-xs);
    font-family: var(--font-sans);
    font-weight: var(--weight-medium);
    color: var(--color-viola);
    background: var(--color-iris);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: 5px 10px;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }
  .results-btn:hover {
    background: var(--color-lavanda);
    color: white;
    border-color: var(--color-lavanda);
  }

  /* ── Dialog ─────────────────────────────────────────────────────────────── */

  .results-dialog {
    border: none;
    border-radius: var(--radius-xl);
    padding: 0;
    width: min(680px, 95vw);
    max-height: 90vh;
    overflow: hidden;
    background: var(--color-nebbia);
    box-shadow: var(--shadow-lg);
    color: var(--color-prugna);
    margin: auto;
  }

  .results-dialog::backdrop {
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
  }

  .dialog-inner {
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    overflow-y: auto;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-6);
    border-bottom: 0.5px solid var(--color-bordo);
    position: sticky;
    top: 0;
    background: var(--color-nebbia);
    z-index: 1;
  }

  .dialog-title {
    font-family: var(--font-serif);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin: 0;
  }

  .dialog-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--color-lilla);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 1.1rem;
    transition: color var(--transition-fast), background var(--transition-fast);
  }
  .dialog-close:hover { color: var(--color-notte); background: var(--color-iris); }

  .loading-state {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-lilla);
    font-size: var(--text-sm);
    padding: var(--space-6) var(--space-6);
  }

  /* ── Charts ─────────────────────────────────────────────────────────────── */

  .charts-section {
    padding: var(--space-5) var(--space-6);
  }

  .chart-switcher {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-5);
  }

  .chart-tab {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--text-sm);
    font-family: var(--font-sans);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: transparent;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: 6px 14px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .chart-tab:hover { border-color: var(--color-viola); color: var(--color-viola); }
  .chart-tab.active {
    background: var(--color-viola);
    color: white;
    border-color: var(--color-viola);
  }

  .chart-area {
    min-height: 180px;
  }

  .chart-with-legend {
    display: flex;
    align-items: center;
    gap: var(--space-6);
  }

  .chart-svg {
    flex-shrink: 0;
  }

  :global(.chart-svg .donut-center-num) {
    font-family: var(--font-sans, system-ui);
    font-size: 20px;
    font-weight: 700;
    fill: var(--color-notte, #1e1630);
  }
  :global(.chart-svg .donut-center-label) {
    font-family: var(--font-sans, system-ui);
    font-size: 9px;
    fill: var(--color-lilla, #8e82b0);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .chart-legend {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .legend-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend-label {
    flex: 1;
    color: var(--color-prugna);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .legend-pct {
    font-weight: var(--weight-semibold);
    color: var(--color-viola);
    font-size: var(--text-xs);
    white-space: nowrap;
  }

  /* Bar chart */
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .bar-row {
    display: grid;
    grid-template-columns: 160px 1fr auto;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-sm);
  }

  .bar-label {
    color: var(--color-prugna);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track {
    height: 22px;
    background: var(--color-iris);
    border-radius: var(--radius-pill);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: var(--radius-pill);
    transition: width 0.4s ease;
    min-width: 3px;
  }

  .bar-meta {
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    font-size: var(--text-sm);
    white-space: nowrap;
  }

  .bar-pct {
    font-weight: var(--weight-normal);
    color: var(--color-lilla);
    font-size: var(--text-xs);
  }

  .bar-total {
    margin: var(--space-2) 0 0;
    font-size: var(--text-xs);
    color: var(--color-lilla);
  }

  /* ── Dialog footer ───────────────────────────────────────────────────────── */

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-6);
    border-top: 0.5px solid var(--color-bordo);
    background: var(--color-iris);
  }

  .btn-ghost-sm {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--text-sm);
    font-family: var(--font-sans);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: transparent;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: 6px 14px;
    cursor: pointer;
    text-decoration: none;
    transition: all var(--transition-fast);
  }
  .btn-ghost-sm:hover {
    color: var(--color-notte);
    border-color: var(--color-lavanda);
    background: var(--color-nebbia);
  }

  /* Spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  :global(.spin) { display: inline-block; animation: spin 0.9s linear infinite; }
</style>
