<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
</script>

<svelte:head><title>Commenti in attesa — OhMyNic!</title></svelte:head>

<div class="page-header">
  <h1>Commenti in attesa</h1>
  <span class="count">{data.comments.length} commento{data.comments.length !== 1 ? 'i' : ''}</span>
</div>

{#if data.comments.length === 0}
  <p class="empty">Nessun commento in attesa. 🎉</p>
{:else}
  <div class="comments-list">
    {#each data.comments as comment}
      <div class="comment-card">
        <div class="comment-meta">
          <span class="author">{comment.authorName ?? 'Anonimo'}</span>
          {#if comment.authorEmail}
            <span class="email">{comment.authorEmail}</span>
          {/if}
          <span class="date">{formatDate(comment.createdAt)}</span>
          <a href="/{data.articleSlugs[comment.articleId] ?? ''}" target="_blank" class="article-link">
            Articolo →
          </a>
        </div>
        <p class="comment-content">{comment.content}</p>
        <div class="comment-actions">
          <form method="POST" action="?/approve" use:enhance>
            <input type="hidden" name="id" value={comment.id} />
            <button type="submit" class="btn-approve">✓ Approva</button>
          </form>
          <form method="POST" action="?/delete" use:enhance>
            <input type="hidden" name="id" value={comment.id} />
            <button type="submit" class="btn-delete"
              onclick={(e) => { if (!confirm('Eliminare questo commento?')) e.preventDefault(); }}>
              Elimina
            </button>
          </form>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .page-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
  }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  .count {
    font-size: var(--text-sm);
    color: var(--color-lilla);
  }

  .empty { color: var(--color-lilla); }

  .comments-list { display: flex; flex-direction: column; gap: var(--space-4); }

  .comment-card {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
  }

  .comment-meta {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
    flex-wrap: wrap;
  }

  .author { font-weight: var(--weight-medium); color: var(--color-notte); }
  .email { font-size: var(--text-sm); color: var(--color-lilla); }
  .date { font-size: var(--text-sm); color: var(--color-lilla); margin-left: auto; }
  .article-link { font-size: var(--text-sm); }

  .comment-content {
    color: var(--color-prugna);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--space-4);
    white-space: pre-wrap;
  }

  .comment-actions { display: flex; gap: var(--space-3); }

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
</style>
