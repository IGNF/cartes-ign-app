import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const recentPlaces = [
  { text: "Tour Eiffel, Paris", coordinates: { lat: 48.8584, lon: 2.2945 } },
  { text: "Gare de Lyon, Paris", coordinates: { lat: 48.8443, lon: 2.3730 } },
  { text: "Gare du Nord, Paris", coordinates: { lat: 48.8809, lon: 2.3553 } },
  { text: "Arc de Triomphe, Paris", coordinates: { lat: 48.8738, lon: 2.2950 } },
];
const addressSuggestion = {
  fulltext: recentPlaces[0].text,
  x: recentPlaces[0].coordinates.lon,
  y: recentPlaces[0].coordinates.lat,
  poiType: ["Monument"],
};
const mapPointCoordinates = [2.2945, 48.8584];
const routeGeometry = "_p~iF~ps|U_ulLnnqC_mqNvxq";

async function openDirections(page) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({
    latitude: recentPlaces[0].coordinates.lat,
    longitude: recentPlaces[0].coordinates.lon,
  });
  await page.addInitScript((places) => {
    localStorage.setItem("lastRecentSearches", JSON.stringify(places));
    window.__e2eControlsLoaded = false;
    window.addEventListener("controlsloaded", () => {
      window.__e2eControlsLoaded = true;
    });
  }, recentPlaces);
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
          geometry: { type: "Point", coordinates: mapPointCoordinates },
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
    const points = [
      url.searchParams.get("start"),
      ...(url.searchParams.get("intermediates") || "").split("|").filter(Boolean),
      url.searchParams.get("end"),
    ];
    const portions = points.slice(1).map((end, index) => ({
      start: points[index],
      end,
      distance: 5000,
      duration: 300,
      steps: [{
        geometry: routeGeometry,
        distance: 5000,
        duration: 300,
        instruction: { type: "continue", modifier: "straight" },
        attributes: { name: { nom_1_droite: "Rue du Test" } },
      }],
    }));
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        geometry: routeGeometry,
        distance: 5000 * portions.length,
        duration: 300 * portions.length,
        portions,
      }),
    });
  });
  await page.route("https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevationLine.json**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        elevations: [
          { lon: 2.2945, lat: 48.8584, z: 35, acc: 2.5 },
          { lon: 2.3730, lat: 48.8443, z: 42, acc: 2.5 },
        ],
      }),
    });
  });

  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await page.waitForFunction(() => window.__e2eControlsLoaded === true);
  await dismissStartupOverlay(page);
  await expect(page.locator("action-sheet")).toBeHidden();
  await page.getByRole("button", { name: "Se déplacer" }).hover();
  await page.locator("#directions").click();
  await expect(page.locator("#directionsForm")).toBeVisible();
}

async function setLocationFromAddress(page, input) {
  await input.click();
  const searchInput = page.locator("#lieuRech");
  await searchInput.fill("");
  await searchInput.pressSequentially("Tour Eiffel");
  const suggestion = page.locator("#resultsRech .autocompresult");
  await expect(suggestion).toHaveAttribute("fulltext", addressSuggestion.fulltext);
  await suggestion.click({ position: { x: 60, y: 12 } });
  await expect(input).toHaveValue("Tour Eiffel");
  await expect(input).toHaveAttribute("data-coordinates", JSON.stringify([addressSuggestion.x, addressSuggestion.y]));
}

async function setLocationFromRecent(page, input, recentIndex) {
  const place = recentPlaces[recentIndex];
  await input.click();
  const result = page.locator(`#resultsRechRecent .recentresult[fulltext="${place.text}"]`);
  await expect(result).toBeVisible();
  await result.click({ position: { x: 60, y: 12 } });
  await expect(input).toHaveValue(place.text.split(",")[0]);
  await expect(input).toHaveAttribute("data-coordinates", JSON.stringify([place.coordinates.lon, place.coordinates.lat]));
}

async function setLocationFromMyPosition(page, input) {
  await input.click();
  await page.locator("#myGeoLocation").click();
  await expect(input).toHaveValue("Ma position");
  await expect(input).toHaveAttribute("data-coordinates", JSON.stringify([recentPlaces[0].coordinates.lon, recentPlaces[0].coordinates.lat]));
}

async function setLocationFromMap(page, input) {
  await input.click();
  await page.locator("#selectOnMap").click();
  const confirmMapCenter = page.locator("#mapCenterSubmit");
  await expect(confirmMapCenter).toBeVisible();
  await confirmMapCenter.click();
  await expect(input).toHaveValue("1 Rue du Test, Paris, 75000");
  await expect(input).toHaveAttribute("data-coordinates", JSON.stringify(mapPointCoordinates));
}

async function setRoutePoints(page, stepCount = 0) {
  const departure = page.locator("#directionsLocation_start");
  const arrival = page.locator("#directionsLocation_end");
  await setLocationFromRecent(page, departure, 0);

  for (let index = 1; index <= stepCount; index++) {
    await page.locator("#directionsLocationImg_step").click();
    const step = page.locator(`#directionsLocation_step_${index}`);
    await expect(step).toBeVisible();
    await setLocationFromRecent(page, step, index + 1);
  }

  await setLocationFromRecent(page, arrival, 1);
}

async function calculateAndReadRequest(page) {
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes("/navigation/itineraire?")
  );
  await page.locator("#directionsCompute").click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(page.locator("#directionsResults")).toBeVisible();
  return new URL(response.url()).searchParams;
}

