import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ["./tests/setup/vitest.setup.js"],
  },
});