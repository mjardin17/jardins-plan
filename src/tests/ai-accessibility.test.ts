// src/tests/ai-accessibility.test.ts
import { AIAccessibilityAssessmentService } from '../services/ai-accessibility-assessment.service.ts';
import { AIAccessibilityReadinessEngine } from '../lib/ai-accessibility-readiness-engine.ts';
import { AIAccessibilitySanitizer } from '../lib/ai-accessibility-sanitizer.ts';
import { AIAccessibilityDeployer } from '../services/deployers/ai-accessibility.deployer.ts';
import { DeployableImprovementService } from '../services/deployable-improvement.service.ts';
import * as fs from 'fs';

async function runAIAccessibilityTests() {
  const logLines: string[] = [];
  logLines.push('==================================================');
  logLines.push('RUNNING AI-ACCESSIBLE BUSINESS ENGINE TEST SUITE');
  logLines.push('==================================================');

  let passed = 0;
  let failed = 0;

  let assertIdx = 0;
  function assert(condition: boolean, description: string) {
    assertIdx++;
    if (condition) {
      logLines.push(`[PASS #${assertIdx}] ${description}`);
      passed++;
    } else {
      logLines.push(`[FAIL #${assertIdx}] ${description}`);
      failed++;
    }
  }

  try {
    const tenantAlpha = 'tenant_alpha_landscaping';
    const tenantBeta = 'tenant_beta_hvac';

    // TEST 1: Assessment Execution
    console.log('\n--- Test 1: Assessment Execution ---');
    const resultAlpha = await AIAccessibilityAssessmentService.assessBusiness(tenantAlpha, 'https://alpha-landscaping.com');
    assert(resultAlpha.findings.length >= 10, 'Evaluates multiple findings across dimensions');
    assert(resultAlpha.scores.overallAgentReady >= 0 && resultAlpha.scores.overallAgentReady <= 100, 'Calculates valid overall readiness score');
    assert(resultAlpha.scores.explanationRules.length > 0, 'Provides mathematical rule explanations for derived scores');

    // TEST 2: Missing Field & Remediation Detection
    console.log('\n--- Test 2: Missing Field & Remediation Detection ---');
    const missingSchema = resultAlpha.findings.find(f => f.dimension === 'org_schema');
    assert(missingSchema !== undefined, 'Identifies org schema dimension finding');
    assert(missingSchema?.status === 'verified_missing', 'Correctly detects missing schema');
    assert(missingSchema?.recommendedRemediation.includes('schema.org'), 'Provides actionable remediation statement');

    // TEST 3: Rule-Based Readiness Engine Math
    console.log('\n--- Test 3: Rule-Based Readiness Engine Math ---');
    const mockFindings = [
      { id: '1', dimension: 'crawlability' as const, label: 'Crawl', status: 'verified_present' as const, evidence: '', evidenceSource: '', confidence: 1, businessImpact: 'high' as const, securityImpact: 'none' as const, recommendedRemediation: '', humanConfirmationRequirement: false },
      { id: '2', dimension: 'robots_txt' as const, label: 'Robots', status: 'verified_present' as const, evidence: '', evidenceSource: '', confidence: 1, businessImpact: 'high' as const, securityImpact: 'none' as const, recommendedRemediation: '', humanConfirmationRequirement: false },
      { id: '3', dimension: 'xml_sitemap' as const, label: 'Sitemap', status: 'verified_present' as const, evidence: '', evidenceSource: '', confidence: 1, businessImpact: 'high' as const, securityImpact: 'none' as const, recommendedRemediation: '', humanConfirmationRequirement: false }
    ];
    const scores = AIAccessibilityReadinessEngine.calculateScores(mockFindings);
    assert(scores.aiDiscoverability >= 50, 'Discoverability score correctly accumulates points for present features');

    // TEST 4: Markup & Script Sanitization
    console.log('\n--- Test 4: Markup & Script Sanitization ---');
    const dirtyMarkup = `
      <div>
        <script>alert('xss injection')</script>
        <script type="application/ld+json">{"@context": "https://schema.org"}</script>
        <a href="javascript:doBadThings()">Click Me</a>
        <img src="x" onerror="alert(1)" />
      </div>
    `;
    const cleanMarkup = AIAccessibilitySanitizer.sanitizeMarkup(dirtyMarkup);
    assert(!cleanMarkup.includes("<script>alert"), 'Strips executable script tags');
    assert(cleanMarkup.includes('application/ld+json'), 'Preserves valid application/ld+json schema scripts');
    assert(!cleanMarkup.includes('javascript:doBadThings'), 'Strips javascript: protocol URLs');
    assert(!cleanMarkup.includes('onerror='), 'Strips inline event handlers');

    // TEST 5: Secrets & PII Masking
    console.log('\n--- Test 5: Secrets & PII Masking ---');
    const dirtyPayload = '{"service": "Stripe", "api_key": "sk_live_999888777", "card": "4111-2222-3333-4444"}';
    const { sanitized, secretDetected } = AIAccessibilitySanitizer.sanitizeSecretsAndPII(dirtyPayload);
    assert(secretDetected, 'Detects secret keywords and credit cards');
    assert(!sanitized.includes('sk_live_999888777'), 'Redacts live API key');
    assert(!sanitized.includes('4111-2222-3333-4444'), 'Redacts credit card number');

    // TEST 6: Public vs Private Profile Field Isolation
    console.log('\n--- Test 6: Public vs Private Profile Field Isolation ---');
    const profile = AIAccessibilityAssessmentService.getProfile(tenantAlpha);
    assert(profile !== null, 'Retrieves canonical business profile');
    if (profile) {
      const publicJsonLd = AIAccessibilitySanitizer.extractPublicJsonLd(profile);
      assert(publicJsonLd['@type'] === 'LocalBusiness', 'Generates valid LocalBusiness JSON-LD');
      assert(publicJsonLd['name'] !== undefined, 'Includes public business name');
      assert(publicJsonLd['hasCheckoutApi'] === undefined, 'Excludes private internal capability fields from public JSON-LD');
    }

    // TEST 7: AIAccessibilityDeployer Deployment Lifecycle
    console.log('\n--- Test 7: AIAccessibilityDeployer Deployment Lifecycle ---');
    const deployer = new AIAccessibilityDeployer();

    const improvement = await DeployableImprovementService.generateFromOpportunity(tenantAlpha, {
      opportunityId: "opp_test_acc",
      title: "Deploy Schema.org LocalBusiness Markup",
      description: "Inject structured JSON-LD into website head",
      problemBeingSolved: "Website lacks machine readable identity",
      capabilityType: "ai_accessibility",
      businessOutcome: "improve_ai_discoverability"
    });

    // Check unapproved readiness
    const readinessUnapproved = await deployer.validateReadiness(tenantAlpha, improvement);
    assert(!readinessUnapproved.ready, 'Blocks deployment when improvement is not yet approved');

    // Request & approve improvement
    await DeployableImprovementService.requestApproval(tenantAlpha, improvement.id);
    const { improvement: approvedImp } = await DeployableImprovementService.approveImprovement(
      tenantAlpha,
      improvement.id,
      'Owner John',
      ['publish_website_changes']
    );
    const readinessApproved = await deployer.validateReadiness(tenantAlpha, approvedImp);
    if (!readinessApproved.ready) {
      console.error('DEBUG READINESS FAILED:', {
        blockers: readinessApproved.blockers,
        missingApprovals: readinessApproved.missingApprovals,
        status: approvedImp.deploymentStatus,
        hasProfile: !!AIAccessibilityAssessmentService.getProfile(tenantAlpha)
      });
    }
    assert(readinessApproved.ready, 'Allows deployment when improvement is explicitly approved');

    // Deploy
    const deployRes = await deployer.deploy(tenantAlpha, approvedImp);
    assert(deployRes.success, 'Executes deployment successfully');

    // Verify
    const verifyRes = await deployer.verify(tenantAlpha, approvedImp);
    assert(verifyRes.verified, 'Verifies deployed schema markup successfully');

    // Rollback
    const rollbackRes = await deployer.rollback(tenantAlpha, approvedImp);
    assert(rollbackRes.success, 'Rolls back deployed markup safely');

    // TEST 8: Tenant Isolation
    console.log('\n--- Test 8: Tenant Isolation ---');
    await AIAccessibilityAssessmentService.assessBusiness(tenantBeta, 'https://beta-hvac.com');
    const profileBeta = AIAccessibilityAssessmentService.getProfile(tenantBeta);
    const profileAlphaRefreshed = AIAccessibilityAssessmentService.getProfile(tenantAlpha);

    assert(profileBeta?.tenantId === tenantBeta, 'Tenant Beta profile has correct tenant ID');
    assert(profileAlphaRefreshed?.tenantId === tenantAlpha, 'Tenant Alpha profile remains isolated');
    assert(profileBeta?.businessIdentity.value.publicName !== profileAlphaRefreshed?.businessIdentity.value.publicName, 'Tenant business identities are strictly isolated');

  } catch (err: any) {
    logLines.push(`>>> FATAL ERROR MSG: ${err?.message}`);
    logLines.push(`>>> FATAL ERROR STACK: ${err?.stack}`);
    failed++;
  }

  logLines.push('==================================================');
  logLines.push(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  logLines.push('==================================================');

  fs.writeFileSync('./test-output.log', logLines.join('\n'));

  if (failed > 0) {
    process.exit(1);
  }
}

runAIAccessibilityTests();
