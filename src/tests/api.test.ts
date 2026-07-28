import { GrowthService } from "../services/growth.service.ts";

export async function runApiTests() {
  console.log("----------------------------------------");
  console.log("🌐 Running Growth API & Service Integration Tests...");

  const testBusinessId = "apex-plumbing";

  // 1. Executive Intelligence
  const execIntel = await GrowthService.getExecutiveIntelligence(testBusinessId);
  if (!execIntel.success || !execIntel.kpis || !execIntel.kpis.conversionRate) {
    throw new Error("API test failed: Executive Intelligence contract mismatch.");
  }

  // 2. Opportunity Feed
  const oppFeed = await GrowthService.getOpportunityFeed(testBusinessId);
  if (!oppFeed.success || !Array.isArray(oppFeed.opportunities)) {
    throw new Error("API test failed: Opportunity Feed contract mismatch.");
  }

  // 3. Competitive Intelligence
  const compIntel = await GrowthService.getCompetitiveIntel(testBusinessId);
  if (!compIntel.success || !Array.isArray(compIntel.competitors)) {
    throw new Error("API test failed: Competitive Intel contract mismatch.");
  }

  // 4. Real Diagnostics Test
  const diagnostics = await GrowthService.runRealDiagnostics(testBusinessId);
  if (!diagnostics.success || !diagnostics.results || diagnostics.summary.totalTests === 0) {
    throw new Error("API test failed: Real Diagnostics suite execution failed.");
  }

  console.log("  ✅ Executive Intelligence Endpoint: Passed");
  console.log("  ✅ Opportunity Feed Endpoint: Passed");
  console.log("  ✅ Competitive Intel Endpoint: Passed");
  console.log("  ✅ Real Executable Diagnostics Endpoint: Passed");
  console.log("  ✅ All API & Service Integration Tests Passed!");
}
