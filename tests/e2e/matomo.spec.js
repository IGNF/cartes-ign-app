import { expect, test } from "@playwright/test";
import { configureAppTest } from "./app-helpers";

const enabled = process.env.MATOMO_TEST_ENABLED === "1";
const trackerUrl = "https://matomo.example.org/matomo/";

test.beforeEach(async ({ page }) => {
  await configureAppTest(page);
});

test("uses Matomo only when configured", async ({ page }) => {
  const matomoRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("matomo")) {
      matomoRequests.push(request.url());
    }
  });
  await page.route(`${trackerUrl}**`, (route) => route.fulfill({
    contentType: "application/javascript",
    body: "",
  }));
  await page.goto("/");
  await expect(page.locator("#map")).toBeVisible();

  if (!enabled) {
    await page.locator("#layerManagerBtn").dispatchEvent("pointerdown");
    expect(await page.evaluate(() => window._paq)).toBeUndefined();
    expect(matomoRequests).toEqual([]);
    return;
  }

  await expect.poll(() => matomoRequests).toContain(`${trackerUrl}matomo.js`);
  expect(matomoRequests).not.toContain("https://matomo.ign.fr/matomo.js");
  expect(await page.evaluate(() => window._paq)).toEqual(expect.arrayContaining([
    ["setTrackerUrl", `${trackerUrl}matomo.php`],
    ["setSiteId", "23"],
  ]));
});
