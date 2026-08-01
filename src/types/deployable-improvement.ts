// src/types/deployable-improvement.ts

export type EvidenceClassification =
  | "verified"
  | "owner_provided"
  | "connected_data"
  | "calculated"
  | "benchmark"
  | "assumption"
  | "unknown";

export type CapabilityType =
  | "worker"
  | "connector"
  | "automation"
  | "website_improvement"
  | "ai_accessibility"
  | "agent_ready_capability"
  | "sales_channel"
  | "payment_capability"
  | "custom_workflow";

export type BusinessOutcome =
  | "increase_revenue"
  | "reduce_cost"
  | "save_time"
  | "reduce_risk"
  | "improve_ai_discoverability"
  | "enable_ai_transactions";

export type ImprovementDeploymentStatus =
  | "recommended"
  | "awaiting_information"
  | "awaiting_approval"
  | "approved"
  | "deploying"
  | "active"
  | "blocked"
  | "failed"
  | "disabled"
  | "rolled_back";

export type ImprovementDecision =
  | "continue"
  | "expand"
  | "modify"
  | "pause"
  | "rollback"
  | "insufficient_data";

export type FinancialBenefitStatus =
  | "verified"
  | "partially_verified"
  | "not_verified"
  | "inconclusive";

export interface FinancialAssumption {
  id: string;
  label: string;
  value: number | string | boolean;
  classification: EvidenceClassification;
  source?: string;
  requiresConfirmation: boolean;
  isConfirmed?: boolean;
}

export interface FinancialScenario {
  scenario: "conservative" | "expected" | "upside";
  monthlySavings?: number;
  monthlyRevenueIncrease?: number;
  monthlyImplementationCost?: number;
  monthlyOperatingCost?: number;
  monthlyNetBenefit?: number;
  annualNetBenefit?: number;
  paybackPeriodMonths?: number;
  roiPercent?: number;
  formulaDetails?: {
    inputs: Record<string, number | string | boolean>;
    formula: string;
    confidenceScore: number;
    hasUnknowns: boolean;
  };
}

export interface BusinessMetricDefinition {
  id: string;
  name: string;
  category: "revenue" | "cost" | "efficiency" | "ai_readiness" | "customer_experience";
  unit: string;
  baselineValue?: number;
  targetValue?: number;
  currentActualValue?: number;
  classification: EvidenceClassification;
}

export interface ImprovementMeasurementPlan {
  baselineStartDate?: string;
  baselineEndDate?: string;
  baselineMetrics: BusinessMetricDefinition[];
  outcomeMetrics: BusinessMetricDefinition[];
  evaluationCadence: "daily" | "weekly" | "monthly";
  minimumMeasurementPeriodDays: number;
}

export interface ImprovementRisk {
  id: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  mitigationStrategy: string;
  requiresHumanApproval: boolean;
}

export interface ImprovementDependency {
  id: string;
  label: string;
  type: "connector" | "credential" | "approval" | "system";
  satisfied: boolean;
  details?: string;
}

export interface ImprovementApproval {
  id: string;
  improvementId: string;
  tenantId: string;
  approver: string;
  approvedScope: string[];
  policyUsed: string;
  expiresAt?: string;
  rejectionReason?: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  createdAt: string;
  updatedAt?: string;
}

export interface DeploymentAttempt {
  id: string;
  improvementId: string;
  tenantId: string;
  attemptNumber: number;
  status: "in_progress" | "success" | "failed" | "rolled_back";
  log: string[];
  startedAt: string;
  completedAt?: string;
  rollbackLog?: string[];
}

export interface ImprovementPerformanceResult {
  id: string;
  improvementId: string;
  tenantId: string;
  evaluationDate: string;
  status: ImprovementDeploymentStatus;
  comparisonToBaseline: Record<string, number>;
  comparisonToScenarios: {
    conservativeRatio: number;
    expectedRatio: number;
    upsideRatio: number;
  };
  financialBenefitStatus: FinancialBenefitStatus;
  recommendation: ImprovementDecision;
  notes?: string;
}

export interface DeployableBusinessImprovement {
  id: string;
  tenantId: string;
  opportunityId: string;

  title: string;
  description: string;
  problemBeingSolved: string;

  capabilityType: CapabilityType;
  businessOutcome: BusinessOutcome;

  scenarios: FinancialScenario[];
  assumptions: FinancialAssumption[];
  confidenceScore: number;
  risks: ImprovementRisk[];

  requiredConnectors: string[];
  requiredCredentials: string[];
  requiredApprovals: string[];
  dependencies: ImprovementDependency[];

  deploymentStatus: ImprovementDeploymentStatus;
  measurementPlan: ImprovementMeasurementPlan;

  activeDeploymentAttemptId?: string;
  lastApprovalId?: string;
  createdAt: string;
  updatedAt: string;
}

// Strict State Machine Rules
export const VALID_IMPROVEMENT_TRANSITIONS: Record<ImprovementDeploymentStatus, ImprovementDeploymentStatus[]> = {
  recommended: ["awaiting_information", "awaiting_approval", "disabled"],
  awaiting_information: ["awaiting_approval", "blocked", "disabled"],
  awaiting_approval: ["approved", "blocked", "disabled"],
  approved: ["deploying", "disabled"],
  deploying: ["active", "failed", "disabled"],
  active: ["blocked", "rolled_back", "disabled"],
  blocked: ["awaiting_information", "awaiting_approval", "approved", "deploying", "disabled"],
  failed: ["awaiting_information", "deploying", "disabled", "rolled_back"],
  disabled: ["recommended", "awaiting_information", "awaiting_approval"],
  rolled_back: ["recommended", "disabled"]
};

export function validateImprovementStatusTransition(
  current: ImprovementDeploymentStatus,
  target: ImprovementDeploymentStatus
): boolean {
  if (current === target) return true;
  const allowed = VALID_IMPROVEMENT_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}
