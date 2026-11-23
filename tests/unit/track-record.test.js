import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capgo/background-geolocation", () => ({
  BackgroundGeolocation: { start: vi.fn(), stop: vi.fn() },
}));
vi.mock("@capacitor/toast", () => ({ Toast: { show: vi.fn() } }));
vi.mock("../../src/js/globals", () => ({ default: {} }));
vi.mock("../../src/js/dom", () => ({ default: {} }));
vi.mock("../../src/js/services/location", () => ({
  default: { isLocationActive: () => true, getCurrentPosition: () => null },
}));
vi.mock("../../src/js/action-sheet", () => ({
  default: { show: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() },
}));
vi.mock("../../src/js/utils/file-storage", () => ({
  default: { save: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../src/js/utils/gis-utils", () => ({ default: { hasRouteLoop: () => false } }));
vi.mock("../../src/js/route-draw/route-draw-dom", () => ({ default: {} }));
vi.mock("../../src/js/utils/popup-utils", () => ({ default: {} }));

import Globals from "../../src/js/globals";
import DOM from "../../src/js/dom";
import ActionSheet from "../../src/js/action-sheet";
import fileStorage from "../../src/js/utils/file-storage";
import { Toast } from "@capacitor/toast";
import TrackRecord from "../../src/js/track-record/track-record";

describe("track recording backups", () => {
  let track;
  let map;
  let move;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 2, 3, 4));
    document.body.innerHTML = `
      <div id="trackRecordWindow">
        <button class="startRecord"></button><button class="whileRecording"></button>
        <button class="pauseRecord"></button><button class="finishRecord"></button>
        <button class="closeRecord"></button><div id="trackRecordContainer"></div>
      </div>
      <div id="trackRecordInfos"><span class="trackRecordTimer"></span>
        <span class="trackRecordDistance"></span><span class="trackRecordDplus"></span></div>
      <button id="backTopLeftBtn"></button>`;
    DOM.$trackRecordInfos = document.getElementById("trackRecordInfos");
    DOM.$tabHeader = document.createElement("div");
    const source = { setData: vi.fn() };
    map = {
      addSource: vi.fn(), addLayer: vi.fn(), getSource: () => source,
      getCenter: () => ({ lng: 2, lat: 48 }),
      on: vi.fn((_event, callback) => { move = callback; }),
      off: vi.fn(),
    };
    Globals.myaccount = {
      geojsonToRoute: vi.fn(feature => {
        const coordinates = feature.geometry.coordinates.map(c => c.slice(0, 2));
        feature.geometry.coordinates = coordinates;
        return { data: { ...feature.data, steps: [{ geometry: { coordinates } }] }, name: feature.data.name };
      }),
      addRoute: vi.fn(), deleteRoute: vi.fn(), showRouteDetailsFromID: vi.fn(),
    };
    fileStorage.save.mockResolvedValue();
    fileStorage.delete.mockResolvedValue();
    track = new TrackRecord(map, {});
    track.dom.startRecordBtn.click();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  function addPoint(longitude, altitude = 100) {
    move({ detail: { longitude, latitude: 48, altitude } });
  }

  it("saves one dated route every minute without mutating the recording", async () => {
    addPoint(2);
    await vi.advanceTimersByTimeAsync(60000);
    expect(fileStorage.save).not.toHaveBeenCalled();
    addPoint(2.04, 150);
    await vi.advanceTimersByTimeAsync(60000);
    const [first, key] = fileStorage.save.mock.calls[0];
    expect(first.name).toBe("Mon itinéraire - 02/01/26 03:04");
    expect(first.data.duration).toBe(60);
    expect(first.data.elevationData.unit).toBe("km");
    expect(track.currentFeature.geometry.coordinates[0]).toHaveLength(4);
    expect(track.currentFeature.data.elevationData.unit).toBe("m");
    addPoint(2.05);
    await vi.advanceTimersByTimeAsync(60000);
    expect(fileStorage.save).toHaveBeenCalledTimes(3);
    expect(fileStorage.save.mock.calls[2][1]).toBe(key);
    expect(fileStorage.save.mock.calls[2][0].data.steps[0].geometry.coordinates).toHaveLength(3);
    expect(Globals.myaccount.addRoute).not.toHaveBeenCalled();
  });

  it("retains the accumulated duration when paused and uses the same ID for the final save", async () => {
    addPoint(2);
    addPoint(2.01);
    await vi.advanceTimersByTimeAsync(60000);
    track.pauseRecording();
    await vi.advanceTimersByTimeAsync(60000);
    expect(fileStorage.save.mock.calls[1][0].data.duration).toBe(60);
    track.trackName = "Ma trace";
    expect(await track.saveRecording()).toBe(true);
    const [route, key] = fileStorage.save.mock.calls[2];
    expect(key).toBe(fileStorage.save.mock.calls[0][1]);
    expect(route.name).toBe("Ma trace");
    expect(Globals.myaccount.addRoute).toHaveBeenCalledWith(route, { persist: false });
    expect(Globals.myaccount.showRouteDetailsFromID).toHaveBeenCalledWith(route.id);
    await vi.advanceTimersByTimeAsync(60000);
    expect(fileStorage.save).toHaveBeenCalledTimes(3);
  });

  it("waits for an in-flight backup before saving the final route", async () => {
    let finishBackup;
    fileStorage.save.mockImplementationOnce(() => new Promise(resolve => { finishBackup = resolve; }));
    addPoint(2);
    addPoint(2.01);
    await vi.advanceTimersByTimeAsync(60000);
    track.pauseRecording();
    const saving = track.saveRecording();
    expect(fileStorage.save).toHaveBeenCalledTimes(1);
    finishBackup();
    expect(await saving).toBe(true);
    expect(fileStorage.save).toHaveBeenCalledTimes(2);
  });

  it("saves when a location arrives after a delayed timer", async () => {
    addPoint(2);
    vi.setSystemTime(new Date(2026, 0, 2, 3, 5, 10));
    addPoint(2.01);
    await Promise.resolve();
    expect(fileStorage.save).toHaveBeenCalledOnce();
    expect(fileStorage.save.mock.calls[0][0].data.duration).toBe(70);
  });

  it("removes the backup on explicit deletion", async () => {
    let finishBackup;
    fileStorage.save.mockImplementationOnce(() => new Promise(resolve => { finishBackup = resolve; }));
    addPoint(2);
    addPoint(2.01);
    await vi.advanceTimersByTimeAsync(60000);
    const key = fileStorage.save.mock.calls[0][1];
    const id = track.trackId;
    ActionSheet.show.mockResolvedValueOnce("deleteRecord").mockResolvedValueOnce("confirmDelete");
    track.dom.finishRecordBtn.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(fileStorage.delete).not.toHaveBeenCalled();
    finishBackup();
    await vi.advanceTimersByTimeAsync(0);
    expect(fileStorage.delete).toHaveBeenCalledWith(key, { throwOnError: true });
    expect(Globals.myaccount.deleteRoute).toHaveBeenCalledWith(id, { persist: false });
    expect(track.activeRecord).toBe(false);
    await vi.advanceTimersByTimeAsync(60000);
    expect(fileStorage.save).toHaveBeenCalledTimes(1);
  });

  it("reports final save failures and keeps the recording available", async () => {
    addPoint(2);
    addPoint(2.01);
    track.pauseRecording();
    fileStorage.save.mockRejectedValueOnce(new Error("storage unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await track.saveRecording()).toBe(false);
    expect(track.activeRecord).toBe(true);
    expect(Globals.myaccount.addRoute).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60000);
    expect(fileStorage.save).toHaveBeenCalledTimes(2);
  });
});
