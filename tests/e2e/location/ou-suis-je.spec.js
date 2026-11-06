import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const currentPosition = { latitude: 48.8584, longitude: 2.2945 };
const positionAddress = {
  number: "5",
  street: "Avenue Anatole France",
  postcode: "75007",
  city: "Paris",
};
const positionName = "5 Avenue Anatole France, 75007 Paris";

async function openWhereAmI(page, captureShare = false) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation(currentPosition);

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
            housenumber: positionAddress.number,
            street: positionAddress.street,
            postcode: positionAddress.postcode,
            city: positionAddress.city,
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
  await page.getByRole("button", { name: "Explorer" }).hover();
  await page.locator("#position").click();

  await expect(page.locator("#positionContainer")).toBeVisible();
  await expect(page.locator("#positionCoordsSpan")).toHaveText("(48.8584, 2.2945)");
  await expect(page.locator(".lblPositionAddress")).toHaveText("5 Avenue Anatole France");
  await expect(page.locator(".lblPositionCity")).toHaveText("75007 Paris");
}

test("shows the current position and its nearest address", async ({ page }) => {
  await openWhereAmI(page);

  await expect(page.locator("#positionAltitudeSpan")).toHaveText("123");
});

test("shares the current position through the system share API", async ({ page }) => {
  await openWhereAmI(page, true);
  await expect(page.locator("#positionAltitudeSpan")).toHaveText("123");

  await page.locator("#positionShare").click();
  await expect.poll(() => page.evaluate(() => window.__e2eSharedData?.text)).toContain(positionName);

  const sharedData = await page.evaluate(() => window.__e2eSharedData);
  expect(sharedData.text).toContain("Latitude : 48.8584");
  expect(sharedData.text).toContain("Longitude : 2.2945");
  expect(sharedData.text).toContain("Altitude : 123 m");
  expect(sharedData.text).toContain("https://cartes-ign.ign.fr?lng=2.2945&lat=48.8584");
});

test("opens nearby with the current position", async ({ page }) => {
  await openWhereAmI(page);

  await page.locator("#positionNear").click();

  const isochroneLocation = page.locator("#isochroneLocation");
  await expect(isochroneLocation).toHaveValue(positionName);
  await expect(isochroneLocation).toHaveAttribute("data-coordinates", "[2.2945,48.8584]");
});

test("starts a route with the current position as departure", async ({ page }) => {
  await openWhereAmI(page);

  await page.locator("#positionRoute").click();

  const departureInput = page.locator("#directionsLocation_start");
  await expect(departureInput).toHaveValue(positionName);
  await expect(departureInput).toHaveAttribute("data-coordinates", "[2.2945,48.8584]");
});
