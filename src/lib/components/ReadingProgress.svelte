<script lang="ts">
  import { onMount } from 'svelte';

  let width = $state(0);

  onMount(() => {
    const article = document.querySelector('.prose') as HTMLElement | null;
    if (!article) return;

    function update() {
      const articleTop = article!.offsetTop;
      const articleHeight = article!.offsetHeight;
      const scrolled = window.scrollY - articleTop;
      const progress = Math.min(Math.max(scrolled / articleHeight, 0), 1);
      width = progress * 100;
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  });
</script>

<div class="reading-progress" style="width: {width}%"></div>

<style>
  .reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    background: var(--color-lavanda);
    z-index: 9999;
    border-radius: 0 2px 2px 0;
    transition: width 100ms linear;
    pointer-events: none;
  }
</style>
