import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const placeSuggestion = {
  fulltext: "Tour Eiffel, Paris",
  x: 2.2945,
  y: 48.8584,
  poiType: ["Monument"],
};

async function openIsochrone(page) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);

  await page.getByRole("button", { name: "Explorer" }).hover();
  await page.locator("#isochrone").click();
  const locationInput = page.locator("#isochroneLocation");
  await expect(locationInput).toBeVisible();
  return locationInput;
}

async function mockPlaceCompletion(page) {
  await page.route("https://data.geopf.fr/geocodage/completion**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        status: "OK",
        results: [placeSuggestion],
      }),
    });
  });
}

test("sets a location from an address", async ({ page }) => {
  await mockPlaceCompletion(page);
  const locationInput = await openIsochrone(page);

  await locationInput.click();
  const searchInput = page.locator("#lieuRech");
  await searchInput.pressSequentially("Tour Eiffel");
  const result = page.locator("#resultsRech .autocompresult");
  await expect(result).toHaveAttribute("fulltext", placeSuggestion.fulltext);
  await result.click({ position: { x: 60, y: 12 } });

  await expect(locationInput).toHaveValue(placeSuggestion.fulltext);
  await expect(locationInput).toHaveAttribute("data-coordinates", "[2.2945,48.8584]");
});

test("sets a location from a recent address", async ({ page }) => {
  const recentSearch = {
    text: placeSuggestion.fulltext,
    coordinates: { lat: placeSuggestion.y, lon: placeSuggestion.x },
  };
  await page.addInitScript((search) => {
    localStorage.setItem("lastRecentSearches", JSON.stringify([search]));
  }, recentSearch);
  const locationInput = await openIsochrone(page);

  await locationInput.click();
  const recentResult = page.locator("#resultsRechRecent .recentresult");
  await expect(recentResult).toHaveAttribute("fulltext", recentSearch.text);
  await recentResult.click({ position: { x: 60, y: 12 } });

  await expect(locationInput).toHaveValue(recentSearch.text);
  await expect(locationInput).toHaveAttribute("data-coordinates", "[2.2945,48.8584]");
});

test("sets a location from my position", async ({ page }) => {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: placeSuggestion.y, longitude: placeSuggestion.x });
  const locationInput = await openIsochrone(page);

  await locationInput.click();
  await page.locator("#myGeoLocation").click();

  await expect(locationInput).toHaveValue("Ma position");
  await expect(locationInput).toHaveAttribute("data-coordinates", "[2.2945,48.8584]");
});

test("sets a location by placing a point on the map", async ({ page }) => {
  await page.route("https://data.geopf.fr/geocodage/reverse**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ type: "FeatureCollection", features: [] }),
    });
  });
  const locationInput = await openIsochrone(page);

  await locationInput.click();
  await page.locator("#selectOnMap").click();
  const confirmMapCenter = page.locator("#mapCenterSubmit");
  await expect(confirmMapCenter).toBeVisible();
  await confirmMapCenter.click();

  await expect(locationInput).toHaveAttribute("data-coordinates", /^\[-?\d+(\.\d+)?,-?\d+(\.\d+)?\]$/);
  await expect(locationInput).not.toHaveValue("");
});
