const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = process.env.QA_BASE_URL || 'https://keeptruckin-motive.vercel.app';
const COMPANY_ID = '11111111-1111-4111-8111-111111111111';
const PASSWORD = 'Password123!';
const ROLE_EMAILS = {
  owner: 'owner.atlas@example.com',
  admin: 'admin.atlas@example.com',
  dispatcher: 'dispatcher.atlas@example.com',
  driver: 'driver.atlas@example.com',
  viewer: 'viewer.atlas@example.com',
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const report = {
  startedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  authentication: [],
  rbac: [],
  workflows: [],
  middleware: [],
  playwright: [],
  apiResponses: [],
  consoleErrors: [],
  networkErrors: [],
  summary: {},
};

function record(bucket, name, status, details) {
  report[bucket].push({ name, status, details });
}

async function login(page, role) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.getByTestId('login-email').fill(ROLE_EMAILS[role]);
  await page.getByTestId('login-password').fill(PASSWORD);
  await page.getByTestId('login-submit').click();
  await page.waitForURL((url) => url.pathname.includes('/dashboard') || url.pathname.includes('/login'), { timeout: 20000 });
  return new URL(page.url()).pathname;
}

async function postJson(page, url, payload) {
  return page.evaluate(async ({ u, p }) => {
    const res = await fetch(u, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(p),
      credentials: 'include',
    });
    let data = null;
    try { data = await res.json(); } catch {}
    return { status: res.status, data };
  }, { u: url, p: payload });
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1) Authentication + middleware protection
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('console', (msg) => { if (msg.type() === 'error') report.consoleErrors.push(msg.text()); });
    page.on('requestfailed', (req) => report.networkErrors.push(`${req.method()} ${req.url()} => ${req.failure()?.errorText}`));

    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      const redirected = new URL(page.url()).pathname.startsWith('/login');
      record('middleware', 'Protected route redirect without login', redirected ? 'PASS' : 'FAIL', page.url());

      const pathAfterLogin = await login(page, 'owner');
      record('authentication', 'Owner login', pathAfterLogin.startsWith('/dashboard') ? 'PASS' : 'FAIL', pathAfterLogin);

      await page.goto(`${BASE_URL}/drivers`, { waitUntil: 'networkidle' });
      await page.reload({ waitUntil: 'networkidle' });
      const persisted = !new URL(page.url()).pathname.startsWith('/login');
      record('authentication', 'Session persistence after navigation/reload', persisted ? 'PASS' : 'FAIL', page.url());

      await page.getByRole('button', { name: 'Logout' }).first().click();
      await page.waitForURL((url) => url.pathname.startsWith('/login') || url.pathname.startsWith('/dashboard'), { timeout: 15000 });
      const loggedOut = new URL(page.url()).pathname.startsWith('/login');
      record('authentication', 'Logout', loggedOut ? 'PASS' : 'FAIL', page.url());
    } catch (e) {
      record('authentication', 'Authentication flow', 'FAIL', e.message || String(e));
    } finally {
      await context.close();
    }
  }

  // 2) RBAC UI checks + owner invite visibility + write restrictions
  for (const role of ['owner', 'admin', 'dispatcher', 'driver', 'viewer']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const path = await login(page, role);
      if (!path.startsWith('/dashboard')) {
        record('rbac', `${role} login`, 'FAIL', `landed on ${path}`);
        await context.close();
        continue;
      }

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      const inviteVisible = await page.locator('#inviteEmail').count();

      if (role === 'owner') {
        record('rbac', 'owner can invite users (UI)', inviteVisible > 0 ? 'PASS' : 'FAIL', `inviteVisible=${inviteVisible}`);
      }
      if (role === 'driver' || role === 'viewer') {
        const res = await postJson(page, `${BASE_URL}/api/drivers`, {
          companyId: COMPANY_ID,
          firstName: `NoWrite${role}`,
          lastName: 'Role',
          licenseNumber: `NO-${role}-${Date.now()}`,
        });
        report.apiResponses.push({ role, endpoint: '/api/drivers', status: res.status });
        record('rbac', `${role} cannot create driver`, res.status === 403 ? 'PASS' : 'FAIL', `status=${res.status}`);
      }

      if (role === 'admin') {
        record('rbac', 'admin invite UI access', inviteVisible > 0 ? 'PASS' : 'FAIL', `inviteVisible=${inviteVisible}`);
      }

      if (role === 'dispatcher') {
        const res = await postJson(page, `${BASE_URL}/api/drivers`, {
          companyId: COMPANY_ID,
          firstName: `Dispatch${Date.now()}`,
          lastName: 'CanWrite',
          licenseNumber: `DSP-${Date.now()}`,
        });
        report.apiResponses.push({ role, endpoint: '/api/drivers', status: res.status });
        record('rbac', 'dispatcher write access', [200, 201].includes(res.status) ? 'PASS' : 'FAIL', `status=${res.status}`);
      }
    } catch (e) {
      record('rbac', `${role} role check`, 'FAIL', e.message || String(e));
    } finally {
      await context.close();
    }
  }

  // Direct policy check for admin ownership/member role changes
  if (supabaseUrl && supabaseAnonKey) {
    const adminSb = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signInErr } = await adminSb.auth.signInWithPassword({ email: ROLE_EMAILS.admin, password: PASSWORD });

    if (signInErr) {
      record('rbac', 'admin policy test login', 'FAIL', signInErr.message);
    } else {
      const { data: members } = await adminSb
        .from('company_members')
        .select('id,company_id,user_id,role')
        .eq('company_id', COMPANY_ID)
        .limit(5);

      const target = (members || []).find((m) => m.role === 'viewer') || (members || [])[0];
      if (!target) {
        record('rbac', 'admin cannot update company_members roles', 'FAIL', 'no target member found');
      } else {
        const { error: updErr } = await adminSb
          .from('company_members')
          .update({ role: 'driver' })
          .eq('id', target.id);

        record('rbac', 'admin cannot update company_members roles', updErr ? 'PASS' : 'FAIL', updErr ? updErr.message : 'update succeeded unexpectedly');
      }

      const { error: companyUpdErr } = await adminSb
        .from('companies')
        .update({ created_by: null })
        .eq('id', COMPANY_ID);

      record('rbac', 'admin cannot change company ownership', companyUpdErr ? 'PASS' : 'FAIL', companyUpdErr ? companyUpdErr.message : 'company update succeeded unexpectedly');
    }
  } else {
    record('rbac', 'direct policy checks', 'FAIL', 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // 3) Core workflow CRUD as owner via deployed API and table visibility
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await login(page, 'owner');
      const stamp = Date.now();
      const driverLicense = `SMK-${stamp}`;
      const driverRes = await postJson(page, `${BASE_URL}/api/drivers`, {
        companyId: COMPANY_ID,
        firstName: 'Smoke',
        lastName: 'Driver',
        licenseNumber: driverLicense,
      });
      report.apiResponses.push({ role: 'owner', endpoint: '/api/drivers', status: driverRes.status });
      record('workflows', 'Create driver API 200/201', [200, 201].includes(driverRes.status) ? 'PASS' : 'FAIL', `status=${driverRes.status}`);

      const vehicleUnit = `SMK-${String(stamp).slice(-5)}`;
      const vehicleVin = `SMKVIN${String(stamp).slice(-10).padStart(10, '0')}`;
      const vehicleRes = await postJson(page, `${BASE_URL}/api/vehicles`, {
        companyId: COMPANY_ID,
        vin: vehicleVin,
        unitNumber: vehicleUnit,
      });
      report.apiResponses.push({ role: 'owner', endpoint: '/api/vehicles', status: vehicleRes.status });
      record('workflows', 'Create vehicle API 200/201', [200, 201].includes(vehicleRes.status) ? 'PASS' : 'FAIL', `status=${vehicleRes.status}`);

      const tripRes = await postJson(page, `${BASE_URL}/api/trips`, {
        companyId: COMPANY_ID,
        driverId: driverRes.data?.data?.id || driverRes.data?.id,
        vehicleId: vehicleRes.data?.data?.id || vehicleRes.data?.id,
        origin: 'Austin',
        destination: 'San Antonio',
      });
      report.apiResponses.push({ role: 'owner', endpoint: '/api/trips', status: tripRes.status });
      record('workflows', 'Create trip API 200/201', [200, 201].includes(tripRes.status) ? 'PASS' : 'FAIL', `status=${tripRes.status}`);

      await page.goto(`${BASE_URL}/drivers`, { waitUntil: 'networkidle' });
      const driverVisible = await page.getByText(driverLicense).first().isVisible({ timeout: 10000 }).catch(() => false);
      record('workflows', 'Created driver visible in table', driverVisible ? 'PASS' : 'FAIL', driverLicense);

      await page.goto(`${BASE_URL}/vehicles`, { waitUntil: 'networkidle' });
      const vehicleVisible = await page.getByText(vehicleUnit).first().isVisible({ timeout: 10000 }).catch(() => false);
      record('workflows', 'Created vehicle visible in table', vehicleVisible ? 'PASS' : 'FAIL', vehicleUnit);

      await page.goto(`${BASE_URL}/trips`, { waitUntil: 'networkidle' });
      const tripVisible = await page.getByText('Austin').first().isVisible({ timeout: 10000 }).catch(() => false);
      record('workflows', 'Created trip visible in table', tripVisible ? 'PASS' : 'FAIL', 'Austin -> San Antonio');
    } catch (e) {
      record('workflows', 'Core workflow run', 'FAIL', e.message || String(e));
    } finally {
      await context.close();
    }
  }

  // 5) existing tests + pnpm test
  const { execSync } = require('child_process');
  try {
    execSync('pnpm exec playwright test tests/e2e/auth-smoke.spec.ts tests/e2e/dashboard-auth.spec.ts', { stdio: 'pipe', timeout: 240000 });
    record('playwright', 'tests/e2e run', 'PASS', 'passed');
  } catch (e) {
    record('playwright', 'tests/e2e run', 'FAIL', (e.stdout?.toString() || '') + (e.stderr?.toString() || ''));
  }

  try {
    execSync('pnpm test', { stdio: 'pipe', timeout: 240000 });
    record('playwright', 'pnpm test (vitest)', 'PASS', 'passed');
  } catch (e) {
    record('playwright', 'pnpm test (vitest)', 'FAIL', (e.stdout?.toString() || '') + (e.stderr?.toString() || ''));
  }

  await browser.close();

  const all = ['authentication','rbac','workflows','middleware','playwright'].flatMap((k) => report[k]);
  report.summary = {
    total: all.length,
    passed: all.filter((x) => x.status === 'PASS').length,
    failed: all.filter((x) => x.status === 'FAIL').length,
  };
  report.finishedAt = new Date().toISOString();

  const outPath = path.join(process.cwd(), 'output', 'production-smoke-report.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ outPath, summary: report.summary }, null, 2));
})();
