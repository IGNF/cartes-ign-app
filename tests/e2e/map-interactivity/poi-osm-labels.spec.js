import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";
import { encodeVectorTile } from "./mvt-fixtures";

const mapCenter = { longitude: 2.2945, latitude: 48.8584, zoom: 16 };
const poiStyle = readFileSync(resolve(process.cwd(), "www/data/poi-osm-style.json"), "utf8");
const website = "https://example.test/poi";
const telephone = "0123456789";

const poiCases = [
  {category: "Transports", symbol: "bus_stop", featureClass: "highway", label: "Arrêt de bus"},
  {category: "Commerces", symbol: "bakery", featureClass: "shop", label: "Boulangerie"},
  {category: "Hébergement", symbol: "hotel", featureClass: "tourism", label: "Hôtel"},
  {category: "Lieux remarquables", symbol: "castle", featureClass: "historic", label: "Château"},
  {category: "Restauration", symbol: "restaurant", featureClass: "amenity", label: "Restaurant"},
  {category: "Santé", symbol: "pharmacy", featureClass: "amenity", label: "Pharmacie"},
  {category: "Services et commodités", symbol: "toilets", featureClass: "amenity", label: "Toilettes"},
  {category: "Services publics", symbol: "townhall", featureClass: "amenity", label: "Mairie"},
];

async function clickMapCenter(page) {
  await page.locator("#map canvas").evaluate((canvas) => {
    const bounds = canvas.getBoundingClientRect();
    const eventOptions = {
      bubbles: true,
      cancelable: true,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
      button: 0,
    };
    canvas.dispatchEvent(new MouseEvent("mousedown", eventOptions));
    canvas.dispatchEvent(new MouseEvent("mouseup", eventOptions));
    canvas.dispatchEvent(new MouseEvent("click", eventOptions));
  });
}

async function openPoiFeature(page, poiCase) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((center) => {
    localStorage.setItem("lastMapLat", String(center.latitude));
    localStorage.setItem("lastMapLng", String(center.longitude));
    localStorage.setItem("lastMapZoom", String(center.zoom));
  }, mapCenter);

  let poiTileRequests = 0;
  const spriteJsonLoaded = page.waitForResponse((response) =>
    response.url().endsWith("poi-osm-sprite.json") && response.ok()
  );
  const spriteImageLoaded = page.waitForResponse((response) =>
    response.url().endsWith("poi-osm-sprite.png") && response.ok()
  );

  await page.route("https://ignf.github.io/cartes-ign-app/poi-osm-style.json", async (route) => {
    await route.fulfill({ contentType: "application/json", body: poiStyle });
  });
  await page.route(/\/OSM\.POI\/(\d+)\/(\d+)\/(\d+)\.pbf/, async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/\/OSM\.POI\/(\d+)\/(\d+)\/(\d+)\.pbf$/);
    const [, zoom, tileX, tileY] = match;
    poiTileRequests++;
    await route.fulfill({
      status: 200,
      contentType: "application/x-protobuf",
      headers: { "access-control-allow-origin": "*" },
      body: Buffer.from(encodeVectorTile({
        center: mapCenter,
        zoom: Number(zoom),
        tileX: Number(tileX),
        tileY: Number(tileY),
        layers: [{
          name: "point_interet",
          geometryType: 1,
          properties: {
            symbo: poiCase.symbol,
            class: poiCase.featureClass,
            subclass: poiCase.symbol,
            texte: `POI E2E ${poiCase.category}`,
            telephone,
            web: website,
            horaire: "Mo-Fr 09:00-17:00",
          },
        }],
      })),
    });
  });
  await page.route("**/geocodage/reverse**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ type: "FeatureCollection", features: [] }),
    });
  });
  await page.route("**/altimetrie/**", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ elevations: [0] }) });
  });

  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await spriteJsonLoaded;
  await spriteImageLoaded;
  await expect(page.locator("#interactivityBtn")).toBeVisible();
  await expect.poll(() => poiTileRequests, { timeout: 15_000 }).toBeGreaterThan(0);
  await dismissStartupOverlay(page);
  await expect(page.getByRole("button", { name: `POI E2E ${poiCase.category}` })).toBeVisible();
  await clickMapCenter(page);

  const positionWindow = page.locator("#positionWindow");
  await expect(positionWindow).not.toHaveClass(/d-none/);
  await expect(positionWindow).toContainText(`POI E2E ${poiCase.category}`);
  await expect(positionWindow).toContainText(poiCase.label);
  await expect(positionWindow.locator(".positionHours")).toContainText("Horaire");
  await expect(positionWindow.locator(".positionWeb a")).toHaveAttribute("href", website);
  await expect(positionWindow.locator(".positionTelephone a")).toHaveAttribute("href", "tel:0123456789");
}

for (const poiCase of poiCases) {
  test(`${poiCase.category} affiche un libellé et ses informations complémentaires`, async ({ page }) => {
    await openPoiFeature(page, poiCase);
  });
}
