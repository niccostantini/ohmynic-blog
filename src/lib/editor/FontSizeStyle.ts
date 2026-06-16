import { createStyleSpec } from '@blocknote/core';

export const fontSizeStyle = createStyleSpec(
  { type: 'fontSize', propSchema: 'string' as const },
  {
    render: (value) => {
      const dom = document.createElement('span');
      dom.className = `bn-font-size-${value}`;
      return { dom, contentDOM: dom };
    },
    toExternalHTML: (value) => {
      const dom = document.createElement('span');
      dom.className = `article-font-${value}`;
      return { dom, contentDOM: dom };
    },
    parse: (element) => {
      for (const cls of Array.from(element.classList)) {
        if (cls.startsWith('article-font-')) return cls.replace('article-font-', '') as string;
        if (cls.startsWith('bn-font-size-')) return cls.replace('bn-font-size-', '') as string;
      }
      return undefined;
    },
  }
);
