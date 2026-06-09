# Pubblicare `blocknote-footnotes` su npm

Guida per estrarre il plugin in un pacchetto npm indipendente.

---

## 1. Struttura del nuovo repo

```
blocknote-footnotes/
├── src/
│   ├── FootnoteInlineContent.tsx
│   ├── FootnoteList.tsx
│   └── index.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Copia i tre file da `src/lib/editor/footnotes/` nella cartella `src/` del nuovo repo.

---

## 2. `package.json`

```json
{
  "name": "blocknote-footnotes",
  "version": "0.1.0",
  "description": "Footnote/endnote inline content plugin for BlockNote",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "@blocknote/core": ">=0.51.0",
    "@blocknote/react": ">=0.51.0",
    "react": ">=18.0.0"
  },
  "devDependencies": {
    "@blocknote/core": "^0.51.4",
    "@blocknote/react": "^0.51.4",
    "@types/react": "^19.0.0",
    "react": "^19.2.7",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "vite-plugin-dts": "^4.0.0"
  }
}
```

---

## 3. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

## 4. `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: true, // bundle tutti i .d.ts in un unico file
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BlocknoteFootnotes',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // le peerDependencies non vanno nel bundle
      external: [
        'react',
        'react/jsx-runtime',
        '@blocknote/core',
        '@blocknote/react',
      ],
      output: {
        globals: {
          react: 'React',
          '@blocknote/core': 'BlockNoteCore',
          '@blocknote/react': 'BlockNoteReact',
        },
      },
    },
    sourcemap: true,
  },
});
```

---

## 5. Build e pubblicazione

```bash
# installa dipendenze
npm install

# build
npm run build
# → genera dist/index.js (ESM), dist/index.cjs (CJS), dist/index.d.ts

# anteprima di cosa verrà pubblicato
npm pack --dry-run

# pubblica (prima volta: npm login)
npm publish --access public
```

---

## 6. Utilizzo nel progetto consumer

```bash
npm install blocknote-footnotes
```

```tsx
import {
  footnoteInlineContentSpec,
  footnoteListBlockSpec,
  FootnoteContext,
} from 'blocknote-footnotes';
import type { FootnoteContextValue } from 'blocknote-footnotes';

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    footnoteList: footnoteListBlockSpec(), // ← chiamare come factory con ()
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    footnote: footnoteInlineContentSpec,
  },
});
```

---

## 7. Gotcha da documentare nel README

### `footnoteListBlockSpec` è una factory

`createReactBlockSpec` restituisce una **factory function**, non direttamente la spec.
Va chiamata con `()` quando si passa allo schema:

```ts
// ✅ corretto
footnoteList: footnoteListBlockSpec()

// ❌ sbagliato — passa la factory invece della spec
footnoteList: footnoteListBlockSpec
```

### `updateInlineContent` vuole `type` obbligatorio

BlockNote richiede che l'oggetto passato a `updateInlineContent` includa sempre il campo `type`.
Senza di esso, `inlineContentToNodes` non sa che nodo ricostruire e **cancella silenziosamente la footnote**.

```ts
// ✅ corretto
updater({ type: 'footnote', props: { id, note: text } })

// ❌ sbagliato — il campo type è obbligatorio in PartialCustomInlineContentFromConfig
updater({ props: { note: text } })
```

### Event isolation del popover

Il popover deve essere renderizzato via `ReactDOM.createPortal(..., document.body)`.
Vanno inoltre aggiunti listener `capture: true` su `document` per keydown/keypress
per impedire che gli eventi tastiera raggiungano ProseMirror mentre il popover è aperto.
