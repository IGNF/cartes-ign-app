import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";

const routeNames = ["E2E route alpha", "E2E route beta"];
const landmarkNames = ["E2E repere alpha", "E2E repere beta"];
const landmarkDescription = "Description du repere E2E.";

function routeFeatureCollection(name, offset = 0) {
  const start = [2.29 + offset, 48.85];
  const end = [2.31 + offset, 48.87];
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: start },
        properties: { name: `${name} depart` },
      },
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [start, end] },
        properties: { distance: 1000, duration: 600 },
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: end },
        properties: { name: `${name} arrivee` },
      },
    ],
    data: {
      name,
      transport: "pedestrian",
      distance: 1000,
      duration: 600,
      elevationData: {
        elevationData: [{ x: 0, y: 120 }],
        coordinates: [],
        dplus: 0,
        dminus: 0,
        unit: "m",
      },
    },
  };
}

function landmarkFeatureCollection(names = landmarkNames) {
  return {
    type: "FeatureCollection",
    features: names.map((title, index) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [2.29 + index * 0.02, 48.85 + index * 0.02] },
      properties: {
        title,
        description: landmarkDescription,
        locationName: `Lieu ${index + 1}, Paris`,
        color: "#3993F3",
        icon: "landmark-icon-saved",
      },
    })),
  };
}

