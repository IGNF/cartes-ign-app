import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const location = {
  text: "Tour Eiffel, Paris",
  coordinates: { lat: 48.8584, lon: 2.2945 },
};

async function openIsochrone(page) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((recentLocation) => {
    localStorage.setItem("lastRecentSearches", JSON.stringify([recentLocation]));
  }, location);
  await page.route("https://data.geopf.fr/navigation/isochrone**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        geometry: {
          type: "Polygon",
          coordinates: [[
            [2.28, 48.84],
            [2.31, 48.84],
            [2.31, 48.87],
            [2.28, 48.87],
            [2.28, 48.84],
          ]],
        },
      }),
    });
  });

  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await page.getByRole("button", { name: "Explorer" }).hover();
  await page.locator("#isochrone").click();

  const locationInput = page.locator("#isochroneLocation");
  await expect(locationInput).toBeVisible();
  await locationInput.click();
  const recentLocation = page.locator("#resultsRechRecent .recentresult");
  await expect(recentLocation).toHaveAttribute("fulltext", location.text);
  await recentLocation.click({ position: { x: 60, y: 12 } });
  await expect(locationInput).toHaveAttribute("data-coordinates", "[2.2945,48.8584]");
  await page.locator("#isochroneModeDistance + label").click();
}

async function expectDistanceRequest(page, profile, kilometers) {
  const distanceInput = page.locator("#isochroneValueDistanceInput");
  const effectiveDistance = Math.min(kilometers, 50);

  await distanceInput.fill(String(kilometers));
  await expect(distanceInput).toHaveValue(String(effectiveDistance));
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes("/navigation/isochrone?")
  );
  await page.locator("#isochroneCompute").click();
  const response = await responsePromise;

  expect(response.status()).toBe(200);
  const query = new URL(response.url()).searchParams;
  expect(query.get("costType")).toBe("distance");
  expect(query.get("costValue")).toBe(String(Math.round(effectiveDistance * 1000)));
  expect(query.get("distanceUnit")).toBe("meter");
  expect(query.get("profile")).toBe(profile);
  expect(query.get("point")).toBe("2.2945,48.8584");
  await expect(page.locator("#isochroneCompute")).toHaveValue("Calculer");
}

for (const transport of [
  { label: "piéton", profile: "pedestrian" },
  { label: "véhicule", profile: "car" },
]) {
  test(`calculates distances of 0.5, 1, 2.5, 10 and 100 km in ${transport.label} mode`, async ({ page }) => {
    await openIsochrone(page);
    if (transport.profile === "car") {
      await page.locator("#isochroneTransportVoiture + label").click();
    }

    for (const kilometers of [0.5, 1, 2.5, 10, 100]) {
      await expectDistanceRequest(page, transport.profile, kilometers);
    }
  });
}

async function setPoiCategories(page, selectedIndexes) {
  const categories = page.locator(".inputIsochroneFilterItem");
  const categoryCount = await categories.count();
  expect(categoryCount).toBeGreaterThan(0);

  for (let index = 0; index < categoryCount; index++) {
    const category = categories.nth(index);
    const shouldBeChecked = selectedIndexes.includes(index);
    if (await category.isChecked() !== shouldBeChecked) {
      await category.locator("xpath=.." ).click();
    }
  }

  await expect(page.locator(".inputIsochroneFilterItem:checked")).toHaveCount(selectedIndexes.length);
}

test("calculates 0.5 km with all, no, and selected POI categories and contour options", async ({ page }) => {
  await openIsochrone(page);
  const categories = page.locator(".inputIsochroneFilterItem");
  const categoryCount = await categories.count();

  await setPoiCategories(page, Array.from({ length: categoryCount }, (_, index) => index));
  await expectDistanceRequest(page, "pedestrian", 0.5);

  await setPoiCategories(page, []);
  await expectDistanceRequest(page, "pedestrian", 0.5);

  await setPoiCategories(page, [0]);
  await expectDistanceRequest(page, "pedestrian", 0.5);

  const showLimits = page.locator("#showLimitsChk");
  await showLimits.locator("xpath=.." ).click();
  await expect(showLimits).not.toBeChecked();
  await expectDistanceRequest(page, "pedestrian", 0.5);

  const showOutsidePois = page.locator("#showOutPoisChk");
  await showOutsidePois.locator("xpath=.." ).click();
  await expect(showOutsidePois).toBeChecked();
  await expect(showLimits).toBeChecked();
  await expect(showLimits).toBeDisabled();
  await expectDistanceRequest(page, "pedestrian", 0.5);
});
