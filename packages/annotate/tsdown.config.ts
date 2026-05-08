import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: 'iife',
  outDir: 'dist',
  minify: true,
  globalName: 'DesignDraftsAnnotate',
  outputOptions: {
    entryFileNames: 'annotate.js',
  },
});