async function openApp(page, captureShare = false) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
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
  await page.addInitScript(() => {
    window.__e2eControlsLoaded = false;
    window.addEventListener("controlsloaded", () => {
      window.__e2eControlsLoaded = true;
    });
    window.__e2eInitialAccountBody = null;
    window.__e2eAccountRefreshDone = false;
    const observer = new MutationObserver(() => {
      const currentAccountBody = document.querySelector("#myaccountWindow #myAccountBody");
      if (!currentAccountBody) {
        return;
      }
      if (!window.__e2eInitialAccountBody) {
        window.__e2eInitialAccountBody = currentAccountBody;
      } else if (currentAccountBody !== window.__e2eInitialAccountBody) {
        window.__e2eAccountRefreshDone = true;
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });

  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await page.waitForFunction(() => window.__e2eControlsLoaded === true);
  await page.waitForFunction(() => {
    return window.__e2eAccountRefreshDone === true;
  }, undefined, { timeout: 15_000 });
}

async function openAccount(page, tab = "routes") {
  const accountWindow = page.locator("#myaccountWindow");
  const accountHeading = page.getByText("Mes enregistrements", { exact: true });
  const listSelector = tab === "landmarks" ? "#myaccountLandmarksList" : "#myaccountRouteList";
  const list = page.locator(listSelector);
  await expect(async () => {
    if (!await accountWindow.isVisible()) {
      await page.locator("#myaccount").click({ force: true });
    }
    await expect(accountWindow).toBeVisible();
  }).toPass({ timeout: 15_000 });
  await expect(accountHeading).toBeVisible();
  if (tab === "landmarks") {
    await page.locator("label[for=\"myaccount-landmarks-tab\"]").click({ force: true });
  } else {
    await page.locator("label[for=\"myaccount-routes-tab\"]").click({ force: true });
  }
  await expect(list).toBeVisible();
}

async function importFiles(page, buttonSelector, files) {
  const chooserPromise = page.waitForEvent("filechooser");
  await page.locator(buttonSelector).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(files.map(({ name, data }) => ({
    name,
    mimeType: "application/geo+json",
    buffer: Buffer.from(JSON.stringify(data)),
  })));
}

async function importRoutes(page, names = [routeNames[0]]) {
  await importFiles(page, "#myAccountImportBtnRoutes", names.map((name, index) => ({
    name: `${name}.geojson`,
    data: routeFeatureCollection(name, index * 0.02),
  })));
  await expect(page.locator("#myaccountRouteList .tools-layer-panel")).toHaveCount(names.length);
  for (const name of names) {
    await expect(routeRow(page, name)).toBeVisible();
  }
}

async function importLandmarks(page, names = [landmarkNames[0]]) {
  await importFiles(page, "#myAccountImportBtnLandmarks", [{
    name: "E2E-reperes.geojson",
    data: landmarkFeatureCollection(names),
  }]);
  await expect(page.locator("#myaccountLandmarksList .tools-layer-panel")).toHaveCount(names.length);
  for (const name of names) {
    await expect(landmarkRow(page, name)).toBeVisible();
  }
}

function routeRow(page, name) {
  return page.locator("#myaccountRouteList .tools-layer-panel").filter({ hasText: name });
}

function landmarkRow(page, name) {
  return page.locator("#myaccountLandmarksList .tools-layer-panel").filter({ hasText: name });
}

async function openAdvancedMenu(page, row) {
  const advancedButton = row.locator(".tools-layer-advanced");
  await advancedButton.dispatchEvent("click");
  await expect(page.locator("action-sheet")).not.toHaveClass(/d-none/);
}

async function chooseListAction(page, row, actionName) {
  await openAdvancedMenu(page, row);
  const option = page.locator(".actionSheet-list-option").getByText(actionName, { exact: true });
  await expect(option).toBeVisible();
  await option.click();
  await expect(page.locator("action-sheet")).toHaveClass(/d-none/);
}

async function chooseExportFormat(page, format = "JSON") {
  const formatOption = page.locator(".actionSheet-buttons-button").getByText(format, { exact: true });
  await expect(formatOption).toBeVisible();
  await formatOption.click();
}

async function dragFirstRowToSecond(page, listSelector) {
  const rows = page.locator(`${listSelector} .tools-layer-panel`);
  const handles = rows.locator(".handle-draggable-layer");
  const titles = rows.locator("span[id^='route-title_ID_'], span[id^='landmark-title_ID_']");
  const before = await titles.allTextContents();
  const source = await handles.nth(0).boundingBox();
  const target = await rows.nth(1).boundingBox();
  expect(source).not.toBeNull();
  expect(target).not.toBeNull();

  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(source.x + source.width / 2 + 1, source.y + source.height / 2 + 1);
  await page.mouse.move(target.x + target.width / 2, target.y + 10, { steps: 10 });
  await page.mouse.up();

  await expect.poll(() => titles.allTextContents()).not.toEqual(before);
}

test("imports and reorders routes", async ({ page }) => {
  await openApp(page);
  await openAccount(page);
  await importRoutes(page, routeNames);

  await dragFirstRowToSecond(page, "#myaccountRouteList");
});

test("shares a route", async ({ page }) => {
  await openApp(page, true);
  await openAccount(page);
  await importRoutes(page);
  await openAccount(page);
  const route = routeRow(page, routeNames[0]);

  await route.scrollIntoViewIfNeeded();
  await openAdvancedMenu(page, route);
  await page.locator(".actionSheet-list-option").getByText("Partager", { exact: true }).click();
  await expect(page.locator(".actionSheet-title")).toHaveText("Choisissez votre format de partage");
  await chooseExportFormat(page);
  await expect.poll(() => page.evaluate(() => window.__e2eSharedData?.text)).toContain(routeNames[0]);
});

test("hides, restores, and edits a route", async ({ page }) => {
  await openApp(page);
  await openAccount(page);
  await importRoutes(page);
  await openAccount(page);
  const route = routeRow(page, routeNames[0]);

  await chooseListAction(page, route, "Masquer de la carte");
  await expect(route).toHaveClass(/invisible/);
  await chooseListAction(page, route, "Afficher sur la carte");
  await expect(route).not.toHaveClass(/invisible/);

  await chooseListAction(page, route, "Modifier");
  await expect(page.locator("#routeDrawResults")).toBeVisible();
  await expect(page.locator(".routeDrawResultsTitle")).toContainText(routeNames[0]);
});

test("exports and deletes a route", async ({ page }) => {
  await openApp(page);
  await openAccount(page);
  await importRoutes(page);
  await openAccount(page);
  const route = routeRow(page, routeNames[0]);

  const downloadPromise = page.waitForEvent("download");
  await route.scrollIntoViewIfNeeded();
  await openAdvancedMenu(page, route);
  await page.locator(".actionSheet-list-option").getByText("Exporter", { exact: true }).click();
  await chooseExportFormat(page);
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${routeNames[0]}.geojson`);

  const routeAfterExport = routeRow(page, routeNames[0]);
  await routeAfterExport.scrollIntoViewIfNeeded();
  await openAdvancedMenu(page, routeAfterExport);
  const deleteOption = page.locator(".actionSheet-list-option.confirm-needed");
  await deleteOption.click();
  await deleteOption.click();
  await expect(routeRow(page, routeNames[0])).toHaveCount(0);
});

test("imports and reorders landmarks", async ({ page }) => {
  await openApp(page);
  await openAccount(page, "landmarks");
  await importLandmarks(page, landmarkNames);

  await dragFirstRowToSecond(page, "#myaccountLandmarksList");
});

test("shares a landmark", async ({ page }) => {
  await openApp(page, true);
  await openAccount(page, "landmarks");
  await importLandmarks(page);
  await openAccount(page, "landmarks");
  const landmark = landmarkRow(page, landmarkNames[0]);

  await chooseListAction(page, landmark, "Partager");
  await expect.poll(() => page.evaluate(() => window.__e2eSharedData?.text)).toContain(landmarkNames[0]);
  await expect.poll(() => page.evaluate(() => window.__e2eSharedData?.text)).toContain(landmarkDescription);
});

test("hides, restores, and edits a landmark", async ({ page }) => {
  await openApp(page);
  await openAccount(page, "landmarks");
  await importLandmarks(page);
  await openAccount(page, "landmarks");
  const landmark = landmarkRow(page, landmarkNames[0]);

  await chooseListAction(page, landmark, "Masquer de la carte");
  await expect(landmark).toHaveClass(/invisible/);
  await chooseListAction(page, landmark, "Afficher sur la carte");
  await expect(landmark).not.toHaveClass(/invisible/);

  await chooseListAction(page, landmark, "Modifier");
  await expect(page.locator("#landmarkWindow")).not.toHaveClass(/d-none/);
  await expect(page.locator("#landmark-title")).toHaveValue(landmarkNames[0]);
  await expect(page.locator("#landmark-description")).toHaveValue(landmarkDescription);
});

test("exports and deletes a landmark", async ({ page }) => {
  await openApp(page);
  await openAccount(page, "landmarks");
  await importLandmarks(page);
  await openAccount(page, "landmarks");
  const landmark = landmarkRow(page, landmarkNames[0]);

  const downloadPromise = page.waitForEvent("download");
  await landmark.scrollIntoViewIfNeeded();
  await openAdvancedMenu(page, landmark);
  await page.locator(".actionSheet-list-option").getByText("Exporter", { exact: true }).click();
  await chooseExportFormat(page);
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${landmarkNames[0]}.geojson`);

  const landmarkAfterExport = landmarkRow(page, landmarkNames[0]);
  await landmarkAfterExport.scrollIntoViewIfNeeded();
  await openAdvancedMenu(page, landmarkAfterExport);
  const deleteOption = page.locator(".actionSheet-list-option.confirm-needed");
  await deleteOption.click();
  await deleteOption.click();
  await expect(landmarkRow(page, landmarkNames[0])).toHaveCount(0);
});
