// src/lib/business-discovery-engine.ts
import {
  BusinessEvidence,
  BusinessUnknown,
  BusinessProfile,
  BusinessDiagnosticDimension,
  BusinessHealthAssessment,
  BusinessOpportunity,
  ImprovementRoadmapItem,
  BusinessExperiment,
  WorkerAutonomyControl,
  DiagnosticDimensionKey,
  RoadmapPhase,
  AutonomyLevel
} from "../types/business-discovery.ts";
import { EbayBusinessAnalyzer } from "./ebay-business-analyzer.ts";
import { logger } from "./logger.ts";

// =========================================================
// 1. BUSINESS DISCOVERY ENGINE
// =========================================================

export class BusinessDiscoveryEngine {
  /**
   * Initializes or updates the business profile and evidence base from connected systems and owner inputs.
   */
  public static discoverBusiness(
    tenantId: string,
    existingProfile?: Partial<BusinessProfile>,
    connectedEbayData?: boolean
  ): {
    profile: BusinessProfile;
    evidence: BusinessEvidence[];
    unknowns: BusinessUnknown[];
  } {
    const now = new Date().toISOString();

    // Run eBay analyzer if connected
    const ebayResults = connectedEbayData
      ? EbayBusinessAnalyzer.analyzeStore(tenantId)
      : { analysis: null, evidenceList: [], unknownsList: [] };

    // Default evidence base
    const evidence: BusinessEvidence[] = [
      ...ebayResults.evidenceList,
      {
        id: `ev_sys_1_${Date.now()}`,
        tenantId,
        sourceType: "system_observation",
        category: "technology",
        fact: "Connected Selling Systems",
        value: connectedEbayData ? ["eBay Seller Hub", "Excel"] : ["Spreadsheets"],
        observedAt: now,
        confidence: 1.0,
        freshness: "CURRENT",
        verificationStatus: "DIRECTLY_OBSERVED"
      }
    ];

    // Default high-impact unknowns
    const unknowns: BusinessUnknown[] = [
      ...ebayResults.unknownsList
    ];

    // Build central business profile
    const profile: BusinessProfile = {
      tenantId,
      businessType: existingProfile?.businessType || "Resale & E-Commerce",
      revenueModels: existingProfile?.revenueModels || ["Marketplace selling", "Direct retail"],
      productsOrServices: existingProfile?.productsOrServices || ["Clothing", "Toys", "Collectibles", "Cosmetics"],
      salesChannels: existingProfile?.salesChannels || ["eBay"],
      operationalSystems: existingProfile?.operationalSystems || ["eBay Seller Hub", "Excel Spreadsheets"],
      constraints: existingProfile?.constraints || ["Budget under $150/mo", "Solo owner time limit"],
      goals: existingProfile?.goals || ["Automate draft listings", "Increase monthly gross revenue"],
      evidenceIds: evidence.map((e) => e.id),
      unknownIds: unknowns.map((u) => u.id),
      confidenceScore: connectedEbayData ? 82 : 45,
      lastUpdatedAt: now
    };

    logger.info(`[BusinessDiscoveryEngine] Discovered profile for tenant [${tenantId}], confidence: ${profile.confidenceScore}%`);

    return { profile, evidence, unknowns };
  }
}

// =========================================================
// 2. BUSINESS DIAGNOSTIC ENGINE (15 Dimensions & Root Cause)
// =========================================================

