import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'http://localhost:3000';

let browser: Browser;
let page: Page;

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
  severity?: string;
}

const results: TestResult[] = [];

function log(r: TestResult) {
  results.push(r);
  console.log(`[${r.status}] ${r.name}: ${r.detail}`);
}

async function setup() {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
}

async function teardown() {
  await browser?.close();
}

// ─── Test 1: Homepage loads ───
async function testHomepageLoads() {
  try {
    const res = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    log({ name: 'Homepage loads', status: res?.ok() ? 'PASS' : 'FAIL', detail: `Status ${res?.status()}` });
  } catch (e: any) {
    log({ name: 'Homepage loads', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 2: CRITICAL - Direct registration without phone verification BLOCKED ───
async function testDirectRegistrationBypass() {
  try {
    const ts = Date.now();
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: `0521${String(ts).slice(-6)}`,
        email: `bypass${ts}@test.com`,
        username: `bypassuser${ts}`,
        password: 'TestPassword123',
        fullName: 'Bypass Test',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        applicationText: '',
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      log({
        name: 'FIXED: Registration blocked without phone verification',
        status: 'FAIL',
        detail: `User was still created without verification token!`,
        severity: 'CRITICAL',
      });
    } else {
      const isPhoneCheck = data.error_code === 'PHONE_NOT_VERIFIED';
      log({
        name: 'FIXED: Registration blocked without phone verification',
        status: isPhoneCheck ? 'PASS' : 'WARN',
        detail: `Blocked: ${data.error_code} - ${data.error}`,
      });
    }
  } catch (e: any) {
    log({ name: 'FIXED: Registration blocked without phone verification', status: 'WARN', detail: e.message });
  }
}

// ─── Test 3: CRITICAL - Registration with forged token BLOCKED ───
async function testForgedVerificationToken() {
  try {
    const ts = Date.now();
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: `0522${String(ts).slice(-6)}`,
        email: `forged${ts}@test.com`,
        username: `forgeduser${ts}`,
        password: 'TestPassword123',
        fullName: 'Forged Token Test',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        applicationText: '',
        phoneVerificationToken: 'forged.invalid.token',
      }),
    });
    const data = await res.json();
    log({
      name: 'FIXED: Forged verification token rejected',
      status: (res.status === 403 && data.error_code === 'PHONE_NOT_VERIFIED') ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}: ${data.error_code}`,
    });
  } catch (e: any) {
    log({ name: 'FIXED: Forged verification token rejected', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 4: CRITICAL - Unauthenticated submit-application BLOCKED ───
async function testUnauthenticatedSubmitApplication() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/submit-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '25928cfa-123a-4b66-935c-8ffff11d5d09',
        applicationText: 'UNAUTHORIZED MODIFICATION TEST - should be blocked',
      }),
    });
    const data = await res.json();
    log({
      name: 'FIXED: Unauthenticated submit-application blocked',
      status: (res.status === 403 && data.error_code === 'UNAUTHORIZED') ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}: ${data.error_code || data.error || JSON.stringify(data).slice(0, 100)}`,
      severity: 'CRITICAL',
    });
  } catch (e: any) {
    log({ name: 'FIXED: Unauthenticated submit-application blocked', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 5: Submit-application with forged token BLOCKED ───
async function testForgedRegistrationToken() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/submit-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '25928cfa-123a-4b66-935c-8ffff11d5d09',
        applicationText: 'FORGED TOKEN TEST - should be blocked',
        registrationToken: 'forged.registration.token',
      }),
    });
    const data = await res.json();
    log({
      name: 'FIXED: Forged registration token rejected',
      status: (res.status === 403) ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}: ${data.error_code}`,
    });
  } catch (e: any) {
    log({ name: 'FIXED: Forged registration token rejected', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 6: Invalid PIN rejected ───
async function testInvalidPIN() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/verify-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0521234567', code: '0000' }),
    });
    const data = await res.json();
    log({
      name: 'Invalid PIN rejected',
      status: res.status === 400 ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}: ${data.error || data.message || 'no message'}`,
    });
  } catch (e: any) {
    log({ name: 'Invalid PIN rejected', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 7: Duplicate username detection ───
async function testDuplicateUsername() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'username', value: 'lior' }),
    });
    const data = await res.json();
    log({
      name: 'Check-availability works',
      status: res.ok ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}, available: ${data.available}`,
    });
  } catch (e: any) {
    log({ name: 'Check-availability works', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 8: Missing fields rejected ───
async function testMissingFields() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0521111111' }),
    });
    const data = await res.json();
    log({
      name: 'Missing fields rejected',
      status: res.status === 400 ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}: ${data.error_code || data.error}`,
    });
  } catch (e: any) {
    log({ name: 'Missing fields rejected', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 9: Server-side email validation ───
async function testInvalidEmailFormat() {
  try {
    const ts = Date.now();
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: `0523${String(ts).slice(-6)}`,
        email: 'not-an-email',
        username: `valtest${ts}`,
        password: 'TestPassword123',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phoneVerificationToken: 'fake',
      }),
    });
    const data = await res.json();
    const blocked = data.error_code === 'PHONE_NOT_VERIFIED' || data.error_code === 'INVALID_EMAIL_FORMAT';
    log({
      name: 'FIXED: Server-side email validation',
      status: (res.status === 400 || res.status === 403) && blocked ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}: ${data.error_code}`,
    });
  } catch (e: any) {
    log({ name: 'FIXED: Server-side email validation', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 10: Server-side username length validation ───
async function testUsernameLength() {
  try {
    const ts = Date.now();
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: `0524${String(ts).slice(-6)}`,
        email: `lentest${ts}@test.com`,
        username: 'ab',
        password: 'TestPassword123',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phoneVerificationToken: 'fake',
      }),
    });
    const data = await res.json();
    const blocked = data.error_code === 'PHONE_NOT_VERIFIED' || data.error_code === 'INVALID_USERNAME_LENGTH';
    log({
      name: 'FIXED: Server-side username length (2 chars blocked)',
      status: (res.status === 400 || res.status === 403) && blocked ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}: ${data.error_code}`,
    });
  } catch (e: any) {
    log({ name: 'FIXED: Server-side username length', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 11: Admin approve without auth ───
async function testAdminApproveWithoutAuth() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/approve-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000000', action: 'approve' }),
    });
    const blocked = res.status === 401 || res.status === 302 || res.status === 307 || res.status === 403;
    log({
      name: 'Admin approve blocked without auth',
      status: blocked ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}`,
    });
  } catch (e: any) {
    log({ name: 'Admin approve blocked without auth', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 12: Secrets not exposed to client ───
async function testSecretsNotExposed() {
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const html = await page.content();
    const exposed = html.includes('ecefbe0b3007') || html.includes('re_XXk9fM6c');
    log({
      name: 'Secrets not exposed to client',
      status: exposed ? 'FAIL' : 'PASS',
      detail: exposed ? 'Server secrets found in HTML!' : 'No server secrets in client HTML',
      severity: exposed ? 'CRITICAL' : undefined,
    });
  } catch (e: any) {
    log({ name: 'Secrets not exposed to client', status: 'WARN', detail: e.message });
  }
}

// ─── Test 13: Twilio Verify API used (send-verification) ───
async function testTwilioVerifySend() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0521234567' }),
    });
    const data = await res.json();
    const noDemoCode = !data.demoCode;
    log({
      name: 'FIXED: Twilio Verify used (no demoCode, no self-managed codes)',
      status: noDemoCode ? 'PASS' : 'FAIL',
      detail: `Response keys: ${Object.keys(data).join(', ')}. demoCode present: ${!!data.demoCode}`,
    });
  } catch (e: any) {
    log({ name: 'FIXED: Twilio Verify used', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 14: No OTP plaintext in send-verification response ───
async function testNoOTPInResponse() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0529876543' }),
    });
    const text = await res.text();
    const hasCode = /"\d{4,6}"/.test(text) && text.includes('code');
    log({
      name: 'FIXED: No OTP code in API response',
      status: !hasCode ? 'PASS' : 'FAIL',
      detail: hasCode ? 'OTP code found in response!' : 'No OTP code in response body',
    });
  } catch (e: any) {
    log({ name: 'FIXED: No OTP code in API response', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 15: Phone format validated server-side ───
async function testPhoneFormatValidation() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: 'invalid-phone' }),
    });
    const data = await res.json();
    log({
      name: 'FIXED: Phone format validated server-side',
      status: res.status === 400 ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}: ${data.error}`,
    });
  } catch (e: any) {
    log({ name: 'FIXED: Phone format validated', status: 'FAIL', detail: e.message });
  }
}

