/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: ["node_modules"],
    silent: "passed-only",
  },
});
