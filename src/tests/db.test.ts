import { CompetitorRepository } from "../repositories/competitor.repository.ts";
import { GrowthRepository } from "../repositories/growth.repository.ts";

export async function runDbTests() {
  console.log("----------------------------------------");
  console.log("🗄️ Running Database & Persistence Tests...");

  const testBusinessId = "apex-plumbing";

  // 1. Competitor Repository Persistence Test
  const seeded = await CompetitorRepository.seedDefaultsIfEmpty(testBusinessId);
  if (!Array.isArray(seeded) || seeded.length === 0) {
    throw new Error("DB test failed: Competitor repository seeding returned empty.");
  }

  const createdCompetitor = await CompetitorRepository.create({
    businessId: testBusinessId,
    name: "Enterprise Test Competitor",
    pricing: "Custom ($200/hr)",
    reviews: "4.9★",
    advantages: "24/7 Dispatch",
    weaknesses: "Expensive fees",
    tactics: "Offer price match guarantee",
  });

  if (!createdCompetitor.id || createdCompetitor.name !== "Enterprise Test Competitor") {
    throw new Error("DB test failed: Inserted competitor mismatch.");
  }

  const allCompetitors = await CompetitorRepository.findByBusinessId(testBusinessId);
  const found = allCompetitors.find((c) => c.name === "Enterprise Test Competitor");
  if (!found) {
    throw new Error("DB test failed: Inserted competitor not retrieved from database.");
  }

  // 2. Growth Repository Query Test
  const healthMetrics = await GrowthRepository.getSystemHealthMetrics();
  if (typeof healthMetrics.totalLeads !== "number") {
    throw new Error("DB test failed: System health metrics returned invalid types.");
  }

  console.log("  ✅ PostgreSQL Competitor Persistence: Passed");
  console.log("  ✅ Growth Metrics DB Queries: Passed");
  console.log("  ✅ All Database Tests Passed!");
}
