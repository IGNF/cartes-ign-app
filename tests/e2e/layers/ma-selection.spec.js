import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, openLayerManager, waitForMapLoaded } from "../app-helpers";

const selectedLayersCount = "#layer-switcher-number";

async function openMySelection(page) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await openLayerManager(page);
  await expect(page.locator(selectedLayersCount)).toHaveText("1");
  await page.locator("label[for=\"layer-switcher-tab\"]").click();
  await expect(page.locator("#lst-layer-switcher .tools-layer-panel")).toHaveCount(1);
}

async function addAerialBasemap(page) {
  await page.locator("label[for=\"layer-thematics-tab\"]").click();
  const aerialBasemap = page.locator("[id=\"ORTHOIMAGERY.ORTHOPHOTOS$WMTS\"]");
  await aerialBasemap.click();
  await expect(page.locator(selectedLayersCount)).toHaveText("2");
  await page.locator("label[for=\"layer-switcher-tab\"]").click();
  await expect(page.locator("#lst-layer-switcher .tools-layer-panel")).toHaveCount(2);
}

function layerRow(page, title) {
  return page.locator("#lst-layer-switcher .tools-layer-panel").filter({ hasText: title });
}

async function openLayerActions(page, row) {
  await row.locator(".tools-layer-advanced").click();
  await expect(page.locator(".actionSheet-list-option").first()).toBeVisible();
}

async function chooseLayerAction(page, actionName) {
  await page.locator(".actionSheet-list-option").getByText(actionName, { exact: true }).click();
}

test("changes the order of selected layers", async ({ page }) => {
  await openMySelection(page);
  await addAerialBasemap(page);

  const rows = page.locator("#lst-layer-switcher .tools-layer-panel");
  const titles = rows.locator("span[id^=\"title_ID_\"]");
  const beforeOrder = await titles.allTextContents();
  const secondHandle = rows.nth(1).locator(".handle-draggable-layer");
  const firstRow = rows.nth(0);
  const sourceBox = await secondHandle.boundingBox();
  const targetBox = await firstRow.boundingBox();

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 1, sourceBox.y + sourceBox.height / 2 + 1);
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 10, { steps: 10 });
  await page.mouse.up();

  await expect.poll(() => titles.allTextContents()).not.toEqual(beforeOrder);
});

test("changes the opacity of a selected layer", async ({ page }) => {
  await openMySelection(page);

  const planLayer = layerRow(page, "Plan IGN");
  const opacity = planLayer.locator("input[type=\"range\"]");

  await expect(opacity).toHaveValue("100");
  await opacity.focus();
  await opacity.press("ArrowLeft");

  await expect(opacity).toHaveValue("99");
  await expect(opacity).toHaveCSS("--value", "99");
});

test("toggles a selected layer between color and black and white", async ({ page }) => {
  await openMySelection(page);
  const planLayer = layerRow(page, "Plan IGN");

  await openLayerActions(page, planLayer);
  await expect(page.locator(".actionSheet-list-option")).toContainText(["Afficher en noir et blanc", "Masquer", "Informations", "Retirer de ma sélection"]);
  await chooseLayerAction(page, "Afficher en noir et blanc");

  await openLayerActions(page, planLayer);
  await expect(page.locator(".actionSheet-list-option").filter({ hasText: "Afficher en couleur" })).toBeVisible();
});

test("hides and restores a selected layer", async ({ page }) => {
  await openMySelection(page);
  const planLayer = layerRow(page, "Plan IGN");

  await openLayerActions(page, planLayer);
  await chooseLayerAction(page, "Masquer");
  await expect(planLayer).toHaveClass(/invisible/);

  await openLayerActions(page, planLayer);
  await chooseLayerAction(page, "Afficher");
  await expect(planLayer).not.toHaveClass(/invisible/);
});

test("shows layer information", async ({ page }) => {
  await openMySelection(page);
  await openLayerActions(page, layerRow(page, "Plan IGN"));
  await chooseLayerAction(page, "Informations");

  await expect(page.locator("#informationsWindow")).not.toHaveClass(/d-none/);
  await expect(page.locator("#informationsText")).not.toBeEmpty();
});

test("removes a layer from the selection", async ({ page }) => {
  await openMySelection(page);
  await addAerialBasemap(page);

  const aerialLayer = layerRow(page, "Photographies aériennes");
  await openLayerActions(page, aerialLayer);
  await chooseLayerAction(page, "Retirer de ma sélection");

  await expect(page.locator(selectedLayersCount)).toHaveText("1");
  await expect(aerialLayer).toHaveCount(0);

  await page.locator("label[for=\"layer-thematics-tab\"]").click();
  await expect(page.locator("[id=\"ORTHOIMAGERY.ORTHOPHOTOS$WMTS\"]")).not.toHaveClass(/selectedLayer/);
});