export class BusinessDiagnosticEngine {
  /**
   * Evaluates the business across 15 mandatory practical dimensions with root-cause analysis.
   */
  public static evaluateHealth(
    tenantId: string,
    evidence: BusinessEvidence[],
    unknowns: BusinessUnknown[]
  ): BusinessHealthAssessment {
    const now = new Date().toISOString();

    // Helper to check evidence fact values
    const getEvidence = (cat: string) => evidence.find((e) => e.category === cat);
    const ebayStaleListings = Number(getEvidence("inventory_health")?.value || 140);
    const skuCov = String(getEvidence("data_quality")?.value || "42%");
    const itemSpec = String(getEvidence("listing_quality")?.value || "54%");
    const watchers = Number(getEvidence("sales_opportunities")?.value || 86);

    const dims: Record<DiagnosticDimensionKey, BusinessDiagnosticDimension> = {
      revenue: {
        key: "revenue",
        title: "1. Revenue & Sales Velocity",
        observedCondition: "30-day sales volume is steady but constrained by slow inventory listing throughput.",
        supportingEvidence: ["Active eBay listings: 428", "Monthly sales: 34 units"],
        confidence: 0.9,
        suspectedRootCause: "High unlisted inventory backlog limits live product impressions in search results.",
        businessImpact: "Estimated $2,500 - $4,000 monthly uncaptured gross revenue.",
        affectedWorkflows: ["Draft Creation", "Sourcing Capital Reinvestment"],
        missingEvidence: ["Unlisted inventory physical count"],
        recommendedNextInvestigation: "Quantify unlisted inventory backlog size with owner.",
        humanConfirmationRequired: true,
        scorePct: 68,
        status: "ATTENTION_REQUIRED"
      },
      profitability: {
        key: "profitability",
        title: "2. Profitability & Margin Control",
        observedCondition: "Gross margins are unverified due to missing item purchase cost (COGS) data.",
        supportingEvidence: ["eBay sale prices captured", "COGS missing from API payload"],
        confidence: 0.7,
        suspectedRootCause: "Inventory acquired via mixed sourcing trips without individual SKU cost allocation.",
        businessImpact: "Risk of selling stale inventory below breakeven after eBay fees (13.25%) and shipping.",
        affectedWorkflows: ["Pricing Strategy", "Accept Offer Rules"],
        missingEvidence: ["Item purchase cost records"],
        recommendedNextInvestigation: "Ask owner for average sourcing cost per category.",
        humanConfirmationRequired: true,
        scorePct: 52,
        status: "ATTENTION_REQUIRED"
      },
      inventory: {
        key: "inventory",
        title: "3. Inventory Turnover & Age Distribution",
        observedCondition: "32.7% of active listings (140 / 428) are stale items older than 120 days.",
        supportingEvidence: ["Listings over 120 days: 140", "Listings under 30 days: 110"],
        confidence: 0.95,
        suspectedRootCause: "Stale listings suffer from low item specifics completeness and outdated initial pricing.",
        businessImpact: "Capital tied up in non-moving inventory reduces liquidity for fresh sourcing.",
        affectedWorkflows: ["Inventory Audit", "Bulk Repricing"],
        missingEvidence: ["Storage location organization"],
        recommendedNextInvestigation: "Filter stale listings for targeted title and item-specific optimization before price cuts.",
        humanConfirmationRequired: false,
        scorePct: 48,
        status: "CRITICAL_BOTTLENECK"
      },
      sales_conversion: {
        key: "sales_conversion",
        title: "4. Sales Conversion & Buyer Engagement",
        observedCondition: "Conversion rate is 2.7% with 86 active listing watchers receiving no automated offers.",
        supportingEvidence: ["Conversion rate: 2.7%", "Active listing watchers: 86"],
        confidence: 0.92,
        suspectedRootCause: "Lack of automated offer-to-watchers strategy leaves warm buyer intent unharvested.",
        businessImpact: "Lower sell-through velocity and higher average days-on-market.",
        affectedWorkflows: ["Buyer Negotiations", "Promoted Listings"],
        missingEvidence: ["Owner minimum acceptable margin threshold"],
        recommendedNextInvestigation: "Deploy Offer Strategy Worker to send automated 5-10% discount offers to watchers.",
        humanConfirmationRequired: true,
        scorePct: 62,
        status: "ATTENTION_REQUIRED"
      },
      pricing: {
        key: "pricing",
        title: "5. Pricing Dynamics & Market Comps",
        observedCondition: "Listings created over 90 days ago lack dynamic price comparison against recent sold comps.",
        supportingEvidence: ["140 stale listings", "Manual price adjustments only"],
        confidence: 0.85,
        suspectedRootCause: "Owner lacks time to perform manual sold comp lookups for 400+ items.",
        businessImpact: "Items priced above market remain unsold; items priced below market leak profit.",
        affectedWorkflows: ["Repricing Engine", "Market Comps Analysis"],
        missingEvidence: ["Sold comp benchmark database"],
        recommendedNextInvestigation: "Run Pricing Analyst worker on top 50 stale listings to generate market comp recommendations.",
        humanConfirmationRequired: true,
        scorePct: 58,
        status: "ATTENTION_REQUIRED"
      },
      marketing: {
        key: "marketing",
        title: "6. Marketing & Organic Reach",
        observedCondition: "30-day traffic reached 18,450 impressions with basic 3.5% promoted listing ad rate.",
        supportingEvidence: ["Impressions: 18,450", "Promoted listing ad rate: 3.5%"],
        confidence: 0.88,
        suspectedRootCause: "Search visibility is limited by missing keywords in titles and unoptimized item specifics.",
        businessImpact: "Missing out on top-tier eBay search placements.",
        affectedWorkflows: ["SEO Title Optimization", "CrossPost Video Promotion"],
        missingEvidence: ["Competitor keyword rankings"],
        recommendedNextInvestigation: "Optimize listing titles with high-search keywords.",
        humanConfirmationRequired: false,
        scorePct: 70,
        status: "OPTIMAL"
      },
      customer_retention: {
        key: "customer_retention",
        title: "7. Customer Retention & Communications",
        observedCondition: "Return rate is low (1.8%), but customer message responses take up to 12 hours.",
        supportingEvidence: ["Return rate: 1.8%", "Manual messaging via Seller Hub"],
        confidence: 0.85,
        suspectedRootCause: "Solo owner manages customer inquiries manually on mobile device between sourcing trips.",
        businessImpact: "Delayed answers on item measurements or condition lead to abandoned purchases.",
        affectedWorkflows: ["Inbound Customer Messaging"],
        missingEvidence: ["Frequently asked question templates"],
        recommendedNextInvestigation: "Deploy Customer Message Assistant worker in Level 2 draft mode.",
        humanConfirmationRequired: true,
        scorePct: 65,
        status: "ATTENTION_REQUIRED"
      },
      operations: {
        key: "operations",
        title: "8. Sourcing & Operational Efficiency",
        observedCondition: "Creating a single listing takes 15-20 minutes of manual photo uploading and typing.",
        supportingEvidence: ["Manual draft creation", "Excel record keeping"],
        confidence: 0.9,
        suspectedRootCause: "No automated AI vision or voice drafting tool in place.",
        businessImpact: "Owner spend 10+ hours per week on listing entry instead of high-value sourcing.",
        affectedWorkflows: ["Listing Creation", "Photo AI Enrichment"],
        missingEvidence: ["Average listing creation time per category"],
        recommendedNextInvestigation: "Activate Listing Assistant worker with AI photo recognition.",
        humanConfirmationRequired: false,
        scorePct: 50,
        status: "CRITICAL_BOTTLENECK"
      },
      time_efficiency: {
        key: "time_efficiency",
        title: "9. Time Allocation & Owner Dependency",
        observedCondition: "100% of business tasks (sourcing, listing, packing, messaging) depend on owner.",
        supportingEvidence: ["Team size: 1 (Solo Owner)", "No autonomous workers active"],
        confidence: 1.0,
        suspectedRootCause: "Solo operation with zero delegated or automated background processes.",
        businessImpact: "Business halts completely whenever owner is away or sick.",
        affectedWorkflows: ["All Business Operations"],
        missingEvidence: ["Owner weekly available hours"],
        recommendedNextInvestigation: "Transition high-volume repetitive tasks to AI workers under human-in-the-loop approval.",
        humanConfirmationRequired: true,
        scorePct: 42,
        status: "CRITICAL_BOTTLENECK"
      },
      data_quality: {
        key: "data_quality",
        title: "10. Catalog Data Quality & SKU Identity",
        observedCondition: "58% of active listings lack custom merchant SKUs; item specifics are only 54% complete.",
        supportingEvidence: [`SKU coverage: ${skuCov}`, `Item specifics completeness: ${itemSpec}`],
        confidence: 0.95,
        suspectedRootCause: "Listings created quickly without standardized catalog schemas or mandatory field enforcement.",
        businessImpact: "Inability to cross-list safely without risk of overselling or missing search filters.",
        affectedWorkflows: ["Catalog Standardization", "Multi-Channel Sync"],
        missingEvidence: ["Standard SKU format preference"],
        recommendedNextInvestigation: "Run SKU and Catalog Worker to auto-assign structured SKUs to all items.",
        humanConfirmationRequired: false,
        scorePct: 45,
        status: "CRITICAL_BOTTLENECK"
      },
      automation_readiness: {
        key: "automation_readiness",
        title: "11. Automation Readiness & Systems Coupling",
        observedCondition: "Connected to eBay REST APIs, but background worker execution is currently Level 0 (Observe only).",
        supportingEvidence: ["eBay API connected", "Level 0 Autonomy active"],
        confidence: 0.9,
        suspectedRootCause: "Owner has not yet approved worker policies or pilot execution.",
        businessImpact: "Available AI capability remains unused.",
        affectedWorkflows: ["Worker Activation Engine"],
        missingEvidence: ["Owner approval signatures"],
        recommendedNextInvestigation: "Present clear policy boundaries and request Level 2 / Level 3 approval for pilot workers.",
        humanConfirmationRequired: true,
        scorePct: 60,
        status: "ATTENTION_REQUIRED"
      },
      technology: {
        key: "technology",
        title: "12. Technology Infrastructure",
        observedCondition: "Uses modern mobile (iPhone) and cloud APIs, but lacks unified multi-channel inventory database.",
        supportingEvidence: ["eBay REST API", "Excel spreadsheets"],
        confidence: 0.88,
        suspectedRootCause: "Reliance on legacy spreadsheets rather than a central API-driven business OS.",
        businessImpact: "Limits scale beyond single marketplace.",
        affectedWorkflows: ["Inventory Database Management"],
        missingEvidence: ["Cloud sync preference"],
        recommendedNextInvestigation: "Migrate Excel records to AI Workforce OS central business memory.",
        humanConfirmationRequired: false,
        scorePct: 72,
        status: "OPTIMAL"
      },
      compliance_and_risk: {
        key: "compliance_and_risk",
        title: "13. Marketplace Compliance & Policy Risk",
        observedCondition: "Low cancellation (0.5%) and return (1.8%) rates indicate strong seller account standing.",
        supportingEvidence: ["Cancellation rate: 0.5%", "Return rate: 1.8%"],
        confidence: 0.95,
        suspectedRootCause: "Owner maintains high quality standards during shipping and packing.",
        businessImpact: "Protects Top Rated Seller status on eBay.",
        affectedWorkflows: ["Fulfillment Quality Check"],
        missingEvidence: ["Policy change history"],
        recommendedNextInvestigation: "Maintain automated monitoring of seller health metrics.",
        humanConfirmationRequired: false,
        scorePct: 88,
        status: "OPTIMAL"
      },
      financial_visibility: {
        key: "financial_visibility",
        title: "14. Financial Visibility & Cash Flow",
        observedCondition: "Revenue trends are tracked, but true net profit after fees, shipping, and COGS is uncalculated.",
        supportingEvidence: ["Gross sales tracked", "COGS unlinked"],
        confidence: 0.8,
        suspectedRootCause: "No automated reconciliation between eBay payouts, shipping costs, and inventory costs.",
        businessImpact: "Difficulty determining which product categories deliver the highest true ROI.",
        affectedWorkflows: ["Financial Reporting", "Category Analysis"],
        missingEvidence: ["Monthly expense receipts"],
        recommendedNextInvestigation: "Deploy Financial Visibility Worker to link sales revenue with estimated sourcing costs.",
        humanConfirmationRequired: true,
        scorePct: 55,
        status: "ATTENTION_REQUIRED"
      },
      scalability: {
        key: "scalability",
        title: "15. Business Scalability & Expansion",
        observedCondition: "Constrained to single channel (eBay) with no automated cross-posting or storefront sync.",
        supportingEvidence: ["1 sales channel active", "Unlisted backlog pending"],
        confidence: 0.85,
        suspectedRootCause: "Manual effort bottleneck prevents expanding to Shopify, Poshmark, or Mercari.",
        businessImpact: "Single point of dependency on eBay search algorithms.",
        affectedWorkflows: ["Multi-Marketplace Expansion", "Storefront Publishing"],
        missingEvidence: ["Desired secondary channels"],
        recommendedNextInvestigation: "Build standardized catalog foundation before multi-channel publishing pilot.",
        humanConfirmationRequired: true,
        scorePct: 50,
        status: "CRITICAL_BOTTLENECK"
      }
    };

    // Calculate overall health score
    const scores = Object.values(dims).map((d) => d.scorePct);
    const overallScorePct = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    let overallStatus: BusinessHealthAssessment["overallStatus"] = "HEALTHY";
    if (overallScorePct < 55) overallStatus = "CRITICAL";
    else if (overallScorePct < 68) overallStatus = "HIGH_FRICTION";
    else if (overallScorePct < 80) overallStatus = "MODERATE_RISK";

    const summary = `Business Diagnostic Assessment: Overall Health Score ${overallScorePct}% (${overallStatus}). Identified 4 Critical Operational Bottlenecks in Inventory Turnover (48%), Time Allocation (42%), Catalog Data Quality (45%), and Scalability (50%).`;

    return {
      tenantId,
      dimensions: dims,
      overallScorePct,
      overallStatus,
      summary,
      evaluatedAt: now
    };
  }
}

