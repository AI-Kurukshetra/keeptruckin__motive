import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("safe delete behavior for drivers and vehicles", () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD are required");

  test("blocks deletion for referenced entities and allows deletion for unreferenced ones", async ({ page }) => {
    const runId = Date.now().toString();

    const refFirstName = `Ref${runId}`;
    const refLastName = "Driver";
    const refLicense = `REF-${runId}`;
    const freeFirstName = `Free${runId}`;
    const freeLastName = "Driver";
    const freeLicense = `FREE-${runId}`;

    const refVin = `VINREF${runId}`;
    const refUnit = `UNIT-REF-${runId}`;
    const freeVin = `VINFREE${runId}`;
    const freeUnit = `UNIT-FREE-${runId}`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(E2E_EMAIL!);
    await page.getByLabel("Password").fill(E2E_PASSWORD!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/drivers");
    await page.getByTestId("driver-first-name").fill(refFirstName);
    await page.getByTestId("driver-last-name").fill(refLastName);
    await page.getByTestId("driver-license").fill(refLicense);
    await page.getByTestId("add-driver-button").click();

    await page.getByTestId("driver-first-name").fill(freeFirstName);
    await page.getByTestId("driver-last-name").fill(freeLastName);
    await page.getByTestId("driver-license").fill(freeLicense);
    await page.getByTestId("add-driver-button").click();

    await expect(page.getByText(refLicense)).toBeVisible();
    await expect(page.getByText(freeLicense)).toBeVisible();

    await page.goto("/vehicles");
    await page.getByTestId("vehicle-vin").fill(refVin);
    await page.getByTestId("vehicle-unit-number").fill(refUnit);
    await page.getByTestId("add-vehicle-button").click();

    await page.getByTestId("vehicle-vin").fill(freeVin);
    await page.getByTestId("vehicle-unit-number").fill(freeUnit);
    await page.getByTestId("add-vehicle-button").click();

    await expect(page.getByText(refUnit)).toBeVisible();
    await expect(page.getByText(freeUnit)).toBeVisible();

    await page.goto("/trips");
    await page.getByTestId("trip-driver-select").selectOption({ label: `${refFirstName} ${refLastName}` });
    await page.getByTestId("trip-vehicle-select").selectOption({ label: refUnit });
    await page.getByTestId("trip-origin").fill(`Origin-${runId}`);
    await page.getByTestId("trip-destination").fill(`Destination-${runId}`);
    await page.getByTestId("create-trip-button").click();

    await page.goto("/drivers");
    const referencedDriverRow = page.locator("tr", { hasText: refLicense });
    await referencedDriverRow.getByRole("button", { name: /delete/i }).click();
    await page.getByTestId("confirm-delete-driver-button").click();

    await expect(
      page.getByText("Driver cannot be deleted because it is assigned to existing trips. Deactivate the driver instead.")
    ).toBeVisible();

    await page.getByTestId("deactivate-driver-button").click();
    await expect(page.getByText("Driver deactivated.")).toBeVisible();
    await expect(page.locator("tr", { hasText: `${refLicense} inactive` })).toBeVisible();

    const freeDriverRow = page.locator("tr", { hasText: freeLicense });
    await freeDriverRow.getByRole("button", { name: /delete/i }).click();
    await page.getByTestId("confirm-delete-driver-button").click();
    await expect(page.getByText("Driver deleted.")).toBeVisible();
    await expect(page.getByText(freeLicense)).toHaveCount(0);

    await page.goto("/vehicles");
    const referencedVehicleRow = page.locator("tr", { hasText: refUnit });
    await referencedVehicleRow.getByRole("button", { name: /delete/i }).click();
    await page.getByTestId("confirm-delete-vehicle-button").click();

    await expect(
      page.getByText("Vehicle cannot be deleted because it is assigned to existing trips. Deactivate the vehicle instead.")
    ).toBeVisible();

    await page.getByTestId("deactivate-vehicle-button").click();
    await expect(page.getByText("Vehicle deactivated.")).toBeVisible();

    const freeVehicleRow = page.locator("tr", { hasText: freeUnit });
    await freeVehicleRow.getByRole("button", { name: /delete/i }).click();
    await page.getByTestId("confirm-delete-vehicle-button").click();
    await expect(page.getByText("Vehicle deleted.")).toBeVisible();
    await expect(page.getByText(freeUnit)).toHaveCount(0);
  });
});
