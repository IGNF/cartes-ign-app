import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/js/globals", () => ({
  default: { backButtonState: "position%pr" },
}));
vi.mock("../../src/js/dom", () => ({
  default: {
    $fullScreenBtn: {
      querySelector: () => ({ classList: { contains: () => false } }),
    },
    $backTopLeftBtn: { click: vi.fn() },
  },
}));
vi.mock("../../src/js/layer-manager/layer-config", () => ({ default: {} }));
vi.mock("../../src/js/map-interactivity/feature-property-filter", () => ({ default: vi.fn() }));
vi.mock("../../src/js/map-interactivity/gfi-rules", () => ({ default: {} }));
vi.mock("../../src/js/map-interactivity/legend-plan-ign", () => ({ default: {} }));
vi.mock("../../src/js/utils/gis-utils", () => ({ default: {} }));

import DOM from "../../src/js/dom";
import MapInteractivity from "../../src/js/map-interactivity/map-interactivity";

describe("MapInteractivity landmark clicks", () => {
  let map;
  let interactivity;

  beforeEach(() => {
    vi.useFakeTimers();
    map = {
      addSource: vi.fn(),
      addLayer: vi.fn(),
      once: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      queryRenderedFeatures: vi.fn(),
    };
    interactivity = new MapInteractivity(map);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    "my-account-landmark",
    "my-account-compare-landmark",
    "comparepoi",
  ])("does not close the position opened by the %s click handler", async (source) => {
    map.queryRenderedFeatures.mockReturnValue([{
      source,
      layer: { id: source },
      properties: { visible: true },
    }]);

    interactivity.handleInfoOnMapSafe({ point: { x: 100, y: 100 } });
    await vi.advanceTimersByTimeAsync(250);

    expect(map.queryRenderedFeatures).toHaveBeenCalledOnce();
    expect(DOM.$backTopLeftBtn.click).not.toHaveBeenCalled();
    expect(map.once).toHaveBeenLastCalledWith("click", interactivity.handleInfoOnMapSafe);
  });

  it("waits 250 ms before processing a single click", async () => {
    interactivity.handleInfoOnMap = vi.fn().mockResolvedValue();
    const event = { point: { x: 100, y: 100 } };

    interactivity.handleInfoOnMapSafe(event);
    await vi.advanceTimersByTimeAsync(249);
    expect(interactivity.handleInfoOnMap).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(interactivity.handleInfoOnMap).toHaveBeenCalledExactlyOnceWith(event);
  });

  it.each(["click", "touchstart"])("cancels the pending click on a second %s", async (eventType) => {
    interactivity.handleInfoOnMap = vi.fn().mockResolvedValue();
    const event = { point: { x: 100, y: 100 } };

    interactivity.handleInfoOnMapSafe(event);
    await vi.advanceTimersByTimeAsync(100);
    if (eventType === "click") {
      interactivity.handleInfoOnMapSafe(event);
    } else {
      const touchHandler = map.on.mock.calls.find(([type]) => type === "touchstart")[1];
      touchHandler();
    }
    await vi.advanceTimersByTimeAsync(250);

    expect(interactivity.handleInfoOnMap).not.toHaveBeenCalled();
    expect(DOM.$backTopLeftBtn.click).not.toHaveBeenCalled();
  });
});
