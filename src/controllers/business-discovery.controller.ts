// src/controllers/business-discovery.controller.ts
import { Request, Response } from 'express';
import { BusinessDiscoveryService } from '../services/business-discovery.service.ts';
import { getAuthenticatedUserEmail } from '../middleware/auth.middleware.ts';
import { getUserByEmail } from '../db/tenant-context.ts';
import { logger } from '../lib/logger.ts';

async function resolveTenantAuth(req: Request, res: Response): Promise<{ tenantId: string; email: string } | null> {
  const email = getAuthenticatedUserEmail(req);
  if (!email) {
    res.status(401).json({ error: 'Unauthorized: Authentication token missing or invalid.' });
    return null;
  }

  const user = await getUserByEmail(email);
  if (!user || !user.businessId) {
    res.status(401).json({ error: 'Unauthorized: User not associated with a valid business tenant.' });
    return null;
  }

  const serverTenantId = user.businessId;

  // Verify that any client-supplied tenant overrides match server tenant
  const clientTenantId = (req.query.tenantId as string) || req.body?.tenantId || (req.headers['x-tenant-id'] as string);
  if (clientTenantId && clientTenantId !== serverTenantId) {
    res.status(403).json({ error: 'Forbidden: Client-supplied tenant identity mismatch with authenticated session.' });
    return null;
  }

  return { tenantId: serverTenantId, email };
}

export class BusinessDiscoveryController {
  /**
   * Run or fetch business discovery for a tenant.
   */
  public static async getDiscoveryData(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const forceRefresh = req.query.refresh === 'true';

      const data = await BusinessDiscoveryService.runDiscovery(auth.tenantId, true, forceRefresh);
      res.json({
        success: true,
        data
      });
    } catch (err: any) {
      logger.error('Error in BusinessDiscoveryController.getDiscoveryData:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch discovery data' });
    }
  }

  /**
   * Get 3-5 prioritized interview questions with rationale.
   */
  public static async getInterviewQuestions(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const result = await BusinessDiscoveryService.getInterviewQuestions(auth.tenantId);
      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      logger.error('Error in BusinessDiscoveryController.getInterviewQuestions:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch interview questions' });
    }
  }

  /**
   * Submit an owner answer, skip, or "I don't know".
   */
  public static async submitAnswer(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { questionId, answer, action = 'ANSWER' } = req.body;

      if (!questionId) {
        return res.status(400).json({ error: 'questionId is required' });
      }

      const result = await BusinessDiscoveryService.submitAnswer(
        auth.tenantId,
        questionId,
        answer,
        action,
        auth.email
      );

      res.json({
        success: true,
        data: result.data,
        contradictionDetected: result.contradictionDetected
      });
    } catch (err: any) {
      logger.error('Error in BusinessDiscoveryController.submitAnswer:', err);
      res.status(500).json({ error: err.message || 'Failed to submit answer' });
    }
  }

  /**
   * Update worker autonomy level and approval state.
   */
  public static async updateWorkerAutonomy(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const { workerId, autonomyLevel, approved } = req.body;

      if (!workerId || !autonomyLevel) {
        return res.status(400).json({ error: 'workerId and autonomyLevel are required' });
      }

      const updated = await BusinessDiscoveryService.updateWorkerAutonomy(
        auth.tenantId,
        workerId,
        autonomyLevel,
        approved ?? true,
        auth.email
      );

      res.json({
        success: true,
        data: updated
      });
    } catch (err: any) {
      logger.error('Error in BusinessDiscoveryController.updateWorkerAutonomy:', err);
      res.status(500).json({ error: err.message || 'Failed to update worker autonomy' });
    }
  }

  /**
   * Update experiment results & apply expand/modify/rollback decision.
   */
  public static async updateExperimentResults(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;

      const {
        experimentId,
        actualOutcome,
        decision,
        lessonsLearned
      } = req.body;

      if (!experimentId || !decision) {
        return res.status(400).json({ error: 'experimentId and decision are required' });
      }

      const updated = await BusinessDiscoveryService.updateExperimentResults(
        auth.tenantId,
        experimentId,
        actualOutcome || 'Measured outcome',
        decision,
        lessonsLearned || 'No notes provided',
        auth.email
      );

      res.json({
        success: true,
        data: updated
      });
    } catch (err: any) {
      logger.error('Error in BusinessDiscoveryController.updateExperimentResults:', err);
      res.status(500).json({ error: err.message || 'Failed to update experiment' });
    }
  }
}

