import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  // The index app lives one level down so the Pages root can carry the docs
  // site. Drafts are published as siblings of this app, under the same `d/`:
  // the path this repo declares in design-drafts.config.json for the CLI.
  base: '/design-drafts/d/',
  plugins: [vike(), react(), tailwindcss()],
});