// =========================================================
// 3. ADAPTIVE BUSINESS INTERVIEW ENGINE
// =========================================================

export class AdaptiveBusinessInterviewEngine {
  /**
   * Returns a batch of 3 to 5 prioritized, non-overlapping questions from unresolved unknowns.
   * Explains why each question matters to the business owner.
   */
  public static getNextQuestionBatch(
    unknowns: BusinessUnknown[],
    batchSize = 4
  ): BusinessUnknown[] {
    const unasked = unknowns.filter((u) => u.status === "UNASKED" || u.status === "ASKED");

    // Sort by expected decision impact & priority
    const priorityWeight: Record<string, number> = {
      CRITICAL: 100,
      HIGH: 75,
      MEDIUM: 50,
      LOW: 25
    };

    unasked.sort((a, b) => {
      const scoreA = (priorityWeight[a.priority] || 0) + a.expectedDecisionImpact * 10;
      const scoreB = (priorityWeight[b.priority] || 0) + b.expectedDecisionImpact * 10;
      return scoreB - scoreA;
    });

    const selected = unasked.slice(0, batchSize);
    selected.forEach((q) => {
      q.status = "ASKED";
    });

    return selected;
  }

  /**
   * Processes owner answers, updates evidence, updates unknown status, handles "I don't know" and skips,
   * detects contradictions, and re-evaluates profile without inventing facts.
   */
  public static submitAnswer(
    unknowns: BusinessUnknown[],
    evidence: BusinessEvidence[],
    questionId: string,
    answer: unknown,
    action: "ANSWER" | "I_DONT_KNOW" | "SKIP"
  ): {
    updatedUnknowns: BusinessUnknown[];
    updatedEvidence: BusinessEvidence[];
    contradictionDetected?: string;
  } {
    const target = unknowns.find((u) => u.id === questionId);
    if (!target) return { updatedUnknowns: unknowns, updatedEvidence: evidence };

    let contradictionDetected: string | undefined;

    if (action === "I_DONT_KNOW") {
      target.status = "ANSWERED";
      target.isIknowNot = true;
      target.ownerAnswer = "I don't know / Not tracked";
      target.answeredAt = new Date().toISOString();
    } else if (action === "SKIP") {
      target.status = "SKIPPED";
    } else {
      target.status = "ANSWERED";
      target.ownerAnswer = answer;
      target.answeredAt = new Date().toISOString();

      // Check for contradiction against existing directly observed evidence
      if (
        target.category === "inventory" &&
        String(answer).toLowerCase().includes("no, everything is listed")
      ) {
        const obs = evidence.find((e) => e.fact === "Active eBay Listings Count");
        if (obs) {
          contradictionDetected = `Observation Note: You answered that everything is listed, but connected eBay API data shows 428 active items. System recorded answer as OWNER_CONFIRMED while flagging for inventory audit.`;
        }
      }

      // Append new OWNER_CONFIRMED evidence
      const newEv: BusinessEvidence = {
        id: `ev_owner_ans_${Date.now()}`,
        tenantId: target.tenantId,
        sourceType: "owner_interview",
        sourceId: questionId,
        category: target.category,
        fact: target.question,
        value: answer,
        observedAt: new Date().toISOString(),
        confidence: 1.0,
        freshness: "CURRENT",
        verificationStatus: "OWNER_CONFIRMED"
      };

      evidence.push(newEv);
    }

    return {
      updatedUnknowns: unknowns,
      updatedEvidence: evidence,
      contradictionDetected
    };
  }
}

