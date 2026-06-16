import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';

export const BULLET_CHARS: Record<string, string> = {
  disc:             '•',
  circle:           '○',
  square:           '■',
  'square-hollow':  '□',
  diamond:          '◆',
  'diamond-hollow': '◇',
  dash:             '–',
  arrow:            '→',
  star:             '★',
};

// Default style per nesting depth when bulletStyle is 'auto'
const DEPTH_DEFAULTS = ['disc', 'dash', 'circle'];

/**
 * Returns the bullet list depth of a block (counting only bulletListItem ancestors).
 * Non-list ancestors reset the count to 0.
 */
function computeDepth(blocks: any[], targetId: string, depth = 0): number {
  for (const b of blocks) {
    if (b.id === targetId) return depth;
    const children = b.children ?? [];
    if (children.length > 0) {
      const childDepth = b.type === 'bulletListItem' ? depth + 1 : 0;
      const d = computeDepth(children, targetId, childDepth);
      if (d >= 0) return d;
    }
  }
  return -1;
}

function resolveBulletStyle(rawStyle: string, depth: number): string {
  if (!rawStyle || rawStyle === 'auto') return DEPTH_DEFAULTS[depth] ?? 'disc';
  return rawStyle;
}

export const bulletListItemSpec = createReactBlockSpec(
  {
    type: 'bulletListItem' as const,
    propSchema: {
      textColor:       { default: 'default' as string },
      backgroundColor: { default: 'default' as string },
      textAlignment:   { default: 'left'    as string },
      // 'auto' = depth-based default; explicit values always override
      bulletStyle:     { default: 'auto'    as string },
    },
    content: 'inline' as const,
  },
  {
    render: ({ block, editor, contentRef }) => {
      const doc = (editor as any).document as any[];
      const depth = computeDepth(doc, block.id);
      const style = resolveBulletStyle(block.props?.bulletStyle ?? 'auto', depth < 0 ? 0 : depth);

      let bulletEl: React.ReactNode;
      if (style.startsWith('icon:')) {
        bulletEl = (
          <i
            className={`ti ti-${style.slice(5)}`}
            style={{ fontSize: '0.85em', lineHeight: 1, color: 'inherit' }}
            aria-hidden="true"
          />
        );
      } else {
        bulletEl = BULLET_CHARS[style] ?? '•';
      }

      return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5em' }}>
          <span
            contentEditable={false}
            style={{ userSelect: 'none', flexShrink: 0, minWidth: '1em', textAlign: 'center' }}
          >
            {bulletEl}
          </span>
          <div ref={contentRef as React.Ref<HTMLDivElement>} style={{ flex: 1, minWidth: 0 }} />
        </div>
      );
    },

    // Export: embed bullet char or icon reference as data attributes.
    // CSS uses ::before for chars; onMount JS inserts <i> for icons.
    toExternalHTML: (props: any) => {
      const { block, contentRef } = props;
      const doc = (props.editor as any)?.document as any[] ?? [];
      const depth = computeDepth(doc, block.id);
      const style = resolveBulletStyle(block.props?.bulletStyle ?? 'auto', depth < 0 ? 0 : depth);

      if (style.startsWith('icon:')) {
        return (
          <p
            ref={contentRef as React.Ref<HTMLParagraphElement>}
            data-bullet-style={block.props.bulletStyle || 'auto'}
            data-bullet-icon={style.slice(5)}
          />
        );
      }

      return (
        <p
          ref={contentRef as React.Ref<HTMLParagraphElement>}
          data-bullet-style={block.props.bulletStyle || 'auto'}
          data-bullet-char={BULLET_CHARS[style] ?? '•'}
        />
      );
    },

    parse: (element) => {
      if (!(element instanceof HTMLElement)) return undefined;
      const bulletStyle = element.dataset.bulletStyle;
      if (!bulletStyle) return undefined;
      return { textColor: 'default', backgroundColor: 'default', textAlignment: 'left', bulletStyle };
    },
  }
);
