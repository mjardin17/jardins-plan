// src/tests/business-discovery-security.test.ts
import { Pool } from 'pg';
import { createPool } from '../db/index.ts';
import { generateSessionToken } from '../middleware/auth.middleware.ts';
import { BusinessDiscoveryController } from '../controllers/business-discovery.controller.ts';
import { BusinessDiscoveryRepository } from '../repositories/business-discovery.repository.ts';

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

export async function runBusinessDiscoverySecurityTests() {
  console.log("----------------------------------------");
  console.log("🛡️ Running Business Discovery Tenant Security Test Suite...");

  const pool = createPool();

  const tenantA = 'disc_tenant_alpha';
  const tenantB = 'disc_tenant_beta';
  const userAEmail = 'disc_user_alpha@alphacorp.com';
  const userBEmail = 'disc_user_beta@betacorp.com';
  const unknownEmail = 'disc_unknown_user@nobusiness.com';
  const noBusinessEmail = 'disc_nobusiness_user@orphans.com';

  const tokenA = generateSessionToken(userAEmail);
  const tokenB = generateSessionToken(userBEmail);
  const tokenUnknown = generateSessionToken(unknownEmail);
  const tokenNoBusiness = generateSessionToken(noBusinessEmail);

  try {
    // 0. Seed Test Fixtures into PostgreSQL
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantA}', 'Disc Alpha Corp') ON CONFLICT DO NOTHING;`);
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantB}', 'Disc Beta Corp') ON CONFLICT DO NOTHING;`);

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

    await seedUser(userAEmail, 'Disc Alpha User', 'admin', tenantA);
    await seedUser(userBEmail, 'Disc Beta User', 'admin', tenantB);
    await seedUser(noBusinessEmail, 'Disc No Biz User', 'admin', null);

    BusinessDiscoveryRepository.clearCache();

    // Test 1: Authenticated Tenant A accesses its own discovery data
    console.log("  [Test 1/10] Authenticated Tenant A accesses its own discovery data...");
    const t1 = createMockReqRes({ headers: { authorization: `Bearer ${tokenA}` } });
    await BusinessDiscoveryController.getDiscoveryData(t1.req, t1.res);
    if (t1.getStatus() !== 200 || !t1.getJson()?.success || !t1.getJson()?.data?.profile) {
      throw new Error(`Test 1 Failed: Expected 200 with discovery data, got ${t1.getStatus()} - ${JSON.stringify(t1.getJson())}`);
    }
    console.log("     ✅ PASSED: Tenant A authenticated and retrieved discovery state.");

    // Test 2: Tenant A cannot access Tenant B by supplying Tenant B in query parameter
    console.log("  [Test 2/10] Tenant A attempts to read Tenant B discovery data via query parameter override...");
    const t2 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      query: { tenantId: tenantB }
    });
    await BusinessDiscoveryController.getDiscoveryData(t2.req, t2.res);
    if (t2.getStatus() !== 403) {
      throw new Error(`Test 2 Failed: Expected 403 forbidden for tenant query override, got ${t2.getStatus()}`);
    }
    console.log("     ✅ PASSED: Query tenantId override strictly rejected with 403.");

    // Test 3: Tenant A cannot submit interview answers for Tenant B
    console.log("  [Test 3/10] Tenant A attempts to submit answer for Tenant B in body...");
    const t3 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { tenantId: tenantB, questionId: 'q_pricing', answer: '$150', action: 'ANSWER' }
    });
    await BusinessDiscoveryController.submitAnswer(t3.req, t3.res);
    if (t3.getStatus() !== 403) {
      throw new Error(`Test 3 Failed: Expected 403 forbidden for body tenant override in submitAnswer, got ${t3.getStatus()}`);
    }
    console.log("     ✅ PASSED: Body tenantId override in submitAnswer strictly rejected with 403.");

    // Test 4: Tenant A cannot update worker autonomy for Tenant B
    console.log("  [Test 4/10] Tenant A attempts to update worker autonomy for Tenant B...");
    const t4 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { tenantId: tenantB, workerId: 'worker_listing_assistant', autonomyLevel: 'FULL_AUTONOMY', approved: true }
    });
    await BusinessDiscoveryController.updateWorkerAutonomy(t4.req, t4.res);
    if (t4.getStatus() !== 403) {
      throw new Error(`Test 4 Failed: Expected 403 forbidden for body tenant override in updateWorkerAutonomy, got ${t4.getStatus()}`);
    }
    console.log("     ✅ PASSED: Worker autonomy update override strictly rejected with 403.");

    // Test 5: Tenant A cannot update experiment results for Tenant B
    console.log("  [Test 5/10] Tenant A attempts to update experiment results for Tenant B...");
    const t5 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { tenantId: tenantB, experimentId: 'exp_1', actualOutcome: 'Hacked', decision: 'EXPAND' }
    });
    await BusinessDiscoveryController.updateExperimentResults(t5.req, t5.res);
    if (t5.getStatus() !== 403) {
      throw new Error(`Test 5 Failed: Expected 403 forbidden for body tenant override in updateExperimentResults, got ${t5.getStatus()}`);
    }
    console.log("     ✅ PASSED: Experiment results update override strictly rejected with 403.");

    // Test 6: Missing authentication fails with 401
    console.log("  [Test 6/10] Unauthenticated request to discovery endpoint...");
    const t6 = createMockReqRes({});
    await BusinessDiscoveryController.getDiscoveryData(t6.req, t6.res);
    if (t6.getStatus() !== 401) {
      throw new Error(`Test 6 Failed: Expected status 401 for missing auth, got ${t6.getStatus()}`);
    }
    console.log("     ✅ PASSED: Unauthenticated request rejected with 401.");

    // Test 7: Unknown user fails with 401
    console.log("  [Test 7/10] Authenticated request with non-existent user in DB...");
    const t7 = createMockReqRes({ headers: { authorization: `Bearer ${tokenUnknown}` } });
    await BusinessDiscoveryController.getDiscoveryData(t7.req, t7.res);
    if (t7.getStatus() !== 401) {
      throw new Error(`Test 7 Failed: Expected 401 for unknown user, got ${t7.getStatus()}`);
    }
    console.log("     ✅ PASSED: Unknown user rejected with 401.");

    // Test 8: User without businessId fails with 401
    console.log("  [Test 8/10] Authenticated user without businessId...");
    const t8 = createMockReqRes({ headers: { authorization: `Bearer ${tokenNoBusiness}` } });
    await BusinessDiscoveryController.getDiscoveryData(t8.req, t8.res);
    if (t8.getStatus() !== 401) {
      throw new Error(`Test 8 Failed: Expected 401 for user with no businessId, got ${t8.getStatus()}`);
    }
    console.log("     ✅ PASSED: User without businessId rejected with 401.");

    // Test 9: Verify discovery state written to DB is tenant-isolated in Postgres business_memory
    console.log("  [Test 9/10] Verifying discovery data written under Tenant A is isolated in business_memory...");
    const clientTest9 = await pool.connect();
    try {
      await clientTest9.query("BEGIN;");
      await clientTest9.query(`SELECT set_config('app.current_tenant', $1, true);`, [tenantA]);
      const checkDbA = await clientTest9.query(`SELECT business_id, key FROM business_memory WHERE business_id = $1 AND key = 'discovery_engine_state';`, [tenantA]);
      if (checkDbA.rows.length === 0) {
        throw new Error(`Test 9 Failed: Discovery data for Tenant A was not persisted to business_memory under ${tenantA}!`);
      }
      await clientTest9.query("COMMIT;");
    } finally {
      clientTest9.release();
    }

    const clientTest9B = await pool.connect();
    try {
      await clientTest9B.query("BEGIN;");
      await clientTest9B.query(`SELECT set_config('app.current_tenant', $1, true);`, [tenantB]);
      const checkDbB = await clientTest9B.query(`SELECT business_id, key FROM business_memory WHERE business_id = $1 AND key = 'discovery_engine_state';`, [tenantA]);
      if (checkDbB.rows.length > 0) {
        throw new Error(`Test 9 Failed: Tenant B was able to query Tenant A's discovery data in business_memory!`);
      }
      await clientTest9B.query("COMMIT;");
    } finally {
      clientTest9B.release();
    }
    console.log("     ✅ PASSED: Database storage in business_memory strictly tenant-isolated under RLS.");

    // Test 10: Verify audit log entries are attributed to authenticated actor email
    console.log("  [Test 10/10] Verifying audit log entries are attributed to authenticated actor email...");
    const t10 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { questionId: 'q_primary_channel', answer: 'eBay', action: 'ANSWER' }
    });
    await BusinessDiscoveryController.submitAnswer(t10.req, t10.res);
    if (t10.getStatus() !== 200) {
      throw new Error(`Test 10 Failed: Expected status 200, got ${t10.getStatus()}`);
    }
    const clientTest10 = await pool.connect();
    let checkAuditRows: any[] = [];
    try {
      await clientTest10.query("BEGIN;");
      await clientTest10.query(`SELECT set_config('app.current_tenant', $1, true);`, [tenantA]);
      const resAudit = await clientTest10.query(`SELECT user_email, action FROM audit_logs WHERE business_id = $1 AND action = 'SUBMIT_INTERVIEW_ANSWER';`, [tenantA]);
      checkAuditRows = resAudit.rows;
      await clientTest10.query("COMMIT;");
    } finally {
      clientTest10.release();
    }

    if (checkAuditRows.length === 0 || checkAuditRows[0].user_email !== userAEmail) {
      throw new Error(`Test 10 Failed: Audit log entry missing or actor email mismatch! Got: ${JSON.stringify(checkAuditRows)}`);
    }
    console.log("     ✅ PASSED: Audit log entries correctly attributed to authenticated actor email.");

    console.log("----------------------------------------");
    console.log("🎉 ALL 10 BUSINESS DISCOVERY SECURITY TESTS PASSED PERFECTLY!");
    console.log("----------------------------------------");
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith('business-discovery-security.test.ts')) {
  runBusinessDiscoverySecurityTests().catch((err) => {
    console.error("❌ Business Discovery Security Tests Failed:", err);
    process.exit(1);
  });
}
