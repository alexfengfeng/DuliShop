import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";

test.describe("MVP storefront purchase flow", () => {
  test.beforeAll(() => {
    execFileSync("pnpm", ["demo:reset"], { stdio: "inherit" });
  });

  test("creates a paid mock order and links back to admin orders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Calm goods for everyday rituals" })).toBeVisible();
    await expect(page.locator('img[src="/generated/theme/hero.svg"]')).toBeVisible();
    await page.getByRole("link", { name: /Linen Utility Tote/ }).click();

    await expect(page.locator('img[src="/generated/products/linen-utility-tote.svg"]')).toBeVisible();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole("heading", { name: "Cart" })).toBeVisible();

    await page.getByRole("link", { name: "Checkout" }).click();
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Place demo order|Pay with Stripe/ })).toBeVisible();
    await page.getByLabel("Name").fill("Playwright Buyer");
    await page.getByLabel("Email").fill(`playwright-${Date.now()}@example.test`);
    await page.getByRole("button", { name: /Place demo order|Pay with Stripe/ }).click();

    await expect(page).toHaveURL(/\/order-success\/SF\d+/);
    await expect(page.getByRole("heading", { name: "Order confirmed" })).toBeVisible();
    const adminLink = page.getByRole("link", { name: "View in admin" });
    await expect(adminLink).toHaveAttribute("href", /\/admin\/orders\?query=SF\d+/);
  });
});
