<script lang="ts">
  const CHIPS = [
    { value: 'public',      label: 'Tutti',        bg: '#1e1630', color: '#f0ecff' },
    { value: 'reader',      label: 'Lettori',      bg: '#ece7fa', color: '#3b2f5e' },
    { value: 'contributor', label: 'Contributor',  bg: '#e6f1fb', color: '#0c447c' },
    { value: 'editor',      label: 'Editor',       bg: '#faeeda', color: '#633806' },
    { value: 'admin',       label: 'Solo admin',   bg: '#eaf3de', color: '#3b6d11' },
  ];

  let { selected = $bindable(['public']) }: { selected: string[] } = $props();

  function toggle(value: string) {
    if (value === 'public') {
      // Selecting 'public' clears everything else
      selected = ['public'];
    } else {
      const withoutPublic = selected.filter(v => v !== 'public');
      if (withoutPublic.includes(value)) {
        // Deselecting — keep at least one chip active
        const next = withoutPublic.filter(v => v !== value);
        selected = next.length > 0 ? next : [value];
      } else {
        selected = [...withoutPublic, value];
      }
    }
  }
</script>

<div class="chips">
  {#each CHIPS as chip}
    <button
      type="button"
      class="chip"
      class:active={selected.includes(chip.value)}
      style:--chip-bg={chip.bg}
      style:--chip-color={chip.color}
      onclick={() => toggle(chip.value)}
    >{chip.label}</button>
  {/each}
</div>

<style>
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }

  .chip {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 99px;
    border: 0.5px solid var(--color-bordo);
    background: var(--color-nebbia);
    color: var(--color-lilla);
    cursor: pointer;
    transition: background 120ms, color 120ms, border-color 120ms;
    line-height: 1.5;
  }
  .chip.active {
    background: var(--chip-bg);
    color: var(--chip-color);
    border-color: transparent;
  }
  .chip:hover:not(.active) {
    border-color: var(--color-lavanda);
    color: var(--color-notte);
  }
</style>
