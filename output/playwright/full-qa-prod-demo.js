const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.env.QA_BASE_URL || 'https://keeptruckin-motive.vercel.app';
const LOGIN_EMAIL = process.env.QA_E2E_EMAIL || 'owner.atlas@example.com';
const LOGIN_PASSWORD = process.env.QA_E2E_PASSWORD || 'Password123!';

const outDir = path.join(process.cwd(), 'output');
const shotDir = path.join(outDir, 'qa-screenshots');
const reportPath = path.join(outDir, 'qa-report.json');
fs.mkdirSync(shotDir, { recursive: true });

const report = {
  startedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  credentialsUsed: { email: LOGIN_EMAIL },
  summary: { passed: 0, failed: 0 },
  passedTests: [],
  failedTests: [],
  consoleErrors: [],
  networkErrors: [],
  screenshots: [],
  recommendedFixes: [],
};

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function saveShot(page, name) {
  const file = path.join(shotDir, `${Date.now()}-${slug(name)}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  report.screenshots.push(file);
}

async function runStep(page, name, fn) {
  try {
    const details = await fn();
    report.summary.passed += 1;
    report.passedTests.push({ name, details: details || 'ok' });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    report.summary.failed += 1;
    report.failedTests.push({ name, details });
    await saveShot(page, name);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') report.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => report.consoleErrors.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    report.networkErrors.push(`${req.method()} ${req.url()} => ${req.failure()?.errorText || 'request failed'}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      report.networkErrors.push(`${res.request().method()} ${res.url()} => HTTP ${res.status()}`);
    }
  });

  await runStep(page, 'Authentication: login page renders', async () => {
    const res = await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    if (!res || res.status() >= 500) throw new Error(`login page unavailable (${res ? res.status() : 'no response'})`);
    await page.getByTestId('login-email').waitFor({ timeout: 15000 });
    await page.getByTestId('login-password').waitFor({ timeout: 15000 });
    return `status ${res.status()}`;
  });

  await runStep(page, 'Authentication: register page renders', async () => {
    const res = await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    if (!res || res.status() >= 500) throw new Error(`register page unavailable (${res ? res.status() : 'no response'})`);
    await page.getByTestId('register-email').waitFor({ timeout: 15000 });
    return `status ${res.status()}`;
  });

  await runStep(page, 'Authentication: login with seeded owner', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.getByTestId('login-email').fill(LOGIN_EMAIL);
    await page.getByTestId('login-password').fill(LOGIN_PASSWORD);
    await page.getByTestId('login-submit').click();
    await page.waitForURL((url) => url.pathname.includes('/dashboard') || url.pathname.includes('/login'), { timeout: 20000 });
    await page.waitForTimeout(1000);

    if (!new URL(page.url()).pathname.startsWith('/dashboard')) {
      const errText = await page.locator('p.text-destructive').first().textContent().catch(() => null);
      throw new Error(`expected redirect to /dashboard, got ${page.url()}${errText ? ' | ' + errText : ''}`);
    }

    return 'redirected to dashboard';
  });

  await runStep(page, 'Dashboard loading: metrics, charts, activity feed', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.getByTestId('metric-card-drivers').waitFor({ timeout: 15000 });
    await page.getByTestId('metric-card-vehicles').waitFor({ timeout: 15000 });
    await page.getByTestId('metric-card-active-trips').waitFor({ timeout: 15000 });
    await page.getByTestId('metric-card-open-alerts').waitFor({ timeout: 15000 });
    const charts = await page.locator('svg.recharts-surface').count();
    if (charts < 3) throw new Error(`expected >=3 charts, got ${charts}`);
    return `charts=${charts}`;
  });

  await runStep(page, 'Navigation: command palette (Cmd/Ctrl+K)', async () => {
    await page.getByTestId('command-palette-trigger').click();
    await page.getByRole('combobox').fill('Vehicles');
    await page.keyboard.press('Enter');
    await page.waitForURL((url) => url.pathname.includes('/vehicles') || url.pathname.includes('/dashboard'), { timeout: 10000 });
    if (!new URL(page.url()).pathname.startsWith('/vehicles')) {
      throw new Error(`expected /vehicles, got ${page.url()}`);
    }
    return 'command navigation to vehicles OK';
  });

  await runStep(page, 'Drivers list page works', async () => {
    await page.goto(`${BASE_URL}/drivers`, { waitUntil: 'networkidle' });
    await page.getByTestId('driver-first-name').waitFor({ timeout: 15000 });
    await page.getByText('TX-AF-30111').first().waitFor({ timeout: 15000 });
    return 'seeded driver visible';
  });

  await runStep(page, 'Vehicles list page works', async () => {
    await page.goto(`${BASE_URL}/vehicles`, { waitUntil: 'networkidle' });
    await page.getByTestId('vehicle-vin').waitFor({ timeout: 15000 });
    await page.getByText('101').first().waitFor({ timeout: 15000 });
    return 'seeded vehicle visible';
  });

  await runStep(page, 'Trips list page works', async () => {
    await page.goto(`${BASE_URL}/trips`, { waitUntil: 'networkidle' });
    await page.getByTestId('trip-driver-select').waitFor({ timeout: 15000 });
    await page.getByTestId('trip-vehicle-select').waitFor({ timeout: 15000 });
    const driverOpts = await page.getByTestId('trip-driver-select').locator('option').count();
    const vehicleOpts = await page.getByTestId('trip-vehicle-select').locator('option').count();
    if (driverOpts < 2 || vehicleOpts < 2) throw new Error(`dropdowns incomplete d=${driverOpts} v=${vehicleOpts}`);
    await page.getByText('Dallas').first().waitFor({ timeout: 15000 });
    return `dropdowns d=${driverOpts} v=${vehicleOpts}`;
  });

  await runStep(page, 'Alerts page renders table and badges', async () => {
    await page.goto(`${BASE_URL}/alerts`, { waitUntil: 'networkidle' });
    await page.getByTestId('alerts-table').waitFor({ timeout: 15000 });
    const badges = await page.locator('[data-slot="badge"]').count();
    if (badges < 1) throw new Error('no badges found');
    return `badges=${badges}`;
  });

  await runStep(page, 'Dark mode toggle works', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    const toggle = page.getByTestId('dark-mode-toggle');
    await toggle.waitFor({ timeout: 15000 });
    const before = await page.locator('html.dark').count();
    await toggle.click();
    await page.waitForTimeout(300);
    const after = await page.locator('html.dark').count();
    if (before === after) throw new Error('theme did not toggle');
    return `${before}->${after}`;
  });

  await runStep(page, 'Global search filtering works', async () => {
    const run = async (pathname, scope, query, expected) => {
      await page.goto(`${BASE_URL}${pathname}`, { waitUntil: 'networkidle' });
      await page.getByTestId('global-search-input').waitFor({ timeout: 15000 });
      await page.getByTestId('global-search-scope').selectOption(scope);
      const input = page.getByTestId('global-search-input');
      await input.fill(query);
      await input.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.getByText(expected).first().waitFor({ timeout: 15000 });
    };

    await run('/drivers', 'drivers', 'John', 'TX-AF-30111');
    await run('/vehicles', 'vehicles', '101', '101');
    await run('/trips', 'trips', 'Dallas', 'Dallas');
    return 'search OK';
  });

  await runStep(page, 'Navigation links render and route', async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.locator('aside a[href="/drivers"]').first().click();
    await page.waitForURL((url) => url.pathname.includes('/drivers') || url.pathname.includes('/dashboard'), { timeout: 10000 });
    if (!new URL(page.url()).pathname.startsWith('/drivers')) throw new Error('drivers nav failed');
    await page.locator('aside a[href="/alerts"]').first().click();
    await page.waitForURL((url) => url.pathname.includes('/alerts') || url.pathname.includes('/drivers'), { timeout: 10000 });
    if (!new URL(page.url()).pathname.startsWith('/alerts')) throw new Error('alerts nav failed');
    return 'sidebar routes OK';
  });

  await saveShot(page, 'final-state');
  await browser.close();

  if (report.failedTests.length === 0) {
    report.recommendedFixes.push('No blocking issues detected in tested flows.');
  } else {
    report.recommendedFixes.push('Review failed steps and attached screenshots for targeted fixes.');
  }

  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    reportPath,
    screenshotDir: shotDir,
    summary: report.summary,
    failed: report.failedTests.length,
    consoleErrors: report.consoleErrors.length,
    networkErrors: report.networkErrors.length,
  }, null, 2));
})();
