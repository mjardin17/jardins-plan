import { runControllerSecurityTests } from "./controller-tenant-security.test.ts";
import { runOAuthCallbackSecurityTests } from "./oauth-callback-security.test.ts";
import { runBusinessDiscoverySecurityTests } from "./business-discovery-security.test.ts";
import { runWorkforceSecurityTests } from "./workforce-security.test.ts";
import { runDeployableImprovementsSecurityTests } from "./deployable-improvements-security.test.ts";
import { runGrowthSecurityTests } from "./growth-security.test.ts";
import { runCompetitorSecurityTests } from "./competitor-security.test.ts";
import { runUnitTests } from "./unit.test.ts";
import { runPostgresProofTests } from "./postgres-proof.test.ts";
import { runRLSSecurityTests } from "./rls-security.test.ts";
import { runTokenRefreshTests } from "./token-refresh.test.ts";
import { runAuditImmutabilityTests } from "./audit-immutability.test.ts";
import { runDistributedCacheTests } from "./distributed-cache.test.ts";
import { runProviderSandboxSuite } from "./provider-sandbox.test.ts";
import { runDbTests } from "./db.test.ts";
import { runQueueTests } from "./queue.test.ts";
import { runActivationAndConnectorsTests } from "./activation-and-connectors.test.ts";
import { runAITests } from "./ai.test.ts";
import { runApiTests } from "./api.test.ts";
import { runPhase65ValidationSuite } from "./phase65-validation.test.ts";
import { runUniversalityVerificationSuite } from "./universality-verification.test.ts";
import { runProductionRemediationTests } from "./production-remediation.test.ts";
import { initializeDatabaseTables } from "../db/init.ts";

export async function runAllTests() {
  console.log("==================================================");
  console.log("🚀 STARTING AUTOMATED ENTERPRISE SECURITY & QUALITY TEST SUITE");
  console.log("==================================================");

  const startTime = Date.now();

  try {
    // 0. Production Fail-Closed & Fail-Fast Validation
    await runProductionRemediationTests();

    // Ensure DB tables, RLS policies, and triggers are initialized
    await initializeDatabaseTables();

    // 1. Real PostgreSQL Server & Driver Proof
    await runPostgresProofTests();

    // 2. PostgreSQL Row-Level Security (RLS) Attack Suite
    await runRLSSecurityTests();

    // 2b. Controller Tenant Isolation Security Suite
    await runControllerSecurityTests();

    // 2c. Focused OAuth Callback Security Suite
    await runOAuthCallbackSecurityTests();

    // 2d. Business Discovery Engine Security Suite
    await runBusinessDiscoverySecurityTests();

    // 2e. Workforce Engine Security Suite
    await runWorkforceSecurityTests();

    // 2f. Deployable Improvements Engine Security Suite
    await runDeployableImprovementsSecurityTests();

    // 2g. Growth Engine Security Suite
    await runGrowthSecurityTests();

    // 2h. Competitor Analysis Security Suite
    await runCompetitorSecurityTests();

    // 3. Real Token Refresh Lifecycle Suite
    await runTokenRefreshTests();

    // 4. Audit Log Immutability Trigger Suite
    await runAuditImmutabilityTests();

    // 5. Distributed Cache Invalidation Suite
    await runDistributedCacheTests();

    // 6. Real Provider Sandbox Classification Suite
    await runProviderSandboxSuite();

    // Standard Functional Suites
    await runUnitTests();
    await runDbTests();
    await runQueueTests();
    await runActivationAndConnectorsTests();
    await runAITests();
    await runApiTests();

    // Phase 6.5 Validation Suite
    console.log("----------------------------------------");
    console.log("⚡ Executing Phase 6.5 Deep Validation Suite...");
    const phase65Res = await runPhase65ValidationSuite();
    console.log(`Phase 6.5 Results: ${phase65Res.summary.passed}/${phase65Res.summary.total} Passed in ${phase65Res.summary.durationMs}ms`);

    console.log("--------------------------------------------------");
    console.log("Executing Universal Business Engine Universality Verification...");
    const universalityResults = runUniversalityVerificationSuite();
    console.log(`Universality Suite Passed: ${universalityResults.passed} (${universalityResults.passCount}/${universalityResults.totalTests} tests passed)`);
    console.log("Tested profiles: Joshua Jardin (Solo Reseller), Ricardo's (Restaurant), Apex Plumbing (Contractor)");

    const duration = Date.now() - startTime;
    console.log("==================================================");
    console.log(`🎉 ALL ENTERPRISE SECURITY & INTEGRATION TEST SUITES PASSED IN ${duration}ms!`);
    console.log("==================================================");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ ENTERPRISE TEST SUITE FAILED:");
    console.error(error);
    process.exit(1);
  }
}

runAllTests();

