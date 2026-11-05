import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "../../src/js/utils/request-utils.js";

describe("fetchJson", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns parsed JSON and clears the deadline without aborting", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ready: true }) });

    await expect(fetchJson("success")).resolves.toEqual({ ready: true });

    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects HTTP errors before parsing the body", async () => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status: 503, json });

    await expect(fetchJson("http-error")).rejects.toThrow("HTTP 503");

    expect(json).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("propagates connection errors and clears the deadline", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network unavailable"));

    await expect(fetchJson("offline")).rejects.toThrow("Network unavailable");

    expect(vi.getTimerCount()).toBe(0);
  });

  it("propagates invalid JSON errors and clears the deadline", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => { throw new SyntaxError("Invalid JSON"); },
    });

    await expect(fetchJson("invalid-json")).rejects.toThrow("Invalid JSON");

    expect(vi.getTimerCount()).toBe(0);
  });

  it("times out after three seconds even when fetch does not settle on abort", async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const result = expect(fetchJson("stalled-headers")).rejects.toThrow("Request timed out");

    await vi.advanceTimersByTimeAsync(2999);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await result;

    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps a custom deadline active while the response body stalls", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => new Promise(() => {}) });
    const result = expect(fetchJson("stalled-body", 50)).rejects.toThrow("Request timed out");

    await vi.advanceTimersByTimeAsync(50);
    await result;

    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});