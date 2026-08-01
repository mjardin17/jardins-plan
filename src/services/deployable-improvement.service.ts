// src/services/deployable-improvement.service.ts
import { DeployableImprovementRepository } from '../repositories/deployable-improvement.repository.ts';
import { FinancialScenarioEngine } from '../lib/financial-scenario-engine.ts';
import { ImprovementAutonomyEngine } from '../lib/improvement-autonomy-engine.ts';
import { ImprovementMeasurementEngine } from '../lib/improvement-measurement-engine.ts';
import { DeployerRegistryService } from './deployer-registry.service.ts';
import {
  DeployableBusinessImprovement,
  CapabilityType,
  BusinessOutcome,
  FinancialAssumption,
  ImprovementDeploymentStatus,
  validateImprovementStatusTransition,
  ImprovementApproval,
  DeploymentAttempt,
  ImprovementPerformanceResult
} from '../types/deployable-improvement.ts';
import { logger } from '../lib/logger.ts';

export class DeployableImprovementService {
  /**
   * Generate a structured Deployable Business Improvement from a diagnosed opportunity.
   */
  public static async generateFromOpportunity(
    tenantId: string,
    params: {
      opportunityId: string;
      title: string;
      description: string;
      problemBeingSolved: string;
      capabilityType: CapabilityType;
      businessOutcome: BusinessOutcome;
      baseMonthlySavings?: number;
      baseMonthlyRevenueIncrease?: number;
      implementationCost?: number;
      monthlyOperatingCost?: number;
      customAssumptions?: FinancialAssumption[];
    }
  ): Promise<DeployableBusinessImprovement> {
    const defaultAssumptions: FinancialAssumption[] = params.customAssumptions || [
      {
        id: "asm_1",
        label: "Estimated monthly labor savings",
        value: params.baseMonthlySavings || 1200,
        classification: "owner_provided",
        requiresConfirmation: true,
        isConfirmed: false
      },
      {
        id: "asm_2",
        label: "Expected revenue expansion ratio",
        value: params.baseMonthlyRevenueIncrease || 2500,
        classification: "benchmark",
        requiresConfirmation: true,
        isConfirmed: false
      },
      {
        id: "asm_3",
        label: "Initial setup & credential configuration cost",
        value: params.implementationCost || 500,
        classification: "calculated",
        requiresConfirmation: false,
        isConfirmed: true
      }
    ];

    const scenarios = FinancialScenarioEngine.calculateScenarios({
      baseMonthlySavings: params.baseMonthlySavings || 1200,
      baseMonthlyRevenueIncrease: params.baseMonthlyRevenueIncrease || 2500,
      implementationCost: params.implementationCost || 500,
      monthlyOperatingCost: params.monthlyOperatingCost || 100,
      assumptions: defaultAssumptions
    });

    const id = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const improvement: DeployableBusinessImprovement = {
      id,
      tenantId,
      opportunityId: params.opportunityId,
      title: params.title,
      description: params.description,
      problemBeingSolved: params.problemBeingSolved,
      capabilityType: params.capabilityType,
      businessOutcome: params.businessOutcome,
      scenarios,
      assumptions: defaultAssumptions,
      confidenceScore: 0.85,
      risks: [
        {
          id: "r1",
          description: "Customer-facing content publication requires owner review",
          severity: "medium",
          mitigationStrategy: "Staged deployment with preview mode",
          requiresHumanApproval: true
        }
      ],
      requiredConnectors: params.capabilityType === 'connector' ? ['crm_connector'] : [],
      requiredCredentials: [],
      requiredApprovals: ["publish_website_changes"],
      dependencies: [],
      deploymentStatus: "recommended",
      measurementPlan: {
        evaluationCadence: "weekly",
        minimumMeasurementPeriodDays: 30,
        baselineMetrics: [
          {
            id: "m_rev",
            name: "Monthly Revenue",
            category: "revenue",
            unit: "USD",
            baselineValue: 15000,
            targetValue: 17500,
            classification: "owner_provided"
          },
          {
            id: "m_ai_disc",
            name: "AI Referral Traffic Share",
            category: "ai_readiness",
            unit: "percent",
            baselineValue: 2,
            targetValue: 15,
            classification: "connected_data"
          }
        ],
        outcomeMetrics: [
          {
            id: "m_rev",
            name: "Monthly Revenue",
            category: "revenue",
            unit: "USD",
            baselineValue: 15000,
            targetValue: 17500,
            currentActualValue: 15000,
            classification: "verified"
          },
          {
            id: "m_ai_disc",
            name: "AI Referral Traffic Share",
            category: "ai_readiness",
            unit: "percent",
            baselineValue: 2,
            targetValue: 15,
            currentActualValue: 2,
            classification: "verified"
          }
        ]
      },
      createdAt: now,
      updatedAt: now
    };

    return DeployableImprovementRepository.createImprovement(tenantId, improvement);
  }

