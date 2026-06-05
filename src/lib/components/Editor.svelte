<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let {
    content = $bindable(''),
  }: {
    content: string;
  } = $props();

  let mountEl: HTMLDivElement;
  let rootRef: import('react-dom/client').Root | null = null;
  let showSource = $state(false);
  let sourceValue = $state(content);

  function applySource() {
    content = sourceValue;
    showSource = false;
    mountEditor(sourceValue);
  }

  async function mountEditor(initialHtml: string) {
    if (rootRef) { rootRef.unmount(); rootRef = null; }

    const React = await import('react');
    const { createElement } = React;
    const { createRoot } = await import('react-dom/client');
    const { useCreateBlockNote } = await import('@blocknote/react');
    const { BlockNoteView } = await import('@blocknote/mantine');

    await import('@blocknote/mantine/style.css');

    function EditorWrapper({ html, onChange }: { html: string; onChange: (h: string) => void }) {
      const editor = useCreateBlockNote();

      React.useEffect(() => {
        const blocks = editor.tryParseHTMLToBlocks(html);
        if (blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks);
        }
      }, []);

      const handleChange = React.useCallback(async () => {
        const h = await editor.blocksToHTMLLossy(editor.document);
        onChange(h);
      }, [editor]);

      return createElement(BlockNoteView as any, {
        editor,
        onChange: handleChange,
        theme: 'light',
      });
    }

    if (!mountEl) return;

    rootRef = createRoot(mountEl);
    rootRef.render(
      createElement(EditorWrapper, {
        html: initialHtml,
        onChange: (h: string) => {
          content = h;
          sourceValue = h;
        },
      })
    );
  }

  onMount(() => {
    mountEditor(content);
  });

  onDestroy(() => {
    rootRef?.unmount();
  });
</script>

<div class="editor-wrap">
  <div class="editor-toolbar">
    <button
      type="button"
      class="source-toggle"
      class:active={showSource}
      onclick={() => {
        if (!showSource) {
          sourceValue = content;
          showSource = true;
        } else {
          applySource();
        }
      }}
      title="Mostra/modifica HTML sorgente"
    >&lt;/&gt;</button>
  </div>

  <div class="bn-mount" bind:this={mountEl}></div>

  {#if showSource}
    <div class="source-panel">
      <textarea bind:value={sourceValue} rows="12" spellcheck="false"></textarea>
      <div class="source-actions">
        <button type="button" class="btn-apply" onclick={applySource}>Applica</button>
        <button type="button" class="btn-cancel" onclick={() => showSource = false}>Annulla</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .editor-wrap {
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: white;
  }

  .editor-toolbar {
    display: flex;
    justify-content: flex-end;
    padding: var(--space-2) var(--space-3);
    border-bottom: 0.5px solid var(--color-bordo);
    background: var(--color-nebbia);
  }

  .source-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 var(--space-3);
    border: 0.5px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .source-toggle:hover, .source-toggle.active {
    background: var(--color-iris);
    color: var(--color-viola);
    border-color: var(--color-bordo);
  }

  .bn-mount {
    min-height: 400px;
  }

  .source-panel {
    border-top: 0.5px solid var(--color-bordo);
    padding: var(--space-4);
    background: var(--color-nebbia);
  }

  .source-panel textarea {
    width: 100%;
    font-family: monospace;
    font-size: var(--text-sm);
    color: var(--color-prugna);
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    resize: vertical;
    outline: none;
  }

  .source-actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
    justify-content: flex-end;
  }

  .btn-apply {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 6px 14px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
  }

  .btn-cancel {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: transparent;
    color: var(--color-lilla);
    padding: 6px 14px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    cursor: pointer;
  }

  /* Override BlockNote styles con i nostri token */
  :global(.bn-container) {
    font-family: var(--font-sans) !important;
    --bn-font-family: var(--font-sans);
    --bn-border-radius: var(--radius-md);
  }

  :global(.bn-editor) {
    padding: var(--space-6) !important;
    min-height: 380px;
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-prugna);
  }

  :global(.bn-editor h1, .bn-editor h2, .bn-editor h3) {
    font-family: var(--font-serif) !important;
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
  }

  :global(.bn-editor h2) {
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
  }

  :global(.bn-editor h3) {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
  }
</style>
