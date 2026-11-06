import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const currentPosition = { latitude: 48.8584, longitude: 2.2945 };
const addressSuggestion = {
  fulltext: "Tour Eiffel, Paris",
  x: 2.2945,
  y: 48.8584,
  poiType: ["Monument"],
};
const addressCoordinates = "[2.2945,48.8584]";
const landmarkTitle = "Point E2E Tour Eiffel";
const landmarkDescription = "Repère créé pendant un test automatisé.";
const reverseAddressName = "5 Avenue Anatole France, 75007 Paris";

async function openApp(page, captureShare = false) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation(currentPosition);
  await page.addInitScript(() => {
    window.__e2eControlsLoaded = false;
    window.addEventListener("controlsloaded", () => {
      window.__e2eControlsLoaded = true;
    });
  });

  if (captureShare) {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data) => {
          window.__e2eSharedData = data;
        },
      });
    });
  }

  await page.route("https://data.geopf.fr/geocodage/completion**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ status: "OK", results: [addressSuggestion] }),
    });
  });
  await page.route("https://data.geopf.fr/geocodage/reverse**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: { type: "Point", coordinates: [currentPosition.longitude, currentPosition.latitude] },
          properties: {
            _type: "address",
            housenumber: "5",
            street: "Avenue Anatole France",
            postcode: "75007",
            city: "Paris",
          },
        }],
      }),
    });
  });
  await page.route("https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ elevations: [123] }),
    });
  });
  await page.route("https://data.geopf.fr/wfs/ows**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ type: "FeatureCollection", features: [] }),
    });
  });

  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await page.waitForFunction(() => window.__e2eControlsLoaded === true);
}

async function openLandmarkForm(page) {
  await page.getByRole("button", { name: "Explorer" }).hover();
  await page.locator("#landmark").click();
  await expect(page.locator("#landmarkWindow")).not.toHaveClass(/d-none/);
}

async function setLandmarkLocation(page, method) {
  const locationInput = page.locator("#landmarkLocation");
  await locationInput.click();

  if (method === "address") {
    const searchInput = page.locator("#lieuRech");
    await searchInput.pressSequentially("Tour Eiffel");
    const suggestion = page.locator("#resultsRech .autocompresult");
    await expect(suggestion).toHaveAttribute("fulltext", addressSuggestion.fulltext);
    await suggestion.click({ position: { x: 60, y: 12 } });
    await expect(locationInput).toHaveValue(addressSuggestion.fulltext);
    await expect(locationInput).toHaveAttribute("data-coordinates", addressCoordinates);
    return;
  }

  if (method === "my position") {
    await page.locator("#myGeoLocation").click();
    await expect(locationInput).toHaveValue("Ma position");
    await expect(locationInput).toHaveAttribute("data-coordinates", addressCoordinates);
    return;
  }

  await page.locator("#selectOnMap").click();
  const confirmMapCenter = page.locator("#mapCenterSubmit");
  await expect(confirmMapCenter).toBeVisible();
  await confirmMapCenter.click();
  await expect(locationInput).toHaveAttribute("data-coordinates", /^\[-?\d+(\.\d+)?,-?\d+(\.\d+)?\]$/);
  await expect(locationInput).not.toHaveValue("");
}

async function fillLandmark(page, { title = landmarkTitle, description = "", method = "address", color, icon } = {}) {
  await openLandmarkForm(page);
  await setLandmarkLocation(page, method);
  await page.locator("#landmark-title").fill(title);
  await page.locator("#landmark-description").fill(description);

  if (color) {
    await page.locator(`input[name="landmark-color"][value="${color}"] + label`).click();
  }
  if (icon) {
    await page.locator(`input[name="landmark-icon"][value="${icon}"] + label`).click();
  }

  await expect(page.locator(".landmark-submit")).not.toHaveClass(/disabled/);
}

async function saveLandmark(page, title = landmarkTitle) {
  await page.locator(".landmark-submit").click();
  await expect(page.locator("#landmarkWindow")).toHaveClass(/d-none/);
  const savedLandmark = page.locator("#myaccountLandmarksList .tools-layer-panel").first();
  await expect(savedLandmark).toContainText(title);
  return savedLandmark;
}

async function clickSavedMapMarker(page) {
  const canvas = page.locator("#map canvas.maplibregl-canvas");
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page.waitForTimeout(800);
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page.locator("#positionContainer")).toBeVisible();
}

