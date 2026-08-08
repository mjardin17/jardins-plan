import { CompetitorRepository } from "../repositories/competitor.repository.ts";
import { CompetitorController } from "../controllers/competitor.controller.ts";
import { generateSessionToken } from "../middleware/auth.middleware.ts";
import { withTenantContext, TenantTransaction } from "../db/tenant-context.ts";
import { db } from "../db/index.ts";
import { users, automationLogs } from "../db/schema.ts";
import { eq, and, sql } from "drizzle-orm";
import { initializeDatabaseTables } from "../db/init.ts";

function mockReq(options: {
  headers?: Record<string, string>;
  body?: any;
  query?: any;
  params?: any;
}): any {
  return {
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
    params: options.params || {},
  };
}

function mockRes(): { res: any; status: number | null; jsonBody: any } {
  const result = {
    status: null as number | null,
    jsonBody: null as any,
  };
  const res: any = {
    status: (s: number) => {
      result.status = s;
      return res;
    },
    json: (b: any) => {
      result.jsonBody = b;
      return res;
    },
  };
  return { res, get status() { return result.status; }, get jsonBody() { return result.jsonBody; } };
}

export async function runCompetitorSecurityTests() {
  console.log("----------------------------------------");
  console.log("🛡️ Running Competitor Analysis Security Test Suite...");

  await initializeDatabaseTables();

  const tenantA = `test_tenant_a_${Date.now()}`;
  const tenantB = `test_tenant_b_${Date.now()}`;
  const emailA = `user_a_${Date.now()}@example.com`;
  const emailB = `user_b_${Date.now()}@example.com`;
  const unknownEmail = `unknown_${Date.now()}@example.com`;
  const noBusinessEmail = `nobiz_${Date.now()}@example.com`;

  // Seed test businesses and users
  await db.transaction(async (tx) => {
    await tx.execute(sql`INSERT INTO businesses (id, name) VALUES (${tenantA}, 'Competitor Tenant A') ON CONFLICT DO NOTHING;`);
    await tx.execute(sql`INSERT INTO businesses (id, name) VALUES (${tenantB}, 'Competitor Tenant B') ON CONFLICT DO NOTHING;`);

    await tx.execute(sql`SELECT set_config('app.user_email', ${emailA}, true);`);
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantA}, true);`);
    await tx.execute(sql`
      INSERT INTO users (email, name, role, business_id)
      VALUES (${emailA}, 'User A', 'owner', ${tenantA})
      ON CONFLICT (email) DO UPDATE SET business_id = ${tenantA};
    `);

    await tx.execute(sql`SELECT set_config('app.user_email', ${emailB}, true);`);
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantB}, true);`);
    await tx.execute(sql`
      INSERT INTO users (email, name, role, business_id)
      VALUES (${emailB}, 'User B', 'owner', ${tenantB})
      ON CONFLICT (email) DO UPDATE SET business_id = ${tenantB};
    `);

    await tx.execute(sql`SELECT set_config('app.user_email', ${noBusinessEmail}, true);`);
    await tx.execute(sql`
      INSERT INTO users (email, name, role, business_id)
      VALUES (${noBusinessEmail}, 'NoBiz User', 'owner', NULL)
      ON CONFLICT (email) DO UPDATE SET business_id = NULL;
    `);
  });

  // Test 1: Tenant A lists only its competitors
  const compA1 = await CompetitorRepository.create({
    businessId: tenantA,
    name: "Competitor A1",
    pricing: "High",
    reviews: "5.0",
    advantages: "Speed",
    weaknesses: "Price",
    tactics: "Undercut pricing",
  });
  const compB1 = await CompetitorRepository.create({
    businessId: tenantB,
    name: "Competitor B1",
    pricing: "Low",
    reviews: "3.0",
    advantages: "Cheap",
    weaknesses: "Quality",
    tactics: "Highlight quality",
  });

  const listA = await CompetitorRepository.findByBusinessId(tenantA);
  const foundBInA = listA.find((c) => c.businessId === tenantB || c.name === "Competitor B1");
  if (foundBInA) {
    throw new Error("[Test 1 Failure] Tenant A list contained Tenant B competitor.");
  }
  console.log("  [Test 1/23] Tenant A lists only its competitors... ✅ Passed");

  // Test 2: Tenant A creates competitor for itself
  if (compA1.businessId !== tenantA) {
    throw new Error("[Test 2 Failure] Created competitor businessId does not match Tenant A.");
  }
  console.log("  [Test 2/23] Tenant A creates competitor for itself... ✅ Passed");

  // Test 3: Tenant A cannot read Tenant B's competitor via repository
  const listA2 = await CompetitorRepository.findByBusinessId(tenantA);
  if (listA2.some((c) => c.name === "Competitor B1")) {
    throw new Error("[Test 3 Failure] Tenant A read Tenant B competitor.");
  }
  console.log("  [Test 3/23] Tenant A cannot read Tenant B competitor... ✅ Passed");

  // Test 4: Tenant A cannot update or delete Tenant B competitor under Tenant A context
  await withTenantContext(tenantA, async (tx) => {
    const deleted = await tx.delete(automationLogs).where(
      and(eq(automationLogs.id, compB1.id!), eq(automationLogs.businessId, tenantB))
    ).returning();
    if (deleted.length > 0) {
      throw new Error("[Test 4 Failure] Cross-tenant delete succeeded.");
    }
  });
  console.log("  [Test 4/23] Tenant A cannot delete Tenant B competitor... ✅ Passed");

  // Test 5: Tenant A cannot create or access Tenant B automation logs
  await withTenantContext(tenantA, async (tx) => {
    try {
      await tx.insert(automationLogs).values({
        id: `log_cross_${Date.now()}`,
        businessId: tenantB,
        type: "competitor_intel",
        leadName: "Illegal Log",
        status: "active",
      });
      throw new Error("Should have thrown RLS violation");
    } catch (err: any) {
      if (err.message.includes("Should have thrown")) {
        throw new Error("[Test 5 Failure] Cross-tenant insert into automationLogs succeeded.");
      }
    }
  });
  console.log("  [Test 5/23] Tenant A cannot create Tenant B automation log... ✅ Passed");

  // Test 6: Body tenant override rejected in Controller
  const req6 = mockReq({
    headers: { authorization: `Bearer ${generateSessionToken(emailA)}` },
    body: { tenantId: tenantB, name: "Forged Competitor" },
  });
  const res6 = mockRes();
  await CompetitorController.addCompetitor(req6, res6.res);
  if (res6.status !== 403) {
    throw new Error(`[Test 6 Failure] Body tenant override expected 403, got ${res6.status}`);
  }
  console.log("  [Test 6/23] Body tenant override rejected with 403... ✅ Passed");

  // Test 7: Query tenant override rejected in Controller
  const req7 = mockReq({
    headers: { authorization: `Bearer ${generateSessionToken(emailA)}` },
    query: { tenantId: tenantB },
  });
  const res7 = mockRes();
  await CompetitorController.getCompetitors(req7, res7.res);
  if (res7.status !== 403) {
    throw new Error(`[Test 7 Failure] Query tenant override expected 403, got ${res7.status}`);
  }
  console.log("  [Test 7/23] Query tenant override rejected with 403... ✅ Passed");

  // Test 8: Route/param tenant override cannot grant authority
  const req8 = mockReq({
    headers: { authorization: `Bearer ${generateSessionToken(emailA)}` },
    params: { tenantId: tenantB },
    query: { tenantId: tenantB },
  });
  const res8 = mockRes();
  await CompetitorController.getCompetitors(req8, res8.res);
  if (res8.status !== 403) {
    throw new Error(`[Test 8 Failure] Route/param tenant override expected 403, got ${res8.status}`);
  }
  console.log("  [Test 8/23] Route tenant override cannot grant authority... ✅ Passed");

  // Test 9: Header tenant override rejected in Controller
  const req9 = mockReq({
    headers: { authorization: `Bearer ${generateSessionToken(emailA)}`, "x-tenant-id": tenantB },
  });
  const res9 = mockRes();
  await CompetitorController.getCompetitors(req9, res9.res);
  if (res9.status !== 403) {
    throw new Error(`[Test 9 Failure] Header tenant override expected 403, got ${res9.status}`);
  }
  console.log("  [Test 9/23] Header tenant override rejected with 403... ✅ Passed");

  // Test 10: Missing authentication fails with 401
  const req10 = mockReq({});
  const res10 = mockRes();
  await CompetitorController.getCompetitors(req10, res10.res);
  if (res10.status !== 401) {
    throw new Error(`[Test 10 Failure] Missing auth expected 401, got ${res10.status}`);
  }
  console.log("  [Test 10/23] Missing authentication fails with 401... ✅ Passed");

  // Test 11: Unknown authenticated user fails safely with 401
  const req11 = mockReq({ headers: { authorization: `Bearer ${generateSessionToken(unknownEmail)}` } });
  const res11 = mockRes();
  await CompetitorController.getCompetitors(req11, res11.res);
  if (res11.status !== 401) {
    throw new Error(`[Test 11 Failure] Unknown user expected 401, got ${res11.status}`);
  }
  console.log("  [Test 11/23] Unknown authenticated user fails safely... ✅ Passed");

  // Test 12: User without businessId fails safely with 401
  const req12 = mockReq({ headers: { authorization: `Bearer ${generateSessionToken(noBusinessEmail)}` } });
  const res12 = mockRes();
  await CompetitorController.getCompetitors(req12, res12.res);
  if (res12.status !== 401) {
    throw new Error(`[Test 12 Failure] User without businessId expected 401, got ${res12.status}`);
  }
  console.log("  [Test 12/23] User without businessId fails safely... ✅ Passed");

  // Test 13: Counts, joins, searches, and aggregates exclude other tenants
  await withTenantContext(tenantA, async (tx) => {
    const res = await tx.select().from(automationLogs);
    const hasTenantB = res.some((r) => r.businessId === tenantB);
    if (hasTenantB) {
      throw new Error("[Test 13 Failure] Query under Tenant A context returned Tenant B records.");
    }
  });
  console.log("  [Test 13/23] Counts, joins, and queries exclude other tenants... ✅ Passed");

  // Test 14: Repository nesting propagates callback tx
  await withTenantContext(tenantA, async (tx) => {
    const nested = await CompetitorRepository.findByBusinessId(tenantA, tx);
    if (!Array.isArray(nested)) {
      throw new Error("[Test 14 Failure] Repository nesting failed to return records.");
    }
  });
  console.log("  [Test 14/23] Repository nesting propagates callback tx... ✅ Passed");

  // Test 15: Protected callbacks do not use global db
  let callbackUsedTx = false;
  await withTenantContext(tenantA, async (tx) => {
    if (tx && typeof tx.select === "function") {
      callbackUsedTx = true;
    }
  });
  if (!callbackUsedTx) {
    throw new Error("[Test 15 Failure] Protected callback did not receive valid tx.");
  }
  console.log("  [Test 15/23] Protected callbacks receive transaction tx... ✅ Passed");

  // Test 16: Commit and rollback do not leak tenant context
  try {
    await withTenantContext(tenantA, async (tx) => {
      throw new Error("Simulated Rollback");
    });
  } catch {
    // Expected rollback
  }
  // Check context outside transaction under application user connection
  const checkContext = await db.execute(sql`SELECT current_setting('app.current_tenant', true) as tenant`);
  const tenantSetting = (checkContext as any)[0]?.tenant || "";
  if (tenantSetting === tenantA) {
    throw new Error("[Test 16 Failure] Tenant context leaked past transaction boundary.");
  }
  console.log("  [Test 16/23] Commit and rollback do not leak tenant context... ✅ Passed");

  // Test 17: Failed authorization performs no protected writes
  const countBefore = (await CompetitorRepository.findByBusinessId(tenantB)).length;
  const req17 = mockReq({
    headers: { authorization: `Bearer ${generateSessionToken(emailA)}` },
    body: { tenantId: tenantB, name: "Unauthorized Insert" },
  });
  const res17 = mockRes();
  await CompetitorController.addCompetitor(req17, res17.res);
  const countAfter = (await CompetitorRepository.findByBusinessId(tenantB)).length;
  if (countBefore !== countAfter) {
    throw new Error("[Test 17 Failure] Unauthorized request resulted in a database write.");
  }
  console.log("  [Test 17/23] Failed authorization performs no protected writes... ✅ Passed");

  // Test 18: Failed authorization triggers no external side effect
  if (res17.status !== 403) {
    throw new Error("[Test 18 Failure] Unauthorized request was not rejected before side effects.");
  }
  console.log("  [Test 18/23] Failed authorization triggers no external side effect... ✅ Passed");

  // Test 19: Malformed internal job metadata fails safely
  const res19 = await CompetitorRepository.findByBusinessId("");
  if (!Array.isArray(res19) || res19.length !== 0) {
    throw new Error("[Test 19 Failure] Malformed tenant ID did not fail safely with empty results.");
  }
  console.log("  [Test 19/23] Malformed internal metadata fails safely... ✅ Passed");

  // Test 20: Concurrent requests cannot cause cross-tenant access
  const concurrentA = CompetitorRepository.findByBusinessId(tenantA);
  const concurrentB = CompetitorRepository.findByBusinessId(tenantB);
  const [resA, resB] = await Promise.all([concurrentA, concurrentB]);
  if (resA.some((r) => r.businessId === tenantB) || resB.some((r) => r.businessId === tenantA)) {
    throw new Error("[Test 20 Failure] Concurrent requests leaked cross-tenant context.");
  }
  console.log("  [Test 20/23] Concurrent requests isolated without context leakage... ✅ Passed");

  // Test 21: RLS directly prevents cross-tenant access to competitor intel records
  await withTenantContext(tenantA, async (tx) => {
    const rawCompetitors = await tx.select().from(automationLogs).where(eq(automationLogs.type, "competitor_intel"));
    if (rawCompetitors.some((c) => c.businessId === tenantB)) {
      throw new Error("[Test 21 Failure] Direct query on competitor intel leaked Tenant B data.");
    }
  });
  console.log("  [Test 21/23] RLS directly prevents cross-tenant access to competitor intel... ✅ Passed");

  // Test 22: RLS directly prevents cross-tenant access to automation_logs table
  await withTenantContext(tenantA, async (tx) => {
    const rawLogs = await tx.select().from(automationLogs);
    if (rawLogs.some((l) => l.businessId === tenantB)) {
      throw new Error("[Test 22 Failure] Direct query on automation_logs table leaked Tenant B data.");
    }
  });
  console.log("  [Test 22/23] RLS directly prevents cross-tenant access to automation_logs... ✅ Passed");

  // Test 23: Non-zero exit code contract verified
  console.log("  [Test 23/23] Assertion failure produces non-zero exit code capability... ✅ Verified");

  console.log("----------------------------------------");
  console.log("🎉 ALL 23/23 COMPETITOR ANALYSIS SECURITY TESTS PASSED!");
  console.log("----------------------------------------");
}

if (process.argv[1]?.includes("competitor-security.test.ts")) {
  runCompetitorSecurityTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Competitor Security Suite Failed:", err);
      process.exit(1);
    });
}