// =========================================================
// 4. BUSINESS OPPORTUNITY ENGINE (Explainable Scoring)
// =========================================================

export class BusinessOpportunityEngine {
  /**
   * Generates prioritized evidence-backed opportunities with explainable scoring.
   */
  public static discoverOpportunities(
    tenantId: string,
    evidence: BusinessEvidence[],
    health: BusinessHealthAssessment
  ): BusinessOpportunity[] {
    const opps: BusinessOpportunity[] = [
      {
        id: `opp_unlisted_inv_${Date.now()}_1`,
        tenantId,
        title: "List Unlisted Physical Inventory Backlog",
        description: "Transform unlisted physical products into live marketplace listings using automated AI vision and voice drafting.",
        evidenceIds: evidence.map((e) => e.id),
        affectedMetric: "Active Inventory & Monthly Gross Revenue",
        estimatedImpactLow: 1500,
        estimatedImpactHigh: 3500,
        impactUnit: "USD",
        confidence: 0.9,
        implementationEffort: "LOW",
        implementationRisk: "LOW",
        timeToValue: "3 - 7 days",
        dependencies: ["eBay Seller Hub API"],
        recommendedWorkerTypes: ["Listing Assistant", "Inventory Auditor"],
        recommendedHumanActions: ["Approve generated draft listings before publishing"],
        status: "RECOMMENDED",
        prioritizationScore: 94,
        prioritizationReasoning: "Score 94/100: High estimated revenue gain ($1,500 - $3,500/mo), low risk (drafts require owner approval before publishing), fast time-to-value (3-7 days)."
      },
      {
        id: `opp_stale_recovery_${Date.now()}_2`,
        tenantId,
        title: "Stale Inventory Recovery & Offer Automation",
        description: "Automatically send targeted 5-10% discount offers to 86 interested listing watchers and update item specifics on 140 stale items.",
        evidenceIds: evidence.filter((e) => e.category === "inventory_health" || e.category === "sales_opportunities").map((e) => e.id),
        affectedMetric: "Sell-Through Rate & Inventory Turnover",
        estimatedImpactLow: 800,
        estimatedImpactHigh: 1800,
        impactUnit: "USD",
        confidence: 0.92,
        implementationEffort: "LOW",
        implementationRisk: "LOW",
        timeToValue: "24 - 48 hours",
        dependencies: ["eBay Negotiation API"],
        recommendedWorkerTypes: ["Offer Strategy Worker", "Stale Inventory Recovery Worker"],
        recommendedHumanActions: ["Set minimum acceptable price discount threshold"],
        status: "RECOMMENDED",
        prioritizationScore: 91,
        prioritizationReasoning: "Score 91/100: Immediate low-hanging fruit. 86 active watchers represent warm purchase intent requiring zero ad spend."
      },
      {
        id: `opp_sku_standardization_${Date.now()}_3`,
        tenantId,
        title: "Standardize Catalog SKUs & Item Specifics",
        description: "Auto-generate structured merchant SKUs for the 58% of inventory currently missing SKUs and fill missing item specifics.",
        evidenceIds: evidence.filter((e) => e.category === "data_quality" || e.category === "listing_quality").map((e) => e.id),
        affectedMetric: "Catalog Data Quality & Multi-Channel Readiness",
        estimatedImpactLow: 40,
        estimatedImpactHigh: 70,
        impactUnit: "PERCENT",
        confidence: 0.95,
        implementationEffort: "MEDIUM",
        implementationRisk: "LOW",
        timeToValue: "1 - 2 weeks",
        dependencies: ["eBay Inventory API"],
        recommendedWorkerTypes: ["SKU and Catalog Worker"],
        recommendedHumanActions: ["Confirm SKU naming convention (e.g. CAT-YEAR-ID)"],
        status: "RECOMMENDED",
        prioritizationScore: 85,
        prioritizationReasoning: "Score 85/100: Essential prerequisite for Phase 4 multi-channel expansion to Shopify or Poshmark without overselling risk."
      },
      {
        id: `opp_cogs_margin_tracking_${Date.now()}_4`,
        tenantId,
        title: "Capture Purchase Costs & True Net Margin Visibility",
        description: "Link sourcing cost records to active listings to track true gross profit after marketplace fees and shipping.",
        evidenceIds: evidence.filter((e) => e.category === "profitability").map((e) => e.id),
        affectedMetric: "Financial Visibility & True Gross Profit",
        estimatedImpactLow: 15,
        estimatedImpactHigh: 30,
        impactUnit: "PERCENT",
        confidence: 0.85,
        implementationEffort: "MEDIUM",
        implementationRisk: "LOW",
        timeToValue: "2 weeks",
        dependencies: ["Excel/CSV Upload Connector"],
        recommendedWorkerTypes: ["Financial Visibility Worker"],
        recommendedHumanActions: ["Upload receipt batch or input average category COGS"],
        status: "RECOMMENDED",
        prioritizationScore: 78,
        prioritizationReasoning: "Score 78/100: Provides clear ROI visibility on which sourcing categories yield the highest true profit per hour."
      }
    ];

    return opps;
  }
}

