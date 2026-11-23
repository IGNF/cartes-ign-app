import { beforeEach, describe, expect, it } from "vitest";
import { initAnalytics, trackEvent, trackPage } from "../../src/js/analytics.js";

describe("Matomo analytics", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete window._paq;
  });

  it("does not load or queue tracking when not configured", () => {
    initAnalytics("", "");
    trackEvent("UI", "Button click", "label");
    trackPage("search", "Recherche");

    expect(window._paq).toBeUndefined();
    expect(document.querySelector("script")).toBeNull();
  });

  it("configures the tracker and centralizes events and page views", () => {
    initAnalytics("https://analytics.example.org/matomo/", "23");
    trackEvent("Layer", "Add", "plan");
    trackPage("search%test", "Recherche");

    expect(document.querySelector("script").src).toBe("https://analytics.example.org/matomo/matomo.js");
    expect(window._paq).toEqual([
      ["trackPageView"],
      ["enableLinkTracking"],
      ["setTrackerUrl", "https://analytics.example.org/matomo/matomo.php"],
      ["setSiteId", "23"],
      ["trackEvent", "Layer", "Add", "plan"],
      ["setCustomUrl", "/search%25test"],
      ["setDocumentTitle", "Recherche"],
      ["trackPageView"],
    ]);
  });
});