async function getPopupCoordinates(page) {
  const coordinatesText = await page.locator("#positionCoordsSpan").innerText();
  const coordinates = coordinatesText.match(/^\((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)$/);
  expect(coordinates).not.toBeNull();
  return { lat: Number(coordinates[1]), lon: Number(coordinates[2]) };
}

async function expectCoordinatesToMatch(input, coordinates) {
  await expect(input).toHaveAttribute("data-coordinates", JSON.stringify([coordinates.lon, coordinates.lat]));
}

test("creates a landmark from an address with a description, color, and category", async ({ page }) => {
  await openApp(page);
  await fillLandmark(page, {
    description: landmarkDescription,
    color: "#C17346",
    icon: "landmark-icon-tovisit",
  });

  const savedLandmark = await saveLandmark(page);
  await expect(savedLandmark.locator(".landmarkSummaryIcon")).toHaveClass(/landmark-icon-tovisit/);
  await expect(savedLandmark.locator(".landmarkSummaryIcon")).toHaveAttribute("style", /#C17346/);
});

test("creates a landmark from my position without a description", async ({ page }) => {
  await openApp(page);
  await fillLandmark(page, { method: "my position" });
  await expect(page.locator("#landmark-description")).toHaveValue("");

  await saveLandmark(page);
});

test("creates a landmark by placing a point on the map", async ({ page }) => {
  await openApp(page);
  await fillLandmark(page, { method: "map" });

  await saveLandmark(page);
});

test("shows landmark information when its map marker is clicked", async ({ page }) => {
  await openApp(page);
  await fillLandmark(page, { description: landmarkDescription });
  await saveLandmark(page);

  await clickSavedMapMarker(page);

  await expect(page.locator("#landmarkPositionTitle")).toContainText(landmarkTitle);
  await expect(page.locator(".positionHtmlBefore")).toContainText(landmarkDescription);
  const coordinates = await getPopupCoordinates(page);
  expect(Math.abs(coordinates.lat - 48.8584)).toBeLessThan(0.001);
  expect(Math.abs(coordinates.lon - 2.2945)).toBeLessThan(0.001);
});

test("opens nearby from the saved landmark", async ({ page }) => {
  await openApp(page);
  await fillLandmark(page, { description: landmarkDescription });
  await saveLandmark(page);
  await clickSavedMapMarker(page);
  const coordinates = await getPopupCoordinates(page);

  await page.locator("#positionNear").click();

  const isochroneLocation = page.locator("#isochroneLocation");
  await expect(isochroneLocation).toHaveValue(reverseAddressName);
  await expectCoordinatesToMatch(isochroneLocation, coordinates);
});

test("starts a route from the saved landmark", async ({ page }) => {
  await openApp(page);
  await fillLandmark(page, { description: landmarkDescription });
  await saveLandmark(page);
  await clickSavedMapMarker(page);
  const coordinates = await getPopupCoordinates(page);

  await page.locator("#positionRoute").click();

  const arrivalInput = page.locator("#directionsLocation_end");
  await expect(arrivalInput).toHaveValue(reverseAddressName);
  await expectCoordinatesToMatch(arrivalInput, coordinates);
});

test("shares the saved landmark from its map popup", async ({ page }) => {
  await openApp(page, true);
  await fillLandmark(page, { description: landmarkDescription });
  await saveLandmark(page);
  await clickSavedMapMarker(page);
  const coordinates = await getPopupCoordinates(page);

  await page.locator("#positionShare").click();
  await expect.poll(() => page.evaluate(() => window.__e2eSharedData?.text)).toContain(landmarkTitle);

  const sharedData = await page.evaluate(() => window.__e2eSharedData);
  expect(sharedData.text).toContain(landmarkDescription);
  expect(sharedData.text).toContain(`Latitude : ${coordinates.lat}`);
  expect(sharedData.text).toContain(`Longitude : ${coordinates.lon}`);
});

test("edits a saved landmark from the account list", async ({ page }) => {
  await openApp(page);
  await fillLandmark(page, {
    description: landmarkDescription,
    color: "#C17346",
    icon: "landmark-icon-tovisit",
  });
  const savedLandmark = await saveLandmark(page);

  await page.locator("#myaccount").click();
  await page.locator("label[for=\"myaccount-landmarks-tab\"]").click();
  await savedLandmark.locator(".tools-layer-advanced").click();
  await page.locator("action-sheet .tools-layer-edit").click();

  await expect(page.locator("#landmarkWindow")).not.toHaveClass(/d-none/);
  await expect(page.locator("#landmarkWindowTitle")).toHaveText("Modifier un point de repère");
  await expect(page.locator("#landmark-title")).toHaveValue(landmarkTitle);
  await expect(page.locator("#landmark-description")).toHaveValue(landmarkDescription);
  await expect(page.locator("#landmarkLocation")).toHaveAttribute("data-coordinates", addressCoordinates);
  await expect(page.locator("#landmark-color-orange")).toBeChecked();
  await expect(page.locator("#landmark-icon-tovisit")).toBeChecked();
});
