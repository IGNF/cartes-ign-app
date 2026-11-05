import { expect, test } from "@playwright/test";

async function dismissStartupOverlay(page) {
  const actionSheet = page.locator("action-sheet");
  const sheetClose = page.locator("#sheetClose");
  const onboardingConfirm = page.locator("#onBoardingConfirm");
  const onboardingUnderstood = page.getByText("J'ai compris").first();

  if (await actionSheet.isVisible().catch(() => false)) {
    if (await sheetClose.isVisible().catch(() => false)) {
      await sheetClose.click({ force: true });
    } else {
      // Fallback for rare viewport edge cases in CI.
      await page.evaluate(() => {
        const confirm = document.getElementById("onBoardingConfirm");
        if (confirm) {
          confirm.click();
          return;
        }
        const understood = Array.from(document.querySelectorAll("div"))
          .find((el) => el.textContent && el.textContent.includes("J'ai compris"));
        if (understood) {
          understood.click();
        }
      });
    }
    return;
  }

  for (const locator of [onboardingConfirm, onboardingUnderstood]) {
    if (await locator.isVisible().catch(() => false)) {
      await locator.click({ force: true });
      break;
    }
  }
}

async function openLayerManager(page) {
  const layerManagerBtn = page.locator("#layerManagerBtn");

  await expect(layerManagerBtn).toBeVisible();
  await expect(async () => {
    await dismissStartupOverlay(page);
    await layerManagerBtn.click({ force: true });
    await expect(layerManagerBtn).toHaveClass(/active/);
    await expect(page.locator("#layerManagerWindow")).not.toHaveClass(/d-none/);
  }).toPass({ timeout: 15_000 });

  // Ensure overlays are not left open after the transition.
  if (await page.locator("action-sheet").isVisible().catch(() => false)) {
    await dismissStartupOverlay(page);
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("hasBeenLaunched", "true");
    localStorage.setItem("lastOnboardId", "4");
    localStorage.setItem("dontShowOnboardAgain", "true");
    localStorage.setItem("dontShowEditoAgain", "true");
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
});

test("loads the main map shell", async ({ page }) => {
  await page.goto("/");
  await dismissStartupOverlay(page);

  await expect(page.locator("#map")).toBeVisible();
  await expect(page.locator("#lieuRech")).toBeVisible();
  await expect(page.locator("#layerManagerBtn")).toBeVisible();
});

test("opens the layer manager", async ({ page }) => {
  await page.goto("/");
  await dismissStartupOverlay(page);

  await openLayerManager(page);
  await expect(page.locator("#layerManagerBtn")).toHaveClass(/active/);
});