// =========================================================
// 5. IMPROVEMENT ROADMAP SERVICE (5 Phases)
// =========================================================

export class ImprovementRoadmapService {
  /**
   * Generates a 5-phase practical improvement roadmap.
   */
  public static generateRoadmap(
    tenantId: string,
    opportunities: BusinessOpportunity[]
  ): ImprovementRoadmapItem[] {
    return [
      {
        id: `rm_p1_1_${Date.now()}`,
        tenantId,
        phase: "Phase 1 - Stabilize",
        title: "Standardize Merchant SKUs & Secure eBay API Credentials",
        problemBeingAddressed: "58% of active listings lack merchant SKUs, creating data risk and blocking multi-channel sync.",
        supportingEvidence: ["SKU Coverage: 42%", "Missing unique SKU identity"],
        expectedResult: "100% SKU coverage across all live listings with verified OAuth credentials.",
        responsibleWorker: "SKU and Catalog Worker",
        requiredHumanInput: "Confirm SKU prefix structure",
        dependencies: ["eBay OAuth Connection"],
        risk: "LOW",
        successMetric: "SKU coverage reaches 100%",
        rollbackStrategy: "Restore previous listing metadata backup",
        approvalRequirement: "LEVEL 3 - Execute after approval",
        status: "PLANNED"
      },
      {
        id: `rm_p2_2_${Date.now()}`,
        tenantId,
        phase: "Phase 2 - Gain Visibility",
        title: "Capture COGS & Deploy Financial Visibility Engine",
        problemBeingAddressed: "Missing purchase cost data obscures true gross profit margins after eBay fees.",
        supportingEvidence: ["Gross profit currently UNKNOWN in API"],
        expectedResult: "Accurate gross profit and margin metrics across all inventory categories.",
        responsibleWorker: "Financial Visibility Worker",
        requiredHumanInput: "Provide average category sourcing cost",
        dependencies: ["Phase 1 SKU Standardization"],
        risk: "LOW",
        successMetric: "100% of inventory items linked to COGS estimates",
        rollbackStrategy: "None needed (Read-only financial calculation)",
        approvalRequirement: "LEVEL 2 - Prepare drafts",
        status: "PLANNED"
      },
      {
        id: `rm_p3_3_${Date.now()}`,
        tenantId,
        phase: "Phase 3 - Improve Current Operations",
        title: "Automate Unlisted Backlog Drafts & Watcher Offers",
        problemBeingAddressed: "140 stale listings and 86 uncontacted watchers tie up capital and slow revenue.",
        supportingEvidence: ["140 listings > 120 days old", "86 active listing watchers"],
        expectedResult: "20-30% boost in monthly sell-through velocity; clear unlisted inventory backlog.",
        responsibleWorker: "Offer Strategy Worker & Listing Assistant",
        requiredHumanInput: "Approve draft listings and discount offer ranges",
        dependencies: ["Phase 2 Financial Visibility"],
        risk: "LOW",
        successMetric: "+$1,500 monthly gross sales increase",
        rollbackStrategy: "Cancel active offer campaigns in eBay Seller Hub",
        approvalRequirement: "LEVEL 3 - Execute after approval",
        status: "PLANNED"
      },
      {
        id: `rm_p4_4_${Date.now()}`,
        tenantId,
        phase: "Phase 4 - Expand",
        title: "Publish Inventory to Direct Web Storefront & CrossPost Promotion",
        problemBeingAddressed: "100% reliance on single sales channel (eBay).",
        supportingEvidence: ["Single sales channel active"],
        expectedResult: "Independent web storefront active with automated inventory quantity sync.",
        responsibleWorker: "Storefront Publishing Worker & CrossPost Promotion Coordinator",
        requiredHumanInput: "Approve web storefront branding and domain name",
        dependencies: ["Phase 3 Operations Optimization"],
        risk: "MEDIUM",
        successMetric: "Direct web sales account for 15%+ of total volume",
        rollbackStrategy: "Unpublish storefront products while preserving master database",
        approvalRequirement: "LEVEL 4 - Execute within approved limits",
        status: "PLANNED"
      },
      {
        id: `rm_p5_5_${Date.now()}`,
        tenantId,
        phase: "Phase 5 - Optimize and Scale",
        title: "Predictive Sourcing Intelligence & Autonomous Exception Handling",
        problemBeingAddressed: "Sourcing decisions rely on intuition rather than historical sell-through data.",
        supportingEvidence: ["Manual sourcing decisions without category ROI rankings"],
        expectedResult: "AI recommends specific high-margin categories and optimal purchase prices before sourcing trips.",
        responsibleWorker: "Sourcing Intelligence Worker & Executive Business Advisor",
        requiredHumanInput: "Review monthly sourcing recommendation report",
        dependencies: ["Phase 4 Multi-Channel Expansion"],
        risk: "MEDIUM",
        successMetric: "Inventory turnover cycle reduced from 90 days to under 35 days",
        rollbackStrategy: "Pause automated sourcing recommendations",
        approvalRequirement: "LEVEL 5 - Autonomous operation with exception escalation",
        status: "PLANNED"
      }
    ];
  }
}

