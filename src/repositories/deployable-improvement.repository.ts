// src/repositories/deployable-improvement.repository.ts
import { db } from '../db/index.ts';
import {
  deployableImprovements,
  improvementApprovals,
  improvementDeploymentAttempts,
  improvementPerformanceResults
} from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import {
  DeployableBusinessImprovement,
  ImprovementApproval,
  DeploymentAttempt,
  ImprovementPerformanceResult,
  ImprovementDeploymentStatus
} from '../types/deployable-improvement.ts';
import { logger } from '../lib/logger.ts';
import { validateEnvironment } from '../config/env-validator.ts';

// In-memory tenant store fallback for local dev / tests
const memoryImprovementStore = new Map<string, Map<string, DeployableBusinessImprovement>>();
const memoryApprovalStore = new Map<string, ImprovementApproval[]>();
const memoryAttemptStore = new Map<string, DeploymentAttempt[]>();
const memoryPerformanceStore = new Map<string, ImprovementPerformanceResult[]>();

export function checkFallbackAllowed(action: string, error?: any): void {
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  
  if (nodeEnv === 'production') {
    logger.error(`[DeployableImprovementRepository] CRITICAL: Database operation failed during ${action} in PRODUCTION. Fallback prohibited.`);
    throw new Error(`PRODUCTION DATABASE FAILURE [${action}]: ${error?.message || 'Database connection unavailable'}`);
  }

  if (nodeEnv === 'development' && process.env.ALLOW_IN_MEMORY_DEV_FALLBACK !== 'true') {
    logger.error(`[DeployableImprovementRepository] Database operation failed during ${action} in DEVELOPMENT, and ALLOW_IN_MEMORY_DEV_FALLBACK is not 'true'.`);
    throw new Error(`DEVELOPMENT DATABASE FAILURE [${action}]: Set ALLOW_IN_MEMORY_DEV_FALLBACK=true to permit ephemeral in-memory storage during local development.`);
  }

  logger.warn(`[DeployableImprovementRepository] Using ephemeral in-memory store for ${action} (${nodeEnv} mode)`);
}

export class DeployableImprovementRepository {
  public static async createImprovement(
    tenantId: string,
    improvement: DeployableBusinessImprovement
  ): Promise<DeployableBusinessImprovement> {
    let dbSuccess = false;

    if (db) {
      try {
        await db.insert(deployableImprovements).values({
          id: improvement.id,
          tenantId,
          opportunityId: improvement.opportunityId,
          title: improvement.title,
          description: improvement.description,
          problemBeingSolved: improvement.problemBeingSolved,
          capabilityType: improvement.capabilityType,
          businessOutcome: improvement.businessOutcome,
          scenarios: improvement.scenarios as any,
          assumptions: improvement.assumptions as any,
          confidenceScore: improvement.confidenceScore,
          risks: improvement.risks as any,
          requiredConnectors: improvement.requiredConnectors as any,
          requiredCredentials: improvement.requiredCredentials as any,
          requiredApprovals: improvement.requiredApprovals as any,
          dependencies: improvement.dependencies as any,
          deploymentStatus: improvement.deploymentStatus,
          measurementPlan: improvement.measurementPlan as any,
          activeDeploymentAttemptId: improvement.activeDeploymentAttemptId,
          lastApprovalId: improvement.lastApprovalId,
          createdAt: new Date(improvement.createdAt),
          updatedAt: new Date(improvement.updatedAt)
        });
        dbSuccess = true;
      } catch (err: any) {
        checkFallbackAllowed('createImprovement', err);
      }
    } else {
      checkFallbackAllowed('createImprovement (No DB instance)');
    }

    if (!dbSuccess) {
      if (!memoryImprovementStore.has(tenantId)) {
        memoryImprovementStore.set(tenantId, new Map());
      }
      memoryImprovementStore.get(tenantId)!.set(improvement.id, improvement);
    }

    return improvement;
  }