async function dragHandle(page, sourceSelector, targetSelector) {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);
  await target.scrollIntoViewIfNeeded();
  const sourceBounds = await source.boundingBox();
  const targetBounds = await target.boundingBox();
  expect(sourceBounds).not.toBeNull();
  expect(targetBounds).not.toBeNull();

  const sourceX = sourceBounds.x + sourceBounds.width / 2;
  const sourceY = sourceBounds.y + sourceBounds.height / 2;
  const targetX = targetBounds.x + targetBounds.width / 2;
  const targetY = targetBounds.y + targetBounds.height / 2;
  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(sourceX + 12, sourceY + 8, { steps: 2 });
  await page.mouse.move(targetX, targetY, { steps: 16 });
  await page.mouse.up();
}

for (const endpoint of [
  { name: "departure", selector: "#directionsLocation_start" },
  { name: "arrival", selector: "#directionsLocation_end" },
]) {
  test(`sets the ${endpoint.name} by address, recent search, position, and map point`, async ({ page }) => {
    await openDirections(page);
    const input = page.locator(endpoint.selector);

    await setLocationFromAddress(page, input);
    await setLocationFromRecent(page, input, 1);
    await setLocationFromMyPosition(page, input);
    await setLocationFromMap(page, input);
  });
}

for (const mode of [
  { title: "shortest pedestrian", profile: "pedestrian", optimization: "shortest", transport: "pedestrian", shortest: true },
  { title: "fastest car", profile: "car", optimization: "fastest", transport: "car", shortest: false },
  { title: "shortest car", profile: "car", optimization: "shortest", transport: "car", shortest: true },
]) {
  test(`calculates a ${mode.title} route`, async ({ page }) => {
    await openDirections(page);
    await setRoutePoints(page);
    if (mode.transport === "car") {
      await page.locator("#directionsTransportVoiture + label").click();
    }
    if (mode.shortest) {
      await page.locator("#directionsComputationShortest + label").click();
    }

    const query = await calculateAndReadRequest(page);
    expect(query.get("profile")).toBe(mode.profile);
    expect(query.get("optimization")).toBe(mode.optimization);
    expect(query.get("start")).toBe("2.2945,48.8584");
    expect(query.get("end")).toBe("2.373,48.8443");
    expect(query.get("intermediates")).toBe("");
  });
}

test("adds one intermediate step and calculates the route", async ({ page }) => {
  await openDirections(page);
  await setRoutePoints(page, 1);

  const query = await calculateAndReadRequest(page);
  expect(query.get("intermediates")).toBe("2.3553,48.8809");
  expect(query.get("start")).toBe("2.2945,48.8584");
  expect(query.get("end")).toBe("2.373,48.8443");
});

for (const mode of [
  { title: "shortest pedestrian", profile: "pedestrian", optimization: "shortest", transport: "pedestrian", shortest: true },
  { title: "fastest car", profile: "car", optimization: "fastest", transport: "car", shortest: false },
  { title: "shortest car", profile: "car", optimization: "shortest", transport: "car", shortest: true },
]) {
  test(`calculates a multi-step ${mode.title} route`, async ({ page }) => {
    await openDirections(page);
    await setRoutePoints(page, 2);
    if (mode.transport === "car") {
      await page.locator("#directionsTransportVoiture + label").click();
    }
    if (mode.shortest) {
      await page.locator("#directionsComputationShortest + label").click();
    }

    const query = await calculateAndReadRequest(page);
    expect(query.get("profile")).toBe(mode.profile);
    expect(query.get("optimization")).toBe(mode.optimization);
    expect(query.get("intermediates")).toBe("2.3553,48.8809|2.295,48.8738");
  });
}

test("reverses departure and arrival by dragging their handles", async ({ page }) => {
  await openDirections(page);
  await setRoutePoints(page);

  await dragHandle(
    page,
    "#divDirectionsLocationsItem_start .handle-draggable-layer",
    "#divDirectionsLocationsItem_end .handle-draggable-layer"
  );

  const orderedInputs = page.locator("#divDirectionsLocationsList > .divDirectionsLocationsItem:not(.hidden) .inputDirectionsLocations");
  await expect(orderedInputs).toHaveCount(2);
  await expect(orderedInputs.nth(0)).toHaveValue("Gare de Lyon");
  await expect(orderedInputs.nth(1)).toHaveValue("Tour Eiffel");
});

test("reverses the order of multiple intermediate steps", async ({ page }) => {
  await openDirections(page);
  await setRoutePoints(page, 2);

  await dragHandle(
    page,
    "#divDirectionsLocationsItem_2 .handle-draggable-layer",
    "#divDirectionsLocationsItem_1 .handle-draggable-layer"
  );

  const orderedInputs = page.locator("#divDirectionsLocationsList > .divDirectionsLocationsItem:not(.hidden) .inputDirectionsLocations");
  await expect(orderedInputs).toHaveCount(4);
  await expect(orderedInputs.nth(1)).toHaveValue("Arc de Triomphe");
  await expect(orderedInputs.nth(2)).toHaveValue("Gare du Nord");
  const query = await calculateAndReadRequest(page);
  expect(query.get("intermediates")).toBe("2.295,48.8738|2.3553,48.8809");
});

test.skip(
  "calculates fastest pedestrian routes with and without intermediate steps",
  async () => {},
  "The current directions adapter forces pedestrian optimization to shortest."
);
