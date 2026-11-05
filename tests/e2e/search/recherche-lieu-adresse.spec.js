import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const placeSuggestion = {
  fulltext: "Tour Eiffel, Paris",
  x: 2.2945,
  y: 48.8584,
  poiType: ["Monument"],
};

async function openSearch(page) {
  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);

  const searchInput = page.locator("#lieuRech");
  await searchInput.click();
  await expect(page.locator("#searchresultsWindow")).not.toHaveClass(/d-none/);
  return searchInput;
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

test.beforeEach(async ({ page }) => {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
});

test("searches for a place and saves it as recent", async ({ page }) => {
  await mockPlaceCompletion(page);
  const searchInput = await openSearch(page);

  await searchInput.pressSequentially("Tour Eiffel");
  const result = page.locator("#resultsRech .autocompresult");
  await expect(result).toContainText("Tour Eiffel");
  await result.click({ position: { x: 60, y: 12 } });

  await expect(searchInput).toHaveValue(placeSuggestion.fulltext);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("lastRecentSearches"))))
    .toContainEqual({
      text: placeSuggestion.fulltext,
      coordinates: { lat: placeSuggestion.y, lon: placeSuggestion.x },
    });
});

test("searches for my position", async ({ page }) => {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: 48.8584, longitude: 2.2945 });
  const searchInput = await openSearch(page);

  await page.locator("#myGeoLocation").click();

  await expect(searchInput).toHaveValue("Ma position");
  await expect(page.locator("#searchresultsWindow")).toHaveClass(/d-none/);
});

test("reuses a recent place search", async ({ page }) => {
  const recentSearch = {
    text: placeSuggestion.fulltext,
    coordinates: { lat: placeSuggestion.y, lon: placeSuggestion.x },
  };
  await page.addInitScript((search) => {
    localStorage.setItem("lastRecentSearches", JSON.stringify([search]));
  }, recentSearch);
  const searchInput = await openSearch(page);

  const recentResult = page.locator("#resultsRechRecent .recentresult");
  await expect(recentResult).toContainText("Tour Eiffel");
  await recentResult.click({ position: { x: 60, y: 12 } });

  await expect(searchInput).toHaveValue(recentSearch.text);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("lastRecentSearches"))))
    .toEqual([recentSearch]);
});

test("the back arrow closes the search panel", async ({ page }) => {
  await openSearch(page);
  const backButton = page.locator("#backTopLeftBtn");

  await expect(backButton).toBeVisible();
  await backButton.click();

  await expect(page.locator("#searchresultsWindow")).toHaveClass(/d-none/);
  await expect(backButton).toHaveClass(/d-none/);
});

test("the clear button empties the search field", async ({ page }) => {
  const searchInput = await openSearch(page);

  await searchInput.fill("Lyon");
  const clearButton = page.locator("#clearSearch");
  await expect(clearButton).toBeVisible();
  await clearButton.click();

  await expect(searchInput).toHaveValue("");
  await expect(clearButton).toBeHidden();
});