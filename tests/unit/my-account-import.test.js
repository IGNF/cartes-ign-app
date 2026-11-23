import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/js/globals", () => ({ default: {} }));
vi.mock("../../src/js/my-account/my-account-dom", () => ({ default: {} }));
vi.mock("../../src/js/utils/unit-utils", () => ({ default: {} }));
vi.mock("../../src/js/utils/gis-utils", () => ({ default: {} }));
vi.mock("../../src/js/utils/js-utils", () => ({ default: {} }));
vi.mock("../../src/js/utils/dom-utils", () => ({ default: {} }));
vi.mock("../../src/js/action-sheet", () => ({ default: {} }));
vi.mock("../../src/js/services/location", () => ({ default: {} }));
vi.mock("../../src/js/dom", () => ({ default: {} }));
vi.mock("../../src/js/utils/file-storage", () => ({ default: {} }));
vi.mock("../../src/js/compare-landmark", () => ({ default: {} }));
vi.mock("@capawesome/capacitor-file-picker", () => ({ FilePicker: { pickFiles: vi.fn() } }));
vi.mock("@capacitor/toast", () => ({ Toast: { show: vi.fn() } }));

import { FilePicker } from "@capawesome/capacitor-file-picker";
import { Toast } from "@capacitor/toast";
import Globals from "../../src/js/globals";
import gisUtils from "../../src/js/utils/gis-utils";
import Location from "../../src/js/services/location";
import fileStorage from "../../src/js/utils/file-storage";
import MyAccount from "../../src/js/my-account/my-account";

describe("MyAccount file import", () => {
  let account;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(MyAccount.prototype, "render").mockImplementation(() => {});
    account = new MyAccount({ addSource: vi.fn(), addLayer: vi.fn() });
    vi.spyOn(account, "addRoute").mockImplementation(() => {});
  });

  describe("MyAccount saved track routes", () => {
    let account;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(MyAccount.prototype, "render").mockImplementation(() => {});
      gisUtils.getRouteDisplayGeometry = vi.fn(route => route.data.steps[0].geometry);
      Location.isTrackingActive = vi.fn(() => false);
      fileStorage.save = vi.fn();
      fileStorage.delete = vi.fn();
      const map = {
        addSource: vi.fn(), addLayer: vi.fn(), fitBounds: vi.fn(),
        getSource: () => ({ setData: vi.fn() }), once: vi.fn(),
      };
      Globals.map = map;
      account = new MyAccount(map);
      account.__updateAccountRoutesContainerDOMElement = vi.fn();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it("adds and replaces a route with a preassigned ID without writing it again", () => {
      const track = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [[2, 48, 10, "2026-01-02T03:04:00Z"], [2.01, 48, 20, "2026-01-02T03:05:00Z"]] },
        properties: {},
        data: { name: "Mon itinéraire - 02/01/26 03:04", distance: 100, duration: 60 },
      };
      const route = account.geojsonToRoute(track, "geojson", true);
      route.id = "track-id";
      route.data.showOrientation = false;
      expect(route.data.isTrack).toBe(true);
      expect(route.data.steps[0].geometry.coordinates).toEqual([[2, 48], [2.01, 48]]);
      account.addRoute(route, { persist: false });
      const updated = { ...route, name: "Ma trace" };
      account.addRoute(updated, { persist: false });
      expect(account.routes).toEqual([updated]);
      expect(account.routesOrder).toEqual(["track-id"]);
      expect(fileStorage.save).not.toHaveBeenCalled();
      account.deleteRoute("track-id", { persist: false });
      expect(account.routes).toEqual([]);
      expect(fileStorage.delete).not.toHaveBeenCalled();
    });

    it("loads a previously persisted backup as a saved route on startup", async () => {
      const route = {
        id: "track-id", name: "Mon itinéraire - 02/01/26 03:04",
        data: { isTrack: true, steps: [], points: [] },
      };
      fileStorage.list = vi.fn().mockResolvedValue([{ id: "route-track-id", data: route }]);
      Globals.offlineMaps = { loadPromise: new Promise(() => {}) };
      await vi.advanceTimersByTimeAsync(3000);
      expect(account.routes).toEqual([route]);
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it.each([
    ["without BOM", "", "land.gpx"],
    ["with BOM", "\uFEFF", "land.gpx"],
    ["without BOM or extension", "", "land"],
    ["with BOM and no extension", "\uFEFF", "land"],
  ])("imports a UTF-8 GPX %s", async (_label, prefix, name) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Land" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Cr\u00eate du Vercors</name></metadata>
  <trk><trkseg>
    <trkpt lat="45.1" lon="5.1"/>
    <trkpt lat="45.2" lon="5.2"/>
  </trkseg></trk>
</gpx>`;
    FilePicker.pickFiles.mockResolvedValue({
      files: [{ name, data: Buffer.from(prefix + xml, "utf8").toString("base64") }],
    });

    await account.importFile();

    expect(account.addRoute).toHaveBeenCalledOnce();
    const route = account.addRoute.mock.calls[0][0];
    expect(route.name).toBe("Cr\u00eate du Vercors");
    expect(route.data.steps[0].geometry.coordinates).toEqual([[5.1, 45.1], [5.2, 45.2]]);
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
      text: "Itin\u00e9raire \"Cr\u00eate du Vercors\" ajout\u00e9 \u00e0 'Enregistr\u00e9s' et \u00e0 la carte",
    }));
  });
});
