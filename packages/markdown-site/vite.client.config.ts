import { defineConfig } from 'vite';

// The browser-side page chrome, built to a single self-contained IIFE + one
// stylesheet that the node renderer inlines into every generated page —
// minified, since every rendered page carries a copy.
export default defineConfig({
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    minify: 'esbuild',
    cssMinify: 'esbuild',
    lib: {
      entry: 'src/client/main.ts',
      formats: ['iife'],
      name: 'DesignDraftsPage',
      fileName: () => 'page.js',
      cssFileName: 'page',
    },
  },
});
