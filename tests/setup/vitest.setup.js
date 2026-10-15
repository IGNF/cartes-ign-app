import { vi } from "vitest";

if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => "blob:vitest");
}