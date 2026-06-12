<script lang="ts">
  import { base } from '$app/paths';

  type PollOption = { id: string; label: string; position: number };
  type OptionResult = {
    optionId: string;
    label: string;
    position: number;
    votes: number;
    percentage: number;
  };

  let {
    pollId,
    question,
    allowMultiple = false,
    closed = false,
    reader = null,
    previewMode = false,
    previewOptions = [],
    initialResults = null,
    initialUserVotedOptionIds = [],
  }: {
    pollId: string;
    question: string;
    allowMultiple?: boolean;
    closed?: boolean;
    reader?: { id: string; displayName: string } | null;
    previewMode?: boolean;
    previewOptions?: PollOption[];
    initialResults?: { options: OptionResult[]; totalVoters: number } | null;
    initialUserVotedOptionIds?: string[];
  } = $props();

  // Snapshot props → local state once (intentional: updated by vote/refresh, not reactive to prop)
  let selected = $state<string[]>([]);
  let results = $state((() => initialResults)());
  let userVotedOptionIds = $state((() => initialUserVotedOptionIds)());
  let voting = $state(false);
  let voteError = $state<string | null>(null);

  const hasVoted = $derived(userVotedOptionIds.length > 0);
  const showResults = $derived(hasVoted || closed);

  function toggleOption(id: string) {
    if (allowMultiple) {
      selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    } else {
      selected = [id];
    }
  }

  async function vote() {
    if (selected.length === 0 || voting || !reader) return;
    voting = true;
    voteError = null;
    try {
      const res = await fetch(`${base}/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIds: selected }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        voteError = body.message ?? 'Errore durante il voto. Riprova.';
        return;
      }
      userVotedOptionIds = [...selected];
      await refreshResults();
    } catch {
      voteError = 'Errore di rete. Riprova.';
    } finally {
      voting = false;
    }
  }

  async function refreshResults() {
    try {
      const res = await fetch(`${base}/api/polls/${pollId}/results`);
      if (res.ok) {
        const data = await res.json();
        results = { options: data.options, totalVoters: data.totalVoters };
        userVotedOptionIds = data.userVotedOptionIds ?? [];
      }
    } catch {
      /* ignore */
    }
  }

  function formatVotes(n: number) {
    return n === 1 ? '1 voto' : `${n} voti`;
  }
</script>

<div class="poll" class:preview={previewMode} class:closed>
  <div class="poll-header">
    <span class="poll-icon" aria-hidden="true">📊</span>
    <p class="poll-question">{question || 'Sondaggio'}</p>
  </div>

  {#if previewMode}
    <div class="poll-options">
      {#each previewOptions as opt (opt.id)}
        <div class="poll-option disabled">
          <span class="poll-input-fake" class:checkbox={allowMultiple}></span>
          <span class="poll-label">{opt.label || 'Opzione…'}</span>
        </div>
      {/each}
      {#if previewOptions.length === 0}
        <div class="poll-option disabled">
          <span class="poll-input-fake"></span>
          <span class="poll-label poll-placeholder">Aggiungi opzioni nell'editor</span>
        </div>
      {/if}
    </div>
    <p class="poll-hint">Anteprima — voto non disponibile nell'editor</p>

  {:else if !reader}
    <p class="poll-login-msg">
      <a href="{base}/login" class="poll-login-link">Accedi</a> per partecipare al sondaggio
    </p>

  {:else if showResults && results}
    <div class="poll-results">
      {#each results.options as opt (opt.optionId)}
        {@const voted = userVotedOptionIds.includes(opt.optionId)}
        <div class="poll-result-row" class:voted>
          <div class="poll-result-bar" style="width: {opt.percentage}%"></div>
          <div class="poll-result-content">
            <span class="poll-result-label">
              {opt.label}
              {#if voted}<span class="poll-result-check" title="La tua scelta">✓</span>{/if}
            </span>
            <span class="poll-result-pct">{opt.percentage}%</span>
          </div>
        </div>
      {/each}
    </div>
    <p class="poll-total">{formatVotes(results.totalVoters)}</p>
    {#if closed}
      <p class="poll-closed-label">Votazione chiusa</p>
    {/if}

  {:else if closed}
    <p class="poll-closed-label poll-closed-only">Votazione chiusa</p>

  {:else}
    <div class="poll-options">
      {#each (results?.options ?? []) as opt (opt.optionId)}
        <label class="poll-option">
          <input
            type={allowMultiple ? 'checkbox' : 'radio'}
            name="poll-{pollId}"
            value={opt.optionId}
            checked={selected.includes(opt.optionId)}
            onchange={() => toggleOption(opt.optionId)}
          />
          <span class="poll-label">{opt.label}</span>
        </label>
      {/each}
    </div>
    {#if voteError}
      <p class="poll-error">{voteError}</p>
    {/if}
    <button
      class="poll-vote-btn"
      onclick={vote}
      disabled={selected.length === 0 || voting}
    >
      {voting ? 'Voto in corso…' : 'Vota'}
    </button>
    {#if allowMultiple}
      <p class="poll-hint">Puoi selezionare più opzioni</p>
    {/if}
  {/if}
</div>

<style>
  .poll {
    --poll-accent:  var(--color-viola, #7c55d4);
    --poll-border:  var(--color-bordo, #d8d0f0);
    --poll-text:    var(--color-notte, #1a1330);
    --poll-muted:   var(--color-lilla, #8e82b0);
    --poll-card:    var(--color-iris, #ece7fa);
    --poll-bg:      var(--color-nebbia, #f5f3fb);

    border: 1px solid var(--poll-border);
    border-radius: 12px;
    padding: 1.2rem 1.4rem;
    margin: 1.5rem 0;
    background: var(--poll-bg);
    font-family: var(--font-sans, system-ui, sans-serif);
  }

  .poll.preview {
    background: var(--poll-card);
    border-style: dashed;
  }

  .poll-header {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }

  .poll-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .poll-question {
    margin: 0;
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--poll-text);
    line-height: 1.4;
  }

  /* ── Options (voting form) ──────────────────────────────────────── */

  .poll-options {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 0.9rem;
  }

  .poll-option {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--poll-border);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    font-size: 0.875rem;
    color: var(--poll-text);
  }

  .poll-option:not(.disabled):hover {
    border-color: var(--poll-accent);
    background: var(--poll-card);
  }

  .poll-option.disabled {
    cursor: default;
    opacity: 0.65;
  }

  .poll-option input {
    accent-color: var(--poll-accent);
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .poll-input-fake {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 1.5px solid var(--poll-border);
    border-radius: 50%;
    flex-shrink: 0;
    background: white;
  }

  .poll-input-fake.checkbox {
    border-radius: 4px;
  }

  .poll-label {
    flex: 1;
  }

  .poll-placeholder {
    color: var(--poll-muted);
    font-style: italic;
  }

  /* ── Vote button ───────────────────────────────────────────────── */

  .poll-vote-btn {
    display: inline-block;
    padding: 0.5rem 1.4rem;
    background: var(--poll-accent);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .poll-vote-btn:hover:not(:disabled) {
    opacity: 0.85;
  }

  .poll-vote-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* ── Results ───────────────────────────────────────────────────── */

  .poll-results {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 0.7rem;
  }

  .poll-result-row {
    position: relative;
    background: var(--poll-card);
    border: 1px solid var(--poll-border);
    border-radius: 8px;
    padding: 0.55rem 0.75rem;
    overflow: hidden;
  }

  .poll-result-row.voted {
    border-color: var(--poll-accent);
  }

  .poll-result-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--poll-border);
    border-radius: 8px;
    transition: width 0.4s ease;
  }

  .poll-result-row.voted .poll-result-bar {
    background: color-mix(in srgb, var(--poll-accent) 22%, transparent);
  }

  .poll-result-content {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--poll-text);
  }

  .poll-result-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 500;
  }

  .poll-result-check {
    color: var(--poll-accent);
    font-weight: 700;
    font-size: 0.8rem;
  }

  .poll-result-pct {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--poll-accent);
    white-space: nowrap;
  }

  /* ── Footer labels ─────────────────────────────────────────────── */

  .poll-total {
    margin: 0.4rem 0 0;
    font-size: 0.78rem;
    color: var(--poll-muted);
  }

  .poll-closed-label {
    margin: 0.4rem 0 0;
    font-size: 0.78rem;
    color: var(--poll-muted);
    font-style: italic;
  }

  .poll-closed-only {
    margin-top: 0;
  }

  .poll-hint {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: var(--poll-muted);
  }

  .poll-login-msg {
    font-size: 0.875rem;
    color: var(--poll-muted);
    margin: 0;
  }

  .poll-login-link {
    color: var(--poll-accent);
    font-weight: 600;
    text-decoration: none;
  }

  .poll-login-link:hover {
    text-decoration: underline;
  }

  .poll-error {
    color: #c0392b;
    font-size: 0.8rem;
    margin: 0.4rem 0 0.6rem;
  }
</style>
