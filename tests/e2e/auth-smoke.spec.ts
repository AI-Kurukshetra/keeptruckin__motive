import { expect, test } from "@playwright/test";

test("redirects unauthenticated dashboard access to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("shows auth pages", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
});
