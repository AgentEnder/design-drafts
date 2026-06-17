import type { Config } from "jest";

// Presence of this file is what @nx/jest/plugin keys off of to infer a `test`
// target for this project.
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
};

export default config;
