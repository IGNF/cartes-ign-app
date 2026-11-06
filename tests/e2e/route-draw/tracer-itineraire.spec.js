import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, openLayerManager, waitForMapLoaded } from "../app-helpers";

test.use({ hasTouch: true });

async function dismissAllStartupOverlays(page) {
  const actionSheet = page.locator("action-sheet");
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!await actionSheet.isVisible().catch(() => false)) {
      return;
    }
    const onboardingConfirm = page.locator("#onBoardingConfirm");
    const understood = page.getByText("J'ai compris").first();
    if (await onboardingConfirm.isVisible().catch(() => false)) {
      await onboardingConfirm.click({ force: true });
    } else if (await understood.isVisible().catch(() => false)) {
      await understood.click({ force: true });
    } else {
      await dismissStartupOverlay(page);
    }
    await expect(actionSheet).toBeHidden();
  }
  await expect(actionSheet).toBeHidden();
}

async function openRouteDraw(page) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: 48.8584, longitude: 2.2945 });
  await page.addInitScript(() => {
    window.__e2eControlsLoaded = false;
    window.addEventListener("controlsloaded", () => {
      window.__e2eControlsLoaded = true;
    });
  });
  await page.route("https://data.geopf.fr/geocodage/reverse**", async (route) => {
    const url = new URL(route.request().url());
    const lon = Number(url.searchParams.get("lon"));
    const lat = Number(url.searchParams.get("lat"));
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: { type: "Point", coordinates: [lon, lat] },
          properties: {
            _type: "address",
            housenumber: "1",
            street: "Rue du Test",
            postcode: "75000",
            city: "Paris",
          },
        }],
      }),
    });
  });
  await page.route("https://data.geopf.fr/navigation/itineraire**", async (route) => {
    const url = new URL(route.request().url());
    const start = url.searchParams.get("start").split(",").map(Number);
    const end = url.searchParams.get("end").split(",").map(Number);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        geometry: { type: "LineString", coordinates: [start, end] },
        distance: 5000,
        duration: 600,
      }),
    });
  });
  await page.route("https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevationLine.json**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        elevations: [
          { lon: 2.30, lat: 48.85, z: 100, acc: 2.5 },
          { lon: 2.31, lat: 48.86, z: 120, acc: 2.5 },
          { lon: 2.32, lat: 48.87, z: 110, acc: 2.5 },
        ],
      }),
    });
  });

  await page.goto("/");
  await dismissAllStartupOverlays(page);
  await waitForMapLoaded(page);
  await page.waitForFunction(() => window.__e2eControlsLoaded === true);
  await dismissAllStartupOverlays(page);
  await page.getByRole("button", { name: "Se déplacer" }).hover();
  await page.locator("#routeDraw").click();
  await expect(page.locator("#routeDrawResults")).toBeVisible();
  await expect(page.locator("#routeDrawEdit")).toBeVisible();
}

async function clickMapPoint(page, xRatio, yRatio, expectGuidedSegment = false) {
  const canvas = page.locator("#map canvas.maplibregl-canvas");
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  const point = {
    x: bounds.x + bounds.width * xRatio,
    y: bounds.y + bounds.height * yRatio,
  };
  const routeResponse = expectGuidedSegment
    ? page.waitForResponse((response) => response.url().includes("/navigation/itineraire?"))
    : null;

  await page.mouse.click(point.x, point.y);
  if (routeResponse) {
    expect((await routeResponse).status()).toBe(200);
    await expect(page.locator(".routeDrawSummaryDistance")).not.toHaveText("0 m");
  } else {
    await expect(page.locator("#routeDrawCancel")).not.toHaveClass(/inactive/);
  }
  return point;
}

