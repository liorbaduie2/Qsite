import { test, expect } from "@playwright/test";

/**
 * Regression: iOS Safari zooms focused inputs when font-size < 16px unless
 * viewport limits scale and/or inputs use ≥16px (see globals.css + layout viewport).
 */
test.describe("Mobile viewport and form font size", () => {
  test("viewport meta and login field font size", async ({ page }) => {
    await page.goto("/auth/login", { waitUntil: "networkidle" });

    const viewportContent = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewportContent).toBeTruthy();
    const v = viewportContent!.toLowerCase();
    expect(v).toContain("width=device-width");
    expect(v).toMatch(/maximum-scale\s*=\s*1/);
    expect(v).toMatch(/user-scalable\s*=\s*no/);

    const email = page.locator('input[type="email"]').first();
    await expect(email).toBeVisible();
    const px = await email.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).fontSize),
    );
    expect(px).toBeGreaterThanOrEqual(16);
  });
});
