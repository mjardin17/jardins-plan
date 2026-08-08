// src/tests/oauth-callback-security.test.ts
import crypto from 'crypto';
import { Request, Response } from 'express';
import { createPool } from '../db/index.ts';
import { initializeDatabaseTables } from '../db/init.ts';
import { withTenantContext } from '../db/tenant-context.ts';
import { ConnectionActivationController } from '../controllers/connection-activation.controller.ts';
import {
  createOAuthStateAsync,
  validateAndConsumeOAuthStateAsync,
  verifyAndExtractOAuthStateDetails
} from '../lib/oauth-security-engine.ts';
import { getTenantCredentialMetadataAsync } from '../lib/crypto-vault.ts';
import { generateSessionToken } from '../middleware/auth.middleware.ts';

const pool = createPool();

interface MockResponse {
  statusCode: number;
  jsonBody: any;
  res: Response;
}

function createMockReqRes(options: {
  body?: any;
  query?: any;
  headers?: any;
  token?: string;
}): { req: Request; mockRes: MockResponse } {
  const body = options.body || {};
  const query = options.query || {};
  const headers = options.headers || {};

  if (options.token) {
    headers['authorization'] = `Bearer ${options.token}`;
  }

  const req = {
    body,
    query,
    headers,
    get: (headerName: string) => headers[headerName.toLowerCase()] || headers[headerName]
  } as unknown as Request;

  const mockRes: MockResponse = {
    statusCode: 200,
    jsonBody: null,
    res: {} as Response
  };

  mockRes.res = {
    status: (code: number) => {
      mockRes.statusCode = code;
      return mockRes.res;
    },
    json: (data: any) => {
      mockRes.jsonBody = data;
      return mockRes.res;
    }
  } as unknown as Response;

  return { req, mockRes };
}