async function setRouteDrawMode(page, mode, transport = "pedestrian") {
  await page.locator("#routeDrawMode").click();
  await expect(page.locator("action-sheet")).toBeVisible();
  const options = page.locator("#sheetOptions");
  await options.evaluate((element, scrollToBottom) => {
    element.scrollTop = scrollToBottom ? element.scrollHeight : 0;
  }, mode === "free");

  if (mode === "free") {
    const freeToggle = page.locator("#routeDrawModeFree");
    if (!await freeToggle.isChecked()) {
      await freeToggle.locator("xpath=..").click();
    }
  } else {
    const guidedToggle = page.locator("#routeDrawModeGuided");
    if (!await guidedToggle.isChecked()) {
      await guidedToggle.locator("xpath=..").click();
    }
    if (transport === "car") {
      await options.evaluate((element) => { element.scrollTop = 0; });
      const carRadio = page.locator("#routeDrawGuidedCar");
      if (!await carRadio.isChecked()) {
        await carRadio.locator("xpath=..").click();
      }
    }
  }
  await page.locator("#sheetClose").click({ force: true });
  await expect(page.locator("action-sheet")).toBeHidden();
  await expect(page.locator("#routeDrawMode")).toHaveText(mode === "free" ? "Saisie libre" : "Saisie guidée");
}

async function dragTouch(page, start, end) {
  const session = await page.context().newCDPSession(page);
  const touchPoint = (point) => ({
    id: 1,
    x: point.x,
    y: point.y,
    radiusX: 2,
    radiusY: 2,
    force: 1,
  });

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touchPoint(start)],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [touchPoint(end)],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await session.detach();
}

for (const transport of ["pedestrian", "car"]) {
  test(`draws a guided route in ${transport} mode`, async ({ page }) => {
    await openRouteDraw(page);
    if (transport === "car") {
      await setRouteDrawMode(page, "guided", "car");
    }

    await clickMapPoint(page, 0.32, 0.36);
    await clickMapPoint(page, 0.68, 0.58, true);

    await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("5 km");
    await expect(page.locator(".routeDrawSummaryDuration")).not.toBeEmpty();
    if (transport === "pedestrian") {
      await expect(page.locator(".routeDrawSummaryDPlus")).toContainText("m");
    }
  });
}

test("switches between guided and free drawing modes", async ({ page }) => {
  await openRouteDraw(page);
  await clickMapPoint(page, 0.30, 0.34);
  await clickMapPoint(page, 0.58, 0.48, true);

  await setRouteDrawMode(page, "free");
  await clickMapPoint(page, 0.72, 0.65);
  await expect(page.locator(".routeDrawSummaryDistance")).not.toHaveText("5 km");

  await setRouteDrawMode(page, "guided");
  await clickMapPoint(page, 0.40, 0.70, true);
  await expect(page.locator("#routeDrawMode")).toHaveText("Saisie guidée");
  await expect(page.locator(".routeDrawSummaryDistance")).not.toHaveText("0 m");
});

test("undoes and redoes multiple route edits", async ({ page }) => {
  await openRouteDraw(page);
  await clickMapPoint(page, 0.30, 0.34);
  await clickMapPoint(page, 0.58, 0.48, true);
  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("5 km");
  await clickMapPoint(page, 0.72, 0.65, true);
  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("10 km");

  await page.locator("#routeDrawCancel").click();
  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("5 km");
  await page.locator("#routeDrawCancel").click();
  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("0 m");

  await page.locator("#routeDrawRestore").click();
  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("5 km");
  await page.locator("#routeDrawRestore").click();
  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("10 km");
});

test("deletes a selected route point and recalculates the line", async ({ page }) => {
  await openRouteDraw(page);
  await clickMapPoint(page, 0.27, 0.34);
  const middlePoint = await clickMapPoint(page, 0.50, 0.50, true);
  await clickMapPoint(page, 0.73, 0.66, true);
  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("10 km");

  await page.locator("#routeDrawDelete").click();
  await page.mouse.click(middlePoint.x, middlePoint.y);

  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("5 km");
});