  public static async getImprovement(
    tenantId: string,
    id: string
  ): Promise<DeployableBusinessImprovement | null> {
    if (db) {
      try {
        const records = await db
          .select()
          .from(deployableImprovements)
          .where(and(eq(deployableImprovements.tenantId, tenantId), eq(deployableImprovements.id, id)));

        if (records.length > 0) {
          const r = records[0];
          return {
            id: r.id,
            tenantId: r.tenantId,
            opportunityId: r.opportunityId,
            title: r.title,
            description: r.description,
            problemBeingSolved: r.problemBeingSolved,
            capabilityType: r.capabilityType as any,
            businessOutcome: r.businessOutcome as any,
            scenarios: r.scenarios as any,
            assumptions: r.assumptions as any,
            confidenceScore: r.confidenceScore,
            risks: r.risks as any,
            requiredConnectors: r.requiredConnectors as any,
            requiredCredentials: r.requiredCredentials as any,
            requiredApprovals: r.requiredApprovals as any,
            dependencies: r.dependencies as any,
            deploymentStatus: r.deploymentStatus as any,
            measurementPlan: r.measurementPlan as any,
            activeDeploymentAttemptId: r.activeDeploymentAttemptId || undefined,
            lastApprovalId: r.lastApprovalId || undefined,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
          };
        }
        return null;
      } catch (err: any) {
        checkFallbackAllowed('getImprovement', err);
      }
    } else {
      checkFallbackAllowed('getImprovement (No DB instance)');
    }

    const tenantStore = memoryImprovementStore.get(tenantId);
    return tenantStore?.get(id) || null;
  }

  public static async listImprovements(
    tenantId: string
  ): Promise<DeployableBusinessImprovement[]> {
    if (db) {
      try {
        const records = await db
          .select()
          .from(deployableImprovements)
          .where(eq(deployableImprovements.tenantId, tenantId))
          .orderBy(desc(deployableImprovements.createdAt));

        return records.map(r => ({
          id: r.id,
          tenantId: r.tenantId,
          opportunityId: r.opportunityId,
          title: r.title,
          description: r.description,
          problemBeingSolved: r.problemBeingSolved,
          capabilityType: r.capabilityType as any,
          businessOutcome: r.businessOutcome as any,
          scenarios: r.scenarios as any,
          assumptions: r.assumptions as any,
          confidenceScore: r.confidenceScore,
          risks: r.risks as any,
          requiredConnectors: r.requiredConnectors as any,
          requiredCredentials: r.requiredCredentials as any,
          requiredApprovals: r.requiredApprovals as any,
          dependencies: r.dependencies as any,
          deploymentStatus: r.deploymentStatus as any,
          measurementPlan: r.measurementPlan as any,
          activeDeploymentAttemptId: r.activeDeploymentAttemptId || undefined,
          lastApprovalId: r.lastApprovalId || undefined,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
        }));
      } catch (err: any) {
        checkFallbackAllowed('listImprovements', err);
      }
    } else {
      checkFallbackAllowed('listImprovements (No DB instance)');
    }

    const tenantStore = memoryImprovementStore.get(tenantId);
    return tenantStore ? Array.from(tenantStore.values()) : [];
  }

  public static async updateImprovement(
    tenantId: string,
    id: string,
    updates: Partial<DeployableBusinessImprovement>
  ): Promise<DeployableBusinessImprovement | null> {
    const existing = await this.getImprovement(tenantId, id);
    if (!existing) return null;

    const updated: DeployableBusinessImprovement = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    let dbSuccess = false;

    if (db) {
      try {
        await db
          .update(deployableImprovements)
          .set({
            title: updated.title,
            description: updated.description,
            deploymentStatus: updated.deploymentStatus,
            scenarios: updated.scenarios as any,
            assumptions: updated.assumptions as any,
            measurementPlan: updated.measurementPlan as any,
            activeDeploymentAttemptId: updated.activeDeploymentAttemptId,
            lastApprovalId: updated.lastApprovalId,
            updatedAt: new Date()
          })
          .where(and(eq(deployableImprovements.tenantId, tenantId), eq(deployableImprovements.id, id)));
        dbSuccess = true;
      } catch (err: any) {
        checkFallbackAllowed('updateImprovement', err);
      }
    } else {
      checkFallbackAllowed('updateImprovement (No DB instance)');
    }

    if (!dbSuccess) {
      if (!memoryImprovementStore.has(tenantId)) {
        memoryImprovementStore.set(tenantId, new Map());
      }
      memoryImprovementStore.get(tenantId)!.set(id, updated);
    }

    return updated;
  }

