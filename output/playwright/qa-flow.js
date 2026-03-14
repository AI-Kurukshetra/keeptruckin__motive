const results = {
  steps: [],
  consoleErrors: [],
  failedRequests: [],
  uiIssues: [],
  notes: [],
};

const state = {
  registered: false,
  authenticated: false,
  companyOnboarded: false,
  driver: null,
  vehicle: null,
  trip: null,
};

function pushStep(name, status, details) {
  results.steps.push({ name, status, details });
}

async function runStep(name, fn) {
  try {
    const details = await fn();
    pushStep(name, 'passed', details || 'ok');
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    pushStep(name, 'failed', msg);
    results.uiIssues.push(`${name}: ${msg}`);
    return false;
  }
}

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    results.consoleErrors.push(msg.text());
  }
});
page.on('pageerror', (err) => {
  results.consoleErrors.push(`pageerror: ${err.message}`);
});
page.on('requestfailed', (req) => {
  results.failedRequests.push(`${req.method()} ${req.url()} => ${req.failure()?.errorText || 'failed'}`);
});
page.on('response', (res) => {
  if (res.status() >= 400) {
    results.failedRequests.push(`${res.request().method()} ${res.url()} => HTTP ${res.status()}`);
  }
});

const unique = Date.now();
const regEmail = `qa_${unique}@example.com`;
const regPassword = 'Password123!';
const driverFirst = `QAFirst${String(unique).slice(-4)}`;
const driverLast = 'Tester';
const driverLicense = `LIC-${String(unique).slice(-6)}`;
const vehicleUnit = `UNIT-${String(unique).slice(-5)}`;
const vehicleVin = `VIN${String(unique).slice(-14).padEnd(14, '7')}`;
const tripOrigin = `Origin-${String(unique).slice(-4)}`;
const tripDestination = `Dest-${String(unique).slice(-4)}`;

await runStep('1. Register new user', async () => {
  await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
  await page.locator('input[name="email"]').fill(regEmail);
  await page.locator('input[name="password"]').fill(regPassword);
  await page.locator('input[name="confirmPassword"]').fill(regPassword);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('button[type="submit"]').click(),
  ]);

  const url = page.url();
  if (url.includes('/login?message=account_created')) {
    state.registered = true;
    return `registered: ${regEmail}`;
  }

  const errorText = (await page.locator('p.text-destructive').first().textContent().catch(() => null)) || 'unknown registration failure';
  results.notes.push(`Registration failed for ${regEmail}: ${errorText}`);
  throw new Error(`registration did not complete (${url}) - ${errorText}`);
});

await runStep('2. Login with new user and complete company onboarding', async () => {
  if (!state.registered) {
    throw new Error('skipped: registration failed');
  }

  if (!page.url().includes('/login')) {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  }

  await page.locator('input[name="email"]').fill(regEmail);
  await page.locator('input[name="password"]').fill(regPassword);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('button[type="submit"]').click(),
  ]);

  if (!page.url().includes('/dashboard')) {
    throw new Error(`login failed, landed on ${page.url()}`);
  }
  state.authenticated = true;

  const createCompanyTitle = page.locator('text=Create Company').first();
  if ((await createCompanyTitle.count()) > 0) {
    await page.locator('input[name="name"]').fill(`QA Fleet ${String(unique).slice(-5)}`);
    await page.locator('input[name="dotNumber"]').fill(`DOT${String(unique).slice(-6)}`);
    await page.locator('input[name="fleetSize"]').fill('5');

    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.locator('form[action]').first().locator('button[type="submit"]').click(),
    ]);
  }

  state.companyOnboarded = true;
  return 'authenticated and company onboarding attempted';
});

await runStep('3. Verify dashboard metrics, charts, and activity feed', async () => {
  if (!state.authenticated) throw new Error('skipped: not authenticated');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

  await page.getByText('Fleet Health Score').first().waitFor({ timeout: 10000 });
  await page.getByText('Recent Activity').first().waitFor({ timeout: 10000 });
  await page.getByText('Quick Actions').first().waitFor({ timeout: 10000 });
  const chartCount = await page.locator('svg.recharts-surface').count();
  if (chartCount < 3) throw new Error(`expected >=3 charts, found ${chartCount}`);
  return `charts=${chartCount}`;
});

await runStep('4. Test command palette navigation (Ctrl/Cmd + K)', async () => {
  if (!state.authenticated) throw new Error('skipped: not authenticated');
  await page.keyboard.press('ControlOrMeta+K');
  await page.locator('[cmdk-root]').waitFor({ timeout: 5000 });
  await page.getByText('Vehicles').first().click();
  await page.waitForLoadState('networkidle');
  if (!page.url().includes('/vehicles')) throw new Error(`did not navigate to vehicles (${page.url()})`);
  return 'opened palette and navigated to Vehicles';
});

await runStep('5. Add a driver', async () => {
  if (!state.authenticated) throw new Error('skipped: not authenticated');
  await page.goto('http://localhost:3000/drivers', { waitUntil: 'networkidle' });
  await page.locator('input[name="firstName"]').fill(driverFirst);
  await page.locator('input[name="lastName"]').fill(driverLast);
  await page.locator('input[name="licenseNumber"]').fill(driverLicense);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('button:has-text("Add Driver")').click(),
  ]);
  await page.getByText(driverLicense).first().waitFor({ timeout: 10000 });
  state.driver = `${driverFirst} ${driverLast}`;
  return `created driver ${state.driver}`;
});

