// src/lib/improvement-autonomy-engine.ts
import {
  DeployableBusinessImprovement,
  CapabilityType,
  ImprovementRisk,
  ImprovementApproval
} from '../types/deployable-improvement.ts';
import { logger } from './logger.ts';

export type HighRiskCategory =
  | "publish_website_changes"
  | "spend_money"
  | "connect_financial_accounts"
  | "request_credentials"
  | "change_pricing"
  | "enable_payments"
  | "modify_customer_content"
  | "create_marketplace_listings"
  | "send_external_communications"
  | "delete_data";

export interface AutonomyEvaluationResult {
  requiresHumanApproval: boolean;
  detectedHighRiskCategories: HighRiskCategory[];
  allowedToPrepareAutomatically: boolean;
  policyUsed: string;
  reason: string;
}

export class ImprovementAutonomyEngine {
  private static HIGH_RISK_CAPABILITIES: Record<CapabilityType, HighRiskCategory[]> = {
    website_improvement: ["publish_website_changes", "modify_customer_content"],
    ai_accessibility: ["publish_website_changes", "modify_customer_content"],
    agent_ready_capability: ["modify_customer_content", "send_external_communications"],
    payment_capability: ["enable_payments", "connect_financial_accounts", "spend_money"],
    sales_channel: ["create_marketplace_listings", "change_pricing"],
    automation: ["send_external_communications"],
    worker: ["send_external_communications"],
    connector: ["request_credentials"],
    custom_workflow: ["send_external_communications"]
  };

  /**
   * Evaluate whether an improvement requires human approval or can proceed automatically.
   */
  public static evaluateAutonomy(
    improvement: DeployableBusinessImprovement,
    workerPolicy: string = "ALWAYS_ASK"
  ): AutonomyEvaluationResult {
    const highRisks: HighRiskCategory[] = [];

    // Check capability type risks
    const capRisks = this.HIGH_RISK_CAPABILITIES[improvement.capabilityType] || [];
    highRisks.push(...capRisks);

    // Check risks array
    for (const risk of improvement.risks) {
      if (risk.severity === 'high' || risk.severity === 'critical' || risk.requiresHumanApproval) {
        if (!highRisks.includes("modify_customer_content")) {
          highRisks.push("modify_customer_content");
        }
      }
    }

    // Check required approvals
    if (improvement.requiredApprovals && improvement.requiredApprovals.length > 0) {
      for (const reqApp of improvement.requiredApprovals) {
        const normalized = reqApp.toLowerCase();
        if (normalized.includes("spend") || normalized.includes("cost")) highRisks.push("spend_money");
        if (normalized.includes("price")) highRisks.push("change_pricing");
        if (normalized.includes("credential")) highRisks.push("request_credentials");
        if (normalized.includes("publish")) highRisks.push("publish_website_changes");
      }
    }

    const uniqueHighRisks = Array.from(new Set(highRisks));
    const isHighRisk = uniqueHighRisks.length > 0;

    // Strict policy enforcement
    if (workerPolicy === "FULL_AUTONOMY" && !isHighRisk) {
      return {
        requiresHumanApproval: false,
        detectedHighRiskCategories: uniqueHighRisks,
        allowedToPrepareAutomatically: true,
        policyUsed: workerPolicy,
        reason: "Full autonomy enabled for low-risk action."
      };
    }

    // High risk actions MUST always require explicit human approval regardless of policy
    if (isHighRisk) {
      return {
        requiresHumanApproval: true,
        detectedHighRiskCategories: uniqueHighRisks,
        allowedToPrepareAutomatically: true, // Preparation is safe, deployment requires approval
        policyUsed: workerPolicy,
        reason: `High-risk actions detected (${uniqueHighRisks.join(", ")}). Human approval is mandatory.`
      };
    }

    // Default policy ALWAYS_ASK
    return {
      requiresHumanApproval: true,
      detectedHighRiskCategories: uniqueHighRisks,
      allowedToPrepareAutomatically: true,
      policyUsed: workerPolicy,
      reason: "Worker policy is set to ALWAYS_ASK."
    };
  }

  /**
   * Validate if an active approval covers the required scope and hasn't expired.
   */
  public static isApprovalValid(
    approval: ImprovementApproval,
    requiredScope: string[]
  ): { valid: boolean; reason?: string } {
    if (approval.status !== 'approved') {
      return { valid: false, reason: `Approval status is '${approval.status}'.` };
    }

    if (approval.expiresAt) {
      const expires = new Date(approval.expiresAt).getTime();
      if (Date.now() > expires) {
        return { valid: false, reason: "Approval has expired." };
      }
    }

    // Ensure all required scopes are covered
    for (const scope of requiredScope) {
      if (!approval.approvedScope.includes(scope) && !approval.approvedScope.includes("*")) {
        return { valid: false, reason: `Approval scope missing required capability '${scope}'.` };
      }
    }

    return { valid: true };
  }
}
