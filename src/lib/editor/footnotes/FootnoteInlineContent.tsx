import React from 'react';
import { createReactInlineContentSpec } from '@blocknote/react';

// ── Context ───────────────────────────────────────────────────────────────────

export type FootnoteContextValue = {
  indices: Record<string, number>;
  pendingOpenId: string | null;
  clearPendingOpen: () => void;
  registerUpdater: (id: string, fn: (update: { props: { note: string } }) => void) => void;
  unregisterUpdater: (id: string) => void;
  openPopover: (id: string, note: string, anchor: HTMLElement) => void;
};

export const FootnoteContext = React.createContext<FootnoteContextValue>({
  indices: {},
  pendingOpenId: null,
  clearPendingOpen: () => {},
  registerUpdater: () => {},
  unregisterUpdater: () => {},
  openPopover: () => {},
});

// ── Footnote marker component ─────────────────────────────────────────────────

function FootnoteMarker({
  inlineContent,
  updateInlineContent,
}: {
  inlineContent: { props: { id: string; note: string } };
  updateInlineContent: (update: any) => void;
}) {
  const { id, note } = inlineContent.props;
  const ctx = React.useContext(FootnoteContext);
  const index = ctx.indices[id] ?? '?';
  const spanRef = React.useRef<HTMLElement | null>(null);

  // Register updateInlineContent so the popover can save note edits
  React.useEffect(() => {
    ctx.registerUpdater(id, updateInlineContent);
    return () => ctx.unregisterUpdater(id);
  }, [id, updateInlineContent]);

  // Auto-open popover if this footnote was just inserted
  React.useEffect(() => {
    if (ctx.pendingOpenId === id && spanRef.current) {
      ctx.openPopover(id, note, spanRef.current as HTMLElement);
      ctx.clearPendingOpen();
    }
  }, [ctx.pendingOpenId]);

  return (
    <span
      ref={spanRef as React.Ref<HTMLSpanElement>}
      className="fn-marker"
      title={note || 'Clicca per aggiungere una nota'}
      contentEditable={false}
      style={{ cursor: 'pointer', userSelect: 'none' as const, display: 'inline' }}
      onMouseDown={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (spanRef.current) {
          ctx.openPopover(id, note, spanRef.current as HTMLElement);
        }
      }}
    >
      <sup style={{ color: '#7c55d4', fontFamily: 'var(--font-sans, sans-serif)', fontSize: '0.75em', fontWeight: 500 }}>
        [{index}]
      </sup>
    </span>
  );
}

// ── Inline content spec ───────────────────────────────────────────────────────

export const footnoteInlineContentSpec = createReactInlineContentSpec(
  {
    type: 'footnote' as const,
    propSchema: {
      id:   { default: '' as string },
      note: { default: '' as string },
    },
    content: 'none' as const,
  },
  {
    render: ({ inlineContent, updateInlineContent }) =>
      React.createElement(FootnoteMarker, { inlineContent: inlineContent as any, updateInlineContent }),

    toExternalHTML: ({ inlineContent, editor }) => {
      const { id, note } = (inlineContent as any).props as { id: string; note: string };

      // Compute this footnote's 1-based index by traversing the document
      let index = 1;
      let found = false;
      const doc = (editor as any).document as any[];

      const countInBlock = (block: any): void => {
        if (found || block.type === 'footnoteList') return;
        if (Array.isArray(block.content)) {
          for (const item of block.content) {
            if (item.type === 'footnote') {
              if (item.props.id === id) { found = true; return; }
              index++;
            }
          }
        }
        for (const child of (block.children ?? [])) countInBlock(child);
      };
      doc.forEach(countInBlock);

      return (
        <sup
          className="footnote"
          data-id={id}
          data-index={String(index)}
          data-note={note}
        >
          <a href={`#fn-${id}`} id={`fnref-${id}`}>[{index}]</a>
        </sup>
      );
    },

    parse: (el) => {
      if (!(el instanceof HTMLElement)) return undefined;
      if (el.tagName !== 'SUP') return undefined;
      if (!el.classList.contains('footnote')) return undefined;
      const id = el.getAttribute('data-id') || crypto.randomUUID();
      const note = el.getAttribute('data-note') || '';
      return { id, note };
    },
  }
);
