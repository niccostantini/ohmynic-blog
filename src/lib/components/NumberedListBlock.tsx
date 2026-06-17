import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';

export const LIST_STYLES = [
  { value: 'decimal',     label: '1', title: '1, 2, 3…'    },
  { value: 'lower-alpha', label: 'a', title: 'a, b, c…'    },
  { value: 'upper-alpha', label: 'A', title: 'A, B, C…'    },
  { value: 'lower-roman', label: 'i', title: 'i, ii, iii…' },
  { value: 'upper-roman', label: 'I', title: 'I, II, III…' },
] as const;

// Default style per nesting depth when listStyle is 'auto'
const DEPTH_DEFAULTS = ['decimal', 'lower-alpha', 'lower-roman'];

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

function formatIndex(n: number, style: string): string {
  if (n <= 0) return '?';
  switch (style) {
    case 'lower-alpha': return String.fromCharCode(96 + ((n - 1) % 26) + 1);
    case 'upper-alpha': return String.fromCharCode(64 + ((n - 1) % 26) + 1);
    case 'lower-roman': return toRoman(n).toLowerCase();
    case 'upper-roman': return toRoman(n);
    default:            return String(n);
  }
}

/**
 * Recursively resolves a block's hierarchical label (e.g. "1", "1.a", "1.a.ii").
 * listStyle='auto' uses a depth-based default (decimal → lower-alpha → lower-roman).
 * Any explicit style (decimal, lower-alpha, etc.) overrides the depth default.
 * A non-list block resets the sibling counter (starts a new list).
 */
function computeLabel(blocks: any[], targetId: string, parentLabel = '', depth = 0): string | null {
  let idx = 0;
  for (const b of blocks) {
    if (b.type === 'numberedListItem') {
      idx++;
      const rawStyle = b.props?.listStyle ?? 'auto';
      const style = rawStyle === 'auto' ? (DEPTH_DEFAULTS[depth] ?? 'decimal') : rawStyle;
      const segment = formatIndex(idx, style);
      const myLabel = parentLabel ? `${parentLabel}.${segment}` : segment;
      if (b.id === targetId) return myLabel;
      const found = computeLabel(b.children ?? [], targetId, myLabel, depth + 1);
      if (found !== null) return found;
    } else {
      idx = 0;
      const found = computeLabel(b.children ?? [], targetId, '', 0);
      if (found !== null) return found;
    }
  }
  return null;
}

export const numberedListItemSpec = createReactBlockSpec(
  {
    type: 'numberedListItem' as const,
    propSchema: {
      textColor:       { default: 'default' as string },
      backgroundColor: { default: 'default' as string },
      textAlignment:   { default: 'left'    as string },
      // 'auto' = depth-based default; explicit values always override
      listStyle:       { default: 'auto' as string },
    },
    content: 'inline' as const,
  },
  {
    render: ({ block, editor, contentRef }) => {
      const doc = (editor as any).document as any[];
      const label = computeLabel(doc, block.id) ?? '?';

      return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4em' }}>
          <span
            contentEditable={false}
            style={{
              fontVariantNumeric: 'tabular-nums',
              userSelect: 'none',
              flexShrink: 0,
              minWidth: '1.2em',
              textAlign: 'right',
              color: 'inherit',
            }}
          >
            {label}
          </span>
          <div
            ref={contentRef as React.Ref<HTMLDivElement>}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
      );
    },

    toExternalHTML: (props: any) => {
      const { block, contentRef } = props;
      const doc = (props.editor as any)?.document as any[] ?? [];
      const label = computeLabel(doc, block.id) ?? '1';
      const depth = (label.match(/\./g) ?? []).length;

      return (
        <p
          ref={contentRef as React.Ref<HTMLParagraphElement>}
          data-list-style={block.props.listStyle || 'auto'}
          data-list-label={label}
          data-list-depth={String(depth)}
        />
      );
    },

    parse: (element) => {
      if (!(element instanceof HTMLElement)) return undefined;
      const listStyle = element.dataset.listStyle;
      if (!listStyle) return undefined;
      return { textColor: 'default', backgroundColor: 'default', textAlignment: 'left', listStyle };
    },
  }
);
