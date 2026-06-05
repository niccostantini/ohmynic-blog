import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';

// ── Block spec ────────────────────────────────────────────────────────────────

export const footnoteListBlockSpec = createReactBlockSpec(
  {
    type: 'footnoteList' as const,
    propSchema: {
      // JSON-serialised Array<{ id: string; note: string }> in document order
      notes: { default: '[]' as string },
    },
    content: 'none' as const,
  },
  {
    // ── Editor rendering (read-only, auto-updated) ────────────────────────────
    render: ({ block }) => {
      const notes: { id: string; note: string }[] = React.useMemo(() => {
        try { return JSON.parse(block.props.notes); } catch { return []; }
      }, [block.props.notes]);

      return (
        <div
          className="fn-list-editor"
          contentEditable={false}
          style={{
            userSelect: 'none',
            pointerEvents: 'none',
            marginTop: '1rem',
            borderTop: '0.5px solid #d8d0f0',
            paddingTop: '1rem',
          }}
        >
          <p style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: '#8e82b0',
            margin: '0 0 0.75rem',
          }}>
            Fonti
          </p>
          {notes.length === 0 ? (
            <p style={{ color: '#c4b8e0', fontSize: '12px', margin: 0 }}>
              (nessuna nota)
            </p>
          ) : (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notes.map((n, i) => (
                <li key={n.id} style={{
                  display: 'flex',
                  gap: '0.5rem',
                  fontSize: '12px',
                  color: '#6b5f8a',
                  lineHeight: 1.6,
                  marginBottom: '2px',
                }}>
                  <span style={{ color: '#7c55d4', fontWeight: 500, flexShrink: 0 }}>
                    [{i + 1}]
                  </span>
                  <span>{n.note || <em style={{ opacity: 0.4 }}>nota vuota</em>}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      );
    },

    // ── HTML export (saved to DB) ─────────────────────────────────────────────
    toExternalHTML: ({ block }) => {
      const notes: { id: string; note: string }[] = (() => {
        try { return JSON.parse(block.props.notes); } catch { return []; }
      })();

      if (notes.length === 0) return <div></div>;

      return (
        <div className="footnote-list">
          <hr className="footnote-divider" />
          <h3 className="footnote-heading">Fonti</h3>
          <ol className="footnotes">
            {notes.map((n) => (
              <li key={n.id} id={`fn-${n.id}`}>
                {n.note}
                <a href={`#fnref-${n.id}`} className="footnote-backref">↩</a>
              </li>
            ))}
          </ol>
        </div>
      );
    },

    // ── HTML parsing (loading saved content) ─────────────────────────────────
    parse: (element) => {
      if (!(element instanceof HTMLElement)) return undefined;
      if (!element.classList.contains('footnote-list')) return undefined;

      const items = Array.from(element.querySelectorAll('li'));
      const notes = items.map((li) => {
        const id = li.id?.replace('fn-', '') || crypto.randomUUID();
        const clone = li.cloneNode(true) as HTMLElement;
        clone.querySelector('.footnote-backref')?.remove();
        const note = clone.textContent?.trim() || '';
        return { id, note };
      });
      return { notes: JSON.stringify(notes) };
    },
  }
);
