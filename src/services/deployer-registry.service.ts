// src/services/deployer-registry.service.ts
import { BusinessImprovementDeployer, ReadinessResult, DeploymentPlan, DeploymentResult, VerificationResult, RollbackResult } from './deployers/deployer.interface.ts';
import { WorkerActivationDeployer } from './deployers/worker-activation.deployer.ts';
import { ConnectorActivationDeployer } from './deployers/connector-activation.deployer.ts';
import { AutomationActivationDeployer } from './deployers/automation-activation.deployer.ts';
import { WebsiteRecommendationDeployer } from './deployers/website-recommendation.deployer.ts';
import { AIAccessibilityDeployer } from './deployers/ai-accessibility.deployer.ts';
import { CustomWorkflowDeployer } from './deployers/custom-workflow.deployer.ts';
import { CapabilityType, DeployableBusinessImprovement } from '../types/deployable-improvement.ts';
import { logger } from '../lib/logger.ts';

export class DeployerRegistryService {
  private static instance: DeployerRegistryService;
  private deployers: Map<CapabilityType, BusinessImprovementDeployer> = new Map();

  private constructor() {
    this.registerDefaultDeployers();
  }

  public static getInstance(): DeployerRegistryService {
    if (!DeployerRegistryService.instance) {
      DeployerRegistryService.instance = new DeployerRegistryService();
    }
    return DeployerRegistryService.instance;
  }

  private registerDefaultDeployers(): void {
    this.registerDeployer(new WorkerActivationDeployer());
    this.registerDeployer(new ConnectorActivationDeployer());
    this.registerDeployer(new AutomationActivationDeployer());
    this.registerDeployer(new WebsiteRecommendationDeployer());
    this.registerDeployer(new AIAccessibilityDeployer());
    this.registerDeployer(new CustomWorkflowDeployer());
  }

  public registerDeployer(deployer: BusinessImprovementDeployer): void {
    this.deployers.set(deployer.capabilityType, deployer);
    logger.info(`[DeployerRegistry] Registered deployer for capability '${deployer.capabilityType}'.`);
  }

  public getDeployer(capabilityType: CapabilityType): BusinessImprovementDeployer {
    const deployer = this.deployers.get(capabilityType);
    if (!deployer) {
      // Fallback to custom workflow deployer if specific type not mapped
      return this.deployers.get("custom_workflow")!;
    }
    return deployer;
  }

  public async validateReadiness(
    tenantId: string,
    improvement: DeployableBusinessImprovement
  ): Promise<ReadinessResult> {
    const deployer = this.getDeployer(improvement.capabilityType);
    return deployer.validateReadiness(tenantId, improvement);
  }

  public async createPlan(
    tenantId: string,
    improvement: DeployableBusinessImprovement
  ): Promise<DeploymentPlan> {
    const deployer = this.getDeployer(improvement.capabilityType);
    return deployer.createPlan(tenantId, improvement);
  }

  public async orchestrateDeployment(
    tenantId: string,
    improvement: DeployableBusinessImprovement
  ): Promise<{
    deploymentResult: DeploymentResult;
    verificationResult?: VerificationResult;
    finalStatus: "active" | "failed";
  }> {
    const deployer = this.getDeployer(improvement.capabilityType);

    // 1. Deploy
    const deploymentResult = await deployer.deploy(tenantId, improvement);
    if (!deploymentResult.success) {
      return {
        deploymentResult,
        finalStatus: "failed"
      };
    }

    // 2. Verify
    const verificationResult = await deployer.verify(tenantId, improvement);
    if (!verificationResult.verified) {
      deploymentResult.log.push(`[${new Date().toISOString()}] Verification failed: ${verificationResult.failureReason || 'Verification check unfulfilled'}`);
      return {
        deploymentResult,
        verificationResult,
        finalStatus: "failed"
      };
    }

    deploymentResult.log.push(`[${new Date().toISOString()}] Deployment and verification completed successfully. Status set to ACTIVE.`);

    return {
      deploymentResult,
      verificationResult,
      finalStatus: "active"
    };
  }

  public async rollback(
    tenantId: string,
    improvement: DeployableBusinessImprovement
  ): Promise<RollbackResult> {
    const deployer = this.getDeployer(improvement.capabilityType);
    return deployer.rollback(tenantId, improvement);
  }
}
