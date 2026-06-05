<script lang="ts">
  import { enhance } from '$app/forms';
  import { base } from '$app/paths';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  type Filter = 'all' | 'pending' | 'approved';
  let filter = $state<Filter>('all');
  let replyOpenId = $state<string | null>(null);
  let replyTexts = $state<Record<string, string>>({});

  const filtered = $derived(
    filter === 'pending'
      ? data.comments.filter((c) => !c.approved)
      : filter === 'approved'
        ? data.comments.filter((c) => c.approved)
        : data.comments
  );

  const pendingCount = $derived(data.comments.filter((c) => !c.approved).length);

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function toggleReply(id: string) {
    replyOpenId = replyOpenId === id ? null : id;
  }

  // Close reply form after successful send
  $effect(() => {
    if (form?.replySent && form?.replyId) {
      replyOpenId = null;
      replyTexts[form.replyId as string] = '';
    }
  });
</script>

<svelte:head><title>Commenti — OhMyNic!</title></svelte:head>

<div class="page-header">
  <h1>Commenti</h1>
  <span class="count">{data.comments.length} totali · {pendingCount} in attesa</span>
</div>

<div class="tabs">
  <button class="tab" class:active={filter === 'all'} onclick={() => filter = 'all'}>
    Tutti <span class="tab-count">{data.comments.length}</span>
  </button>
  <button class="tab" class:active={filter === 'pending'} onclick={() => filter = 'pending'}>
    In attesa
    {#if pendingCount > 0}<span class="tab-count pending">{pendingCount}</span>{/if}
  </button>
  <button class="tab" class:active={filter === 'approved'} onclick={() => filter = 'approved'}>
    Approvati <span class="tab-count">{data.comments.filter(c => c.approved).length}</span>
  </button>
</div>

{#if filtered.length === 0}
  <p class="empty">Nessun commento{filter !== 'all' ? ' in questa categoria' : ''}.</p>
{:else}
  <div class="comments-list">
    {#each filtered as comment (comment.id)}
      <div class="comment-card" class:is-pending={!comment.approved}>
        <div class="comment-meta">
          <span class="author">{comment.authorName ?? 'Anonimo'}</span>
          {#if comment.authorEmail}
            <span class="email">{comment.authorEmail}</span>
          {/if}
          <span class="article-link-wrap">
            <a href="{base}/{comment.articleSlug}" target="_blank" class="article-link">
              {comment.articleTitle} →
            </a>
          </span>
          <span class="date">{formatDate(comment.createdAt)}</span>
          {#if !comment.approved}
            <span class="badge pending-badge">In attesa</span>
          {:else}
            <span class="badge approved-badge">Approvato</span>
          {/if}
        </div>

        <p class="comment-content">{comment.content}</p>

        <div class="comment-actions">
          {#if !comment.approved}
            <form method="POST" action="?/approve" use:enhance>
              <input type="hidden" name="id" value={comment.id} />
              <button type="submit" class="btn-approve">✓ Approva</button>
            </form>
          {/if}

          {#if comment.authorEmail}
            <button
              type="button"
              class="btn-reply"
              class:active={replyOpenId === comment.id}
              onclick={() => toggleReply(comment.id)}
            >
              ↩ Rispondi
            </button>
          {/if}

          <form method="POST" action="?/delete" use:enhance>
            <input type="hidden" name="id" value={comment.id} />
            <button
              type="submit"
              class="btn-delete"
              onclick={(e) => { if (!confirm('Eliminare questo commento?')) e.preventDefault(); }}
            >
              Elimina
            </button>
          </form>
        </div>

        {#if replyOpenId === comment.id}
          <form
            method="POST"
            action="?/reply"
            class="reply-form"
            use:enhance={() => {
              return ({ update }) => update({ reset: false });
            }}
          >
            <input type="hidden" name="id" value={comment.id} />
            {#if form?.replyError && form?.replyId === comment.id}
              <p class="reply-error">{form.replyError}</p>
            {/if}
            {#if form?.replySent && form?.replyId === comment.id}
              <p class="reply-success">Risposta inviata!</p>
            {/if}
            <textarea
              name="replyText"
              rows="4"
              placeholder="Scrivi la tua risposta..."
              bind:value={replyTexts[comment.id]}
              required
            ></textarea>
            <div class="reply-actions">
              <button type="submit" class="btn-send">Invia risposta</button>
              <button type="button" class="btn-cancel" onclick={() => replyOpenId = null}>Annulla</button>
            </div>
          </form>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .page-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  .count { font-size: var(--text-sm); color: var(--color-lilla); }

  .tabs {
    display: flex;
    gap: var(--space-1);
    margin-bottom: var(--space-6);
    border-bottom: 0.5px solid var(--color-bordo);
  }

  .tab {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: var(--space-2) var(--space-3);
    margin-bottom: -0.5px;
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .tab:hover { color: var(--color-notte); }
  .tab.active { color: var(--color-viola); border-bottom-color: var(--color-lavanda); }

  .tab-count {
    font-size: var(--text-xs);
    background: var(--color-iris);
    color: var(--color-viola);
    padding: 1px 6px;
    border-radius: var(--radius-pill);
  }

  .tab-count.pending {
    background: #fef3c7;
    color: #92400e;
  }

  .empty { color: var(--color-lilla); }

  .comments-list { display: flex; flex-direction: column; gap: var(--space-4); }

  .comment-card {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
  }

  .comment-card.is-pending {
    border-left: 3px solid #f59e0b;
  }

  .comment-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    flex-wrap: wrap;
  }

  .author { font-weight: var(--weight-medium); color: var(--color-notte); }
  .email { font-size: var(--text-sm); color: var(--color-lilla); }
  .article-link-wrap { margin-left: auto; }
  .article-link { font-size: var(--text-sm); color: var(--color-viola); text-decoration: none; }
  .article-link:hover { text-decoration: underline; }
  .date { font-size: var(--text-sm); color: var(--color-lilla); }

  .badge {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
  }

  .pending-badge { background: #fef3c7; color: #92400e; }
  .approved-badge { background: #d1fae5; color: #065f46; }

  .comment-content {
    color: var(--color-prugna);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--space-4);
    white-space: pre-wrap;
  }

  .comment-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }

  .btn-approve {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: #d1fae5;
    color: #065f46;
    padding: 6px 14px;
    border-radius: var(--radius-md);
    border: 1px solid #a7f3d0;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .btn-approve:hover { background: #a7f3d0; }

  .btn-reply {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-iris);
    color: var(--color-viola);
    padding: 6px 14px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .btn-reply:hover, .btn-reply.active { background: var(--color-lavanda); color: white; border-color: var(--color-lavanda); }

  .btn-delete {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: transparent;
    color: #b91c1c;
    padding: 6px 14px;
    border-radius: var(--radius-md);
    border: 0.5px solid #fecaca;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .btn-delete:hover { background: #fef2f2; }

  .reply-form {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 0.5px solid var(--color-bordo);
  }

  .reply-form textarea {
    width: 100%;
    padding: 10px var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-notte);
    background: var(--color-nebbia);
    outline: none;
    resize: vertical;
    transition: border-color var(--transition-fast);
    box-sizing: border-box;
  }
  .reply-form textarea:focus { border-color: var(--color-lavanda); }

  .reply-actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }

  .btn-send {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 7px 16px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .btn-send:hover { background: var(--color-viola); }

  .btn-cancel {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    background: none;
    border: none;
    cursor: pointer;
    padding: 7px 12px;
  }
  .btn-cancel:hover { color: var(--color-notte); }

  .reply-error {
    font-size: var(--text-sm);
    color: #b91c1c;
    margin-bottom: var(--space-2);
  }

  .reply-success {
    font-size: var(--text-sm);
    color: #065f46;
    margin-bottom: var(--space-2);
  }
</style>
