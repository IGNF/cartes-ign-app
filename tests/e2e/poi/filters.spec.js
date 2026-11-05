import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, openLayerManager, waitForMapLoaded } from "../app-helpers";

async function openPoiFilters(page, initialZoom = 5) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((zoom) => {
    localStorage.setItem("lastMapLat", "48.8584");
    localStorage.setItem("lastMapLng", "2.2945");
    localStorage.setItem("lastMapZoom", String(zoom));
  }, initialZoom);
  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);

  await page.locator("#filterPoiBtn").click();
  const poiWindow = page.locator("#poiWindow");
  await expect(poiWindow).not.toHaveClass(/d-none/);
  await expect(poiWindow.locator("#displayPOI")).toBeAttached();

  return poiWindow;
}

test("enables and disables all POI categories", async ({ page }) => {
  const poiWindow = await openPoiFilters(page);
  const displayPoi = poiWindow.locator("#displayPOI");
  const categories = poiWindow.locator(".inputPOIFilterItem");
  const displayPoiToggle = poiWindow.locator(".divPOIDisplay .toggleSwitch");

  await expect(displayPoi).toBeChecked();
  await displayPoiToggle.click();
  await expect(displayPoi).not.toBeChecked();
  await expect.poll(() => categories.evaluateAll((inputs) => inputs.every((input) => !input.checked)))
    .toBe(true);

  await displayPoiToggle.click();
  await expect(displayPoi).toBeChecked();
  await expect.poll(() => categories.evaluateAll((inputs) => inputs.every((input) => input.checked)))
    .toBe(true);
});

test("checks and unchecks an individual POI category", async ({ page }) => {
  const poiWindow = await openPoiFilters(page);
  const displayPoi = poiWindow.locator("#displayPOI");
  const commerce = poiWindow.locator("#commerce-POIFilterItem");
  const accommodation = poiWindow.locator("#hebergement-POIFilterItem");
  const commerceLabel = poiWindow.locator("label[for=\"commerce-POIFilterItem\"]");

  await expect(displayPoi).toBeChecked();
  await expect(commerce).toBeChecked();
  await commerceLabel.click();
  await expect(commerce).not.toBeChecked();
  await expect(accommodation).toBeChecked();
  await expect(displayPoi).toBeChecked();

  await commerceLabel.click();
  await expect(commerce).toBeChecked();
  await expect(displayPoi).toBeChecked();
});

test("enables and disables POI Remonter le temps", async ({ page }) => {
  const poiWindow = await openPoiFilters(page);
  const comparePoi = poiWindow.locator("#displayPOIGoBackTime");
  const comparePoiToggle = poiWindow.locator(".divPOIDisplayGoBackTime .toggleSwitch");

  await expect(comparePoi).not.toBeChecked();
  await comparePoiToggle.click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("poirltChecked")))
    .toBe("checked");

  await comparePoiToggle.click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("poirltChecked")))
    .toBe("unchecked");
  await expect(comparePoi).not.toBeChecked();
});

test("keeps POI filters available on another basemap", async ({ page }) => {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await openLayerManager(page);

  const aerialBasemap = page.locator("[id=\"ORTHOIMAGERY.ORTHOPHOTOS$WMTS\"]");
  await aerialBasemap.click();
  await expect(aerialBasemap).toHaveClass(/selectedLayer/);
  await expect(page.locator("#layer-switcher-number")).toHaveText("2");

  await page.locator("#filterPoiBtn").click();
  const poiWindow = page.locator("#poiWindow");
  const displayPoi = poiWindow.locator("#displayPOI");
  const displayPoiToggle = poiWindow.locator(".divPOIDisplay .toggleSwitch");
  await expect(poiWindow).not.toHaveClass(/d-none/);
  await expect(displayPoi).toBeChecked();

  await displayPoiToggle.click();
  await expect(displayPoi).not.toBeChecked();
  await displayPoiToggle.click();
  await expect(displayPoi).toBeChecked();
});