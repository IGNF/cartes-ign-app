import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const comparePois = [
  {
    name: "Saint-Martin-de-Crau",
    latitude: 43.632783,
    longitude: 4.896852,
    title: "Observez comment l'agriculture irriguée redessine nos paysages",
    location: "Saint-Martin- de-crau, Bouches-du-Rhône",
    text: "Irriguer un champ permet d'apporter de l'eau artificiellement aux cultures",
  },
  {
    name: "Brienne",
    latitude: 46.559096,
    longitude: 5.035644,
    title: "Observez l'impact de l'agriculture intensive sur nos paysages agricoles",
    location: "Brienne, Saône-et-Loire",
    text: "les petites parcelles agricoles sont regroupées en exploitations plus grandes",
  },
];

async function openPoiAt(page, poi) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((position) => {
    localStorage.setItem("poirltChecked", "unchecked");
    localStorage.setItem("lastRecentSearches", JSON.stringify([{
      text: position.name,
      coordinates: { lat: position.latitude, lon: position.longitude },
    }]));
  }, poi);

  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);

  await page.locator("#filterPoiBtn").click();
  const poiRltToggle = page.locator("#displayPOIGoBackTime");
  await expect(poiRltToggle).not.toBeChecked();
  await page.locator(".divPOIDisplayGoBackTime .toggleSwitch").click();
  await expect(poiRltToggle).toBeChecked();
  await page.locator("#tabClose").click();
  await expect(page.locator("#poiWindow")).toHaveClass(/d-none/);

  await page.locator("#lieuRech").click();
  const recentSearch = page.locator(`#resultsRechRecent .recentresult[fulltext="${poi.name}"]`);
  await expect(recentSearch).toBeVisible();
  await recentSearch.click({ position: { x: 60, y: 12 } });
  await expect(page.locator(".searchResultIcon")).toBeVisible();
  await page.locator(".searchResultIcon").click();

  const mapCanvas = page.locator("#map canvas.maplibregl-canvas");
  const bounds = await mapCanvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 - 10);

  const poiWindow = page.locator("#comparePoiWindow");
  await expect(poiWindow).not.toHaveClass(/d-none/);
  return poiWindow;
}

for (const poi of comparePois) {
  test(`consults the POI RLT near ${poi.name}`, async ({ page }) => {
    const poiWindow = await openPoiAt(page, poi);

    await expect(poiWindow.locator(".comparePoiTitle")).toContainText(poi.title);
    await expect(poiWindow.locator(".comparePoiLocation")).toHaveText(poi.location);
    await expect(poiWindow.locator(".comparePoiText")).toContainText(poi.text);
  });
}
