<script lang="ts">
  type Comment = {
    id: string;
    authorName: string | null;
    content: string;
    replyText?: string | null;
    createdAt: Date | string;
  };
  let { comments }: { comments: Comment[] } = $props();

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }
</script>

{#if comments.length > 0}
  <div class="comment-list">
    <h3>{comments.length} commento{comments.length !== 1 ? 'i' : ''}</h3>
    {#each comments as comment}
      <div class="thread">
        <!-- commento utente -->
        <div class="bubble user-bubble">
          <div class="bubble-meta">
            <span class="author">{comment.authorName ?? 'Anonimo'}</span>
            <span class="date">{formatDate(comment.createdAt)}</span>
          </div>
          <p class="bubble-text">{comment.content}</p>
        </div>

        <!-- risposta admin -->
        {#if comment.replyText}
          <div class="bubble reply-bubble">
            <div class="bubble-meta">
              <span class="author reply-author">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z"/>
                </svg>
                Nic
              </span>
            </div>
            <p class="bubble-text">{comment.replyText}</p>
          </div>
        {/if}
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
  }

  .thread {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
  }

  .bubble {
    padding: var(--space-4) var(--space-5);
    border-radius: var(--radius-lg);
    max-width: 88%;
  }

  /* commento utente — sinistra */
  .user-bubble {
    align-self: flex-start;
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-bottom-left-radius: var(--radius-sm);
  }

  /* risposta admin — destra, accent */
  .reply-bubble {
    align-self: flex-end;
    background: var(--color-iris);
    border: 0.5px solid var(--color-bordo);
    border-bottom-right-radius: var(--radius-sm);
  }

  .bubble-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
  }

  .author {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  .reply-author {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--color-viola);
  }

  .date {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    margin-left: auto;
  }

  .bubble-text {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-prugna);
    white-space: pre-wrap;
    margin: 0;
  }

  @media (max-width: 640px) {
    .bubble { max-width: 95%; }
  }
</style>
