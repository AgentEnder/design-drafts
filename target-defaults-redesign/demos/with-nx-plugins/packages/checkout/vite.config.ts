import { defineConfig } from "vite";

// Presence of this file is what @nx/vite/plugin keys off of to infer a `test`
// target for this project.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
