import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { configureAppTest, dismissStartupOverlay, waitForMapLoaded } from "../app-helpers";
import { encodeVectorTile } from "./mvt-fixtures";

const mapCenter = { longitude: 2.2945, latitude: 48.8584, zoom: 16 };
const planIgnStyle = readFileSync(resolve(process.cwd(), "www/data/plan-ign-interactif-style.json"), "utf8");

const featureCases = [
  {
    name: "Bâti",
    bdtopoLayer: "batiment",
    bdtopoType: 3,
    bdtopoProperties: {
      cleabs: "e2e-batiment",
      usage_1: "Résidentiel",
      nature: "Bâtiment résidentiel ou quelconque",
      nombre_d_etages: "2",
    },
    planLayer: "bati_surf",
    planType: 3,
    planProperties: { symbo: "BATI_QQUE" },
    legend: "Bâtiment résidentiel ou quelconque",
    data: "Nombre d'étages : 2",
  },
  {
    name: "Réseau routier",
    bdtopoLayer: "troncon_de_route",
    bdtopoType: 2,
    bdtopoProperties: {
      cleabs: "e2e-route",
      nature: "Route à 1 chaussée",
      cpx_numero: "D 42",
      cpx_toponyme_route_nommee: "Avenue E2E",
    },
    planLayer: "routier_route",
    planType: 2,
    planProperties: { symbo: "LOCALE_1" },
    legend: "Route locale",
    data: "Avenue E2E",
  },
  {
    name: "Éléments hydrographiques",
    bdtopoLayer: "cours_d_eau",
    bdtopoType: 2,
    bdtopoProperties: {
      cleabs: "e2e-cours-eau",
      toponyme: "Ruisseau E2E",
      nature: "Cours d'eau",
    },
    planLayer: "hydro_reseau_sup",
    planType: 2,
    planProperties: { symbo: "COURS_D_EAU_SUP" },
    legend: "Cours d'eau",
    data: "Ruisseau E2E",
  },
  {
    name: "Zones de végétation",
    bdtopoLayer: "zone_de_vegetation",
    bdtopoType: 3,
    bdtopoProperties: {
      cleabs: "e2e-vegetation",
      nature: "Bois",
    },
    planLayer: "ocs_vegetation_surf",
    planType: 3,
    planProperties: { symbo: "ZONE_BOISEE" },
    legend: "Bois, forêt fermée, peupleraie",
    data: "Bois",
  },
  {
    name: "Ponctuels",
    bdtopoLayer: "construction_ponctuelle",
    bdtopoType: 1,
    bdtopoProperties: {
      cleabs: "e2e-ponctuel",
      nature_detaillee: "Château d'eau",
      hauteur: "18",
    },
    planLayer: "bati_ponc",
    planType: 1,
    planProperties: { symbo: "CHATEAU_EAU_PONC" },
    legend: "Château d'eau",
    data: "Type : Château d'eau",
  },
];

async function openPlanInteractiveFeature(page, featureCase) {
  await configureAppTest(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const initialZoom = featureCase.zoom || mapCenter.zoom;
  await page.addInitScript((center) => {
    localStorage.setItem("lastMapLat", String(center.latitude));
    localStorage.setItem("lastMapLng", String(center.longitude));
    localStorage.setItem("lastMapZoom", String(center.zoom));
  }, { ...mapCenter, zoom: initialZoom });

  const tileResponses = { plan: 0, bdtopo: 0 };
  await page.route(/\/OSM\.POI\/\d+\/\d+\/\d+\.pbf/, async (route) => {
    await route.fulfill({
      contentType: "application/x-protobuf",
      body: Buffer.alloc(0),
    });
  });
  await page.route("https://ignf.github.io/cartes-ign-app/plan-ign-interactif-style.json", async (route) => {
    await route.fulfill({ contentType: "application/json", body: planIgnStyle });
  });
  await page.route(/\/(PLAN\.IGN|BDTOPO)\/(\d+)\/(\d+)\/(\d+)\.pbf/, async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/\/(PLAN\.IGN|BDTOPO)\/(\d+)\/(\d+)\/(\d+)\.pbf$/);
    const [, source, zoom, tileX, tileY] = match;
    tileResponses[source === "PLAN.IGN" ? "plan" : "bdtopo"]++;
    await route.fulfill({
      status: 200,
      contentType: "application/x-protobuf",
      headers: { "access-control-allow-origin": "*" },
      body: Buffer.from(encodeVectorTile({
        center: mapCenter,
        zoom: Number(zoom),
        tileX: Number(tileX),
        tileY: Number(tileY),
        layers: [
          {name: featureCase.planLayer, geometryType: featureCase.planType, properties: featureCase.planProperties},
          {name: featureCase.bdtopoLayer, geometryType: featureCase.bdtopoType, properties: featureCase.bdtopoProperties},
        ],
      })),
    });
  });
  await page.route("**/geocodage/reverse**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ type: "FeatureCollection", features: [] }),
    });
  });
  await page.route("**/altimetrie/**", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ elevations: [0] }) });
  });

  await page.goto("/");
  await dismissStartupOverlay(page);
  await waitForMapLoaded(page);
  await expect(page.locator("#interactivityBtn")).toBeVisible();
  await expect.poll(() => tileResponses.plan, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect.poll(() => tileResponses.bdtopo, { timeout: 15_000 }).toBeGreaterThan(0);

  await dismissStartupOverlay(page);
  await expect(page.locator("action-sheet")).toBeHidden();
  const canvas = page.locator("#map canvas");
  await expect(async () => {
    await canvas.click();
    await expect(page.locator("#positionWindow .divLegendDescription"))
      .toContainText(featureCase.legend, { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });

  await expect(page.locator("#positionWindow")).not.toHaveClass(/d-none/);
  await expect(page.locator("#positionWindow .positionHtmlBefore")).toContainText(featureCase.data);
  await expect(page.locator("#positionWindow")).toContainText("Source : BD Topo® - IGN");
}

for (const featureCase of featureCases) {
  test(`${featureCase.name} affiche sa légende et ses données BD Topo`, async ({ page }) => {
    await openPlanInteractiveFeature(page, featureCase);
  });
}
