<script lang="ts">
  type Comment = {
    id: string; authorName: string | null; content: string;
    createdAt: Date | string;
  };
  let { comments }: { comments: Comment[] } = $props();

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  }
</script>

{#if comments.length > 0}
  <div class="comment-list">
    <h3>{comments.length} commento{comments.length !== 1 ? 'i' : ''}</h3>
    {#each comments as comment}
      <div class="comment">
        <div class="comment-meta">
          <span class="author">{comment.authorName ?? 'Anonimo'}</span>
          <span class="date">{formatDate(comment.createdAt)}</span>
        </div>
        <p class="comment-text">{comment.content}</p>
      </div>
    {/each}
  </div>
{/if}

<style>
  .comment-list { margin-bottom: var(--space-10); }
  h3 {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo);
  }
  .comment {
    padding: var(--space-5) 0;
    border-bottom: 0.5px solid var(--color-bordo-soft);
  }
  .comment:last-child { border-bottom: none; }
  .comment-meta {
    display: flex;
    align-items: baseline;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
  }
  .author {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
  }
  .date {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
  }
  .comment-text {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-prugna);
    white-space: pre-wrap;
  }
</style>