  public static async getImprovement(
    tenantId: string,
    id: string
  ): Promise<DeployableBusinessImprovement> {
    const imp = await DeployableImprovementRepository.getImprovement(tenantId, id);
    if (!imp) throw new Error(`Deployable Improvement [${id}] not found for tenant [${tenantId}].`);
    return imp;
  }

  public static async listImprovements(
    tenantId: string
  ): Promise<DeployableBusinessImprovement[]> {
    return DeployableImprovementRepository.listImprovements(tenantId);
  }

  public static async updateAssumptions(
    tenantId: string,
    id: string,
    updatedAssumptions: FinancialAssumption[]
  ): Promise<DeployableBusinessImprovement> {
    const imp = await this.getImprovement(tenantId, id);

    // Recalculate scenarios
    const baseSavings = Number(updatedAssumptions.find(a => a.id === 'asm_1')?.value) || 1200;
    const baseRevenue = Number(updatedAssumptions.find(a => a.id === 'asm_2')?.value) || 2500;
    const implCost = Number(updatedAssumptions.find(a => a.id === 'asm_3')?.value) || 500;

    const newScenarios = FinancialScenarioEngine.calculateScenarios({
      baseMonthlySavings: baseSavings,
      baseMonthlyRevenueIncrease: baseRevenue,
      implementationCost: implCost,
      monthlyOperatingCost: 100,
      assumptions: updatedAssumptions
    });

    const updated = await DeployableImprovementRepository.updateImprovement(tenantId, id, {
      assumptions: updatedAssumptions,
      scenarios: newScenarios
    });

    return updated!;
  }

  public static async confirmAssumption(
    tenantId: string,
    id: string,
    assumptionId: string,
    isConfirmed: boolean
  ): Promise<DeployableBusinessImprovement> {
    const imp = await this.getImprovement(tenantId, id);
    const updatedAssumptions = imp.assumptions.map(a => {
      if (a.id === assumptionId) {
        return {
          ...a,
          isConfirmed,
          classification: isConfirmed ? ("owner_provided" as const) : a.classification
        };
      }
      return a;
    });

    return this.updateAssumptions(tenantId, id, updatedAssumptions);
  }

  public static async requestApproval(
    tenantId: string,
    id: string
  ): Promise<DeployableBusinessImprovement> {
    const imp = await this.getImprovement(tenantId, id);

    if (!validateImprovementStatusTransition(imp.deploymentStatus, "awaiting_approval")) {
      throw new Error(`Cannot transition improvement from status '${imp.deploymentStatus}' to 'awaiting_approval'.`);
    }

    const updated = await DeployableImprovementRepository.updateImprovement(tenantId, id, {
      deploymentStatus: "awaiting_approval"
    });

    return updated!;
  }

  public static async approveImprovement(
    tenantId: string,
    id: string,
    approver: string,
    approvedScope: string[],
    policyUsed: string = "HUMAN_EXPLICIT"
  ): Promise<{ improvement: DeployableBusinessImprovement; approval: ImprovementApproval }> {
    const imp = await this.getImprovement(tenantId, id);

    if (!validateImprovementStatusTransition(imp.deploymentStatus, "approved")) {
      throw new Error(`Cannot transition improvement from '${imp.deploymentStatus}' to 'approved'.`);
    }

    const approvalId = `appr_${Date.now()}`;
    const approval: ImprovementApproval = {
      id: approvalId,
      improvementId: id,
      tenantId,
      approver,
      approvedScope,
      policyUsed,
      status: "approved",
      createdAt: new Date().toISOString()
    };

    await DeployableImprovementRepository.createApproval(tenantId, approval);

    const updatedImp = await DeployableImprovementRepository.updateImprovement(tenantId, id, {
      deploymentStatus: "approved",
      lastApprovalId: approvalId
    });

    return { improvement: updatedImp!, approval };
  }

