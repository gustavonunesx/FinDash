import { test, expect } from "@playwright/test";

test.describe("FinDash", () => {
  test("landing page loads with hero and FAQ", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /decisões claras/i })).toBeVisible();
    await expect(page.getByText("Perguntas frequentes")).toBeVisible();
    await expect(page.getByRole("link", { name: /criar conta/i }).first()).toBeVisible();
  });

  test("demo dashboard loads metrics", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Suas métricas")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Score 50/30/20")).toBeVisible();
  });
});
