import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, openLayerManager, waitForMapLoaded } from "../app-helpers";

const indicator = "#interactivityBtn";

async function openMapAtZoom(page, zoom) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((initialZoom) => {
    localStorage.setItem("lastMapLat", "48.8584");
    localStorage.setItem("lastMapLng", "2.2945");
    localStorage.setItem("lastMapZoom", String(initialZoom));
  }, zoom);
  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
}

test("hides the indicator when Plan IGN is below its interactive zoom", async ({ page }) => {
  await openMapAtZoom(page, 15);

  await expect(page.locator("[id=\"PLAN.IGN.INTERACTIF$TMS\"]")).toHaveClass(/selectedLayer/);
  await expect(page.locator(indicator)).toBeVisible();

  await page.locator("#map canvas").hover();
  await page.mouse.wheel(0, 1200);

  await expect(page.locator(indicator)).toHaveCSS("opacity", "0", { timeout: 10_000 });
});

test("hides the indicator after removing the interactive thematic layer", async ({ page }) => {
  await openMapAtZoom(page, 5);
  const interactivityIndicator = page.locator(indicator);
  const agricultureButton = page.locator(".thematicButton[data-name=\"Agriculture\"]");
  const agricultureLayer = page.locator("[id=\"LANDUSE.AGRICULTURE.LATEST$WMTS\"]");
  const selectedLayersCount = page.locator("#layer-switcher-number");

  await expect(interactivityIndicator).toHaveClass(/d-none/);
  await openLayerManager(page);
  await agricultureButton.click();
  await agricultureLayer.click();

  await expect(agricultureLayer).toHaveClass(/selectedLayer/);
  await expect(selectedLayersCount).toHaveText("2");
  await expect(interactivityIndicator).toBeVisible();

  await agricultureLayer.click();

  await expect(agricultureLayer).not.toHaveClass(/selectedLayer/);
  await expect(selectedLayersCount).toHaveText("1");
  await expect(interactivityIndicator).toHaveCSS("opacity", "0", { timeout: 10_000 });
});
