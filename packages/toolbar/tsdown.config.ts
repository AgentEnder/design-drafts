import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/toolbar.ts'],
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  outDir: 'dist',
  // tsdown defaults to <name>.<format>.js for non-esm formats. Strip the
  // format suffix so the consumed filename is the friendly `toolbar.js`.
  outputOptions: {
    entryFileNames: '[name].js',
  },
});
