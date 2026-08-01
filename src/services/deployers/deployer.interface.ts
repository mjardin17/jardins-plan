// src/services/deployers/deployer.interface.ts
import { DeployableBusinessImprovement, CapabilityType } from '../../types/deployable-improvement.ts';

export interface ReadinessResult {
  ready: boolean;
  blockers: string[];
  missingConnectors: string[];
  missingCredentials: string[];
  missingApprovals: string[];
  details?: Record<string, any>;
}

export interface DeploymentPlanStep {
  stepNumber: number;
  name: string;
  action: string;
  requiresVerification: boolean;
}

export interface DeploymentPlan {
  improvementId: string;
  capabilityType: CapabilityType;
  steps: DeploymentPlanStep[];
  estimatedDurationSeconds: number;
}

export interface DeploymentResult {
  success: boolean;
  attemptId: string;
  log: string[];
  deployedAt?: string;
  error?: string;
}

export interface VerificationResult {
  verified: boolean;
  metricsVerified: string[];
  log: string[];
  details?: Record<string, any>;
  failureReason?: string;
}

export interface RollbackResult {
  success: boolean;
  log: string[];
  rolledBackAt: string;
  error?: string;
}

export interface BusinessImprovementDeployer {
  capabilityType: CapabilityType;
  validateReadiness(tenantId: string, improvement: DeployableBusinessImprovement): Promise<ReadinessResult>;
  createPlan(tenantId: string, improvement: DeployableBusinessImprovement): Promise<DeploymentPlan>;
  deploy(tenantId: string, improvement: DeployableBusinessImprovement): Promise<DeploymentResult>;
  verify(tenantId: string, improvement: DeployableBusinessImprovement): Promise<VerificationResult>;
  rollback(tenantId: string, improvement: DeployableBusinessImprovement): Promise<RollbackResult>;
}
