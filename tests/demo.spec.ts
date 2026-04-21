import { test, expect } from "@playwright/test";

test.describe("Cascade1 Demo Readiness", () => {
  test("home page loads with header and trigger button", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Project Cascade");
    await expect(
      page.getByRole("button", { name: /Run a Simulation/i })
    ).toBeVisible();
  });

  test("scenario picker modal opens and lists 3 scenarios", async ({
    page,
  }) => {
    await page.goto("/");
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    const cards = dialog.locator("button").filter({ hasText: /County|Dam/i });
    await expect(cards).toHaveCount(3);
  });

  test("trigger API returns valid response for each scenario", async ({
    request,
  }) => {
    for (const id of [
      "tornado_buncombe_replay",
      "fire_shasta_redding",
      "dam_oroville_break",
    ]) {
      const res = await request.post("/api/trigger", {
        data: { scenario_id: id },
      });
      expect(res.ok()).toBeTruthy();
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.polygon).toBeDefined();
      expect(json.trigger_directive).toBeDefined();
      expect(json.warning_type).toBeDefined();
    }
  });

  test("query API returns synthetic discovery layers", async ({ request }) => {
    // Discovery layers (sidebar toggles) have local synthetic data
    const layers = [
      { id: "infra_pharmacies", scenario: "tornado" },
      { id: "cr_no_broadband", scenario: "tornado" },
      { id: "haz_stream_gauges", scenario: "tornado" },
    ];
    for (const { id, scenario } of layers) {
      const res = await request.post("/api/query", {
        data: { layer_id: id, scenario },
      });
      expect(res.ok()).toBeTruthy();
      const json = await res.json();
      expect(json.features).toBeDefined();
      expect(json.features.length).toBeGreaterThan(0);
      expect(json.source).toBe("synthetic");
    }
  });

  test("trigger fires and map container renders", async ({ page }) => {
    await page.goto("/");
    // Close default picker
    await page.locator('[role="dialog"]').getByText("Cancel").click();

    // Reopen and select tornado
    await page.getByRole("button", { name: /Run a Simulation/i }).click();
    await page
      .locator('[role="dialog"] button')
      .filter({ hasText: /Tornado/ })
      .click();

    // Emergency dashboard header should appear
    await expect(page.getByText("Cascade County")).toBeVisible({
      timeout: 10_000,
    });
    // Event badge
    await expect(page.getByText("Tornado Warning")).toBeVisible();
    // Conversation tab should be active (AI briefing)
    await expect(page.getByText("Conversation")).toBeVisible();
  });

  test("layers tab shows categories and layer toggles", async ({ page }) => {
    await page.goto("/");
    // Close picker
    await page.locator('[role="dialog"]').getByText("Cancel").click();

    // Switch to Layers tab
    await page.getByRole("button", { name: "Layers", exact: true }).click();

    // Should show layer categories
    await expect(page.getByText("Infrastructure")).toBeVisible();
    await expect(page.getByText("Community Resilience")).toBeVisible();
  });
});