test("changes basemap and thematic layer appearance while drawing", async ({ page }) => {
  await openRouteDraw(page);
  await clickMapPoint(page, 0.32, 0.36);
  await clickMapPoint(page, 0.68, 0.58, true);

  await openLayerManager(page);
  const aerialBasemap = page.locator("[id=\"ORTHOIMAGERY.ORTHOPHOTOS$WMTS\"]");
  await aerialBasemap.click();
  await expect(aerialBasemap).toHaveClass(/selectedLayer/);

  await page.locator(".thematicButton[data-name=\"Agriculture\"]").click();
  const agricultureLayer = page.locator("[id=\"LANDUSE.AGRICULTURE.LATEST$WMTS\"]");
  await agricultureLayer.click();
  await page.locator("label[for=\"layer-switcher-tab\"]").click();
  const agricultureRow = page.locator("#lst-layer-switcher .tools-layer-panel")
    .filter({ hasText: "Registre parcellaire graphique" });
  const opacity = agricultureRow.locator("input[type=\"range\"]");
  await expect(opacity).toHaveValue("75");
  await opacity.focus();
  await opacity.press("ArrowLeft");
  await expect(opacity).toHaveValue("74");

  await page.locator("#backTopLeftBtn").click();
  await expect(page.locator("#routeDrawResults")).toBeVisible();
  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("5 km");
});

test("uses geolocation while a route is being drawn", async ({ page }) => {
  await openRouteDraw(page);
  await clickMapPoint(page, 0.32, 0.36);

  await page.locator("#geolocateBtn").click();

  await expect(page.locator("#geolocateBtn")).toHaveClass(/locationFixe/);
  await expect(page.locator("#map .myPositionIcon")).toBeVisible();
  await expect(page.locator("#routeDrawResults")).toBeVisible();
});

test("shows route characteristics and saves the traced itinerary", async ({ page }) => {
  await openRouteDraw(page);
  await clickMapPoint(page, 0.32, 0.36);
  await clickMapPoint(page, 0.68, 0.58, true);

  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("5 km");
  await expect(page.locator(".routeDrawSummaryDuration")).not.toBeEmpty();
  await expect(page.locator(".routeDrawSummaryDPlus")).not.toBeEmpty();
  await expect(page.locator(".routeDrawSummaryDMinus")).not.toBeEmpty();

  await page.locator("#routeDrawSaveBtn").click();
  await expect(page.locator("#routeDrawSaveContainer")).toBeVisible();
  await page.locator("#routeDrawSaveNameInput").fill("E2E itineraire trace");
  await page.locator("#routeDrawSaveNameInputSubmit").click();

  await expect(page.locator("#myaccountRouteList")).toContainText("E2E itineraire trace");
  await expect(page.locator("#routeDrawSaveWindow")).toHaveClass(/d-none/);
});

test("moves an existing point and inserts a moved point on the route", async ({ page }) => {
  await openRouteDraw(page);
  const firstPoint = await clickMapPoint(page, 0.28, 0.36);
  const lastPoint = await clickMapPoint(page, 0.72, 0.64, true);

  const moveResponse = page.waitForResponse((response) => response.url().includes("/navigation/itineraire?"));
  await dragTouch(page, lastPoint, { x: lastPoint.x - 20, y: lastPoint.y - 20 });
  await expect((await moveResponse).status()).toBe(200);

  const midPoint = { x: (firstPoint.x + lastPoint.x) / 2, y: (firstPoint.y + lastPoint.y) / 2 };
  const insertedRouteResponses = Promise.all([
    page.waitForResponse((response) => response.url().includes("/navigation/itineraire?")),
    page.waitForResponse((response) => response.url().includes("/navigation/itineraire?")),
  ]);
  await dragTouch(page, midPoint, { x: midPoint.x + 25, y: midPoint.y - 20 });
  const responses = await insertedRouteResponses;
  expect(responses.every((response) => response.status() === 200)).toBe(true);
  await expect(page.locator(".routeDrawSummaryDistance")).toHaveText("10 km");
});
