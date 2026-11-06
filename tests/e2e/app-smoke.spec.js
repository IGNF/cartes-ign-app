import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, openLayerManager } from "./app-helpers";

test.beforeEach(async ({ page }) => {
  await configureAppTest(page);
});

test("loads the main map shell", async ({ page }) => {
  await page.goto("/");
  await dismissStartupOverlay(page);

  await expect(page.locator("#map")).toBeVisible();
  await expect(page.locator("#lieuRech")).toBeVisible();
  await expect(page.locator("#layerManagerBtn")).toBeVisible();
});

test("opens the layer manager", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await dismissStartupOverlay(page);

  await openLayerManager(page);
  await expect(page.locator("#layerManagerBtn")).toHaveClass(/active/);
});
