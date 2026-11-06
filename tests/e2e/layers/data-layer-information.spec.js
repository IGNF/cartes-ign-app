import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, openLayerManager, waitForMapLoaded } from "../app-helpers";

const dataLayers = [
  {
    id: "LANDUSE.AGRICULTURE.LATEST$WMTS",
    title: "Registre parcellaire graphique",
    theme: "Agriculture",
    description: "Registre parcellaire graphique : zones de cultures",
    source: "Agence de services et de paiement (ASP)",
    legend: "LANDUSE.AGRICULTURE2023",
  },
  {
    id: "Aire-Parcellaire$WMTS",
    title: "Délimitation parcellaire AOC viticole",
    theme: "Agriculture",
    description: "Représentation des délimitations parcellaires des appellations d’origine contrôlée (AOC) viticoles",
    source: "Institut national de l’origine et de la qualité (INAO)",
  },
  {
    id: "POI.MONUMENTS_BDD_WLD_WM$WMS",
    title: "Monuments nationaux",
    theme: "Tourisme et loisirs",
    description: "Localisation des sites gérés par le Centre des monuments nationaux.",
    source: "Centre des monuments nationaux",
  },
  {
    id: "POI.MUSEUM$WMS",
    title: "Musées",
    theme: "Tourisme et loisirs",
    description: "Localisation des musées.",
    source: "IGN",
  },
  {
    id: "VILLAGESETAPE$WMS",
    title: "Villages étapes",
    theme: "Tourisme et loisirs",
    description: "Localisation des Villages étapes.",
    source: "Fédération française des villages étapes",
  },
  {
    id: "TRANSPORTS.DRONES.RESTRICTIONS$WMTS",
    title: "Restrictions UAS catégorie Ouverte et Aéromodélisme",
    theme: "Tourisme et loisirs",
    description: "Représentation des zones soumises à interdictions ou à restrictions",
    source: "Service de l’information aéronautique (SIA)",
  },
];

for (const dataLayer of dataLayers) {
  test(`${dataLayer.title} affiche ses informations et sa légende`, async ({ page }) => {
    await configureAppTest(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await dismissStartupOverlay(page);
    await waitForMapLoaded(page);
    await openLayerManager(page);

    await page.locator(`.thematicButton[data-name="${dataLayer.theme}"]`).click();
    const catalogueLayer = page.locator(`[id="${dataLayer.id}"]`);
    await expect(catalogueLayer).toBeVisible();
    await catalogueLayer.click();
    await expect(page.locator("#layer-switcher-number")).toHaveText("2");

    await page.locator("label[for=\"layer-switcher-tab\"]").click();
    const selectedLayer = page.locator("#lst-layer-switcher .tools-layer-panel")
      .filter({ hasText: dataLayer.title });
    await expect(selectedLayer).toBeVisible();
    await selectedLayer.locator(".tools-layer-advanced").click();
    await expect(page.locator(".actionSheet-list-option").first()).toBeVisible();
    await page.locator(".actionSheet-list-option").getByText("Informations", { exact: true }).click();

    const informationWindow = page.locator("#informationsWindow");
    await expect(informationWindow).not.toHaveClass(/d-none/);
    await expect(informationWindow.locator("#informationsText")).toContainText(dataLayer.description);
    await expect(informationWindow.locator("#informationsText")).toContainText(dataLayer.source);
    await expect(informationWindow.locator("#informationsImg"))
      .toHaveAttribute("src", new RegExp((dataLayer.legend || dataLayer.id.split("$")[0]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
}
