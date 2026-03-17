import { test, expect } from "@playwright/test";

test.describe("Storefront smoke", () => {
  test("home page loads and shows storefront nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=PLAYGROUND.AU").first()).toBeVisible();
    await expect(page.locator("a[href='/']").first()).toContainText("Storefront");
    await expect(page.locator("a[href='/quote']").first()).toContainText("Instant quote");
  });

  test("quote page loads", async ({ page }) => {
    await page.goto("/quote");
    await expect(page).toHaveURL(/\/quote/);
    await expect(page.locator("text=Instant quote").or(page.locator("h1")).first()).toBeVisible();
  });

  test("cart page loads", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/cart/);
  });
});
