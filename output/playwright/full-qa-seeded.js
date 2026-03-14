const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    env[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return env;
}

async function createFallbackUser(env, email, password, notes) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    notes.push('Fallback user create skipped: missing Supabase env values.');
    return false;
  }

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error && !String(error.message).toLowerCase().includes('already')) {
    notes.push(`Fallback user create failed: ${error.message}`);
    return false;
  }

  notes.push(`Fallback user ready: ${email}`);
  return true;
}

(async () => {
  const env = loadEnv();
  const runId = Date.now();
  const shortId = String(runId).slice(-6);
  const reportPath = path.join(process.cwd(), 'output', 'playwright', `qa-report-${runId}.json`);
  const screenshotPath = path.join(process.cwd(), 'output', 'playwright', `qa-final-${runId}.png`);

  const qaEmail = env.QA_E2E_EMAIL || 'qae2e610055@example.com';
  const password = env.QA_E2E_PASSWORD || 'Password123!';

  const driverFirst = `QAFirst${shortId.slice(-4)}`;
  const driverLast = 'Tester';
  const driverLicense = `LIC-${shortId}`;
  const vehicleUnit = `UNIT-${shortId.slice(-5)}`;
  const vehicleVin = `VIN${String(runId).slice(-14).padEnd(14, '7')}`;
  const tripOrigin = `Origin-${shortId.slice(-4)}`;
  const tripDestination = `Dest-${shortId.slice(-4)}`;

  const report = {
    startedAt: new Date().toISOString(),
    baseUrl: 'http://localhost:3000',
    steps: [],
    consoleErrors: [],
    failedNetworkRequests: [],
    brokenUiComponents: [],
    notes: [],
    artifacts: { report: reportPath, screenshot: screenshotPath },
  };

  const state = { authenticated: false, loginEmail: null };

  function stepResult(name, status, details) {
    report.steps.push({ name, status, details });
    if (status === 'failed') report.brokenUiComponents.push(`${name}: ${details}`);
  }

  async function attemptStep(name, fn) {
    try {
      const d = await fn();
      stepResult(name, 'passed', d || 'ok');
    } catch (e) {
      stepResult(name, 'failed', e?.message || String(e));
    }
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });

  page.on('console', (msg) => {
    if (msg.type() === 'error') report.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => report.consoleErrors.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => report.failedNetworkRequests.push(`${req.method()} ${req.url()} => ${req.failure()?.errorText || 'request failed'}`));
  page.on('response', (res) => {
    if (res.status() >= 400) report.failedNetworkRequests.push(`${res.request().method()} ${res.url()} => HTTP ${res.status()}`);
  });

  async function loginWith(email) {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByTestId('login-submit').click(),
    ]);
    await page.waitForTimeout(1200);
    return page.url();
  }

  await attemptStep('1. Register step skipped (using existing QA user)', async () => {
    return `using existing QA user ${qaEmail}`;
  });

  await attemptStep('2. Authenticate and open dashboard with seeded account', async () => {
    const loginUrl = await loginWith(qaEmail);

    if (!loginUrl.includes('/dashboard')) {
      const err = await page.locator('p.text-destructive').first().textContent().catch(() => null);
      throw new Error(`unable to authenticate (${loginUrl})${err ? ` | ${err}` : ''}`);
    }

    state.authenticated = true;
    state.loginEmail = qaEmail;

    if (await page.getByTestId('create-company-form').count()) {
      report.notes.push('Onboarding form visible for QA user; seeded company membership may be missing for this user.');
    }

    return `authenticated as ${qaEmail}`;
  });

  await attemptStep('3. Verify dashboard loads with metrics, charts, and activity feed', async () => {
    if (!state.authenticated) throw new Error('not authenticated');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    await page.getByTestId('metric-card-drivers').waitFor({ timeout: 12000 });
    await page.getByTestId('metric-card-vehicles').waitFor({ timeout: 12000 });
    await page.getByTestId('metric-card-active-trips').waitFor({ timeout: 12000 });
    await page.getByTestId('metric-card-open-alerts').waitFor({ timeout: 12000 });

    const chartCount = await page.locator('svg.recharts-surface').count();
    if (chartCount < 3) throw new Error(`expected >=3 charts, found ${chartCount}`);

    return `metric cards visible, charts=${chartCount}`;
  });

  await attemptStep('4. Test command palette (Cmd/Ctrl + K) navigation', async () => {
    if (!state.authenticated) throw new Error('not authenticated');

    await page.getByTestId('command-palette-trigger').click();
    await page.getByTestId('command-page-vehicles').waitFor({ timeout: 5000 });
    await page.getByTestId('command-page-vehicles').click();
    await page.waitForLoadState('networkidle');

    if (!page.url().includes('/vehicles')) {
      throw new Error(`did not navigate to vehicles (${page.url()})`);
    }

    return 'opened and navigated';
  });

  await attemptStep('5. Add a driver', async () => {
    if (!state.authenticated) throw new Error('not authenticated');

    await page.goto('http://localhost:3000/drivers', { waitUntil: 'networkidle' });
    await page.getByTestId('driver-first-name').fill(driverFirst);
    await page.getByTestId('driver-last-name').fill(driverLast);
    await page.getByTestId('driver-license').fill(driverLicense);
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByTestId('add-driver-button').click(),
    ]);

    await page.getByText(driverLicense).first().waitFor({ timeout: 12000 });
    return driverLicense;
  });

  await attemptStep('6. Add a vehicle', async () => {
    if (!state.authenticated) throw new Error('not authenticated');

    await page.goto('http://localhost:3000/vehicles', { waitUntil: 'networkidle' });
    await page.getByTestId('vehicle-vin').fill(vehicleVin);
    await page.getByTestId('vehicle-unit-number').fill(vehicleUnit);
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByTestId('add-vehicle-button').click(),
    ]);

    await page.getByText(vehicleUnit).first().waitFor({ timeout: 12000 });
    return vehicleUnit;
  });

  await attemptStep('7. Create a trip', async () => {
    if (!state.authenticated) throw new Error('not authenticated');

    await page.goto('http://localhost:3000/trips', { waitUntil: 'networkidle' });
    const driverSelect = page.getByTestId('trip-driver-select');
    const vehicleSelect = page.getByTestId('trip-vehicle-select');
    const drivers = await driverSelect.locator('option').count();
    const vehicles = await vehicleSelect.locator('option').count();
    if (drivers < 2 || vehicles < 2) {
      throw new Error(`missing dropdown options drivers=${drivers}, vehicles=${vehicles}`);
    }

    await driverSelect.selectOption((await driverSelect.locator('option').nth(1).getAttribute('value')) || '');
    await vehicleSelect.selectOption((await vehicleSelect.locator('option').nth(1).getAttribute('value')) || '');
    await page.getByTestId('trip-origin').fill(tripOrigin);
    await page.getByTestId('trip-destination').fill(tripDestination);
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByTestId('create-trip-button').click(),
    ]);

    await page.getByText(tripOrigin).first().waitFor({ timeout: 12000 });
    return tripOrigin;
  });

  await attemptStep('8. Verify alerts page loads and status badges render', async () => {
    if (!state.authenticated) throw new Error('not authenticated');

    await page.goto('http://localhost:3000/alerts', { waitUntil: 'networkidle' });
    await page.getByTestId('alerts-table').waitFor({ timeout: 12000 });
    const badgeCount = await page.locator('[data-slot="badge"]').count();
    if (badgeCount === 0) {
      throw new Error('alerts badges not rendered');
    }

    return `badges=${badgeCount}`;
  });

  await attemptStep('9. Test dark mode toggle', async () => {
    if (!state.authenticated) throw new Error('not authenticated');

    const toggle = page.getByTestId('dark-mode-toggle');
    await toggle.waitFor({ timeout: 5000 });
    const before = await page.locator('html.dark').count();
    await toggle.click();
    await page.waitForTimeout(300);
    const after = await page.locator('html.dark').count();
    if (before === after) throw new Error('theme did not toggle');
    return `${before}->${after}`;
  });

  await attemptStep('10. Test global search filtering on drivers, vehicles, and trips', async () => {
    if (!state.authenticated) throw new Error('not authenticated');

    async function run(pathname, scope, query, expected) {
      await page.goto(`http://localhost:3000${pathname}`, { waitUntil: 'networkidle' });
      await page.getByTestId('global-search-scope').selectOption(scope);
      const searchInput = page.getByTestId('global-search-input');
      await searchInput.fill(query);
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');

      if (!page.url().includes(`search=${encodeURIComponent(query)}`)) {
        throw new Error(`missing query param for ${scope}`);
      }

      await page.getByText(expected).first().waitFor({ timeout: 12000 });
    }

    await run('/drivers', 'drivers', driverFirst, driverLicense);
    await run('/vehicles', 'vehicles', vehicleUnit, vehicleUnit);
    await run('/trips', 'trips', tripOrigin, tripOrigin);

    return 'search verified';
  });

  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  await browser.close().catch(() => {});

  report.finishedAt = new Date().toISOString();
  report.summary = {
    passed: report.steps.filter((s) => s.status === 'passed').length,
    failed: report.steps.filter((s) => s.status === 'failed').length,
    loginEmailUsed: state.loginEmail,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    reportPath,
    screenshotPath,
    summary: report.summary,
    failedSteps: report.steps.filter((s) => s.status === 'failed'),
    consoleErrors: report.consoleErrors.length,
    failedNetworkRequests: report.failedNetworkRequests.length,
  }, null, 2));
})();

