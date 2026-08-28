import { defineConfig } from "vite";

// No nx plugin reads this — the `test` target is just the `vitest run` script
// in package.json. nx, if added, would see only "there is a test script."
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