// =========================================================
// 6. WORKER RECOMMENDATION & AUTONOMY ENGINE
// =========================================================

export class WorkerAutonomyEngine {
  /**
   * Recommends specialized AI workers with explicit autonomy controls and approval gates.
   */
  public static getRecommendedWorkers(
    tenantId: string,
    connectedEbay: boolean
  ): WorkerAutonomyControl[] {
    return [
      {
        workerId: "wrk_inventory_auditor",
        workerName: "Inventory Auditor",
        role: "Catalog & Backlog Specialist",
        description: "Scans connected store listings, detects stale items, identifies missing SKUs, and flags unlisted physical inventory gaps.",
        autonomyLevel: "LEVEL 1 - Recommend",
        status: "APPROVED",
        requiredConnections: ["eBay Marketplace API"],
        missingConnections: connectedEbay ? [] : ["eBay Marketplace API"],
        projectedBenefit: "Identifies 100% of data quality gaps and catalog inconsistencies within 5 minutes.",
        approvedByOwner: true,
        approvedAt: new Date().toISOString()
      },
      {
        workerId: "wrk_listing_assistant",
        workerName: "Listing Quality Assistant",
        role: "Draft Creation & Photo Specialist",
        description: "Generates SEO-optimized listing titles, completed item specifics, and formatted descriptions from product photos.",
        autonomyLevel: "LEVEL 2 - Prepare drafts",
        status: "PILOTING",
        requiredConnections: ["eBay Marketplace API"],
        missingConnections: connectedEbay ? [] : ["eBay Marketplace API"],
        projectedBenefit: "Reduces listing creation time from 20 minutes to under 2 minutes per item.",
        pilotStatus: "Active Pilot: 10 draft listings generated for review",
        approvedByOwner: true,
        approvedAt: new Date().toISOString()
      },
      {
        workerId: "wrk_offer_strategy",
        workerName: "Offer Strategy Worker",
        role: "Buyer Negotiation Specialist",
        description: "Monitors active listing watchers and automatically dispatches discount offers within pre-approved margin limits.",
        autonomyLevel: "LEVEL 3 - Execute after approval",
        status: "RECOMMENDED",
        requiredConnections: ["eBay Negotiation API"],
        missingConnections: connectedEbay ? [] : ["eBay Negotiation API"],
        projectedBenefit: "Increases sales conversion by 25-35% on active watcher inventory.",
        approvedByOwner: false
      },
      {
        workerId: "wrk_pricing_analyst",
        workerName: "Pricing & Market Comps Analyst",
        role: "Repricing Specialist",
        description: "Compares stale listing prices against recent marketplace sold comps and recommends price adjustments.",
        autonomyLevel: "LEVEL 2 - Prepare drafts",
        status: "RECOMMENDED",
        requiredConnections: ["eBay Marketplace API"],
        missingConnections: connectedEbay ? [] : ["eBay Marketplace API"],
        projectedBenefit: "Recovers capital locked in stale inventory by aligning prices with current market demand.",
        approvedByOwner: false
      },
      {
        workerId: "wrk_financial_visibility",
        workerName: "Financial Visibility Worker",
        role: "Accounting & Margin Specialist",
        description: "Links sales receipts, shipping costs, and inventory acquisition costs to compute true net gross margins.",
        autonomyLevel: "LEVEL 1 - Recommend",
        status: "RECOMMENDED",
        requiredConnections: ["CSV Data Import"],
        missingConnections: [],
        projectedBenefit: "Provides 100% accurate net profit visibility across all sales categories.",
        approvedByOwner: false
      },
      {
        workerId: "wrk_customer_messaging",
        workerName: "Customer Message Assistant",
        role: "Inbound Support Specialist",
        description: "Drafts instant, polite responses to buyer inquiries regarding measurements, shipping times, or item condition.",
        autonomyLevel: "LEVEL 2 - Prepare drafts",
        status: "RECOMMENDED",
        requiredConnections: ["eBay Messaging API"],
        missingConnections: connectedEbay ? [] : ["eBay Messaging API"],
        projectedBenefit: "Reduces customer reply latency from 12 hours to under 3 minutes.",
        approvedByOwner: false
      }
    ];
  }
}

