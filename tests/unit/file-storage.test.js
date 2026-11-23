import { describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { deleteFile: vi.fn() },
  Directory: { Data: "DATA" },
  Encoding: { UTF8: "utf8" },
}));

import { Filesystem } from "@capacitor/filesystem";
import fileStorage from "../../src/js/utils/file-storage";

describe("file storage deletion", () => {
  it("propagates native deletion errors when requested", async () => {
    const error = new Error("storage unavailable");
    Filesystem.deleteFile.mockRejectedValueOnce(error);
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(fileStorage.delete("route-id", { throwOnError: true })).rejects.toBe(error);
  });
});
