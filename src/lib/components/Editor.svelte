<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Link from '@tiptap/extension-link';
  import Image from '@tiptap/extension-image';

  let {
    content = $bindable(''),
    placeholder = 'Scrivi il tuo articolo...',
  }: {
    content: string;
    placeholder?: string;
  } = $props();

  let editorEl: HTMLDivElement;
  let editor: Editor | null = null;

  onMount(() => {
    editor = new Editor({
      element: editorEl,
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false }),
        Image,
      ],
      content,
      onUpdate: ({ editor }) => {
        content = editor.getHTML();
      },
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  function toggleBold() { editor?.chain().focus().toggleBold().run(); }
  function toggleItalic() { editor?.chain().focus().toggleItalic().run(); }
  function toggleH2() { editor?.chain().focus().toggleHeading({ level: 2 }).run(); }
  function toggleH3() { editor?.chain().focus().toggleHeading({ level: 3 }).run(); }
  function toggleBlockquote() { editor?.chain().focus().toggleBlockquote().run(); }
  function toggleCode() { editor?.chain().focus().toggleCodeBlock().run(); }
  function toggleBulletList() { editor?.chain().focus().toggleBulletList().run(); }
  function toggleOrderedList() { editor?.chain().focus().toggleOrderedList().run(); }

  function setLink() {
    const url = window.prompt('URL del link:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    } else if (url === '') {
      editor?.chain().focus().unsetLink().run();
    }
  }

  function addImage() {
    const url = window.prompt('URL immagine:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }

  function isActive(name: string, attrs?: Record<string, unknown>) {
    return editor?.isActive(name, attrs) ?? false;
  }
</script>

<div class="editor-wrap">
  <div class="toolbar">
    <button type="button" class:active={isActive('bold')} onclick={toggleBold} title="Bold">B</button>
    <button type="button" class:active={isActive('italic')} onclick={toggleItalic} title="Italic"><em>I</em></button>
    <button type="button" class:active={isActive('heading', { level: 2 })} onclick={toggleH2} title="Titolo H2">H2</button>
    <button type="button" class:active={isActive('heading', { level: 3 })} onclick={toggleH3} title="Titolo H3">H3</button>
    <span class="sep"></span>
    <button type="button" class:active={isActive('link')} onclick={setLink} title="Link">🔗</button>
    <button type="button" onclick={addImage} title="Immagine">🖼</button>
    <span class="sep"></span>
    <button type="button" class:active={isActive('blockquote')} onclick={toggleBlockquote} title="Citazione">"</button>
    <button type="button" class:active={isActive('codeBlock')} onclick={toggleCode} title="Codice">&lt;/&gt;</button>
    <span class="sep"></span>
    <button type="button" class:active={isActive('bulletList')} onclick={toggleBulletList} title="Lista">•</button>
    <button type="button" class:active={isActive('orderedList')} onclick={toggleOrderedList} title="Lista numerata">1.</button>
  </div>
  <div class="editor-content" bind:this={editorEl}></div>
</div>

<style>
  .editor-wrap {
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: white;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-bottom: 0.5px solid var(--color-bordo);
    background: var(--color-nebbia);
    flex-wrap: wrap;
  }

  .toolbar button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 28px;
    padding: 0 var(--space-2);
    border: 0.5px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-prugna);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .toolbar button:hover {
    background: var(--color-iris);
    border-color: var(--color-bordo);
  }

  .toolbar button.active {
    background: var(--color-iris);
    border-color: var(--color-viola);
    color: var(--color-viola);
  }

  .sep {
    width: 0.5px;
    height: 20px;
    background: var(--color-bordo);
    margin: 0 var(--space-1);
  }

  .editor-content {
    min-height: 400px;
    padding: var(--space-6);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-prugna);
    outline: none;
  }

  :global(.editor-content .ProseMirror) {
    outline: none;
    min-height: 380px;
  }

  :global(.editor-content h2) {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin: var(--space-6) 0 var(--space-3);
  }

  :global(.editor-content h3) {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin: var(--space-5) 0 var(--space-2);
  }

  :global(.editor-content blockquote) {
    border-left: 3px solid var(--color-lavanda);
    padding-left: var(--space-4);
    margin: var(--space-4) 0;
    color: var(--color-lilla);
    font-style: italic;
  }

  :global(.editor-content code) {
    background: var(--color-iris);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: 0.9em;
  }

  :global(.editor-content pre) {
    background: var(--color-notte);
    color: var(--color-nebbia);
    padding: var(--space-4);
    border-radius: var(--radius-md);
    overflow-x: auto;
    margin: var(--space-4) 0;
  }

  :global(.editor-content pre code) {
    background: transparent;
    padding: 0;
    color: inherit;
  }

  :global(.editor-content ul, .editor-content ol) {
    padding-left: var(--space-6);
    margin: var(--space-3) 0;
  }

  :global(.editor-content img) {
    max-width: 100%;
    border-radius: var(--radius-md);
    margin: var(--space-4) 0;
  }

  :global(.editor-content a) {
    color: var(--color-viola);
  }

  :global(.editor-content p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    color: var(--color-lilla);
    pointer-events: none;
    float: left;
    height: 0;
  }
</style>
