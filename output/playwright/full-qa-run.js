const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    env[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return env;
}

async function ensureQaUser(email, password, env, notes) {
  try {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      notes.push('Fallback QA user creation skipped: missing Supabase env values.');
      return false;
    }

    const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error && !String(error.message).toLowerCase().includes('already')) {
      notes.push(`Fallback QA user create failed: ${error.message}`);
      return false;
    }

    notes.push(`Fallback QA user ready: ${email}`);
    return true;
  } catch (error) {
    notes.push(`Fallback QA user exception: ${error.message}`);
    return false;
  }
}

(async () => {
  const env = loadEnv();
  const runId = Date.now();
  const reportPath = path.join(process.cwd(), 'output', 'playwright', `qa-report-${runId}.json`);
  const screenshotPath = path.join(process.cwd(), 'output', 'playwright', `qa-final-${runId}.png`);

  const credentials = {
    registerEmail: `qa${runId}@example.com`,
    fallbackEmail: `qae2e${runId}@example.com`,
    password: 'Password123!',
  };

  const testData = {
    driverFirst: `QAFirst${String(runId).slice(-4)}`,
    driverLast: 'Tester',
    driverLicense: `LIC-${String(runId).slice(-6)}`,
    vehicleUnit: `UNIT-${String(runId).slice(-5)}`,
    vehicleVin: `VIN${String(runId).slice(-14).padEnd(14, '7')}`,
    tripOrigin: `Origin-${String(runId).slice(-4)}`,
    tripDestination: `Dest-${String(runId).slice(-4)}`,
  };

  const report = {
    startedAt: new Date().toISOString(),
    baseUrl: 'http://localhost:3000',
    steps: [],
    consoleErrors: [],
    failedNetworkRequests: [],
    brokenUiComponents: [],
    notes: [],
    artifacts: {
      screenshot: screenshotPath,
      report: reportPath,
    },
  };

  const state = {
    authenticated: false,
    loginEmailUsed: null,
  };

  let browser;

  async function step(name, fn) {
    const entry = { name, status: 'passed', details: '' };
    try {
      entry.details = await fn();
    } catch (error) {
      entry.status = 'failed';
      entry.details = error && error.message ? error.message : String(error);
      report.brokenUiComponents.push(`${name}: ${entry.details}`);
    }
    report.steps.push(entry);
  }

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        report.consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      report.consoleErrors.push(`pageerror: ${err.message}`);
    });

    page.on('requestfailed', (req) => {
      report.failedNetworkRequests.push(`${req.method()} ${req.url()} => ${req.failure()?.errorText || 'request failed'}`);
    });

    page.on('response', (res) => {
      if (res.status() >= 400) {
        report.failedNetworkRequests.push(`${res.request().method()} ${res.url()} => HTTP ${res.status()}`);
      }
    });

    await step('1. Register a new user', async () => {
      await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', credentials.registerEmail);
      await page.fill('input[name="password"]', credentials.password);
      await page.fill('input[name="confirmPassword"]', credentials.password);
      await Promise.all([
        page.waitForLoadState('networkidle'),
        page.click('button[type="submit"]'),
      ]);

      const url = page.url();
      const errorText = await page.locator('p.text-destructive').first().textContent().catch(() => null);

      if (!url.includes('/login?message=account_created')) {
        throw new Error(`registration failed at ${url}${errorText ? ` | ${errorText}` : ''}`);
      }

      return `registered ${credentials.registerEmail}`;
    });

    await step('2. Complete company onboarding', async () => {
      let emailForLogin = credentials.registerEmail;

      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', emailForLogin);
      await page.fill('input[name="password"]', credentials.password);
      await Promise.all([
        page.waitForLoadState('networkidle'),
        page.click('button[type="submit"]'),
      ]);

      if (!page.url().includes('/dashboard')) {
        const fallbackReady = await ensureQaUser(credentials.fallbackEmail, credentials.password, env, report.notes);
        if (!fallbackReady) {
          throw new Error(`login failed for registered user and fallback user could not be prepared (current: ${page.url()})`);
        }

        emailForLogin = credentials.fallbackEmail;
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
        await page.fill('input[name="email"]', emailForLogin);
        await page.fill('input[name="password"]', credentials.password);
        await Promise.all([
          page.waitForLoadState('networkidle'),
          page.click('button[type="submit"]'),
        ]);
      }

      state.authenticated = page.url().includes('/dashboard');
      state.loginEmailUsed = emailForLogin;

      if (!state.authenticated) {
        throw new Error(`unable to authenticate, landed on ${page.url()}`);
      }

      const createCompany = page.getByText('Create Company');
      if (await createCompany.count()) {
        await page.fill('input[name="name"]', `QA Fleet ${String(runId).slice(-5)}`);
        await page.fill('input[name="dotNumber"]', `DOT${String(runId).slice(-6)}`);
        await page.fill('input[name="fleetSize"]', '5');
        await Promise.all([
          page.waitForLoadState('networkidle'),
          page.locator('form').first().locator('button[type="submit"]').click(),
        ]);
      }

      return `authenticated as ${emailForLogin}`;
    });

    await step('3. Verify dashboard loads with metrics, charts, and activity feed', async () => {
      if (!state.authenticated) throw new Error('not authenticated');
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

      const errorBoundary = await page.getByText('Something went wrong.').count();
      if (errorBoundary > 0) {
        throw new Error('dashboard error boundary rendered');
      }

      await page.getByText('Fleet Health Score').first().waitFor({ timeout: 10000 });
      await page.getByText('Recent Activity').first().waitFor({ timeout: 10000 });
      const chartCount = await page.locator('svg.recharts-surface').count();
      if (chartCount < 3) throw new Error(`expected >=3 charts, found ${chartCount}`);
      return `dashboard ok, charts=${chartCount}`;
    });

    await step('4. Test command palette (Cmd/Ctrl + K) navigation', async () => {
      if (!state.authenticated) throw new Error('not authenticated');
      await page.keyboard.press('ControlOrMeta+K');
      await page.locator('[cmdk-root]').waitFor({ timeout: 5000 });
      await page.getByText('Vehicles').first().click();
      await page.waitForLoadState('networkidle');
      if (!page.url().includes('/vehicles')) throw new Error(`expected vehicles route, got ${page.url()}`);
      return 'command palette opened and navigated';
    });

    await step('5. Add a driver', async () => {
      if (!state.authenticated) throw new Error('not authenticated');
      await page.goto('http://localhost:3000/drivers', { waitUntil: 'networkidle' });
      await page.fill('input[name="firstName"]', testData.driverFirst);
      await page.fill('input[name="lastName"]', testData.driverLast);
      await page.fill('input[name="licenseNumber"]', testData.driverLicense);
      await Promise.all([
        page.waitForLoadState('networkidle'),
        page.getByRole('button', { name: 'Add Driver' }).click(),
      ]);
      await page.getByText(testData.driverLicense).first().waitFor({ timeout: 10000 });
      return `driver created ${testData.driverLicense}`;
    });

    await step('6. Add a vehicle', async () => {
      if (!state.authenticated) throw new Error('not authenticated');
      await page.goto('http://localhost:3000/vehicles', { waitUntil: 'networkidle' });
      await page.fill('input[name="vin"]', testData.vehicleVin);
      await page.fill('input[name="unitNumber"]', testData.vehicleUnit);
      await Promise.all([
        page.waitForLoadState('networkidle'),
        page.getByRole('button', { name: 'Add Vehicle' }).click(),
      ]);
      await page.getByText(testData.vehicleUnit).first().waitFor({ timeout: 10000 });
      return `vehicle created ${testData.vehicleUnit}`;
    });

    await step('7. Create a trip', async () => {
      if (!state.authenticated) throw new Error('not authenticated');
      await page.goto('http://localhost:3000/trips', { waitUntil: 'networkidle' });

      const driverSel = page.locator('select[name="driverId"]');
      const vehicleSel = page.locator('select[name="vehicleId"]');
      const driverOptions = await driverSel.locator('option').count();
      const vehicleOptions = await vehicleSel.locator('option').count();
      if (driverOptions < 2 || vehicleOptions < 2) {
        throw new Error(`missing dropdown options drivers=${driverOptions} vehicles=${vehicleOptions}`);
      }

      const driverValue = await driverSel.locator('option').nth(1).getAttribute('value');
      const vehicleValue = await vehicleSel.locator('option').nth(1).getAttribute('value');
      await driverSel.selectOption(driverValue || '');
      await vehicleSel.selectOption(vehicleValue || '');
      await page.fill('input[name="origin"]', testData.tripOrigin);
      await page.fill('input[name="destination"]', testData.tripDestination);

      await Promise.all([
        page.waitForLoadState('networkidle'),
        page.getByRole('button', { name: 'Create Trip' }).click(),
      ]);
      await page.getByText(testData.tripOrigin).first().waitFor({ timeout: 10000 });
      return `trip created ${testData.tripOrigin}`;
    });

    await step('8. Verify alerts page loads and status badges render', async () => {
      if (!state.authenticated) throw new Error('not authenticated');
      await page.goto('http://localhost:3000/alerts', { waitUntil: 'networkidle' });
      const errorBoundary = await page.getByText('Something went wrong.').count();
      if (errorBoundary > 0) throw new Error('alerts page error boundary rendered');

      await page.getByText('Alerts').first().waitFor({ timeout: 10000 });
      let badgeCount = await page.locator('[data-slot="badge"]').count();

      if (badgeCount === 0) {
        await page.fill('input[name="title"]', `QA Alert ${String(runId).slice(-4)}`);
        await page.fill('input[name="alertType"]', 'qa');
        await page.selectOption('select[name="severity"]', 'high');
        await Promise.all([
          page.waitForLoadState('networkidle'),
          page.getByRole('button', { name: 'Create Alert' }).click(),
        ]);
        badgeCount = await page.locator('[data-slot="badge"]').count();
      }

      if (badgeCount === 0) throw new Error('no badges rendered');
      return `badge count ${badgeCount}`;
    });

    await step('9. Test dark mode toggle', async () => {
      if (!state.authenticated) throw new Error('not authenticated');
      const toggle = page.locator('button[aria-label="Toggle theme"]');
      await toggle.waitFor({ timeout: 5000 });
      const before = await page.locator('html.dark').count();
      await toggle.click();
      await page.waitForTimeout(300);
      const after = await page.locator('html.dark').count();
      if (before === after) throw new Error('theme state did not change');
      return `theme changed (${before} -> ${after})`;
    });

    await step('10. Test global search filtering on drivers, vehicles, and trips', async () => {
      if (!state.authenticated) throw new Error('not authenticated');

      async function scopedSearch(pathname, scope, query, expectText) {
        await page.goto(`http://localhost:3000${pathname}`, { waitUntil: 'networkidle' });
        const scopeSelect = page.locator('select[aria-label="Search scope"]');
        if (await scopeSelect.count()) {
          await scopeSelect.selectOption(scope);
        }
        const searchInput = page.locator('input[placeholder*="Search"]').first();
        await searchInput.fill(query);
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle');
        if (!page.url().includes(`search=${encodeURIComponent(query)}`)) {
          throw new Error(`search query missing in URL for ${scope}`);
        }
        await page.getByText(expectText).first().waitFor({ timeout: 10000 });
      }

      await scopedSearch('/drivers', 'drivers', testData.driverFirst, testData.driverLicense);
      await scopedSearch('/vehicles', 'vehicles', testData.vehicleUnit, testData.vehicleUnit);
      await scopedSearch('/trips', 'trips', testData.tripOrigin, testData.tripOrigin);

      return 'search filtering verified';
    });

    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    report.finishedAt = new Date().toISOString();
    report.summary = {
      passed: report.steps.filter((s) => s.status === 'passed').length,
      failed: report.steps.filter((s) => s.status === 'failed').length,
      loginEmailUsed: state.loginEmailUsed,
    };
  } catch (fatal) {
    report.fatalError = fatal.message;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      reportPath,
      screenshotPath,
      summary: report.summary,
      failedSteps: report.steps.filter((s) => s.status === 'failed'),
      consoleErrors: report.consoleErrors.length,
      failedNetworkRequests: report.failedNetworkRequests.length,
    }, null, 2));
  }
})();
