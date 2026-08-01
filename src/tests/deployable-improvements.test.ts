// src/tests/deployable-improvements.test.ts
import { DeployableImprovementService } from '../services/deployable-improvement.service.ts';
import { DeployableImprovementRepository } from '../repositories/deployable-improvement.repository.ts';
import { FinancialScenarioEngine } from '../lib/financial-scenario-engine.ts';
import { ImprovementAutonomyEngine } from '../lib/improvement-autonomy-engine.ts';
import { DeployerRegistryService } from '../services/deployer-registry.service.ts';
import { validateImprovementStatusTransition } from '../types/deployable-improvement.ts';

async function runTests() {
  console.log("=== DEPLOYABLE BUSINESS IMPROVEMENT ENGINE TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Clear memory stores before starting
  DeployableImprovementRepository.clearMemoryStore();

  const tenantA = "tenant_alpha";
  const tenantB = "tenant_beta";

  try {
    // 1. TEST: Status Transition Validator Rules
    console.log("\n--- 1. Testing Status Transition Validation ---");
    assert(validateImprovementStatusTransition("recommended", "awaiting_approval") === true, "recommended -> awaiting_approval is valid");
    assert(validateImprovementStatusTransition("recommended", "active") === false, "recommended -> active is INVALID");
    assert(validateImprovementStatusTransition("approved", "deploying") === true, "approved -> deploying is valid");
    assert(validateImprovementStatusTransition("deploying", "active") === true, "deploying -> active is valid");
    assert(validateImprovementStatusTransition("active", "rolled_back") === true, "active -> rolled_back is valid");

    // 2. TEST: Financial Scenario Engine Formulas & Unknowns
    console.log("\n--- 2. Testing Financial Scenario Calculations ---");
    const testAssumptions = [
      { id: "a1", label: "Monthly Savings", value: 1000, classification: "owner_provided" as const, requiresConfirmation: false },
      { id: "a2", label: "Monthly Revenue", value: 2000, classification: "assumption" as const, requiresConfirmation: true, isConfirmed: false },
      { id: "a3", label: "Unknown Market Value", value: 0, classification: "unknown" as const, requiresConfirmation: true }
    ];

    const scenarios = FinancialScenarioEngine.calculateScenarios({
      baseMonthlySavings: 1000,
      baseMonthlyRevenueIncrease: 2000,
      implementationCost: 500,
      monthlyOperatingCost: 100,
      assumptions: testAssumptions
    });

    assert(scenarios.length === 3, "Calculated 3 scenario tiers (conservative, expected, upside)");
    const expectedSc = scenarios.find(s => s.scenario === 'expected')!;
    assert(expectedSc.monthlyNetBenefit === 2900, `Expected net benefit is 2900 (calculated: ${expectedSc.monthlyNetBenefit})`);
    assert(expectedSc.formulaDetails?.hasUnknowns === true, "Engine correctly flagged presence of unknown classification");
    assert(expectedSc.formulaDetails?.confidenceScore! < 0.5, "Confidence score penalized for unknown inputs");

    // 3. TEST: Autonomy Engine High-Risk Action Detection
    console.log("\n--- 3. Testing Autonomy Engine & High-Risk Guardrails ---");
    const sampleImprovement = await DeployableImprovementService.generateFromOpportunity(tenantA, {
      opportunityId: "opp_web_01",
      title: "Publish Website SEO Optimization",
      description: "Update meta headers and JSON-LD schema",
      problemBeingSolved: "Missing AI discoverability",
      capabilityType: "website_improvement",
      businessOutcome: "improve_ai_discoverability"
    });

    const autonomyRes = ImprovementAutonomyEngine.evaluateAutonomy(sampleImprovement, "FULL_AUTONOMY");
    assert(autonomyRes.requiresHumanApproval === true, "High-risk website modification requires human approval even under FULL_AUTONOMY");
    assert(autonomyRes.detectedHighRiskCategories.includes("publish_website_changes"), "Detected high risk category 'publish_website_changes'");

    // 4. TEST: Tenant Isolation
    console.log("\n--- 4. Testing Tenant Isolation ---");
    const impB = await DeployableImprovementService.generateFromOpportunity(tenantB, {
      opportunityId: "opp_tenant_b",
      title: "Tenant B Secret Capability",
      description: "Private workflow",
      problemBeingSolved: "Private problem",
      capabilityType: "custom_workflow",
      businessOutcome: "reduce_cost"
    });

    const listA = await DeployableImprovementService.listImprovements(tenantA);
    const listB = await DeployableImprovementService.listImprovements(tenantB);

    assert(listA.length === 1 && listA[0].id === sampleImprovement.id, "Tenant A lists only Tenant A improvement");
    assert(listB.length === 1 && listB[0].id === impB.id, "Tenant B lists only Tenant B improvement");

    let tenantLeakError = false;
    try {
      await DeployableImprovementService.getImprovement(tenantA, impB.id);
    } catch {
      tenantLeakError = true;
    }
    assert(tenantLeakError === true, "Tenant A cannot access Tenant B improvement by ID");

    // 5. TEST: Unauthorized Deployment Rejection
    console.log("\n--- 5. Testing Deployment Protection & Approval Workflow ---");
    let unauthorizedDeployBlocked = false;
    try {
      await DeployableImprovementService.deployImprovement(tenantA, sampleImprovement.id);
    } catch {
      unauthorizedDeployBlocked = true;
    }
    assert(unauthorizedDeployBlocked === true, "Deploying unapproved improvement is blocked");

    // Request & Approve
    await DeployableImprovementService.requestApproval(tenantA, sampleImprovement.id);
    const approvedResult = await DeployableImprovementService.approveImprovement(
      tenantA,
      sampleImprovement.id,
      "Owner CEO",
      ["publish_website_changes", "*"]
    );
    assert(approvedResult.improvement.deploymentStatus === "approved", "Status transitioned to 'approved'");

    // 6. TEST: Deployer Registry, Orchestration & Verification Requirement
    console.log("\n--- 6. Testing Deployer Registry & Verification ---");
    const deployResult = await DeployableImprovementService.deployImprovement(tenantA, sampleImprovement.id);
    assert(deployResult.improvement.deploymentStatus === "active", "Improvement verified and set to ACTIVE");
    assert(deployResult.attempt.status === "success", "Deployment attempt logged as success");

    // 7. TEST: Rollback Mechanism
    console.log("\n--- 7. Testing Rollback Mechanism ---");
    const rollbackResult = await DeployableImprovementService.rollbackDeployment(tenantA, sampleImprovement.id);
    assert(rollbackResult.improvement.deploymentStatus === "rolled_back", "Status set to 'rolled_back'");
    assert(rollbackResult.rollbackLog.length > 0, "Rollback log recorded actions");

    // 8. TEST: Baseline & Performance Measurement
    console.log("\n--- 8. Testing Measurement Engine ---");
    // Generate fresh active improvement for measurement
    const testMeasImp = await DeployableImprovementService.generateFromOpportunity(tenantA, {
      opportunityId: "opp_meas_01",
      title: "Active Measurable Workflow",
      description: "Testing performance evaluation",
      problemBeingSolved: "Manual task speed",
      capabilityType: "automation",
      businessOutcome: "increase_revenue"
    });
    await DeployableImprovementService.requestApproval(tenantA, testMeasImp.id);
    await DeployableImprovementService.approveImprovement(tenantA, testMeasImp.id, "Owner", ["*"]);
    await DeployableImprovementService.deployImprovement(tenantA, testMeasImp.id);

    const perf = await DeployableImprovementService.evaluatePerformance(tenantA, testMeasImp.id, {
      "m_rev": 19000,
      "m_ai_disc": 18
    });

    assert(perf.financialBenefitStatus === "verified", "Financial benefit status evaluated as VERIFIED");
    assert(perf.recommendation === "expand" || perf.recommendation === "continue", `Recommendation is ${perf.recommendation}`);

  } catch (err: any) {
    console.error("FATAL UNHANDLED ERROR IN TEST SUITE:", err);
    failed++;
  }

  console.log(`\n==================================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
