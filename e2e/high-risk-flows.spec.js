import { test, expect } from "@playwright/test";

const sampleAnswers = {
  sleep_quality: 3,
  stress_anxiety: 2,
  lonely_around_others: 2,
  social_satisfaction: 3,
  exercise_frequency: 3,
  mood: 3,
  energy: 3,
};

test.describe("High-risk health flows", () => {
  test("elder: submit assessment via API then dashboard shows insights", async ({ page }) => {
    const health = await page.request.get("/health").catch(() => null);
    test.skip(!health || !health.ok(), "Start backend on 127.0.0.1:8000");

    const email = `e2e_asmt_${Date.now()}@test.local`;
    const reg = await page.request.post("/api/register", {
      json: {
        email_or_phone: email,
        password: "e2e-secret12",
        role: "elder",
        name: "E2E Assessment",
      },
    });
    expect(reg.ok()).toBeTruthy();

    const asmt = await page.request.post("/api/elder/assessments", {
      json: {
        answers: sampleAnswers,
        survey_meta: { mode: "weekly", questions_in_flow: Object.keys(sampleAnswers).length },
      },
    });
    if (asmt.status() === 503) {
      test.skip(true, "ElderSense models not loaded (503)");
    }
    expect(asmt.ok(), await asmt.text()).toBeTruthy();
    const body = await asmt.json();
    expect(body).toHaveProperty("depression_probability");
    expect(body).toHaveProperty("qol_score_0_100");

    await page.goto("/elder");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("E2E Assessment", { timeout: 20_000 });
  });

  test("elder: add medication and mark taken from Health", async ({ page }) => {
    const health = await page.request.get("/health").catch(() => null);
    test.skip(!health || !health.ok(), "Start backend on 127.0.0.1:8000");

    const email = `e2e_med_${Date.now()}@test.local`;
    const reg = await page.request.post("/api/register", {
      json: {
        email_or_phone: email,
        password: "e2e-secret12",
        role: "elder",
        name: "E2E Meds",
      },
    });
    expect(reg.ok()).toBeTruthy();

    const medRes = await page.request.post("/api/elder/medications", {
      json: { name: "E2E Test Med", dosage: "1", schedule_time: "morning" },
    });
    expect(medRes.ok(), await medRes.text()).toBeTruthy();

    await page.goto("/elder/health");
    await expect(page.getByText(/^Health$|^स्वास्थ्य$|^நலம்$/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("E2E Test Med")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /mark taken|लिया चिह्नित|எடுத்தேன்/i }).first().click();
    await expect(page.getByText(/Logged today|लॉग किया|இன்று.*பதிவு/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
