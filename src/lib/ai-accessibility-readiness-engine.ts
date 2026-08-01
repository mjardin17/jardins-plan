// src/lib/ai-accessibility-readiness-engine.ts
import { AIAccessibilityFinding, AIAccessibilityReadinessScores } from '../types/ai-accessibility.ts';

export class AIAccessibilityReadinessEngine {
  /**
   * Calculates rule-based, explainable readiness scores from evaluated assessment findings.
   */
  public static calculateScores(findings: AIAccessibilityFinding[]): AIAccessibilityReadinessScores {
    const rulesExplanations: string[] = [];

    const findStatus = (dimension: string): string => {
      const f = findings.find(x => x.dimension === dimension);
      return f ? f.status : 'unknown';
    };

    const isPresent = (dimension: string): boolean => {
      const s = findStatus(dimension);
      return s === 'verified_present';
    };

    const isPartial = (dimension: string): boolean => {
      const s = findStatus(dimension);
      return s === 'partially_present';
    };

    // 1. AI Discoverability Score (0 - 100)
    let discoverability = 0;
    if (isPresent('crawlability')) { discoverability += 20; rulesExplanations.push("+20 pts: Website is fully crawlable."); }
    else if (isPartial('crawlability')) { discoverability += 10; rulesExplanations.push("+10 pts: Website is partially crawlable."); }

    if (isPresent('robots_txt')) { discoverability += 15; rulesExplanations.push("+15 pts: Valid robots.txt allows AI scrapers/crawlers."); }
    if (isPresent('xml_sitemap')) { discoverability += 15; rulesExplanations.push("+15 pts: XML sitemap is present and accessible."); }
    if (isPresent('org_schema') || isPresent('local_business_schema')) { discoverability += 25; rulesExplanations.push("+25 pts: Verified Organization or LocalBusiness JSON-LD schema present."); }
    else if (isPartial('org_schema') || isPartial('local_business_schema')) { discoverability += 12; rulesExplanations.push("+12 pts: Partial business schema detected."); }

    if (isPresent('location_info') && isPresent('business_hours')) { discoverability += 25; rulesExplanations.push("+25 pts: Verified location and operating hours schema."); }

    // 2. AI Answerability Score (0 - 100)
    let answerability = 0;
    if (isPresent('faq_structure')) { answerability += 30; rulesExplanations.push("+30 pts: Structured FAQ schema available for Q&A matching."); }
    else if (isPartial('faq_structure')) { answerability += 15; rulesExplanations.push("+15 pts: Unstructured text FAQs present."); }

    if (isPresent('contact_info')) { answerability += 20; rulesExplanations.push("+20 pts: Verified phone, email, and support contact channels."); }
    if (isPresent('service_catalog') || isPresent('product_catalog')) { answerability += 30; rulesExplanations.push("+30 pts: Machine-readable service/product descriptions present."); }
    if (isPresent('knowledge_base')) { answerability += 20; rulesExplanations.push("+20 pts: Accessible knowledge base."); }

    // 3. AI Recommendation Score (0 - 100)
    let recommendation = 0;
    if (isPresent('offer_pricing_data')) { recommendation += 35; rulesExplanations.push("+35 pts: Explicit offer & pricing schema available for product recommendation engines."); }
    else if (isPartial('offer_pricing_data')) { recommendation += 15; rulesExplanations.push("+15 pts: Partial or qualitative pricing info found."); }

    if (isPresent('inventory_availability')) { recommendation += 25; rulesExplanations.push("+25 pts: Real-time inventory status accessible."); }
    if (isPresent('product_schema') || isPresent('service_schema')) { recommendation += 25; rulesExplanations.push("+25 pts: Product/Service schema with ratings & reviews."); }
    if (isPresent('provenance')) { recommendation += 15; rulesExplanations.push("+15 pts: Verification provenance timestamp verified."); }

    // 4. AI Transaction Score (0 - 100)
    let transaction = 0;
    if (isPresent('scheduling_booking')) { transaction += 30; rulesExplanations.push("+30 pts: Direct appointment booking or scheduling endpoint."); }
    if (isPresent('checkout_payment')) { transaction += 30; rulesExplanations.push("+30 pts: Automated payment/checkout interface."); }
    if (isPresent('api_availability')) { transaction += 20; rulesExplanations.push("+20 pts: Public REST/GraphQL API available."); }
    if (isPresent('authorized_agent_interfaces')) { transaction += 20; rulesExplanations.push("+20 pts: MCP-compatible or OAuth agent endpoint."); }

    // 5. Data Trustworthiness Score (0 - 100)
    let trustworthiness = 0;
    const verifiedCount = findings.filter(f => f.status === 'verified_present').length;
    const totalCount = findings.length || 1;
    trustworthiness = Math.round((verifiedCount / totalCount) * 100);

    if (isPresent('data_freshness')) { trustworthiness = Math.min(100, trustworthiness + 10); rulesExplanations.push("+10 pts: Data updated within last 30 days."); }
    if (isPresent('provenance')) { trustworthiness = Math.min(100, trustworthiness + 10); rulesExplanations.push("+10 pts: Data provenance owner signature valid."); }

    // 6. Security Readiness Score (0 - 100)
    let security = 100;
    const highRiskFindings = findings.filter(f => f.securityImpact === 'high' && f.status !== 'verified_present');
    if (highRiskFindings.length > 0) {
      security -= highRiskFindings.length * 25;
      rulesExplanations.push(`-${highRiskFindings.length * 25} pts: Unresolved high-security impact findings.`);
    }
    if (!isPresent('privacy_consent')) { security -= 15; rulesExplanations.push("-15 pts: Missing machine-readable privacy consent controls."); }
    if (!isPresent('human_escalation')) { security -= 10; rulesExplanations.push("-10 pts: Missing human escalation fallback route."); }
    security = Math.max(0, security);

    // 7. Overall Composite Agent-Ready Score
    const overallAgentReady = Math.round(
      discoverability * 0.25 +
      answerability * 0.20 +
      recommendation * 0.20 +
      transaction * 0.15 +
      trustworthiness * 0.10 +
      security * 0.10
    );

    return {
      aiDiscoverability: Math.min(100, discoverability),
      aiAnswerability: Math.min(100, answerability),
      aiRecommendation: Math.min(100, recommendation),
      aiTransaction: Math.min(100, transaction),
      dataTrustworthiness: Math.min(100, trustworthiness),
      securityReadiness: Math.min(100, security),
      overallAgentReady: Math.min(100, overallAgentReady),
      explanationRules: rulesExplanations
    };
  }
}
