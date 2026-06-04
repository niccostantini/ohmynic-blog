<script lang="ts">
  type Tag = { id: string; name: string; slug: string; count?: number };
  let { tags, currentSlug = '' }: { tags: Tag[]; currentSlug?: string } = $props();
</script>

{#if tags.length > 0}
  <div class="tag-list">
    <span class="tag-label">Tag</span>
    <div class="tags">
      {#each tags as tag}
        <a
          href="/tag/{tag.slug}"
          class="tag"
          class:active={tag.slug === currentSlug}
        >
          {tag.name}
          {#if tag.count !== undefined}
            <span class="count">{tag.count}</span>
          {/if}
        </a>
      {/each}
    </div>
  </div>
{/if}

<style>
  .tag-list { display: flex; flex-direction: column; gap: var(--space-3); }
  .tag-label {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-widest);
    text-transform: uppercase;
    color: var(--color-lilla);
  }
  .tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-wide);
    color: var(--color-viola);
    background: var(--color-iris);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-pill);
    padding: 4px 12px;
    text-decoration: none;
    border-bottom: none;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }
  .tag:hover, .tag.active {
    background: var(--color-viola);
    color: white;
    border-color: var(--color-viola);
  }
  .count {
    font-size: var(--text-xs);
    opacity: 0.7;
  }
</style>
