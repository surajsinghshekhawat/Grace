import { test, expect } from "@playwright/test";

test("welcome page loads", async ({ page }) => {
  // Vite dev + HMR: `load` can be slow or never settle; DOM is enough for smoke.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Grace", exact: true })).toBeVisible({ timeout: 60_000 });
});
