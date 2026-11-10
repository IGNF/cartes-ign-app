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
import MyAccount from "../../src/js/my-account/my-account";

describe("MyAccount file import", () => {
  let account;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(MyAccount.prototype, "render").mockImplementation(() => {});
    account = new MyAccount({ addSource: vi.fn(), addLayer: vi.fn() });
    vi.spyOn(account, "addRoute").mockImplementation(() => {});
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
