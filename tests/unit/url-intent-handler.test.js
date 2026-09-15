import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toastShow = vi.fn();
const globalsMock = {
  menu: {
    open: vi.fn(),
  },
  position: {
    compute: vi.fn(() => Promise.resolve()),
  },
  myaccount: {
    addCompareLandmark: vi.fn(),
  },
  searchResultIcon: document.createElement("div"),
  searchResultMarker: null,
};

vi.mock("@capacitor/toast", () => ({
  Toast: {
    show: toastShow,
  },
}));

vi.mock("../../src/js/globals.js", () => ({
  default: globalsMock,
}));

describe("handleIncomingUrl", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toastShow.mockClear();
    globalsMock.menu.open.mockClear();
    globalsMock.position.compute.mockClear();
    globalsMock.myaccount.addCompareLandmark.mockClear();
    globalsMock.searchResultMarker = null;
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves the map for https position URLs", async () => {
    const { handleIncomingUrl } = await import("../../src/js/utils/url-intent-handler.js");
    const moveTo = vi.fn();
    const map = {
      getZoom: vi.fn(() => 8),
      flyTo: vi.fn(),
    };

    const handled = handleIncomingUrl({
      url: "https://example.test/?lng=2.35&lat=48.85&z=12&l1=plan&l2=ortho&m=swipe&title=Repere%20test&color=red",
      map,
      moveTo,
    });

    expect(handled).toBe(true);
    expect(moveTo).toHaveBeenCalledWith({
      map,
      center: { lng: 2.35, lat: 48.85 },
      zoom: 12,
    });
    expect(globalsMock.myaccount.addCompareLandmark).toHaveBeenCalledTimes(1);
  });

  it("opens the newsfeed when a news id is provided", async () => {
    const { handleIncomingUrl } = await import("../../src/js/utils/url-intent-handler.js");
    const newsItem = document.createElement("div");
    newsItem.id = "newsfeedItem-42";
    newsItem.scrollIntoView = vi.fn();
    document.body.appendChild(newsItem);

    const handled = handleIncomingUrl({
      url: "https://example.test/?newsid=42",
      map: { getZoom: vi.fn(() => 8), flyTo: vi.fn() },
      canOpenNewsfeed: () => true,
    });

    vi.runAllTimers();

    expect(handled).toBe(true);
    expect(globalsMock.menu.open).toHaveBeenCalledWith("newsfeed");
    expect(newsItem.scrollIntoView).toHaveBeenCalled();
  });

  it("supports geo URLs when explicitly enabled", async () => {
    const { handleIncomingUrl } = await import("../../src/js/utils/url-intent-handler.js");
    const map = {
      getZoom: vi.fn(() => 7),
      flyTo: vi.fn(),
    };

    const handled = handleIncomingUrl({
      url: "geo:48.8566,2.3522?z=10",
      map,
      allowGeo: true,
    });

    expect(handled).toBe(true);
    expect(map.flyTo).toHaveBeenCalledWith({
      zoom: 10,
      center: { lng: 2.3522, lat: 48.8566 },
    });
  });

  it("rejects unsupported or incomplete URLs", async () => {
    const { handleIncomingUrl } = await import("../../src/js/utils/url-intent-handler.js");
    const map = {
      getZoom: vi.fn(() => 7),
      flyTo: vi.fn(),
    };

    expect(handleIncomingUrl({ url: null, map })).toBe(false);
    expect(handleIncomingUrl({ url: "mailto:test@example.com", map, allowGeo: true })).toBe(false);
    expect(handleIncomingUrl({ url: "https://example.test/?foo=bar", map })).toBe(false);
  });
});