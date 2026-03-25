import { test, expect } from "@playwright/test";

test("loads game and completes one word selection", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Word" })).toBeVisible();

  const firstRow = page.locator(".tile").filter({ hasText: /[A-Z]/ }).nth(0);
  await firstRow.dispatchEvent("pointerdown");
  await page.locator("#tile-0-1").dispatchEvent("pointerenter");
  await page.locator("#tile-0-2").dispatchEvent("pointerenter");
  await page.dispatchEvent("body", "pointerup");

  await expect(page.locator("#status")).toContainText("Great");
});
