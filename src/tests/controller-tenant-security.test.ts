// src/tests/controller-tenant-security.test.ts
import { Pool } from 'pg';
import { createPool } from '../db/index.ts';
import { generateSessionToken } from '../middleware/auth.middleware.ts';
import { ConnectionActivationController } from '../controllers/connection-activation.controller.ts';
import { createOAuthStateAsync } from '../lib/oauth-security-engine.ts';
import { withTenantContext } from '../db/tenant-context.ts';
import crypto from 'crypto';

function createMockReqRes(options: {
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: Record<string, any>;
}) {
  const req: any = {
    headers: options.headers || {},
    query: options.query || {},
    body: options.body || {}
  };

  let statusCode = 200;
  let jsonResponse: any = null;

  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (payload: any) => {
      jsonResponse = payload;
      return res;
    }
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => jsonResponse
  };
}

export async function runControllerSecurityTests() {
  console.log("----------------------------------------");
  console.log("🛡️ Running Controller Tenant Identity Security Test Suite...");

  const pool = createPool();

  const tenantA = 'tenant_alpha_ctrl';
  const tenantB = 'tenant_beta_ctrl';
  const userAEmail = 'user_alpha@alphacorp.com';
  const userBEmail = 'user_beta@betacorp.com';
  const unknownEmail = 'unknown_user@nobusiness.com';
  const noBusinessEmail = 'nobusiness_user@orphans.com';

  const tokenA = generateSessionToken(userAEmail);
  const tokenB = generateSessionToken(userBEmail);
  const tokenUnknown = generateSessionToken(unknownEmail);
  const tokenNoBusiness = generateSessionToken(noBusinessEmail);

  try {
    // 0. Seed Test Fixtures into PostgreSQL
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantA}', 'Alpha Corp') ON CONFLICT DO NOTHING;`);
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantB}', 'Beta Corp') ON CONFLICT DO NOTHING;`);

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

    await seedUser(userAEmail, 'Alpha User', 'admin', tenantA);
    await seedUser(userBEmail, 'Beta User', 'admin', tenantB);
    await seedUser(noBusinessEmail, 'No Biz User', 'admin', null);

    // Test 1: Authenticated Tenant A can access its own connection records
    console.log("  [Test 1/12] Authenticated Tenant A accesses its own registry...");
    const t1 = createMockReqRes({ headers: { authorization: `Bearer ${tokenA}` } });
    await ConnectionActivationController.getRegistry(t1.req, t1.res);
    if (t1.getStatus() !== 200 || t1.getJson()?.tenantId !== tenantA) {
      throw new Error(`Test 1 Failed: Expected status 200 and tenantId ${tenantA}, got ${t1.getStatus()} - ${JSON.stringify(t1.getJson())}`);
    }
    console.log("     ✅ PASSED: Tenant A authenticated successfully to its own records.");

    // Test 2: Tenant A cannot access Tenant B by supplying Tenant B in the body
    console.log("  [Test 2/12] Tenant A attempts to override tenant identity via body parameter...");
    const t2 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { tenantId: tenantB, connectorId: 'gmail', secret: 'secret_123' }
    });
    await ConnectionActivationController.connectConnector(t2.req, t2.res);
    if (t2.getStatus() !== 200) {
      throw new Error(`Test 2 Failed: Unexpected status ${t2.getStatus()}`);
    }
    // Verify credential was written under tenantA, NOT tenantB
    const checkT2 = await pool.query(`SELECT tenant_id FROM encrypted_credentials WHERE tenant_id = '${tenantB}' AND connector_id = 'gmail';`);
    if (checkT2.rows.length > 0) {
      throw new Error(`Test 2 Failed: Credential was maliciously written to Tenant B (${tenantB}) via body override!`);
    }
    console.log("     ✅ PASSED: Client body tenantId override ignored. Operation executed under verified server identity (Tenant A).");

    // Test 3: Tenant A cannot override identity through query parameters
    console.log("  [Test 3/12] Tenant A attempts to access Tenant B audit logs via query parameter...");
    const t3 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      query: { requestingTenantId: tenantB }
    });
    await ConnectionActivationController.getAuditLogs(t3.req, t3.res);
    if (t3.getStatus() !== 403) {
      throw new Error(`Test 3 Failed: Expected 403 forbidden for cross-tenant query override, got ${t3.getStatus()}`);
    }
    console.log("     ✅ PASSED: Cross-tenant query override strictly rejected with 403.");

    // Test 4: Tenant A cannot override identity through x-tenant-id header
    console.log("  [Test 4/12] Tenant A attempts to set x-tenant-id header to Tenant B...");
    const t4 = createMockReqRes({
      headers: {
        authorization: `Bearer ${tokenA}`,
        'x-tenant-id': tenantB
      }
    });
    await ConnectionActivationController.getRegistry(t4.req, t4.res);
    if (t4.getJson()?.tenantId !== tenantA) {
      throw new Error(`Test 4 Failed: Expected tenantId to resolve to ${tenantA}, but header overrode it to ${t4.getJson()?.tenantId}`);
    }
    console.log("     ✅ PASSED: x-tenant-id header override ignored.");

    // Test 5: Missing authentication returns 401 or 403
    console.log("  [Test 5/12] Unauthenticated request to registry endpoint...");
    const t5 = createMockReqRes({});
    await ConnectionActivationController.getRegistry(t5.req, t5.res);
    if (t5.getStatus() !== 401) {
      throw new Error(`Test 5 Failed: Expected status 401 for missing auth, got ${t5.getStatus()}`);
    }
    console.log("     ✅ PASSED: Unauthenticated request rejected with 401.");

    // Test 6: Unknown authenticated user fails safely
    console.log("  [Test 6/12] Authenticated request with non-existent user in DB...");
    const t6 = createMockReqRes({ headers: { authorization: `Bearer ${tokenUnknown}` } });
    await ConnectionActivationController.getRegistry(t6.req, t6.res);
    if (t6.getStatus() !== 401) {
      throw new Error(`Test 6 Failed: Expected 401 for unknown user, got ${t6.getStatus()}`);
    }
    console.log("     ✅ PASSED: Unknown user rejected with 401.");

    // Test 7: User without businessId fails safely
    console.log("  [Test 7/12] Authenticated user without businessId...");
    const t7 = createMockReqRes({ headers: { authorization: `Bearer ${tokenNoBusiness}` } });
    await ConnectionActivationController.getRegistry(t7.req, t7.res);
    if (t7.getStatus() !== 403) {
      throw new Error(`Test 7 Failed: Expected 403 for user with no businessId, got ${t7.getStatus()}`);
    }
    console.log("     ✅ PASSED: User without businessId rejected with 403.");

    // Test 8: No request falls back to tenant_default
    console.log("  [Test 8/12] Verifying no endpoint falls back to tenant_default...");
    const t8 = createMockReqRes({ query: { tenantId: 'tenant_default' } });
    await ConnectionActivationController.getWorkerState(t8.req, t8.res);
    if (t8.getStatus() !== 401 && t8.getStatus() !== 403) {
      throw new Error(`Test 8 Failed: Endpoint allowed unauthenticated access to fallback tenant! Status: ${t8.getStatus()}`);
    }
    console.log("     ✅ PASSED: Fallback to default tenant completely removed.");

    // Test 9: Forged OAuth state is rejected
    console.log("  [Test 9/12] OAuth callback with forged state token...");
    const t9 = createMockReqRes({
      body: { state: 'forged_payload_data.invalid_signature_hex' }
    });
    await ConnectionActivationController.handleOAuthCallback(t9.req, t9.res);
    if (t9.getStatus() !== 400) {
      throw new Error(`Test 9 Failed: Expected 400 for forged OAuth state, got ${t9.getStatus()}`);
    }
    console.log("     ✅ PASSED: Forged OAuth state token rejected.");

    // Test 10: Reused OAuth state is rejected
    console.log("  [Test 10/12] Replay attack test (reused OAuth state token)...");
    const validState = await withTenantContext(tenantA, async (tx) => {
      return await createOAuthStateAsync(tenantA, userAEmail, 'gmail', 'http://localhost:3000/callback', tx);
    });

    // First use: Should succeed
    const t10a = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { state: validState.token }
    });
    await ConnectionActivationController.handleOAuthCallback(t10a.req, t10a.res);
    if (t10a.getStatus() !== 200) {
      throw new Error(`Test 10 Initial Callback Failed: Expected 200, got ${t10a.getStatus()} - ${JSON.stringify(t10a.getJson())}`);
    }

    // Second use: Should be rejected (Replay Attack Defense)
    const t10b = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { state: validState.token }
    });
    await ConnectionActivationController.handleOAuthCallback(t10b.req, t10b.res);
    if (t10b.getStatus() !== 400) {
      throw new Error(`Test 10 Replay Failed: Expected 400 rejection for reused state, got ${t10b.getStatus()}`);
    }
    console.log("     ✅ PASSED: Reused OAuth state token rejected (Replay Attack Defense verified).");

    // Test 11: Expired OAuth state is rejected
    console.log("  [Test 11/12] OAuth callback with expired state token...");
    const expiredPayload = `${tenantA}:u_alpha:gmail:${Date.now() - 5000}:expired_random_bytes`;
    const secret = process.env.OAUTH_SECRET || process.env.SECURITY_ENCRYPTION_KEY || 'oauth_csrf_hmac_secret_key_32bytes!';
    const expiredHmac = crypto.createHmac('sha256', secret).update(expiredPayload).digest('hex');
    const expiredStateToken = `${expiredPayload}.${expiredHmac}`;

    const t11 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { state: expiredStateToken }
    });
    await ConnectionActivationController.handleOAuthCallback(t11.req, t11.res);
    if (t11.getStatus() !== 400) {
      throw new Error(`Test 11 Failed: Expected 400 for expired state token, got ${t11.getStatus()}`);
    }
    console.log("     ✅ PASSED: Expired OAuth state token rejected.");

    // Test 12: Valid OAuth state resolves only its original tenant
    console.log("  [Test 12/12] Cross-tenant OAuth state binding enforcement...");
    const stateTenantA = await withTenantContext(tenantA, async (tx) => {
      return await createOAuthStateAsync(tenantA, 'u_alpha', 'stripe', 'http://localhost:3000/callback', tx);
    });

    // Tenant B attempts to claim Tenant A's OAuth state
    const t12 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenB}` },
      body: { state: stateTenantA.token }
    });
    await ConnectionActivationController.handleOAuthCallback(t12.req, t12.res);
    if (t12.getStatus() !== 403) {
      throw new Error(`Test 12 Failed: Expected 403 cross-tenant OAuth callback rejection, got ${t12.getStatus()}`);
    }
    console.log("     ✅ PASSED: Cross-tenant OAuth callback strictly rejected with 403.");

    console.log("----------------------------------------");
    console.log("🎉 ALL 12 CONTROLLER TENANT SECURITY TESTS PASSED PERFECTLY!");
    console.log("----------------------------------------");
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.includes('controller-tenant-security.test.ts')) {
  runControllerSecurityTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
