import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const initialPosition = { latitude: 48.8584, longitude: 2.2945 };

async function openMapWithGeolocation(page, recordUpdates = false) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation(initialPosition);

  if (recordUpdates) {
    await page.addInitScript((startPosition) => {
      window.__e2eGeolocationUpdates = [];
      const geolocation = navigator.geolocation;
      const callbacks = new Map();
      let nextWatchId = 0;
      const emitPosition = ({ latitude, longitude }) => {
        const position = {
          coords: {
            latitude,
            longitude,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };
        callbacks.forEach((callback) => {
          callback(position);
          window.__e2eGeolocationUpdates.push({ latitude, longitude });
        });
      };

      window.__e2eEmitGeolocation = emitPosition;
      Object.defineProperty(geolocation, "watchPosition", {
        configurable: true,
        value: (success) => {
          const watchId = ++nextWatchId;
          callbacks.set(watchId, success);
          setTimeout(() => emitPosition(startPosition), 0);
          return watchId;
        },
      });
      Object.defineProperty(geolocation, "clearWatch", {
        configurable: true,
        value: (watchId) => callbacks.delete(watchId),
      });
    }, initialPosition);
  }

  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
}

test("activates and disables geolocation", async ({ page }) => {
  await openMapWithGeolocation(page);
  const geolocateButton = page.locator("#geolocateBtn");
  const positionMarker = page.locator("#map .myPositionIcon");

  await geolocateButton.click();
  await expect(geolocateButton).toHaveClass(/locationFixe/);
  await expect(positionMarker).toBeVisible();

  await geolocateButton.click({ delay: 800 });

  await expect(geolocateButton).not.toHaveClass(/locationFixe|locationFollow|locationLoading/);
  await expect(positionMarker).toHaveCount(0);
});

test("receives moving geolocation updates while following", async ({ page }) => {
  await openMapWithGeolocation(page, true);
  const geolocateButton = page.locator("#geolocateBtn");

  await geolocateButton.click();
  await expect(geolocateButton).toHaveClass(/locationFixe/);
  await expect.poll(() => page.evaluate(() => window.__e2eGeolocationUpdates.length))
    .toBeGreaterThan(0);

  await geolocateButton.click();
  await expect(geolocateButton).toHaveClass(/locationFollow/);

  const movedPosition = { latitude: 48.8684, longitude: 2.3045 };
  await page.evaluate((position) => window.__e2eEmitGeolocation(position), movedPosition);
  await expect.poll(() => page.evaluate(({ latitude, longitude }) =>
    window.__e2eGeolocationUpdates.some((position) =>
      position.latitude === latitude && position.longitude === longitude
    ), movedPosition), { timeout: 15_000 }).toBe(true);

  await expect(geolocateButton).toHaveClass(/locationFollow/);
  await expect(page.locator("#map .myPositionIcon")).toBeVisible();
});