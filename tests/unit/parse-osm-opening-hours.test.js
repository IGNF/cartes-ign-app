import { describe, expect, it } from "vitest";

import parseOsmOpeningHours from "../../src/js/map-interactivity/parse-osm-opening-hours.js";

describe("parseOsmOpeningHours", () => {
  it("formats closed status", () => {
    expect(parseOsmOpeningHours("closed")).toBe("Fermé définitivement");
  });

  it("formats day ranges and multiple sections", () => {
    expect(parseOsmOpeningHours("Lu-Ve 07:00-21:00/ Di 08:00-20:00"))
      .toBe("Du lundi au vendredi de 07:00 à 21:00 et le dimanche de 08:00 à 20:00");
  });

  it("formats comma-separated days and hour ranges", () => {
    expect(parseOsmOpeningHours("Lu,Ma,Me 09:00-12:00,14:00-17:00"))
      .toBe("Lundi, mardi et mercredi de 09:00 à 12:00 et de 14:00 à 17:00");
  });

  it("falls back to the original string when the day token is unknown", () => {
    expect(parseOsmOpeningHours("XX 09:00-17:00")).toBe("XX 09:00-17:00");
  });
});