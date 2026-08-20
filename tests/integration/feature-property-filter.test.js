import { describe, expect, it } from "vitest";

import featurePropertyFilter from "../../src/js/map-interactivity/feature-property-filter.js";

describe("featurePropertyFilter", () => {
  it("formats poi_osm metadata into HTML", () => {
    const feature = {
      source: "poi_osm",
      properties: {
        web: "https://example.test",
        telephone: "01 23 45 67 89",
        horaire: "Lu-Ve 07:00-21:00",
      },
    };

    const result = featurePropertyFilter(feature);

    expect(result.before).toBe("");
    expect(result.after).toContain("Horaire : Du lundi au vendredi de 07:00 à 21:00");
    expect(result.after).toContain("href=\"https://example.test\"");
    expect(result.after).toContain("href=\"tel:0123456789\">01 23 45 67 89</a>");
    expect(result.after.endsWith("</div>")).toBe(true);
  });

  it("returns an empty before block for source layers without attributes", () => {
    const feature = {
      source: "bdtopo",
      properties: {},
      layer: {
        "source-layer": "surface_hydrographique",
      },
    };

    const result = featurePropertyFilter(feature);

    expect(result.before).toBe("");
    expect(result.after).toBe("<div class='positionHtmlAfter'></div>");
  });
});