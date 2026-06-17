import type { Config } from "jest";

// No nx plugin reads this — the `test` target is just the `jest` script in
// package.json.
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
};

export default config;
