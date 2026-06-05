import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { DOMParser as PMDOMParser } from 'prosemirror-model';
import type { Fragment, Schema } from 'prosemirror-model';

// ── Variant / position config ────────────────────────────────────────────────

const VARIANTS = {
  nota: {
    bg: '#ece7fa', border: '#c9b8f0', text: '#3b2f5e',
    icon: 'ti ti-bulb', emoji: '💡', label: 'Nota',
  },
  attenzione: {
    bg: '#faeeda', border: '#fac775', text: '#633806',
    icon: 'ti ti-alert-triangle', emoji: '⚠️', label: 'Attenzione',
  },
  info: {
    bg: '#e6f1fb', border: '#b5d4f4', text: '#0c447c',
    icon: 'ti ti-info-circle', emoji: 'ℹ️', label: 'Info',
  },
} as const;

const POSITIONS = {
  'float-right': 'Float →',
  'float-left':  '← Float',
  center:        'Centrata',
} as const;

type Variant  = keyof typeof VARIANTS;
type Position = keyof typeof POSITIONS;

// ── Block spec ───────────────────────────────────────────────────────────────

export const calloutBlockSpec = createReactBlockSpec(
  {
    type: 'callout' as const,
    propSchema: {
      variant:  { default: 'nota'   as Variant,  values: ['nota', 'attenzione', 'info']           as const },
      position: { default: 'center' as Position, values: ['float-right', 'float-left', 'center']  as const },
      title:    { default: '' },
    },
    content: 'inline' as const,
  },
  {
    // ── Editor rendering ────────────────────────────────────────────────────
    render: ({ block, editor, contentRef }) => {
      const { variant, position, title } = block.props;
      const v = VARIANTS[variant] ?? VARIANTS.nota;
      const [localTitle, setLocalTitle] = React.useState(title);
      React.useEffect(() => setLocalTitle(title), [title]);

      const btnBase: React.CSSProperties = {
        padding: '1px 7px', borderRadius: '4px', cursor: 'pointer',
        fontSize: '0.7rem', lineHeight: 1.4,
      };

      return (
        <div style={{
          background: v.bg, borderColor: v.border, color: v.text,
          borderRadius: '10px', padding: '0.75rem 1rem',
          border: `0.5px solid ${v.border}`, margin: '0.25rem 0',
        }}>
          {/* Controls */}
          <div
            contentEditable={false}
            style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}
          >
            {(Object.keys(VARIANTS) as Variant[]).map(k => (
              <button
                key={k}
                type="button"
                onMouseDown={e => { e.preventDefault(); editor.updateBlock(block, { props: { variant: k } }); }}
                style={{
                  ...btnBase,
                  border: `0.5px solid ${VARIANTS[k].border}`,
                  background: variant === k ? VARIANTS[k].border : 'transparent',
                  color: VARIANTS[k].text, fontWeight: variant === k ? 700 : 400,
                }}
              >
                {VARIANTS[k].emoji} {VARIANTS[k].label}
              </button>
            ))}
            <span style={{ color: v.border, margin: '0 0.2rem', opacity: 0.5 }}>|</span>
            {(Object.keys(POSITIONS) as Position[]).map(k => (
              <button
                key={k}
                type="button"
                onMouseDown={e => { e.preventDefault(); editor.updateBlock(block, { props: { position: k } }); }}
                style={{
                  ...btnBase,
                  border: `0.5px solid ${v.border}`,
                  background: position === k ? v.border : 'transparent',
                  color: v.text, fontWeight: position === k ? 700 : 400,
                }}
              >
                {POSITIONS[k]}
              </button>
            ))}
          </div>
          {/* Body */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <i
              className={v.icon}
              contentEditable={false}
              style={{ fontSize: '1.15rem', flexShrink: 0, marginTop: '3px', opacity: 0.9 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                type="text"
                value={localTitle}
                onChange={e => setLocalTitle(e.target.value)}
                onBlur={e => editor.updateBlock(block, { props: { title: e.target.value } })}
                placeholder="Titolo (opzionale)"
                style={{
                  display: 'block', width: '100%', background: 'transparent',
                  border: 'none', outline: 'none', color: v.text,
                  fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem', padding: 0,
                  fontFamily: 'inherit',
                }}
              />
              <div ref={contentRef as React.Ref<HTMLDivElement>} />
            </div>
          </div>
        </div>
      );
    },

    // ── HTML export (saved to DB) ────────────────────────────────────────────
    toExternalHTML: ({ block, contentRef }) => {
      const { variant, position, title } = block.props;
      const v = VARIANTS[variant] ?? VARIANTS.nota;
      return (
        <div className={`callout ${variant} ${position}`}>
          <div className="callout-inner">
            <i className={`callout-icon ${v.icon}`} />
            <div className="callout-body">
              {title && <p className="callout-title">{title}</p>}
              <p className="callout-text" ref={contentRef as React.Ref<HTMLParagraphElement>} />
            </div>
          </div>
        </div>
      );
    },

    // ── HTML parsing (loading saved content) ────────────────────────────────
    parse: (element) => {
      if (!(element instanceof HTMLElement)) return undefined;
      if (!element.classList.contains('callout')) return undefined;
      const variant  = (['nota', 'attenzione', 'info']           as const).find(v => element.classList.contains(v))  ?? 'nota';
      const position = (['float-right', 'float-left', 'center']  as const).find(p => element.classList.contains(p)) ?? 'center';
      const title    = element.querySelector('.callout-title')?.textContent?.trim() ?? '';
      return { variant, position, title };
    },

    parseContent: ({ el, schema }: { el: HTMLElement; schema: Schema }) => {
      const contentEl = el.querySelector('.callout-text') as HTMLElement | null;
      if (!contentEl) return undefined;
      const parser = PMDOMParser.fromSchema(schema);
      const parsed = parser.parse(contentEl, {
        topNode: (schema.nodes as Record<string, any>)['paragraph'].create(),
        preserveWhitespace: true,
      });
      return parsed.content as Fragment;
    },
  }
);
