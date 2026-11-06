import { expect } from "@playwright/test";

export async function configureAppTest(page) {
  await page.addInitScript(() => {
    localStorage.setItem("hasBeenLaunched", "true");
    localStorage.setItem("lastOnboardId", "5");
    localStorage.setItem("dontShowOnboardAgain", "true");
    localStorage.setItem("dontShowEditoAgain", "true");
  });

  await page.route("**/cartes-ign-temp-layers/temp_layers_config.json", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/edito.json*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        message: "",
        force: false,
      }),
    });
  });

  await page.route("**/EVENTS**", async (route) => {
    await route.fulfill({
      status: 404,
      body: "Event tiles are not required in E2E",
    });
  });
}

export async function waitForMapLoaded(page) {
  await expect(page.locator(".maplibregl-ctrl-scale")).toBeAttached({ timeout: 30_000 });
}

export async function dismissStartupOverlay(page) {
  const actionSheet = page.locator("action-sheet");
  const onboardingConfirm = page.locator("#onBoardingConfirm");
  const onboardingUnderstood = page.getByText("J'ai compris").first();

  for (let attempt = 0; attempt < 5; attempt++) {
    if (await actionSheet.isVisible().catch(() => false)) {
      const dismissed = await page.evaluate(() => {
        const close = document.getElementById("sheetClose");
        const confirm = document.getElementById("onBoardingConfirm");
        const understood = Array.from(document.querySelectorAll("div"))
          .find((element) => element.textContent?.includes("J'ai compris"));
        const control = close || confirm || understood;
        control?.click();
        return Boolean(control);
      });
      if (!dismissed) {
        return;
      }
      await expect(actionSheet).toBeHidden();
      continue;
    }

    for (const locator of [onboardingConfirm, onboardingUnderstood]) {
      if (await locator.isVisible().catch(() => false)) {
        await locator.evaluate((element) => element.click());
        await expect(actionSheet).toBeHidden();
        return;
      }
    }
    return;
  }

  await expect(actionSheet).toBeHidden();
}

export async function openLayerManager(page) {
  const layerManagerBtn = page.locator("#layerManagerBtn");

  await expect(layerManagerBtn).toBeVisible();
  await expect(async () => {
    await dismissStartupOverlay(page);
    await layerManagerBtn.click({ force: true });
    await expect(layerManagerBtn).toHaveClass(/active/);
    await expect(page.locator("#baseLayersLabel")).toBeVisible();
  }).toPass({ timeout: 15_000 });

  if (await page.locator("action-sheet").isVisible().catch(() => false)) {
    await dismissStartupOverlay(page);
  }
}