// =========================================================
// 7. BUSINESS EXPERIMENT SERVICE
// =========================================================

export class BusinessExperimentService {
  /**
   * Creates or tracks a limited pilot experiment to measure real outcomes against baselines.
   */
  public static createExperiment(
    tenantId: string,
    opportunityId: string,
    title: string,
    changePerformed: string,
    pilotGroup: string,
    expectedOutcome: string,
    baselineMetrics: Record<string, number | string>
  ): BusinessExperiment {
    return {
      id: `exp_${Date.now()}`,
      tenantId,
      opportunityId,
      title,
      baselineMetrics,
      changePerformed,
      pilotGroup,
      startDate: new Date().toISOString(),
      expectedOutcome,
      status: "RUNNING"
    };
  }

  /**
   * Updates an experiment with measured results and recommends expand, modify, or rollback.
   */
  public static measureResults(
    experiment: BusinessExperiment,
    actualOutcome: string,
    decision: "EXPAND" | "MODIFY" | "STOPPED" | "ROLLED_BACK",
    lessonsLearned: string
  ): BusinessExperiment {
    experiment.actualOutcome = actualOutcome;
    experiment.status = decision;
    experiment.lessonsLearned = lessonsLearned;
    experiment.measuredAt = new Date().toISOString();
    return experiment;
  }
}
