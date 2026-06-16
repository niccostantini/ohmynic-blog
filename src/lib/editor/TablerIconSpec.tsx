import React from 'react';
import { createReactInlineContentSpec } from '@blocknote/react';

export const tablerIconInlineContentSpec = createReactInlineContentSpec(
  {
    type: 'tablerIcon' as const,
    propSchema: {
      name: { default: '' as string },
    },
    content: 'none' as const,
  },
  {
    render: ({ inlineContent }) => {
      const { name } = (inlineContent as any).props as { name: string };
      return (
        <i
          className={`ti ti-${name}`}
          contentEditable={false}
          style={{ userSelect: 'none' as const, display: 'inline', fontSize: '1em', verticalAlign: 'middle' }}
          title={name}
        />
      );
    },

    toExternalHTML: ({ inlineContent }) => {
      const { name } = (inlineContent as any).props as { name: string };
      return <i className={`ti ti-${name}`} aria-hidden="true" />;
    },

    parse: (el) => {
      if (!(el instanceof HTMLElement)) return undefined;
      if (el.tagName !== 'I') return undefined;
      const tiClass = Array.from(el.classList).find((c) => c.startsWith('ti-'));
      if (!tiClass) return undefined;
      return { name: tiClass.replace('ti-', '') };
    },
  }
);
