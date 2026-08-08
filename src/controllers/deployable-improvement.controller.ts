// src/controllers/deployable-improvement.controller.ts
import { Request, Response } from 'express';
import { DeployableImprovementService } from '../services/deployable-improvement.service.ts';
import { DeployerRegistryService } from '../services/deployer-registry.service.ts';
import { getAuthenticatedUserEmail } from '../middleware/auth.middleware.ts';
import { getUserByEmail } from '../db/tenant-context.ts';
import { logger } from '../lib/logger.ts';

async function resolveTenantAuth(req: Request, res: Response): Promise<{ tenantId: string; email: string } | null> {
  const email = getAuthenticatedUserEmail(req);
  if (!email) {
    res.status(401).json({ success: false, error: 'Unauthorized: Authentication token missing or invalid.' });
    return null;
  }

  const user = await getUserByEmail(email);
  if (!user || !user.businessId) {
    res.status(401).json({ success: false, error: 'Unauthorized: User not associated with a valid business tenant.' });
    return null;
  }

  const serverTenantId = user.businessId;

  // Verify that any client-supplied tenant overrides match server tenant
  const clientTenantId = (req.query.tenantId as string) || req.body?.tenantId || (req.headers['x-tenant-id'] as string);
  if (clientTenantId && clientTenantId !== serverTenantId) {
    res.status(403).json({ success: false, error: 'Forbidden: Client-supplied tenant identity mismatch with authenticated session.' });
    return null;
  }

  return { tenantId: serverTenantId, email };
}

export class DeployableImprovementController {
  public static async listImprovements(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const improvements = await DeployableImprovementService.listImprovements(auth.tenantId);
      return res.json({ success: true, tenantId: auth.tenantId, data: improvements });
    } catch (err: any) {
      logger.error('Error in listImprovements:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to list improvements' });
    }
  }

  public static async getImprovement(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;
      const improvement = await DeployableImprovementService.getImprovement(auth.tenantId, id);
      return res.json({ success: true, data: improvement });
    } catch (err: any) {
      logger.error('Error in getImprovement:', err);
      return res.status(404).json({ success: false, error: err.message || 'Improvement not found' });
    }
  }

  public static async generateFromOpportunity(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

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

      const improvement = await DeployableImprovementService.generateFromOpportunity(auth.tenantId, {
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
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;
      const { assumptions } = req.body;

      if (!Array.isArray(assumptions)) {
        return res.status(400).json({ success: false, error: 'assumptions must be an array.' });
      }

      const updated = await DeployableImprovementService.updateAssumptions(auth.tenantId, id, assumptions);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in updateAssumptions:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async confirmAssumption(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id, assumptionId } = req.params;
      const { isConfirmed = true } = req.body;

      const updated = await DeployableImprovementService.confirmAssumption(auth.tenantId, id, assumptionId, isConfirmed);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in confirmAssumption:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async requestApproval(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;

      const updated = await DeployableImprovementService.requestApproval(auth.tenantId, id);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in requestApproval:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async approveImprovement(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;
      const { approver = 'Business Owner', approvedScope = ['*'], policyUsed = 'HUMAN_EXPLICIT' } = req.body;

      const result = await DeployableImprovementService.approveImprovement(
        auth.tenantId,
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
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;
      const { approver = 'Business Owner', reason = 'Owner rejected proposed scope' } = req.body;

      const updated = await DeployableImprovementService.rejectImprovement(
        auth.tenantId,
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
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;

      const imp = await DeployableImprovementService.getImprovement(auth.tenantId, id);
      const readiness = await DeployerRegistryService.getInstance().validateReadiness(auth.tenantId, imp);

      return res.json({ success: true, data: readiness });
    } catch (err: any) {
      logger.error('Error in validateReadiness:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async deployImprovement(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;

      const result = await DeployableImprovementService.deployImprovement(auth.tenantId, id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in deployImprovement:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async rollbackDeployment(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;

      const result = await DeployableImprovementService.rollbackDeployment(auth.tenantId, id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in rollbackDeployment:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async evaluatePerformance(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;
      const { actualMetrics } = req.body || {};

      const result = await DeployableImprovementService.evaluatePerformance(auth.tenantId, id, actualMetrics);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in evaluatePerformance:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async disableImprovement(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { id } = req.params;

      const updated = await DeployableImprovementService.disableImprovement(auth.tenantId, id);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in disableImprovement:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}

