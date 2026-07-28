// src/types/business-discovery.ts

export type EvidenceFreshness = "CURRENT" | "AGING" | "STALE" | "UNKNOWN";
export type EvidenceVerificationStatus = "DIRECTLY_OBSERVED" | "OWNER_CONFIRMED" | "INFERRED" | "UNVERIFIED";

export interface BusinessEvidence {
  id: string;
  tenantId: string;
  sourceType: string; // e.g. "ebay_api", "owner_interview", "stripe_api", "system_observation"
  sourceId?: string;
  category: string;
  fact: string;
  value?: unknown;
  observedAt: string;
  confidence: number; // 0.0 - 1.0
  freshness: EvidenceFreshness;
  verificationStatus: EvidenceVerificationStatus;
}

export type QuestionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type QuestionStatus = "UNASKED" | "ASKED" | "ANSWERED" | "SKIPPED";
export type QuestionAnswerType = "multiple_choice" | "numeric" | "yes_no" | "text" | "file_upload";

export interface BusinessUnknown {
  id: string;
  tenantId: string;
  category: string;
  question: string;
  reason: string;
  expectedDecisionImpact: number; // 1 - 10 scale
  priority: QuestionPriority;
  status: QuestionStatus;
  answerType: QuestionAnswerType;
  options?: string[];
  ownerAnswer?: unknown;
  answeredAt?: string;
  isIknowNot?: boolean;
}

export interface BusinessProfile {
  tenantId: string;
  businessType: string;
  revenueModels: string[];
  productsOrServices: string[];
  salesChannels: string[];
  operationalSystems: string[];
  constraints: string[];
  goals: string[];
  evidenceIds: string[];
  unknownIds: string[];
  confidenceScore: number;
  lastUpdatedAt: string;
}

export type DiagnosticDimensionKey =
  | "revenue"
  | "profitability"
  | "inventory"
  | "sales_conversion"
  | "pricing"
  | "marketing"
  | "customer_retention"
  | "operations"
  | "time_efficiency"
  | "data_quality"
  | "automation_readiness"
  | "technology"
  | "compliance_and_risk"
  | "financial_visibility"
  | "scalability";

export interface BusinessDiagnosticDimension {
  key: DiagnosticDimensionKey;
  title: string;
  observedCondition: string;
  supportingEvidence: string[]; // Evidence IDs or descriptions
  confidence: number; // 0.0 - 1.0
  suspectedRootCause: string;
  businessImpact: string;
  affectedWorkflows: string[];
  missingEvidence: string[];
  recommendedNextInvestigation: string;
  humanConfirmationRequired: boolean;
  scorePct: number; // 0 - 100
  status: "OPTIMAL" | "ATTENTION_REQUIRED" | "CRITICAL_BOTTLENECK" | "UNKNOWN";
}

export interface BusinessHealthAssessment {
  tenantId: string;
  dimensions: Record<DiagnosticDimensionKey, BusinessDiagnosticDimension>;
  overallScorePct: number;
  overallStatus: "HEALTHY" | "MODERATE_RISK" | "HIGH_FRICTION" | "CRITICAL";
  summary: string;
  evaluatedAt: string;
}

export type ImpactUnit = "USD" | "HOURS" | "PERCENT" | "COUNT";
export type LevelEffortRisk = "LOW" | "MEDIUM" | "HIGH";
export type OpportunityStatus =
  | "DISCOVERED"
  | "VALIDATING"
  | "RECOMMENDED"
  | "APPROVED"
  | "IMPLEMENTING"
  | "MEASURING"
  | "COMPLETED"
  | "REJECTED";

export interface BusinessOpportunity {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  evidenceIds: string[];
  affectedMetric: string;
  estimatedImpactLow?: number;
  estimatedImpactHigh?: number;
  impactUnit?: ImpactUnit;
  confidence: number;
  implementationEffort: LevelEffortRisk;
  implementationRisk: LevelEffortRisk;
  timeToValue: string;
  dependencies: string[];
  recommendedWorkerTypes: string[];
  recommendedHumanActions: string[];
  status: OpportunityStatus;
  prioritizationScore: number; // Explainable ranking score
  prioritizationReasoning: string;
}

export type RoadmapPhase =
  | "Phase 1 - Stabilize"
  | "Phase 2 - Gain Visibility"
  | "Phase 3 - Improve Current Operations"
  | "Phase 4 - Expand"
  | "Phase 5 - Optimize and Scale";

export type AutonomyLevel =
  | "LEVEL 0 - Observe only"
  | "LEVEL 1 - Recommend"
  | "LEVEL 2 - Prepare drafts"
  | "LEVEL 3 - Execute after approval"
  | "LEVEL 4 - Execute within approved limits"
  | "LEVEL 5 - Autonomous operation with exception escalation";

export interface ImprovementRoadmapItem {
  id: string;
  tenantId: string;
  phase: RoadmapPhase;
  title: string;
  problemBeingAddressed: string;
  supportingEvidence: string[];
  expectedResult: string;
  responsibleWorker: string;
  requiredHumanInput: string;
  dependencies: string[];
  risk: LevelEffortRisk;
  successMetric: string;
  rollbackStrategy: string;
  approvalRequirement: AutonomyLevel;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED";
}

export interface BusinessExperiment {
  id: string;
  tenantId: string;
  opportunityId: string;
  title: string;
  baselineMetrics: Record<string, number | string>;
  changePerformed: string;
  pilotGroup: string;
  startDate: string;
  endDate?: string;
  expectedOutcome: string;
  actualOutcome?: string;
  status: "RUNNING" | "MEASURING" | "EXPAND" | "MODIFY" | "STOPPED" | "ROLLED_BACK";
  lessonsLearned?: string;
  measuredAt?: string;
}

export interface WorkerAutonomyControl {
  workerId: string;
  workerName: string;
  role: string;
  description: string;
  autonomyLevel: AutonomyLevel;
  status: "RECOMMENDED" | "APPROVED" | "PILOTING" | "ACTIVE" | "PAUSED" | "DISABLED";
  requiredConnections: string[];
  missingConnections: string[];
  projectedBenefit: string;
  pilotStatus?: string;
  approvedByOwner: boolean;
  approvedAt?: string;
}

export interface EbayStoreAnalysis {
  tenantId: string;
  accountStatus: "CONNECTED" | "SANDBOX_SIMULATED" | "DISCONNECTED";
  storeName: string;
  totalActiveListings: number;
  totalListedValueUsd: number;
  soldListingsCount30d: number;
  endedUnsoldListingsCount: number;
  averageSellingPriceUsd: number;
  sellThroughRatePct: number;
  listingAgeDistribution: {
    under30Days: number;
    days30To60: number;
    days60To120: number;
    over120DaysStale: number;
  };
  impressions30d: number;
  views30d: number;
  watchersCount: number;
  activeOffersCount: number;
  conversionRatePct: number;
  averageShippingCostUsd: number;
  averageMarketplaceFeePct: number;
  quantityAvailableTotal: number;
  quantitySold30d: number;
  returnRatePct: number;
  cancellationRatePct: number;
  promotedListingAdFeePct: number;
  skuCoveragePct: number;
  itemSpecificsCompletenessPct: number;
  averageImagesPerListing: number;
  revenueTrend30d: number[];
  grossProfitUsd: number | null; // Null if cost data unavailable
  unknownFields: string[];
  apiSourceMapping: Record<string, string>;
  lastAnalyzedAt: string;
}
