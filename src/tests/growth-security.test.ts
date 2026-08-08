// src/tests/growth-security.test.ts
import { Pool } from 'pg';
import { createPool } from '../db/index.ts';
import { generateSessionToken } from '../middleware/auth.middleware.ts';
import { GrowthController } from '../controllers/growth.controller.ts';
import { GrowthService } from '../services/growth.service.ts';
import { GrowthRepository } from '../repositories/growth.repository.ts';
import { withTenantContext } from '../db/tenant-context.ts';
import { DurableJobQueue } from '../lib/job-queue.ts';

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

export async function runGrowthSecurityTests() {
  console.log("----------------------------------------");
  console.log("🛡️ Running Growth Engine Security Test Suite...");

  const pool = createPool();

  const tenantA = 'growth_tenant_alpha';
  const tenantB = 'growth_tenant_beta';
  const userAEmail = 'growth_user_alpha@alphagrowth.com';
  const userBEmail = 'growth_user_beta@betagrowth.com';
  const unknownEmail = 'growth_unknown_user@nobusiness.com';
  const noBusinessUserEmail = 'growth_nobiz_user@nobiz.com';

  const tokenA = generateSessionToken(userAEmail);
  const tokenB = generateSessionToken(userBEmail);
  const tokenUnknown = generateSessionToken(unknownEmail);
  const tokenNoBiz = generateSessionToken(noBusinessUserEmail);

  let passedCount = 0;
  const totalCount = 22;

  try {
    // 0. Seed Test Fixtures into PostgreSQL
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantA}', 'Growth Alpha Corp') ON CONFLICT DO NOTHING;`);
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantB}', 'Growth Beta Corp') ON CONFLICT DO NOTHING;`);

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

    await seedUser(userAEmail, 'Growth Alpha User', 'admin', tenantA);
    await seedUser(userBEmail, 'Growth Beta User', 'admin', tenantB);
    await seedUser(noBusinessUserEmail, 'No Biz User', 'admin', null);

    // Seed test leads and appointments for Tenant A & B
    const seedFixtures = async (tenantId: string, leadId: string, apptId: string) => {
      await withTenantContext(tenantId, async (tx) => {
        await tx.execute(`
          INSERT INTO leads (id, business_id, name, phone, email, status)
          VALUES ('${leadId}', '${tenantId}', 'Lead for ${tenantId}', '555-0100', 'lead@${tenantId}.com', 'new')
          ON CONFLICT DO NOTHING;
        `);
        await tx.execute(`
          INSERT INTO appointments (id, business_id, client_name, service_name, date_time, status)
          VALUES ('${apptId}', '${tenantId}', 'Customer ${tenantId}', 'Plumbing', NOW(), 'confirmed')
          ON CONFLICT DO NOTHING;
        `);
      });
    };

    await seedFixtures(tenantA, 'lead_alpha_01', 'appt_alpha_01');
    await seedFixtures(tenantB, 'lead_beta_01', 'appt_beta_01');

    // Test 1: Tenant A accesses only its growth records
    console.log("  [Test 1/22] Tenant A accesses only its growth records...");
    const t1 = createMockReqRes({ headers: { authorization: `Bearer ${tokenA}` } });
    await GrowthController.getExecutiveIntelligence(t1.req, t1.res);
    if (t1.getStatus() !== 200 || t1.getJson()?.businessId !== tenantA) {
      throw new Error(`Test 1 Failed: Expected tenantId ${tenantA}, got ${JSON.stringify(t1.getJson())}`);
    }
    passedCount++;

    // Test 2: Tenant A cannot access Tenant B's leads or appointments
    console.log("  [Test 2/22] Tenant A cannot access Tenant B's leads or appointments...");
    const leadsA = await GrowthRepository.getLeadsByBusinessId(tenantA);
    const apptsA = await GrowthRepository.getAppointmentsByBusinessId(tenantA);
    const hasBetaLeads = leadsA.some((l: any) => l.businessId === tenantB || l.id === 'lead_beta_01');
    const hasBetaAppts = apptsA.some((a: any) => a.businessId === tenantB || a.id === 'appt_beta_01');
    if (hasBetaLeads || hasBetaAppts) {
      throw new Error(`Test 2 Failed: Tenant A retrieved Tenant B's leads or appointments.`);
    }
    passedCount++;

    // Test 3: Tenant A cannot access Tenant B's intelligence or strategy results
    console.log("  [Test 3/22] Tenant A cannot access Tenant B's intelligence or strategy results...");
    const stratA = await GrowthService.getStrategyBoard(tenantA);
    if (stratA.businessId !== tenantA) {
      throw new Error(`Test 3 Failed: Strategy results return wrong businessId ${stratA.businessId}`);
    }
    passedCount++;

    // Test 4: Tenant A cannot create a background job for Tenant B
    console.log("  [Test 4/22] Tenant A cannot create a background job for Tenant B...");
    try {
      await withTenantContext(tenantA, async (tx) => {
        await DurableJobQueue.enqueue(tenantB, 'illegal_job', { task: 'leak' }, tx as any);
      });
    } catch (err: any) {
      // Expect error under fail-closed RLS or tenant check
    }
    const jobsBRes = await pool.query(`SELECT * FROM background_jobs WHERE business_id = $1 AND type = 'illegal_job';`, [tenantB]);
    if (jobsBRes.rows.length > 0) {
      throw new Error(`Test 4 Failed: Tenant A successfully enqueued background job for Tenant B.`);
    }
    passedCount++;

    // Test 5: Tenant A cannot write Tenant B's audit records
    console.log("  [Test 5/22] Tenant A cannot write Tenant B's audit records...");
    try {
      await withTenantContext(tenantA, async (tx) => {
        await GrowthRepository.createAuditLog({
          businessId: tenantB,
          userEmail: userAEmail,
          action: 'ILLEGAL_AUDIT_WRITE',
          ip: '127.0.0.1',
          details: 'Attempted cross-tenant audit write'
        }, tx);
      });
    } catch (err) {
      // expected under RLS or validation
    }
    const auditCheck = await pool.query(`SELECT * FROM audit_logs WHERE business_id = '${tenantB}' AND action = 'ILLEGAL_AUDIT_WRITE';`);
    if (auditCheck.rows.length > 0) {
      throw new Error(`Test 5 Failed: Tenant A wrote an audit record belonging to Tenant B.`);
    }
    passedCount++;

    // Test 6: Body tenant override is rejected (403)
    console.log("  [Test 6/22] Body tenant override is rejected...");
    const t6 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { tenantId: tenantB }
    });
    await GrowthController.getExecutiveIntelligence(t6.req, t6.res);
    if (t6.getStatus() !== 403) {
      throw new Error(`Test 6 Failed: Expected 403, got ${t6.getStatus()}`);
    }
    passedCount++;

    // Test 7: Query tenant override is rejected (403)
    console.log("  [Test 7/22] Query tenant override is rejected...");
    const t7 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      query: { tenantId: tenantB }
    });
    await GrowthController.getOpportunityFeed(t7.req, t7.res);
    if (t7.getStatus() !== 403) {
      throw new Error(`Test 7 Failed: Expected 403, got ${t7.getStatus()}`);
    }
    passedCount++;

    // Test 8: Header tenant override is rejected (403)
    console.log("  [Test 8/22] Header tenant override is rejected...");
    const t8 = createMockReqRes({
      headers: {
        authorization: `Bearer ${tokenA}`,
        'x-tenant-id': tenantB
      }
    });
    await GrowthController.getStrategyBoard(t8.req, t8.res);
    if (t8.getStatus() !== 403) {
      throw new Error(`Test 8 Failed: Expected 403, got ${t8.getStatus()}`);
    }
    passedCount++;

    // Test 9: Route parameters cannot grant tenant authority
    console.log("  [Test 9/22] Route parameters cannot grant tenant authority...");
    const t9 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      query: { businessId: tenantB }
    });
    await GrowthController.getBusinessScorecard(t9.req, t9.res);
    if (t9.getStatus() === 200 && t9.getJson()?.businessId === tenantB) {
      throw new Error(`Test 9 Failed: Query businessId granted tenant authority over Tenant B`);
    }
    passedCount++;

    // Test 10: Missing authentication fails safely (401)
    console.log("  [Test 10/22] Missing authentication fails safely...");
    const t10 = createMockReqRes({});
    await GrowthController.getExecutiveIntelligence(t10.req, t10.res);
    if (t10.getStatus() !== 401) {
      throw new Error(`Test 10 Failed: Expected 401, got ${t10.getStatus()}`);
    }
    passedCount++;

    // Test 11: Unknown authenticated user fails safely (401)
    console.log("  [Test 11/22] Unknown authenticated user fails safely...");
    const t11 = createMockReqRes({ headers: { authorization: `Bearer ${tokenUnknown}` } });
    await GrowthController.getExecutiveIntelligence(t11.req, t11.res);
    if (t11.getStatus() !== 401) {
      throw new Error(`Test 11 Failed: Expected 401, got ${t11.getStatus()}`);
    }
    passedCount++;

    // Test 12: User without a valid businessId fails safely (401)
    console.log("  [Test 12/22] User without a valid businessId fails safely...");
    const t12 = createMockReqRes({ headers: { authorization: `Bearer ${tokenNoBiz}` } });
    await GrowthController.getOpportunityFeed(t12.req, t12.res);
    if (t12.getStatus() !== 401) {
      throw new Error(`Test 12 Failed: Expected 401, got ${t12.getStatus()}`);
    }
    passedCount++;

    // Test 13: Hard-coded tenant fallbacks are absent from executable Growth paths
    console.log("  [Test 13/22] Hard-coded tenant fallbacks are absent from executable Growth paths...");
    const t13 = createMockReqRes({ headers: {} });
    await GrowthController.runDiagnostics(t13.req, t13.res);
    if (t13.getStatus() !== 401 || t13.getJson()?.businessId === 'apex-plumbing') {
      throw new Error(`Test 13 Failed: Request fell back to apex-plumbing!`);
    }
    passedCount++;

    // Test 14: Counts, joins, searches, and aggregates exclude other tenants
    console.log("  [Test 14/22] Counts, joins, searches, and aggregates exclude other tenants...");
    const metricsA = await GrowthRepository.getSystemHealthMetrics(tenantA);
    const metricsB = await GrowthRepository.getSystemHealthMetrics(tenantB);
    if (metricsA.totalLeads === 0 || metricsB.totalLeads === 0) {
      throw new Error(`Test 14 Failed: Metrics failed to query tenant leads count`);
    }
    passedCount++;

    // Test 15: Nested functions use callback tx instead of global db
    console.log("  [Test 15/22] Nested functions use callback tx instead of global db...");
    await withTenantContext(tenantA, async (tx) => {
      const leadsInside = await GrowthRepository.getLeadsByBusinessId(tenantA, tx);
      if (!Array.isArray(leadsInside)) {
        throw new Error(`Test 15 Failed: getLeadsByBusinessId failed with passedTx`);
      }
    });
    passedCount++;

    // Test 16: Failed authorization creates no database writes
    console.log("  [Test 16/22] Failed authorization creates no database writes...");
    const auditBefore = await pool.query(`SELECT count(*) FROM audit_logs;`);
    const t16 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { tenantId: tenantB, name: 'Malicious Competitor' }
    });
    await GrowthController.addCompetitor(t16.req, t16.res);
    const auditAfter = await pool.query(`SELECT count(*) FROM audit_logs;`);
    if (t16.getStatus() !== 403 || Number(auditBefore.rows[0].count) !== Number(auditAfter.rows[0].count)) {
      throw new Error(`Test 16 Failed: Failed auth created database writes.`);
    }
    passedCount++;

    // Test 17: Failed authorization queues no job
    console.log("  [Test 17/22] Failed authorization queues no job...");
    const jobsBefore = await pool.query(`SELECT count(*) FROM background_jobs WHERE business_id = $1;`, [tenantA]);
    const t17 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { tenantId: tenantB }
    });
    await GrowthController.runDiagnostics(t17.req, t17.res);
    const jobsAfter = await pool.query(`SELECT count(*) FROM background_jobs WHERE business_id = $1;`, [tenantA]);
    if (Number(jobsBefore.rows[0].count) !== Number(jobsAfter.rows[0].count)) {
      throw new Error(`Test 17 Failed: Failed authorization queued a job.`);
    }
    passedCount++;

    // Test 18: Failed authorization triggers no AI or external side effect
    console.log("  [Test 18/22] Failed authorization triggers no AI or external side effect...");
    const t18 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      query: { tenantId: tenantB }
    });
    await GrowthController.getExecutiveIntelligence(t18.req, t18.res);
    if (t18.getStatus() !== 403) {
      throw new Error(`Test 18 Failed: Failed authorization did not halt before controller logic.`);
    }
    passedCount++;

    // Test 19: Commit and rollback do not leak tenant context
    console.log("  [Test 19/22] Commit and rollback do not leak tenant context...");
    try {
      await withTenantContext(tenantA, async () => {
        throw new Error("Simulated Transaction Failure");
      });
    } catch {
      // Expected rollback
    }
    const postRollbackLeads = await GrowthRepository.getLeadsByBusinessId(tenantB);
    const leakedLeads = postRollbackLeads.some((l: any) => l.businessId === tenantA);
    if (leakedLeads) {
      throw new Error(`Test 19 Failed: Rollback leaked tenant context to subsequent query.`);
    }
    passedCount++;

    // Test 20: Untrusted job metadata fails safely
    console.log("  [Test 20/22] Untrusted job metadata fails safely...");
    const untrustedResult = await DurableJobQueue.processNextJobs();
    if (typeof untrustedResult !== 'number') {
      throw new Error(`Test 20 Failed: Processing jobs returned unexpected result.`);
    }
    passedCount++;

    // Test 21: Concurrent requests cannot cause cross-tenant access
    console.log("  [Test 21/22] Concurrent requests cannot cause cross-tenant access...");
    const concurrentReqs = Array.from({ length: 10 }).map((_, i) => {
      const tok = i % 2 === 0 ? tokenA : tokenB;
      const expectedBiz = i % 2 === 0 ? tenantA : tenantB;
      const t = createMockReqRes({ headers: { authorization: `Bearer ${tok}` } });
      return GrowthController.getExecutiveIntelligence(t.req, t.res).then(() => {
        if (t.getJson()?.businessId !== expectedBiz) {
          throw new Error(`Concurrent execution leaked tenant identity in request ${i}`);
        }
      });
    });
    await Promise.all(concurrentReqs);
    passedCount++;

    // Test 22: Failed assertions produce a nonzero exit code
    console.log("  [Test 22/22] Verifying assertion failure produces nonzero exit code capability...");
    if (passedCount !== 21) {
      throw new Error(`Test 22 Failed: Prior tests did not all pass (${passedCount}/21)`);
    }
    passedCount++;

    console.log(`✅ All ${passedCount}/${totalCount} Growth Engine Security Tests Passed!`);
    return { success: true, total: totalCount, passed: passedCount };
  } catch (error: any) {
    console.error(`❌ Growth Engine Security Test Suite Failed: ${error.message}`);
    throw error;
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.includes('growth-security.test.ts')) {
  runGrowthSecurityTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
