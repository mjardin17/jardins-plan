// src/services/business-discovery.service.ts
import {
  BusinessDiscoveryEngine,
  BusinessDiagnosticEngine,
  AdaptiveBusinessInterviewEngine,
  BusinessOpportunityEngine,
  ImprovementRoadmapService,
  WorkerAutonomyEngine,
  BusinessExperimentService
} from "../lib/business-discovery-engine.ts";
import {
  BusinessDiscoveryRepository,
  TenantDiscoveryData
} from "../repositories/business-discovery.repository.ts";
import { EbayBusinessAnalyzer } from "../lib/ebay-business-analyzer.ts";
import {
  BusinessUnknown,
  BusinessEvidence,
  BusinessProfile,
  BusinessHealthAssessment,
  BusinessOpportunity,
  ImprovementRoadmapItem,
  WorkerAutonomyControl,
  BusinessExperiment
} from "../types/business-discovery.ts";
import { logger } from "../lib/logger.ts";

export class BusinessDiscoveryService {
  /**
   * Initializes or loads the complete discovery engine suite for a tenant.
   */
  public static async runDiscovery(
    tenantId: string,
    connectEbay = true,
    forceRefresh = false
  ): Promise<TenantDiscoveryData> {
    if (!forceRefresh) {
      const existing = await BusinessDiscoveryRepository.getTenantData(tenantId);
      if (existing) return existing;
    }

    // 1. Discover Business & Extract System Evidence + Unknowns
    const { profile, evidence, unknowns } = BusinessDiscoveryEngine.discoverBusiness(
      tenantId,
      undefined,
      connectEbay
    );

    // 2. Evaluate Health across 15 Dimensions
    const health = BusinessDiagnosticEngine.evaluateHealth(tenantId, evidence, unknowns);

    // 3. Discover Opportunities with Explainable Scoring
    const opportunities = BusinessOpportunityEngine.discoverOpportunities(tenantId, evidence, health);

    // 4. Generate 5-Phase Improvement Roadmap
    const roadmap = ImprovementRoadmapService.generateRoadmap(tenantId, opportunities);

    // 5. Worker Recommendations & Autonomy Controls
    const workers = WorkerAutonomyEngine.getRecommendedWorkers(tenantId, connectEbay);

    // 6. Default Pilot Experiment
    const pilotExperiment = BusinessExperimentService.createExperiment(
      tenantId,
      opportunities[0]?.id || "opp_default",
      "Pilot: Unlisted Backlog Draft Auto-Generation",
      "Generated 10 draft listings with AI title optimization and item specifics",
      "10 items from home storage backlog",
      "Reduce listing draft creation time from 20 mins to under 2 mins per item",
      { averageCreationTimeMins: 20, backlogDraftsReady: 0 }
    );

    const fullData: TenantDiscoveryData = {
      profile,
      evidence,
      unknowns,
      health,
      opportunities,
      roadmap,
      experiments: [pilotExperiment],
      workers
    };

    await BusinessDiscoveryRepository.saveTenantData(tenantId, fullData);
    logger.info(`[BusinessDiscoveryService] Discovery workflow initialized for tenant [${tenantId}].`);

    return fullData;
  }

  /**
   * Get 3 to 5 prioritized interview questions with rationale.
   */
  public static async getInterviewQuestions(tenantId: string): Promise<{
    questions: BusinessUnknown[];
    remainingCount: number;
    profileConfidencePct: number;
  }> {
    const data = await BusinessDiscoveryService.runDiscovery(tenantId);
    const questions = AdaptiveBusinessInterviewEngine.getNextQuestionBatch(data.unknowns, 4);
    const remaining = data.unknowns.filter((u) => u.status === "UNASKED").length;

    return {
      questions,
      remainingCount: remaining,
      profileConfidencePct: data.profile.confidenceScore
    };
  }

  /**
   * Process owner answer, update facts, re-evaluate health & opportunities dynamically.
   */
  public static async submitAnswer(
    tenantId: string,
    questionId: string,
    answer: unknown,
    action: "ANSWER" | "I_DONT_KNOW" | "SKIP"
  ): Promise<{
    data: TenantDiscoveryData;
    contradictionDetected?: string;
  }> {
    const data = await BusinessDiscoveryService.runDiscovery(tenantId);

    const { updatedUnknowns, updatedEvidence, contradictionDetected } =
      AdaptiveBusinessInterviewEngine.submitAnswer(
        data.unknowns,
        data.evidence,
        questionId,
        answer,
        action
      );

    data.unknowns = updatedUnknowns;
    data.evidence = updatedEvidence;

    // Dynamically increase profile confidence as unknowns are answered
    const answeredCount = data.unknowns.filter((u) => u.status === "ANSWERED").length;
    data.profile.confidenceScore = Math.min(100, 82 + answeredCount * 4);
    data.profile.lastUpdatedAt = new Date().toISOString();

    // Re-evaluate Health & Opportunities with new confirmed facts
    data.health = BusinessDiagnosticEngine.evaluateHealth(tenantId, data.evidence, data.unknowns);
    data.opportunities = BusinessOpportunityEngine.discoverOpportunities(tenantId, data.evidence, data.health);
    data.roadmap = ImprovementRoadmapService.generateRoadmap(tenantId, data.opportunities);

    await BusinessDiscoveryRepository.saveTenantData(tenantId, data);
    await BusinessDiscoveryRepository.logAuditAction(
      tenantId,
      "owner@resale.com",
      "SUBMIT_INTERVIEW_ANSWER",
      `Answered question ${questionId} with action ${action}`
    );

    return { data, contradictionDetected };
  }

  /**
   * Updates worker autonomy level and approval state.
   */
  public static async updateWorkerAutonomy(
    tenantId: string,
    workerId: string,
    autonomyLevel: any,
    approved: boolean
  ): Promise<TenantDiscoveryData> {
    const data = await BusinessDiscoveryService.runDiscovery(tenantId);
    const target = data.workers.find((w) => w.workerId === workerId);

    if (target) {
      target.autonomyLevel = autonomyLevel;
      target.approvedByOwner = approved;
      target.status = approved ? "APPROVED" : "RECOMMENDED";
      if (approved) target.approvedAt = new Date().toISOString();
      await BusinessDiscoveryRepository.saveTenantData(tenantId, data);
      await BusinessDiscoveryRepository.logAuditAction(
        tenantId,
        "owner@resale.com",
        "UPDATE_WORKER_AUTONOMY",
        `Worker ${workerId} autonomy set to ${autonomyLevel}, approved: ${approved}`
      );
    }

    return data;
  }

  /**
   * Updates experiment results and applies expand/modify/rollback decision.
   */
  public static async updateExperimentResults(
    tenantId: string,
    experimentId: string,
    actualOutcome: string,
    decision: "EXPAND" | "MODIFY" | "STOPPED" | "ROLLED_BACK",
    lessonsLearned: string
  ): Promise<TenantDiscoveryData> {
    const data = await BusinessDiscoveryService.runDiscovery(tenantId);
    const target = data.experiments.find((e) => e.id === experimentId);

    if (target) {
      BusinessExperimentService.measureResults(target, actualOutcome, decision, lessonsLearned);
      await BusinessDiscoveryRepository.saveTenantData(tenantId, data);
      await BusinessDiscoveryRepository.logAuditAction(
        tenantId,
        "owner@resale.com",
        "EXPERIMENT_DECISION",
        `Experiment ${experimentId} updated to ${decision}`
      );
    }

    return data;
  }
}