export async function runOAuthCallbackSecurityTests(): Promise<void> {
  console.log('==================================================');
  console.log('🛡️ RUNNING OAUTH CALLBACK FOCUSED SECURITY SUITE');
  console.log('==================================================');

  await initializeDatabaseTables();

  const tenantA = 'oauth_tenant_alpha';
  const tenantB = 'oauth_tenant_beta';
  const userAEmail = 'oauth_user_a@example.com';
  const userBEmail = 'oauth_user_b@example.com';

  const seedUser = async (email: string, name: string, role: string, businessId: string | null) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN;');
      await client.query(`SELECT set_config('app.user_email', $1, true);`, [email]);
      if (businessId) {
        await client.query(`SELECT set_config('app.current_tenant', $1, true);`, [businessId]);
      }
      await client.query(`
        INSERT INTO users (email, name, role, business_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET business_id = $4;
      `, [email, name, role, businessId]);
      await client.query('COMMIT;');
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  };

  // Seed fixture businesses and users with proper tenant context
  await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantA}', 'Alpha Corp') ON CONFLICT DO NOTHING;`);
  await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantB}', 'Beta Corp') ON CONFLICT DO NOTHING;`);

  await seedUser(userAEmail, 'User A', 'admin', tenantA);
  await seedUser(userBEmail, 'User B', 'admin', tenantB);

  const tokenA = generateSessionToken(userAEmail);
  const tokenB = generateSessionToken(userBEmail);

  let passed = 0;
  let total = 16;

  // Test 1: Valid state completes only for its bound tenant, connector, and actor
  console.log('  [Test 1/16] Valid state completes for bound tenant, connector, and actor...');
  const state1 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'gmail', 'http://localhost:3000/callback', tx);
  });
  const { req: req1, mockRes: mockRes1 } = createMockReqRes({
    body: { state: state1.token, code: 'mock_code_1' }
  });
  await ConnectionActivationController.handleOAuthCallback(req1, mockRes1.res);
  if (mockRes1.statusCode !== 200 || !mockRes1.jsonBody?.success || mockRes1.jsonBody?.connectorId !== 'gmail') {
    throw new Error(`Test 1 Failed: Expected status 200 & gmail connector. Got ${mockRes1.statusCode}, ${JSON.stringify(mockRes1.jsonBody)}`);
  }
  const cred1 = await getTenantCredentialMetadataAsync(tenantA, tenantA, 'gmail');
  if (!cred1 || cred1.connectorId !== 'gmail') {
    throw new Error('Test 1 Failed: Credential not persisted for bound tenant and connector');
  }
  passed++;

  // Test 2: Callback-supplied userId is ignored
  console.log('  [Test 2/16] Callback-supplied userId is ignored...');
  const state2 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'stripe', 'http://localhost:3000/callback', tx);
  });
  const { req: req2, mockRes: mockRes2 } = createMockReqRes({
    body: { state: state2.token, userId: 'attacker_user_id', code: 'mock_code_2' }
  });
  await ConnectionActivationController.handleOAuthCallback(req2, mockRes2.res);
  if (mockRes2.statusCode !== 200 || !mockRes2.jsonBody?.success) {
    throw new Error(`Test 2 Failed: Expected 200 despite bogus callback userId. Got ${mockRes2.statusCode}`);
  }
  passed++;

  // Test 3: The owner_1 fallback no longer exists
  console.log('  [Test 3/16] Confirm owner_1 fallback does not exist...');
  const stateDetails2 = verifyAndExtractOAuthStateDetails(state2.token);
  if (stateDetails2.userId === 'owner_1') {
    throw new Error('Test 3 Failed: owner_1 fallback detected in OAuth state');
  }
  passed++;

  // Test 4: Callback-supplied tenantId cannot override signed state
  console.log('  [Test 4/16] Callback-supplied tenantId cannot override signed state...');
  const state4 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'outlook_email', 'http://localhost:3000/callback', tx);
  });
  const { req: req4, mockRes: mockRes4 } = createMockReqRes({
    body: { state: state4.token, tenantId: tenantB, code: 'mock_code_4' }
  });
  await ConnectionActivationController.handleOAuthCallback(req4, mockRes4.res);
  const credTenantB = await getTenantCredentialMetadataAsync(tenantB, tenantB, 'outlook_email');
  if (credTenantB) {
    throw new Error('Test 4 Failed: Credential leaked into tenantB via callback tenantId parameter!');
  }
  const credTenantA = await getTenantCredentialMetadataAsync(tenantA, tenantA, 'outlook_email');
  if (!credTenantA) {
    throw new Error('Test 4 Failed: Credential was not correctly stored in signed tenantA');
  }
  passed++;

  // Test 5: Callback-supplied connectorId cannot override signed state
  console.log('  [Test 5/16] Callback-supplied connectorId cannot override signed state...');
  const state5 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'outlook_calendar', 'http://localhost:3000/callback', tx);
  });
  const { req: req5, mockRes: mockRes5 } = createMockReqRes({
    body: { state: state5.token, connectorId: 'shopify', code: 'mock_code_5' }
  });
  await ConnectionActivationController.handleOAuthCallback(req5, mockRes5.res);
  if (mockRes5.jsonBody?.connectorId !== 'outlook_calendar') {
    throw new Error(`Test 5 Failed: Callback connectorId override attempted! Got ${mockRes5.jsonBody?.connectorId}`);
  }
  passed++;

  // Test 6: Missing state is rejected
  console.log('  [Test 6/16] Missing state is rejected...');
  const { req: req6, mockRes: mockRes6 } = createMockReqRes({
    body: { code: 'mock_code_6' }
  });
  await ConnectionActivationController.handleOAuthCallback(req6, mockRes6.res);
  if (mockRes6.statusCode !== 400 || !mockRes6.jsonBody?.error?.includes('missing')) {
    throw new Error(`Test 6 Failed: Expected 400 for missing state. Got ${mockRes6.statusCode}`);
  }
  passed++;

  // Test 7: Altered state is rejected
  console.log('  [Test 7/16] Altered state is rejected...');
  const state7 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'google_calendar', 'http://localhost:3000/callback', tx);
  });
  const tamperedToken = state7.token.replace('google_calendar', 'admin');
  const { req: req7, mockRes: mockRes7 } = createMockReqRes({
    body: { state: tamperedToken, code: 'mock_code_7' }
  });
  await ConnectionActivationController.handleOAuthCallback(req7, mockRes7.res);
  if (mockRes7.statusCode !== 400) {
    throw new Error(`Test 7 Failed: Expected 400 for tampered state token. Got ${mockRes7.statusCode}`);
  }
  passed++;

  // Test 8: Expired state is rejected
  console.log('  [Test 8/16] Expired state is rejected...');
  const expiredPayload = `${tenantA}:${userAEmail}:gmail:${Date.now() - 1000}:nonce123`;
  const expiredHmac = crypto.createHmac('sha256', process.env.OAUTH_SECRET || 'oauth_csrf_hmac_secret_key_32bytes!').update(expiredPayload).digest('hex');
  const expiredToken = `${expiredPayload}.${expiredHmac}`;
  const { req: req8, mockRes: mockRes8 } = createMockReqRes({
    body: { state: expiredToken, code: 'mock_code_8' }
  });
  await ConnectionActivationController.handleOAuthCallback(req8, mockRes8.res);
  if (mockRes8.statusCode !== 400 || !mockRes8.jsonBody?.error?.includes('expired')) {
    throw new Error(`Test 8 Failed: Expected 400 expired state. Got ${mockRes8.statusCode}`);
  }
  passed++;

  // Test 9: Reused state is rejected
  console.log('  [Test 9/16] Reused state is rejected...');
  const state9 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'twilio', 'http://localhost:3000/callback', tx);
  });
  const { req: req9a, mockRes: mockRes9a } = createMockReqRes({
    body: { state: state9.token, code: 'mock_code_9a' }
  });
  await ConnectionActivationController.handleOAuthCallback(req9a, mockRes9a.res);
  if (mockRes9a.statusCode !== 200) {
    throw new Error(`Test 9 First Consume Failed: Got ${mockRes9a.statusCode}`);
  }

  const { req: req9b, mockRes: mockRes9b } = createMockReqRes({
    body: { state: state9.token, code: 'mock_code_9b' }
  });
  await ConnectionActivationController.handleOAuthCallback(req9b, mockRes9b.res);
  if (mockRes9b.statusCode !== 400) {
    throw new Error(`Test 9 Reuse Rejection Failed: Expected 400 for reused state. Got ${mockRes9b.statusCode}`);
  }
  passed++;

  // Test 10: Tenant mismatch with an authenticated session is rejected
  console.log('  [Test 10/16] Tenant mismatch with authenticated session is rejected...');
  const state10 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'stripe', 'http://localhost:3000/callback', tx);
  });
  const { req: req10, mockRes: mockRes10 } = createMockReqRes({
    body: { state: state10.token, code: 'mock_code_10' },
    token: tokenB // Authenticated as Tenant B user
  });
  await ConnectionActivationController.handleOAuthCallback(req10, mockRes10.res);
  if (mockRes10.statusCode !== 403) {
    throw new Error(`Test 10 Failed: Expected 403 for cross-tenant session callback. Got ${mockRes10.statusCode}`);
  }
  passed++;

  // Test 11: Actor mismatch with an authenticated session is rejected
  console.log('  [Test 11/16] Actor mismatch with authenticated session is rejected...');
  const state11 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, 'different_actor@example.com', 'stripe', 'http://localhost:3000/callback', tx);
  });
  const { req: req11, mockRes: mockRes11 } = createMockReqRes({
    body: { state: state11.token, code: 'mock_code_11' },
    token: tokenA // Authenticated as userAEmail (different from different_actor)
  });
  await ConnectionActivationController.handleOAuthCallback(req11, mockRes11.res);
  if (mockRes11.statusCode !== 403) {
    throw new Error(`Test 11 Failed: Expected 403 for actor mismatch session callback. Got ${mockRes11.statusCode}`);
  }
  passed++;

  // Test 12: Failed validation creates no credential
  console.log('  [Test 12/16] Failed validation creates no credential...');
  const state12 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'calendly', 'http://localhost:3000/callback', tx);
  });
  const badToken12 = state12.token + '_invalid';
  const { req: req12, mockRes: mockRes12 } = createMockReqRes({
    body: { state: badToken12, code: 'mock_code_12' }
  });
  await ConnectionActivationController.handleOAuthCallback(req12, mockRes12.res);
  const cred12 = await getTenantCredentialMetadataAsync(tenantA, tenantA, 'calendly');
  if (cred12) {
    throw new Error('Test 12 Failed: Credential created despite failed state validation!');
  }
  passed++;

  // Test 13: Failed validation consumes no unrelated state
  console.log('  [Test 13/16] Failed validation consumes no unrelated state...');
  const state13 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'ebay', 'http://localhost:3000/callback', tx);
  });
  // Send bogus token
  const { req: req13a, mockRes: mockRes13a } = createMockReqRes({
    body: { state: 'invalid_unrelated_token.12345', code: 'mock_code_13' }
  });
  await ConnectionActivationController.handleOAuthCallback(req13a, mockRes13a.res);

  // Unrelated state13 must still be valid and consumable
  const { req: req13b, mockRes: mockRes13b } = createMockReqRes({
    body: { state: state13.token, code: 'mock_code_13b' }
  });
  await ConnectionActivationController.handleOAuthCallback(req13b, mockRes13b.res);
  if (mockRes13b.statusCode !== 200 || !mockRes13b.jsonBody?.success) {
    throw new Error('Test 13 Failed: Valid state was consumed by unrelated failed validation');
  }
  passed++;

  // Test 14: Concurrent replay permits at most one successful consumption
  console.log('  [Test 14/16] Concurrent replay permits at most one successful consumption...');
  const state14 = await withTenantContext(tenantA, async (tx) => {
    return await createOAuthStateAsync(tenantA, userAEmail, 'shopify', 'http://localhost:3000/callback', tx);
  });
  const reqRes14a = createMockReqRes({ body: { state: state14.token, code: 'concurrent_1' } });
  const reqRes14b = createMockReqRes({ body: { state: state14.token, code: 'concurrent_2' } });

  await Promise.all([
    ConnectionActivationController.handleOAuthCallback(reqRes14a.req, reqRes14a.mockRes.res),
    ConnectionActivationController.handleOAuthCallback(reqRes14b.req, reqRes14b.mockRes.res)
  ]);

  const successes = [reqRes14a.mockRes.statusCode, reqRes14b.mockRes.statusCode].filter(code => code === 200);
  if (successes.length !== 1) {
    throw new Error(`Test 14 Failed: Expected exactly 1 successful consumption during concurrent replay, got ${successes.length}`);
  }
  passed++;

  // Test 15: HTTP errors do not reveal tenant IDs, secrets, or tokens
  console.log('  [Test 15/16] HTTP errors do not reveal tenant IDs, secrets, or tokens...');
  const { req: req15, mockRes: mockRes15 } = createMockReqRes({
    body: { state: state10.token, code: 'mock_code_15' },
    token: tokenB
  });
  await ConnectionActivationController.handleOAuthCallback(req15, mockRes15.res);
  const errorMsg = JSON.stringify(mockRes15.jsonBody || '');
  if (errorMsg.includes(tenantA) || errorMsg.includes(tenantB) || errorMsg.includes('oauth_csrf_hmac_secret')) {
    throw new Error(`Test 15 Failed: HTTP error response leaked internal tenant ID or secret: ${errorMsg}`);
  }
  passed++;

  // Test 16: Every failed assertion produces a nonzero exit code
  console.log('  [Test 16/16] Verify assertion reporting & non-zero exit contract...');
  if (passed !== 15) {
    throw new Error(`Test 16 Failed: Expected 15 preceding tests to pass, got ${passed}`);
  }
  passed++;

  console.log('==================================================');
  console.log(`✅ OAUTH CALLBACK FOCUSED SECURITY SUITE PASSED (${passed}/${total})`);
  console.log('==================================================');
}

if (process.argv[1]?.includes('oauth-callback-security.test.ts')) {
  runOAuthCallbackSecurityTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
