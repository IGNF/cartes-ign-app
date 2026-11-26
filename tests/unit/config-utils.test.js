import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BaseLayers from "../../config/base-layer-config-new.json";
import ConfigLayers from "../../config/layers-config.json";

const { fetchJson, getCommuneWikiData } = vi.hoisted(() => ({
  fetchJson: vi.fn(),
  getCommuneWikiData: vi.fn(),
}));

vi.mock("../../src/js/utils/request-utils", () => ({ fetchJson }));
vi.mock("../../src/js/services/commune-wiki-service", () => ({ getCommuneWikiData }));
vi.mock("@capacitor/device", () => ({
  Device: { getInfo: vi.fn(async () => ({ platform: "web" })) },
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => "web" },
}));

describe("configuration sources", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LOCAL_CONFIG", "");
    getCommuneWikiData.mockResolvedValue({ local: "commune" });
    document.body.innerHTML = `
      <button id="layerManagerBtn"></button>
      <div id="newsfeed" class="d-none"></div>
      <hr id="newsfeed_hr" class="d-none">
    `;
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ["development", ""],
    ["development", "false"],
    ["production", "true"],
  ])("uses only local configs for NODE_ENV=%s and LOCAL_CONFIG=%s", async (nodeEnv, localConfig) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("LOCAL_CONFIG", localConfig);

    const { config } = await import("../../src/js/utils/config-utils.js");

    expect(fetchJson).not.toHaveBeenCalled();
    expect(config.baseLayers).toEqual(BaseLayers);
    expect(config.configLayers).toEqual(ConfigLayers);
    expect(config.inseeCommWiki).toEqual({ local: "commune" });
    expect(getCommuneWikiData).toHaveBeenCalledOnce();
    expect(config.tempLayers).toEqual([]);
    expect(config.newsfeed).toEqual([]);
    expect(config.hasLoaded).toBe(true);
  });

  it.each(["", "false"])("keeps remote loading in production with LOCAL_CONFIG=%s", async (localConfig) => {
    vi.stubEnv("LOCAL_CONFIG", localConfig);
    fetchJson.mockImplementation(async (url) => {
      if (url.endsWith("/layer-tags.json")) {
        return {};
      }
      if (url.endsWith("/com_wiki.json")) {
        return { remote: "commune" };
      }
      return [];
    });

    const { config } = await import("../../src/js/utils/config-utils.js");

    expect(fetchJson).toHaveBeenCalledWith("https://ignf.github.io/cartes-ign-app/layers-config.json");
    expect(config.configLayers).toEqual([]);
    expect(config.inseeCommWiki).toEqual({ remote: "commune" });
    expect(getCommuneWikiData).not.toHaveBeenCalled();
    expect(config.hasLoaded).toBe(true);
  });

  it("falls back to local configs when remote loading fails", async () => {
    fetchJson.mockRejectedValue(new Error("Offline"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const { config } = await import("../../src/js/utils/config-utils.js");

    expect(fetchJson).toHaveBeenCalled();
    expect(config.baseLayers).toEqual(BaseLayers);
    expect(config.configLayers).toEqual(ConfigLayers);
    expect(config.inseeCommWiki).toEqual({ local: "commune" });
    expect(config.hasLoaded).toBe(true);
    expect(console.warn).toHaveBeenCalled();
  });
});