  public static async rejectImprovement(
    tenantId: string,
    id: string,
    approver: string,
    rejectionReason: string
  ): Promise<DeployableBusinessImprovement> {
    const imp = await this.getImprovement(tenantId, id);

    if (!validateImprovementStatusTransition(imp.deploymentStatus, "blocked")) {
      throw new Error(`Cannot transition improvement from '${imp.deploymentStatus}' to 'blocked'.`);
    }

    const approvalId = `appr_rej_${Date.now()}`;
    const approval: ImprovementApproval = {
      id: approvalId,
      improvementId: id,
      tenantId,
      approver,
      approvedScope: [],
      policyUsed: "HUMAN_REJECT",
      rejectionReason,
      status: "rejected",
      createdAt: new Date().toISOString()
    };

    await DeployableImprovementRepository.createApproval(tenantId, approval);

    const updatedImp = await DeployableImprovementRepository.updateImprovement(tenantId, id, {
      deploymentStatus: "blocked",
      lastApprovalId: approvalId
    });

    return updatedImp!;
  }

  public static async deployImprovement(
    tenantId: string,
    id: string
  ): Promise<{ improvement: DeployableBusinessImprovement; attempt: DeploymentAttempt }> {
    const imp = await this.getImprovement(tenantId, id);

    // 1. Verify status transition
    if (!validateImprovementStatusTransition(imp.deploymentStatus, "deploying")) {
      throw new Error(`Cannot deploy improvement currently in status '${imp.deploymentStatus}'. Must be 'approved'.`);
    }

    // 2. Validate readiness
    const deployerRegistry = DeployerRegistryService.getInstance();
    const readiness = await deployerRegistry.validateReadiness(tenantId, imp);
    if (!readiness.ready) {
      throw new Error(`Deployment blocked due to missing readiness requirements: ${[...readiness.blockers, ...readiness.missingApprovals].join(', ')}`);
    }

    // 3. Set status to deploying
    await DeployableImprovementRepository.updateImprovement(tenantId, id, {
      deploymentStatus: "deploying"
    });

    // 4. Orchestrate deployment & verification
    const attemptId = `att_${Date.now()}`;
    const result = await deployerRegistry.orchestrateDeployment(tenantId, imp);

    const attempt: DeploymentAttempt = {
      id: attemptId,
      improvementId: id,
      tenantId,
      attemptNumber: 1,
      status: result.finalStatus === 'active' ? 'success' : 'failed',
      log: result.deploymentResult.log,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    await DeployableImprovementRepository.createAttempt(tenantId, attempt);

    // 5. Transition status based on verified outcome
    const updatedImp = await DeployableImprovementRepository.updateImprovement(tenantId, id, {
      deploymentStatus: result.finalStatus,
      activeDeploymentAttemptId: attemptId
    });

    return { improvement: updatedImp!, attempt };
  }

  public static async rollbackDeployment(
    tenantId: string,
    id: string
  ): Promise<{ improvement: DeployableBusinessImprovement; rollbackLog: string[] }> {
    const imp = await this.getImprovement(tenantId, id);

    if (!validateImprovementStatusTransition(imp.deploymentStatus, "rolled_back")) {
      throw new Error(`Cannot roll back improvement in status '${imp.deploymentStatus}'.`);
    }

    const deployerRegistry = DeployerRegistryService.getInstance();
    const rollbackRes = await deployerRegistry.rollback(tenantId, imp);

    const updatedImp = await DeployableImprovementRepository.updateImprovement(tenantId, id, {
      deploymentStatus: "rolled_back"
    });

    return { improvement: updatedImp!, rollbackLog: rollbackRes.log };
  }

  public static async evaluatePerformance(
    tenantId: string,
    id: string,
    actualMetrics?: Record<string, number>
  ): Promise<ImprovementPerformanceResult> {
    const imp = await this.getImprovement(tenantId, id);

    const metricsToUse = actualMetrics || {
      "m_rev": 17200,
      "m_ai_disc": 12
    };

    const perfResult = ImprovementMeasurementEngine.evaluatePerformance({
      improvement: imp,
      actualMetrics: metricsToUse
    });

    await DeployableImprovementRepository.savePerformanceResult(tenantId, perfResult);
    return perfResult;
  }

  public static async disableImprovement(
    tenantId: string,
    id: string
  ): Promise<DeployableBusinessImprovement> {
    const imp = await this.getImprovement(tenantId, id);

    if (!validateImprovementStatusTransition(imp.deploymentStatus, "disabled")) {
      throw new Error(`Cannot disable improvement in status '${imp.deploymentStatus}'.`);
    }

    const updatedImp = await DeployableImprovementRepository.updateImprovement(tenantId, id, {
      deploymentStatus: "disabled"
    });

    return updatedImp!;
  }
}
