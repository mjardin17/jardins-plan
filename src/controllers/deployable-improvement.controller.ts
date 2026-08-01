// src/controllers/deployable-improvement.controller.ts
import { Request, Response } from 'express';
import { DeployableImprovementService } from '../services/deployable-improvement.service.ts';
import { DeployerRegistryService } from '../services/deployer-registry.service.ts';
import { logger } from '../lib/logger.ts';

export class DeployableImprovementController {
  public static async listImprovements(req: Request, res: Response) {
    try {
      const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const improvements = await DeployableImprovementService.listImprovements(tenantId);
      return res.json({ success: true, tenantId, data: improvements });
    } catch (err: any) {
      logger.error('Error in listImprovements:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to list improvements' });
    }
  }

  public static async getImprovement(req: Request, res: Response) {
    try {
      const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;
      const improvement = await DeployableImprovementService.getImprovement(tenantId, id);
      return res.json({ success: true, data: improvement });
    } catch (err: any) {
      logger.error('Error in getImprovement:', err);
      return res.status(404).json({ success: false, error: err.message || 'Improvement not found' });
    }
  }

  public static async generateFromOpportunity(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const {
        opportunityId,
        title,
        description,
        problemBeingSolved,
        capabilityType,
        businessOutcome,
        baseMonthlySavings,
        baseMonthlyRevenueIncrease,
        implementationCost,
        monthlyOperatingCost,
        customAssumptions
      } = req.body;

      if (!opportunityId || !title || !capabilityType || !businessOutcome) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: opportunityId, title, capabilityType, businessOutcome are required.'
        });
      }

      const improvement = await DeployableImprovementService.generateFromOpportunity(tenantId, {
        opportunityId,
        title,
        description: description || title,
        problemBeingSolved: problemBeingSolved || 'Optimizing business growth and efficiency',
        capabilityType,
        businessOutcome,
        baseMonthlySavings,
        baseMonthlyRevenueIncrease,
        implementationCost,
        monthlyOperatingCost,
        customAssumptions
      });

      return res.status(201).json({ success: true, data: improvement });
    } catch (err: any) {
      logger.error('Error in generateFromOpportunity:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to generate improvement' });
    }
  }

  public static async updateAssumptions(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;
      const { assumptions } = req.body;

      if (!Array.isArray(assumptions)) {
        return res.status(400).json({ success: false, error: 'assumptions must be an array.' });
      }

      const updated = await DeployableImprovementService.updateAssumptions(tenantId, id, assumptions);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in updateAssumptions:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async confirmAssumption(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id, assumptionId } = req.params;
      const { isConfirmed = true } = req.body;

      const updated = await DeployableImprovementService.confirmAssumption(tenantId, id, assumptionId, isConfirmed);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in confirmAssumption:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async requestApproval(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;

      const updated = await DeployableImprovementService.requestApproval(tenantId, id);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in requestApproval:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async approveImprovement(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;
      const { approver = 'Business Owner', approvedScope = ['*'], policyUsed = 'HUMAN_EXPLICIT' } = req.body;

      const result = await DeployableImprovementService.approveImprovement(
        tenantId,
        id,
        approver,
        approvedScope,
        policyUsed
      );

      return res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in approveImprovement:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async rejectImprovement(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;
      const { approver = 'Business Owner', reason = 'Owner rejected proposed scope' } = req.body;

      const updated = await DeployableImprovementService.rejectImprovement(
        tenantId,
        id,
        approver,
        reason
      );

      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in rejectImprovement:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async validateReadiness(req: Request, res: Response) {
    try {
      const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;

      const imp = await DeployableImprovementService.getImprovement(tenantId, id);
      const readiness = await DeployerRegistryService.getInstance().validateReadiness(tenantId, imp);

      return res.json({ success: true, data: readiness });
    } catch (err: any) {
      logger.error('Error in validateReadiness:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async deployImprovement(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;

      const result = await DeployableImprovementService.deployImprovement(tenantId, id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in deployImprovement:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async rollbackDeployment(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;

      const result = await DeployableImprovementService.rollbackDeployment(tenantId, id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in rollbackDeployment:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async evaluatePerformance(req: Request, res: Response) {
    try {
      const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;
      const { actualMetrics } = req.body || {};

      const result = await DeployableImprovementService.evaluatePerformance(tenantId, id, actualMetrics);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in evaluatePerformance:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async disableImprovement(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { id } = req.params;

      const updated = await DeployableImprovementService.disableImprovement(tenantId, id);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in disableImprovement:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
