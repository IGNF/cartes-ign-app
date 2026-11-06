import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, openLayerManager, waitForMapLoaded } from "../app-helpers";

test.beforeEach(async ({ page }) => {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await openLayerManager(page);
});

test("scrolls through basemaps", async ({ page }) => {
  const baseLayers = page.locator("#baseLayers");
  const scrollButton = page.locator("#baseLayersAfter");
  const initialMetrics = await baseLayers.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));

  expect(initialMetrics.scrollWidth).toBeGreaterThan(initialMetrics.clientWidth);

  await scrollButton.click();
  await expect.poll(() => baseLayers.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test("selects and deselects a basemap", async ({ page }) => {
  const firstBasemap = page.locator("[id=\"PLAN.IGN.INTERACTIF$TMS\"]");
  const secondBasemap = page.locator("[id=\"ORTHOIMAGERY.ORTHOPHOTOS$WMTS\"]");
  const selectedLayersCount = page.locator("#layer-switcher-number");

  await expect(firstBasemap).toHaveClass(/selectedLayer/);
  await expect(selectedLayersCount).toHaveText("1");

  await secondBasemap.click();
  await expect(secondBasemap).toHaveClass(/selectedLayer/);
  await expect(selectedLayersCount).toHaveText("2");

  await page.locator("label[for=\"layer-switcher-tab\"]").click();
  const selectedBasemap = page.locator("#layer-switcher .tools-layer-panel")
    .filter({ hasText: "Photographies aériennes" });
  await expect(selectedBasemap).toBeVisible();

  await page.locator("label[for=\"layer-thematics-tab\"]").click();
  await firstBasemap.click();
  await expect(firstBasemap).not.toHaveClass(/selectedLayer/);
  await expect(selectedLayersCount).toHaveText("1");
});

test("selects and deselects thematic data", async ({ page }) => {
  const agricultureButton = page.locator(".thematicButton[data-name=\"Agriculture\"]");
  const agricultureLayer = page.locator("[id=\"LANDUSE.AGRICULTURE.LATEST$WMTS\"]");
  const selectedLayersCount = page.locator("#layer-switcher-number");

  await agricultureButton.click();
  await agricultureLayer.click();
  await expect(agricultureLayer).toHaveClass(/selectedLayer/);
  await expect(selectedLayersCount).toHaveText("2");

  await page.locator("label[for=\"layer-switcher-tab\"]").click();
  const selectedAgricultureLayer = page.locator("#layer-switcher .tools-layer-panel")
    .filter({ hasText: "Registre parcellaire graphique" });
  await expect(selectedAgricultureLayer).toBeVisible();

  await page.locator("label[for=\"layer-thematics-tab\"]").click();
  await agricultureLayer.click();
  await expect(agricultureLayer).not.toHaveClass(/selectedLayer/);
  await expect(selectedLayersCount).toHaveText("1");
});

test("filters thematic layers by theme", async ({ page }) => {
  const agricultureButton = page.locator(".thematicButton[data-name=\"Agriculture\"]");
  const agricultureLayer = page.locator("[id=\"LANDUSE.AGRICULTURE.LATEST$WMTS\"]");
  const cadastralLayer = page.locator("[id=\"CADASTRALPARCELS.PARCELLAIRE_EXPRESS$WMTS\"]");

  await agricultureButton.click();

  await expect(agricultureButton).toHaveClass(/thematic-button-active/);
  await expect(agricultureLayer).not.toHaveClass(/layer-hidden/);
  await expect(cadastralLayer).toHaveClass(/layer-hidden/);
});
