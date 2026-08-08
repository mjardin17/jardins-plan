// src/tests/deployable-improvements-security.test.ts
import { Pool } from 'pg';
import { createPool } from '../db/index.ts';
import { generateSessionToken } from '../middleware/auth.middleware.ts';
import { DeployableImprovementController } from '../controllers/deployable-improvement.controller.ts';
import { DeployableImprovementService } from '../services/deployable-improvement.service.ts';
import { DeployableImprovementRepository } from '../repositories/deployable-improvement.repository.ts';
import { withTenantContext } from '../db/tenant-context.ts';

function createMockReqRes(options: {
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: Record<string, any>;
  params?: Record<string, any>;
}) {
  const req: any = {
    headers: options.headers || {},
    query: options.query || {},
    body: options.body || {},
    params: options.params || {}
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

export async function runDeployableImprovementsSecurityTests() {
  console.log("----------------------------------------");
  console.log("🛡️ Running Deployable Improvements Group Tenant Isolation Security Test Suite...");

  const pool = createPool();

  const tenantA = 'tenant_alpha_dep_sec';
  const tenantB = 'tenant_beta_dep_sec';
  const userAEmail = 'user_dep_alpha@alphacorp.com';
  const userBEmail = 'user_dep_beta@betacorp.com';
  const unknownEmail = 'unknown_dep_user@nobusiness.com';
  const noBusinessEmail = 'nobusiness_dep_user@orphans.com';

  const tokenA = generateSessionToken(userAEmail);
  const tokenB = generateSessionToken(userBEmail);
  const tokenUnknown = generateSessionToken(unknownEmail);
  const tokenNoBusiness = generateSessionToken(noBusinessEmail);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`     ✅ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`     ❌ FAILED: ${message}`);
      failed++;
      throw new Error(`Security Test Failed: ${message}`);
    }
  }

  try {
    // Seed fixtures into DB
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantA}', 'Alpha Corp Dep') ON CONFLICT DO NOTHING;`);
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantB}', 'Beta Corp Dep') ON CONFLICT DO NOTHING;`);

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

    await seedUser(userAEmail, 'Alpha Dep User', 'admin', tenantA);
    await seedUser(userBEmail, 'Beta Dep User', 'admin', tenantB);
    await seedUser(noBusinessEmail, 'No Biz Dep User', 'admin', null);

    // Test 1: Authenticated Tenant A can access listImprovements
    console.log("  [Test 1/10] Authenticated Tenant A accesses listImprovements...");
    const t1 = createMockReqRes({ headers: { authorization: `Bearer ${tokenA}` } });
    await DeployableImprovementController.listImprovements(t1.req, t1.res);
    assert(t1.getStatus() === 200 && t1.getJson()?.tenantId === tenantA, "Tenant A authenticated successfully to list improvements.");

    // Test 2: Unauthenticated request to listImprovements returns 401
    console.log("  [Test 2/10] Unauthenticated request to listImprovements...");
    const t2 = createMockReqRes({});
    await DeployableImprovementController.listImprovements(t2.req, t2.res);
    assert(t2.getStatus() === 401, "Unauthenticated request strictly returned 401.");

    // Test 3: User with no businessId returns 401
    console.log("  [Test 3/10] User with no businessId accesses listImprovements...");
    const t3 = createMockReqRes({ headers: { authorization: `Bearer ${tokenNoBusiness}` } });
    await DeployableImprovementController.listImprovements(t3.req, t3.res);
    assert(t3.getStatus() === 401, "User without tenant association returned 401.");

    // Test 4: Tenant A cannot override identity via body parameter in generateFromOpportunity
    console.log("  [Test 4/10] Tenant A attempts to override tenantId via body parameter...");
    const t4 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: {
        tenantId: tenantB,
        opportunityId: 'opp_sec_01',
        title: 'Malicious Improvement',
        capabilityType: 'website_improvement',
        businessOutcome: 'improve_ai_discoverability'
      }
    });
    await DeployableImprovementController.generateFromOpportunity(t4.req, t4.res);
    assert(t4.getStatus() === 403, "Cross-tenant body override rejected with 403.");

    // Test 5: Tenant A cannot override identity via query parameter in listImprovements
    console.log("  [Test 5/10] Tenant A attempts query parameter tenantId override...");
    const t5 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      query: { tenantId: tenantB }
    });
    await DeployableImprovementController.listImprovements(t5.req, t5.res);
    assert(t5.getStatus() === 403, "Cross-tenant query override rejected with 403.");

    // Test 6: Tenant A cannot override identity via x-tenant-id header
    console.log("  [Test 6/10] Tenant A attempts x-tenant-id header override...");
    const t6 = createMockReqRes({
      headers: {
        authorization: `Bearer ${tokenA}`,
        'x-tenant-id': tenantB
      }
    });
    await DeployableImprovementController.listImprovements(t6.req, t6.res);
    assert(t6.getStatus() === 403, "Cross-tenant header override rejected with 403.");

    // Test 7: Tenant A generates improvement under its own verified identity
    console.log("  [Test 7/10] Tenant A generates improvement under verified identity...");
    const t7 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: {
        opportunityId: 'opp_sec_02',
        title: 'Alpha Corp Valid Improvement',
        capabilityType: 'website_improvement',
        businessOutcome: 'improve_ai_discoverability'
      }
    });
    await DeployableImprovementController.generateFromOpportunity(t7.req, t7.res);
    assert(t7.getStatus() === 201 && t7.getJson()?.data?.tenantId === tenantA, "Improvement successfully created under Tenant A.");

    const impAId = t7.getJson()?.data?.id;

    // Test 8: Tenant B cannot get Tenant A's improvement by ID
    console.log("  [Test 8/10] Tenant B attempts to access Tenant A's improvement by ID...");
    const t8 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenB}` },
      params: { id: impAId }
    });
    await DeployableImprovementController.getImprovement(t8.req, t8.res);
    assert(t8.getStatus() === 404, "Tenant B cannot access Tenant A's improvement (404 returned).");

    // Test 9: Service level tenant isolation with withTenantContext
    console.log("  [Test 9/10] Direct service-level tenant isolation check...");
    let serviceIsolationPassed = false;
    try {
      await DeployableImprovementService.getImprovement(tenantB, impAId);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        serviceIsolationPassed = true;
      }
    }
    assert(serviceIsolationPassed, "DeployableImprovementService enforces tenant boundaries.");

    // Test 10: RLS enforcement test via withTenantContext
    console.log("  [Test 10/10] RLS enforcement test for deployable_improvements...");
    const rlsCheck = await withTenantContext(tenantB, async (tx) => {
      return await tx.select().from(DeployableImprovementRepository.getImprovement ? (await import('../db/schema.ts')).deployableImprovements : null as any).where((await import('drizzle-orm')).eq((await import('../db/schema.ts')).deployableImprovements.id, impAId));
    });
    assert(rlsCheck.length === 0, "PostgreSQL RLS prevented Tenant B from selecting Tenant A record.");

  } catch (err: any) {
    console.error("FATAL UNHANDLED ERROR IN DEPLOYABLE IMPROVEMENTS SECURITY SUITE:", err);
    failed++;
  } finally {
    await pool.end().catch(() => {});
  }

  console.log(`\n==================================================`);
  console.log(`DEPLOYABLE IMPROVEMENTS SECURITY SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    throw new Error(`Deployable Improvements security tests failed: ${failed} errors.`);
  }
}

// Allow standalone execution
if (process.argv[1]?.endsWith('deployable-improvements-security.test.ts')) {
  runDeployableImprovementsSecurityTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