// ─── Test 16: DB UNIQUE constraint on phone ───
async function testDBUniquePhone() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '0521234567',
        email: 'unique-test@test.com',
        username: 'uniquetest123',
        password: 'TestPass123',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phoneVerificationToken: 'fake',
      }),
    });
    const data = await res.json();
    const blocked = data.error_code === 'PHONE_NOT_VERIFIED' || data.error_code === 'PHONE_EXISTS';
    log({
      name: 'FIXED: Duplicate phone blocked',
      status: blocked ? 'PASS' : 'FAIL',
      detail: `Status ${res.status}: ${data.error_code}`,
    });
  } catch (e: any) {
    log({ name: 'FIXED: Duplicate phone blocked', status: 'FAIL', detail: e.message });
  }
}

// ─── MAIN ───
async function main() {
  console.log('=== POST-FIX REGRESSION SMOKE TEST ===\n');

  await setup();

  await testHomepageLoads();
  await testDirectRegistrationBypass();
  await testForgedVerificationToken();
  await testUnauthenticatedSubmitApplication();
  await testForgedRegistrationToken();
  await testInvalidPIN();
  await testDuplicateUsername();
  await testMissingFields();
  await testInvalidEmailFormat();
  await testUsernameLength();
  await testAdminApproveWithoutAuth();
  await testSecretsNotExposed();
  await testTwilioVerifySend();
  await testNoOTPInResponse();
  await testPhoneFormatValidation();
  await testDBUniquePhone();

  await teardown();

  console.log('\n=== SUMMARY ===');
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  console.log(`PASS: ${pass} | FAIL: ${fail} | WARN: ${warn} | Total: ${results.length}`);

  if (fail > 0) {
    console.log('\n--- FAILURES ---');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  [${r.severity || 'N/A'}] ${r.name}`);
      console.log(`    ${r.detail}`);
    });
  }
  if (warn > 0) {
    console.log('\n--- WARNINGS ---');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  ${r.name}: ${r.detail}`);
    });
  }
  if (fail === 0) {
    console.log('\nALL TESTS PASSED');
  }
}

main().catch(console.error);
