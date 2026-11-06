import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const rasterTile = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l3sAAAAASUVORK5CYII=",
  "base64"
);

async function openCompare(page) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://data.geopf.fr/wmts**", async (route) => {
    await route.fulfill({ contentType: "image/png", body: rasterTile });
  });
  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await page.locator("#sideBySideBtn").click();

  await expect(page.locator("#mapRLT1")).toBeVisible();
  await expect(page.locator("#mapRLT2")).toBeVisible();
  await expect(page.locator("#compareMode")).not.toHaveClass(/d-none/);
}

async function dragSlider(page, selector, direction) {
  const slider = page.locator(selector);
  await expect(slider).toBeVisible();
  const before = await slider.boundingBox();
  expect(before).not.toBeNull();

  const startX = before.x + before.width / 2;
  const startY = before.y + before.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  if (direction === "horizontal") {
    await page.mouse.move(startX, startY + 60, { steps: 8 });
  } else {
    await page.mouse.move(startX + 60, startY, { steps: 8 });
  }
  await page.mouse.up();

  await expect.poll(async () => {
    const after = await slider.boundingBox();
    return direction === "horizontal" ? after.y : after.x;
  }).not.toBe(direction === "horizontal" ? before.y : before.x);
}

function layerOnMap(page, mapNumber, layerId) {
  return page.locator(`[id="mapRLT${mapNumber}-${layerId}"]`);
}

async function selectLayer(page, mapNumber, layerType, layerId) {
  await page.locator(mapNumber === 1 ? "#sideBySideLeftLayer" : "#sideBySideRightLayer").click();
  const layerWindow = page.locator(`#compareLayers${mapNumber}Window`);
  await expect(layerWindow).not.toHaveClass(/d-none/);
  const layerTypeToggle = page.locator(`#layerSelector${layerType}Label${mapNumber}`);
  await expect(layerTypeToggle).toBeVisible();
  await layerTypeToggle.click();
  const layer = layerOnMap(page, mapNumber, layerId);
  await expect(layer).toBeVisible();
  await layer.click();
  await expect(layer).toHaveClass(/selectedLayer/);
}

test("opens comparison in vertical mode and moves its slider", async ({ page }) => {
  await openCompare(page);

  await expect(page.locator("#compareLeftRight")).toHaveClass(/selected/);
  await dragSlider(page, ".compare-swiper-vertical", "vertical");
});

test("switches to horizontal mode and moves its slider", async ({ page }) => {
  await openCompare(page);

  await page.locator("#compareUpDown").click();

  await expect(page.locator("#compareUpDown")).toHaveClass(/selected/);
  await expect(page.locator(".compare-swiper-vertical")).toHaveCount(0);
  await dragSlider(page, ".compare-swiper-horizontal", "horizontal");
});

test("switches to fade mode and changes opacity", async ({ page }) => {
  await openCompare(page);

  await page.locator("#compareFade").click();
  const opacity = page.locator("#sideBySideFadeSlider-range-input");
  await expect(page.locator("#compareFade")).toHaveClass(/selected/);
  await expect(opacity).toBeVisible();
  await expect(opacity).toHaveValue("50");

  await opacity.fill("70");

  await expect(opacity).toHaveValue("70");
  await expect(page.locator("#mapRLT1")).toHaveCSS("opacity", "0.3");
});

test("compares a map with aerial imagery and zooms both views", async ({ page }) => {
  await openCompare(page);
  await selectLayer(page, 1, "Cartes", "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$WMTS");
  await selectLayer(page, 2, "Photos", "ORTHOIMAGERY.ORTHOPHOTOS.1950-1965$WMTS");
  await page.locator("#backTopLeftBtn").click();

  const leftScale = page.locator("#mapRLT1 .maplibregl-ctrl-scale");
  const rightScale = page.locator("#mapRLT2 .maplibregl-ctrl-scale");
  await expect(leftScale).toBeVisible();
  await expect(rightScale).toBeVisible();
  const initialLeftScale = await leftScale.innerText();
  const initialRightScale = await rightScale.innerText();

  for (const [mapId, horizontalRatio] of [["#mapRLT1", 0.25], ["#mapRLT2", 0.75]]) {
    const bounds = await page.locator(`${mapId} canvas.maplibregl-canvas`).boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.move(bounds.x + bounds.width * horizontalRatio, bounds.y + bounds.height / 2);
    await page.mouse.wheel(0, -450);
  }

  await expect.poll(() => leftScale.innerText()).not.toBe(initialLeftScale);
  await expect.poll(() => rightScale.innerText()).not.toBe(initialRightScale);
});

test("compares two cartographic views and returns to the main map", async ({ page }) => {
  await openCompare(page);
  await selectLayer(page, 1, "Cartes", "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$WMTS");
  await selectLayer(page, 2, "Cartes", "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950$WMTS");
  await page.locator("#backTopLeftBtn").click();

  await expect(layerOnMap(page, 1, "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$WMTS")).toHaveClass(/selectedLayer/);
  await expect(layerOnMap(page, 2, "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950$WMTS")).toHaveClass(/selectedLayer/);

  await page.locator("#backTopLeftBtn").click();
  await expect(page.locator("#map")).toBeVisible();
  await expect(page.locator("#mapRLT1")).toHaveClass(/d-none/);
  await expect(page.locator("#mapRLT2")).toHaveClass(/d-none/);
});
