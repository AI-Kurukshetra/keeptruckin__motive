import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("authenticated dashboard journey", () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD are required");

  test("login and view dashboard modules", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(E2E_EMAIL!);
    await page.getByLabel("Password").fill(E2E_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("metric-card-drivers")).toBeVisible();

    await page.goto("/drivers");
    await expect(page.getByRole("heading", { name: "Drivers" })).toBeVisible();

    await page.goto("/vehicles");
    await expect(page.getByRole("heading", { name: "Vehicles" })).toBeVisible();

    await page.goto("/alerts");
    await expect(page.getByRole("heading", { name: "Alerts" })).toBeVisible();
  });
});
