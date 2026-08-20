import { describe, expect, it } from "vitest";

import gisUtils from "../../src/js/utils/gis-utils.js";

describe("gisUtils", () => {
  it("computes bounding boxes", () => {
    expect(gisUtils.getBoundingBox([[2, 48], [3, 47], [1, 49]])).toEqual([[1, 47], [3, 49]]);
  });

  it("flattens a multiline string into a single line without duplicating joins", () => {
    const source = [
      [[0, 0], [1, 1]],
      [[1, 1], [2, 2]],
      [[2, 2], [3, 3]],
    ];

    expect(gisUtils.geoJsonMultiLineStringCoordsToSingleLineStringCoords(source)).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it("computes hiking time using Scarf's rule", () => {
    expect(gisUtils.getHikeTimeScarfsRule(1000, 100, 1)).toBe(1792);
  });

  it("converts coordinates into tile and pixel positions", () => {
    expect(gisUtils.latlngToTilePixel(48.8566, 2.3522, 10)).toEqual([
      { x: 518, y: 352 },
      { x: 176, y: 72 },
    ]);
  });

  it("detects route overlap loops and ignores distinct non-overlapping steps", () => {
    const overlappingRoute = {
      data: {
        steps: [
          {
            properties: { id: "step-1" },
            geometry: {
              type: "LineString",
              coordinates: [[0, 0], [1, 1]],
            },
          },
          {
            properties: { id: "step-2" },
            geometry: {
              type: "LineString",
              coordinates: [[0, 0], [1, 1]],
            },
          },
        ],
      },
    };
    const distinctRoute = {
      data: {
        steps: [
          {
            properties: { id: "step-1" },
            geometry: {
              type: "LineString",
              coordinates: [[0, 0], [1, 1]],
            },
          },
          {
            properties: { id: "step-2" },
            geometry: {
              type: "LineString",
              coordinates: [[1, 2], [2, 3]],
            },
          },
        ],
      },
    };

    expect(gisUtils.hasRouteLoop(overlappingRoute)).toBe(true);
    expect(gisUtils.hasRouteLoop(distinctRoute)).toBe(false);
    expect(gisUtils.hasRouteLoop(null)).toBe(false);
  });
});