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
}

async function expectDurationRequests(page, profile, minutes) {
  const durationInput = page.locator("#isochroneValueDurationInputMinutes");
  const computeButton = page.locator("#isochroneCompute");

  await durationInput.fill(String(minutes));
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes("/navigation/isochrone?")
  );
  await computeButton.click();
  const response = await responsePromise;

  expect(response.status()).toBe(200);
  const query = new URL(response.url()).searchParams;
  expect(query.get("costType")).toBe("time");
  expect(query.get("costValue")).toBe(String(minutes * 60));
  expect(query.get("timeUnit")).toBe("second");
  expect(query.get("profile")).toBe(profile);
  expect(query.get("point")).toBe("2.2945,48.8584");
  await expect(computeButton).toHaveValue("Calculer");
}

for (const transport of [
  { label: "piéton", profile: "pedestrian" },
  { label: "véhicule", profile: "car" },
]) {
  test(`calculates durations of 5, 10, 20 and 50 minutes in ${transport.label} mode`, async ({ page }) => {
    await openIsochrone(page);
    if (transport.profile === "car") {
      await page.locator("#isochroneTransportVoiture + label").click();
    }

    for (const minutes of [5, 10, 20, 50]) {
      await expectDurationRequests(page, transport.profile, minutes);
    }
  });
}

test("caps the duration at 60 minutes", async ({ page }) => {
  await openIsochrone(page);
  const durationInput = page.locator("#isochroneValueDurationInputMinutes");

  await durationInput.fill("61");
  await expect(durationInput).toHaveValue("60");
  await expectDurationRequests(page, "pedestrian", 60);
});

test.skip(
  "accepts durations in hours and combined hours and minutes",
  async () => {},
  "The current form only accepts minutes and caps the duration at 60 minutes."
);
