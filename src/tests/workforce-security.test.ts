// src/tests/workforce-security.test.ts
import { Pool } from 'pg';
import { createPool } from '../db/index.ts';
import { generateSessionToken } from '../middleware/auth.middleware.ts';
import { WorkforceController } from '../controllers/workforce.controller.ts';
import { WorkforceEngine, MCPToolRegistry } from '../lib/workforce-engine.ts';
import { MultiAgentEngine } from '../lib/multi-agent-engine.ts';

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

export async function runWorkforceSecurityTests() {
  console.log("----------------------------------------");
  console.log("🛡️ Running Workforce Engine Tenant Security Test Suite...");

  const pool = createPool();

  const tenantA = 'work_tenant_alpha';
  const tenantB = 'work_tenant_beta';
  const userAEmail = 'work_user_alpha@alphacorp.com';
  const userBEmail = 'work_user_beta@betacorp.com';
  const unknownEmail = 'work_unknown_user@nobusiness.com';

  const tokenA = generateSessionToken(userAEmail);
  const tokenB = generateSessionToken(userBEmail);
  const tokenUnknown = generateSessionToken(unknownEmail);

  try {
    // 0. Seed Test Fixtures into PostgreSQL
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantA}', 'Work Alpha Corp') ON CONFLICT DO NOTHING;`);
    await pool.query(`INSERT INTO businesses (id, name) VALUES ('${tenantB}', 'Work Beta Corp') ON CONFLICT DO NOTHING;`);

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

    await seedUser(userAEmail, 'Work Alpha User', 'admin', tenantA);
    await seedUser(userBEmail, 'Work Beta User', 'admin', tenantB);

    // Test 1: Authenticated Tenant A accesses executeAgent endpoint
    console.log("  [Test 1/10] Authenticated Tenant A accesses executeAgent endpoint...");
    const t1 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { agentRole: 'Receptionist', taskPrompt: 'Hello' }
    });
    await WorkforceController.executeAgent(t1.req, t1.res);
    if (t1.getStatus() !== 200 || !t1.getJson()?.success) {
      throw new Error(`Test 1 Failed: Expected 200 with result, got ${t1.getStatus()} - ${JSON.stringify(t1.getJson())}`);
    }
    console.log("     ✅ PASSED: Tenant A authenticated and executed agent task.");

    // Test 2: Tenant A cannot access Tenant B execution via query override
    console.log("  [Test 2/10] Tenant A attempts executeAgent with Tenant B query parameter override...");
    const t2 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      query: { tenantId: tenantB },
      body: { agentRole: 'Receptionist', taskPrompt: 'Hello' }
    });
    await WorkforceController.executeAgent(t2.req, t2.res);
    if (t2.getStatus() !== 403) {
      throw new Error(`Test 2 Failed: Expected 403 forbidden for tenant query override, got ${t2.getStatus()}`);
    }
    console.log("     ✅ PASSED: Query tenantId override strictly rejected with 403.");

    // Test 3: Tenant A cannot trigger workflow under Tenant B via body override
    console.log("  [Test 3/10] Tenant A attempts executeWorkflow with Tenant B body override...");
    const t3 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}` },
      body: { tenantId: tenantB, workflowType: 'new_customer', params: {} }
    });
    await WorkforceController.executeWorkflow(t3.req, t3.res);
    if (t3.getStatus() !== 403) {
      throw new Error(`Test 3 Failed: Expected 403 forbidden for body tenant override in executeWorkflow, got ${t3.getStatus()}`);
    }
    console.log("     ✅ PASSED: Body tenantId override in executeWorkflow strictly rejected with 403.");

    // Test 4: Queue task for Tenant A and verify stored under Tenant A
    console.log("  [Test 4/10] Queueing task under Tenant A via WorkforceEngine.queueTask...");
    const taskA = await WorkforceEngine.queueTask(tenantA, null, "Lead Qualification", { leadId: "lead_123" });
    if (!taskA || taskA.businessId !== tenantA) {
      throw new Error(`Test 4 Failed: Task created does not belong to ${tenantA}: ${JSON.stringify(taskA)}`);
    }
    console.log("     ✅ PASSED: Task queued under Tenant A context.");

    // Test 5: Tenant B processPendingQueue cannot see or process Tenant A task
    console.log("  [Test 5/10] Verifying Tenant B processPendingQueue isolated from Tenant A task...");
    await WorkforceEngine.processPendingQueue(tenantB);
    // Verify taskA remains pending and unprocessed by Tenant B
    const clientTest5 = await pool.connect();
    try {
      await clientTest5.query("BEGIN;");
      await clientTest5.query(`SELECT set_config('app.current_tenant', $1, true);`, [tenantA]);
      const res5 = await clientTest5.query(`SELECT id, status FROM agent_tasks WHERE id = $1;`, [taskA.id]);
      if (res5.rows.length === 0 || res5.rows[0].status !== 'pending') {
        throw new Error(`Test 5 Failed: Task A status changed unexpectedly: ${JSON.stringify(res5.rows)}`);
      }
      await clientTest5.query("COMMIT;");
    } finally {
      clientTest5.release();
    }
    console.log("     ✅ PASSED: Tenant B queue execution isolated from Tenant A tasks.");

    // Test 6: MultiAgentEngine agent registry isolation per tenant
    console.log("  [Test 6/10] Verifying MultiAgentEngine agent registry tenant isolation...");
    const agentsA = await MultiAgentEngine.getAgents(tenantA);
    const agentsB = await MultiAgentEngine.getAgents(tenantB);
    if (!agentsA || agentsA.length === 0 || agentsA[0].businessId !== tenantA) {
      throw new Error(`Test 6 Failed: Tenant A agents invalid or leaked: ${JSON.stringify(agentsA)}`);
    }
    if (!agentsB || agentsB.length === 0 || agentsB[0].businessId !== tenantB) {
      throw new Error(`Test 6 Failed: Tenant B agents invalid or leaked: ${JSON.stringify(agentsB)}`);
    }
    console.log("     ✅ PASSED: MultiAgentEngine agent registry strictly tenant-isolated.");

    // Test 7: Missing authentication fails with 401
    console.log("  [Test 7/10] Unauthenticated request to executeAgent endpoint...");
    const t7 = createMockReqRes({ body: { taskPrompt: 'Hello' } });
    await WorkforceController.executeAgent(t7.req, t7.res);
    if (t7.getStatus() !== 401) {
      throw new Error(`Test 7 Failed: Expected status 401 for missing auth, got ${t7.getStatus()}`);
    }
    console.log("     ✅ PASSED: Unauthenticated request rejected with 401.");

    // Test 8: Unknown user fails with 401
    console.log("  [Test 8/10] Authenticated request with non-existent user in DB...");
    const t8 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenUnknown}` },
      body: { taskPrompt: 'Hello' }
    });
    await WorkforceController.executeAgent(t8.req, t8.res);
    if (t8.getStatus() !== 401) {
      throw new Error(`Test 8 Failed: Expected 401 for unknown user, got ${t8.getStatus()}`);
    }
    console.log("     ✅ PASSED: Unknown user rejected with 401.");

    // Test 9: MCP tool cross-tenant invoice isolation check
    console.log("  [Test 9/10] Verifying MCPToolRegistry cross-tenant isolation on invoice lookup...");
    // Seed invoice for Tenant B
    const clientTest9 = await pool.connect();
    let invoiceBId = 9999;
    try {
      await clientTest9.query("BEGIN;");
      await clientTest9.query(`SELECT set_config('app.current_tenant', $1, true);`, [tenantB]);
      const invRes = await clientTest9.query(`
        INSERT INTO invoices (business_id, amount, status)
        VALUES ($1, 50000, 'pending')
        RETURNING id;
      `, [tenantB]);
      invoiceBId = invRes.rows[0].id;
      await clientTest9.query("COMMIT;");
    } finally {
      clientTest9.release();
    }

    let mcpCrossTenantFailed = false;
    try {
      await MCPToolRegistry.executeTool('stripe_billing', tenantA, { invoiceId: invoiceBId, action: 'GET_INVOICE' });
    } catch (err: any) {
      mcpCrossTenantFailed = true;
    }
    if (!mcpCrossTenantFailed) {
      throw new Error(`Test 9 Failed: MCP tool under Tenant A was able to read Tenant B's invoice!`);
    }
    console.log("     ✅ PASSED: MCPToolRegistry strictly prevents cross-tenant invoice access.");

    // Test 10: Header tenant ID override rejected with 403
    console.log("  [Test 10/10] Tenant A attempts header x-tenant-id override for Tenant B...");
    const t10 = createMockReqRes({
      headers: { authorization: `Bearer ${tokenA}`, 'x-tenant-id': tenantB },
      body: { workflowType: 'new_customer', params: {} }
    });
    await WorkforceController.executeWorkflow(t10.req, t10.res);
    if (t10.getStatus() !== 403) {
      throw new Error(`Test 10 Failed: Expected 403 forbidden for x-tenant-id header override, got ${t10.getStatus()}`);
    }
    console.log("     ✅ PASSED: Header x-tenant-id override strictly rejected with 403.");

    console.log("----------------------------------------");
    console.log("🎉 ALL 10 WORKFORCE ENGINE SECURITY TESTS PASSED PERFECTLY!");
    console.log("----------------------------------------");
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith('workforce-security.test.ts')) {
  runWorkforceSecurityTests().catch((err) => {
    console.error("❌ Workforce Security Tests Failed:", err);
    process.exit(1);
  });
}
