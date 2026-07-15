import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The node renderer inlines the *built* client stylesheet via `?raw`;
    // without css processing vitest would mock that import to an empty string.
    css: true,
  },
});