  public static async createApproval(
    tenantId: string,
    approval: ImprovementApproval
  ): Promise<ImprovementApproval> {
    let dbSuccess = false;

    if (db) {
      try {
        await db.insert(improvementApprovals).values({
          id: approval.id,
          improvementId: approval.improvementId,
          tenantId,
          approver: approval.approver,
          approvedScope: approval.approvedScope as any,
          policyUsed: approval.policyUsed,
          expiresAt: approval.expiresAt ? new Date(approval.expiresAt) : null,
          rejectionReason: approval.rejectionReason,
          status: approval.status,
          createdAt: new Date(approval.createdAt)
        });
        dbSuccess = true;
      } catch (err: any) {
        checkFallbackAllowed('createApproval', err);
      }
    } else {
      checkFallbackAllowed('createApproval (No DB instance)');
    }

    if (!dbSuccess) {
      if (!memoryApprovalStore.has(tenantId)) {
        memoryApprovalStore.set(tenantId, []);
      }
      memoryApprovalStore.get(tenantId)!.push(approval);
    }

    return approval;
  }

  public static async createAttempt(
    tenantId: string,
    attempt: DeploymentAttempt
  ): Promise<DeploymentAttempt> {
    let dbSuccess = false;

    if (db) {
      try {
        await db.insert(improvementDeploymentAttempts).values({
          id: attempt.id,
          improvementId: attempt.improvementId,
          tenantId,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          log: attempt.log as any,
          startedAt: new Date(attempt.startedAt),
          completedAt: attempt.completedAt ? new Date(attempt.completedAt) : null,
          rollbackLog: attempt.rollbackLog as any
        });
        dbSuccess = true;
      } catch (err: any) {
        checkFallbackAllowed('createAttempt', err);
      }
    } else {
      checkFallbackAllowed('createAttempt (No DB instance)');
    }

    if (!dbSuccess) {
      if (!memoryAttemptStore.has(tenantId)) {
        memoryAttemptStore.set(tenantId, []);
      }
      memoryAttemptStore.get(tenantId)!.push(attempt);
    }

    return attempt;
  }

  public static async savePerformanceResult(
    tenantId: string,
    result: ImprovementPerformanceResult
  ): Promise<ImprovementPerformanceResult> {
    let dbSuccess = false;

    if (db) {
      try {
        await db.insert(improvementPerformanceResults).values({
          id: result.id,
          improvementId: result.improvementId,
          tenantId,
          evaluationDate: new Date(result.evaluationDate),
          status: result.status,
          comparisonToBaseline: result.comparisonToBaseline as any,
          comparisonToScenarios: result.comparisonToScenarios as any,
          financialBenefitStatus: result.financialBenefitStatus,
          recommendation: result.recommendation,
          notes: result.notes
        });
        dbSuccess = true;
      } catch (err: any) {
        checkFallbackAllowed('savePerformanceResult', err);
      }
    } else {
      checkFallbackAllowed('savePerformanceResult (No DB instance)');
    }

    if (!dbSuccess) {
      if (!memoryPerformanceStore.has(tenantId)) {
        memoryPerformanceStore.set(tenantId, []);
      }
      memoryPerformanceStore.get(tenantId)!.push(result);
    }

    return result;
  }

  // Clear memory stores (useful for reset/testing)
  public static clearMemoryStore(): void {
    memoryImprovementStore.clear();
    memoryApprovalStore.clear();
    memoryAttemptStore.clear();
    memoryPerformanceStore.clear();
  }
}

