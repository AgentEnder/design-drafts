import { defineConfig } from 'vite';

// The node-side renderer, consumed by @design-drafts/cli (which bundles this
// dist with tsdown). preact and @design-drafts/conventions are bundled in so
// the CLI need not declare them; marked/highlight.js/pagefind stay external
// and MUST be listed in the CLI's dependencies (see README).
export default defineConfig({
  build: {
    outDir: 'dist/node',
    emptyOutDir: true,
    minify: 'esbuild',
    ssr: 'src/node/index.ts',
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
      },
    },
  },
  ssr: {
    external: ['marked', 'marked-highlight', 'highlight.js', 'pagefind'],
    noExternal: [
      'preact',
      'preact-render-to-string',
      '@design-drafts/conventions',
    ],
  },
});
