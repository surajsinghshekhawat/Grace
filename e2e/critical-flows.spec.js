import { test, expect } from "@playwright/test";

/**
 * Uses Vite proxy (/api → backend). Start backend on 8000 and Vite on PLAYWRIGHT_PORT.
 * Cookies from page.request are shared with the browser context.
 */
test.describe("API-backed flows", () => {
  test("elder: session + assessment onboarding screen", async ({ page }) => {
    const health = await page.request.get("/health").catch(() => null);
    test.skip(!health || !health.ok(), "Start backend on 127.0.0.1:8000 (see docs/project/TEST_NOTES.md)");

    const email = `e2e_elder_${Date.now()}@test.local`;
    const reg = await page.request.post("/api/register", {
      json: {
        email_or_phone: email,
        password: "e2e-secret12",
        role: "elder",
        name: "E2E Elder",
      },
    });
    expect(reg.ok()).toBeTruthy();

    await page.goto("/elder/assessment/onboarding");
    await expect(page.getByText(/before you begin|शुरू करने से पहले|தொடங்குவதற்கு முன்/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("caregiver: register and reach home", async ({ page }) => {
    const health = await page.request.get("/health").catch(() => null);
    test.skip(!health || !health.ok(), "Start backend on 127.0.0.1:8000 (see docs/project/TEST_NOTES.md)");

    const email = `e2e_cg_${Date.now()}@test.local`;
    const reg = await page.request.post("/api/register", {
      json: {
        email_or_phone: email,
        password: "e2e-secret12",
        role: "caregiver",
        name: "E2E CG",
      },
    });
    expect(reg.ok()).toBeTruthy();

    await page.goto("/caregiver");
    await expect(page.getByText(/Your elders|आपके बुज़ुर्ग|உங்கள் மூத்தவர்கள்/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("elder: health tab shows medications section", async ({ page }) => {
    const health = await page.request.get("/health").catch(() => null);
    test.skip(!health || !health.ok(), "Start backend on 127.0.0.1:8000 (see docs/project/TEST_NOTES.md)");

    const email = `e2e_health_${Date.now()}@test.local`;
    const reg = await page.request.post("/api/register", {
      json: {
        email_or_phone: email,
        password: "e2e-secret12",
        role: "elder",
        name: "E2E Health",
      },
    });
    expect(reg.ok()).toBeTruthy();

    await page.goto("/elder/health");
    await expect(page.getByText(/^Health$|^स्वास्थ्य$|^நலம்$/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