await runStep('6. Add a vehicle', async () => {
  if (!state.authenticated) throw new Error('skipped: not authenticated');
  await page.goto('http://localhost:3000/vehicles', { waitUntil: 'networkidle' });
  await page.locator('input[name="vin"]').fill(vehicleVin);
  await page.locator('input[name="unitNumber"]').fill(vehicleUnit);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('button:has-text("Add Vehicle")').click(),
  ]);
  await page.getByText(vehicleUnit).first().waitFor({ timeout: 10000 });
  state.vehicle = vehicleUnit;
  return `created vehicle ${vehicleUnit}`;
});

await runStep('7. Create a trip', async () => {
  if (!state.authenticated) throw new Error('skipped: not authenticated');
  await page.goto('http://localhost:3000/trips', { waitUntil: 'networkidle' });

  const driverSelect = page.locator('select[name="driverId"]');
  const vehicleSelect = page.locator('select[name="vehicleId"]');

  const driverOptions = await driverSelect.locator('option').count();
  const vehicleOptions = await vehicleSelect.locator('option').count();
  if (driverOptions < 2 || vehicleOptions < 2) {
    throw new Error(`insufficient dropdown options: drivers=${driverOptions}, vehicles=${vehicleOptions}`);
  }

  const driverValue = await driverSelect.locator('option').nth(1).getAttribute('value');
  const vehicleValue = await vehicleSelect.locator('option').nth(1).getAttribute('value');
  if (!driverValue || !vehicleValue) throw new Error('missing selected option values');

  await driverSelect.selectOption(driverValue);
  await vehicleSelect.selectOption(vehicleValue);
  await page.locator('input[name="origin"]').fill(tripOrigin);
  await page.locator('input[name="destination"]').fill(tripDestination);

  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('button:has-text("Create Trip")').click(),
  ]);

  await page.getByText(tripOrigin).first().waitFor({ timeout: 10000 });
  state.trip = `${tripOrigin} -> ${tripDestination}`;
  return `created trip ${state.trip}`;
});

await runStep('8. Verify alerts page loads and status badges render', async () => {
  if (!state.authenticated) throw new Error('skipped: not authenticated');
  await page.goto('http://localhost:3000/alerts', { waitUntil: 'networkidle' });

  await page.getByText('Alerts').first().waitFor({ timeout: 10000 });

  const badgeCountBefore = await page.locator('[data-slot="badge"]').count();
  if (badgeCountBefore === 0) {
    await page.locator('input[name="title"]').fill(`QA Alert ${String(unique).slice(-4)}`);
    await page.locator('input[name="alertType"]').fill('qa');
    await page.locator('select[name="severity"]').selectOption('high');
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.locator('button:has-text("Create Alert")').click(),
    ]);
  }

  const badgeCount = await page.locator('[data-slot="badge"]').count();
  if (badgeCount === 0) throw new Error('no status/severity badges rendered on alerts page');
  return `badgeCount=${badgeCount}`;
});

await runStep('9. Test dark mode toggle', async () => {
  if (!state.authenticated) throw new Error('skipped: not authenticated');
  const toggle = page.locator('button[aria-label="Toggle theme"]');
  await toggle.waitFor({ timeout: 5000 });

  const beforeDark = await page.locator('html.dark').count();
  await toggle.click();
  await page.waitForTimeout(200);
  const afterDark = await page.locator('html.dark').count();

  if (beforeDark === afterDark) {
    throw new Error('theme class did not change after toggle');
  }

  return `theme changed (${beforeDark} -> ${afterDark})`;
});

await runStep('10. Test global search filtering (drivers/vehicles/trips)', async () => {
  if (!state.authenticated) throw new Error('skipped: not authenticated');

  async function runScoped(scope, path, queryText, expectedText) {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });

    const scopeSelect = page.locator('select[aria-label="Search scope"]');
    if ((await scopeSelect.count()) > 0) {
      await scopeSelect.selectOption(scope);
    }

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill(queryText);
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    if (!page.url().includes(`search=${encodeURIComponent(queryText)}`)) {
      throw new Error(`missing search query in URL for ${scope}: ${page.url()}`);
    }

    await page.getByText(expectedText).first().waitFor({ timeout: 10000 });
  }

  await runScoped('drivers', '/drivers', driverFirst, driverLicense);
  await runScoped('vehicles', '/vehicles', vehicleUnit, vehicleUnit);
  await runScoped('trips', '/trips', tripOrigin, tripOrigin);

  return 'search filtering verified across drivers/vehicles/trips';
});

await page.screenshot({ path: 'output/playwright/qa-final-dashboard.png', fullPage: true });

return {
  ...results,
  summary: {
    passed: results.steps.filter((s) => s.status === "passed").length,
    failed: results.steps.filter((s) => s.status === "failed").length,
    authenticated: state.authenticated,
    registered: state.registered,
  },
};
