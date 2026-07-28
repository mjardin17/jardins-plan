// src/controllers/business-discovery.controller.ts
import { Request, Response } from 'express';
import { BusinessDiscoveryService } from '../services/business-discovery.service.ts';
import { logger } from '../lib/logger.ts';

export class BusinessDiscoveryController {
  /**
   * Run or fetch business discovery for a tenant.
   */
  public static async getDiscoveryData(req: Request, res: Response) {
    try {
      const tenantId = (req.query.tenantId as string) || 'joshua_jardin';
      const forceRefresh = req.query.refresh === 'true';

      const data = await BusinessDiscoveryService.runDiscovery(tenantId, true, forceRefresh);
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
      const tenantId = (req.query.tenantId as string) || 'joshua_jardin';
      const result = await BusinessDiscoveryService.getInterviewQuestions(tenantId);
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
      const { tenantId = 'joshua_jardin', questionId, answer, action = 'ANSWER' } = req.body;

      if (!questionId) {
        return res.status(400).json({ error: 'questionId is required' });
      }

      const result = await BusinessDiscoveryService.submitAnswer(
        tenantId,
        questionId,
        answer,
        action
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
      const { tenantId = 'joshua_jardin', workerId, autonomyLevel, approved } = req.body;

      if (!workerId || !autonomyLevel) {
        return res.status(400).json({ error: 'workerId and autonomyLevel are required' });
      }

      const updated = await BusinessDiscoveryService.updateWorkerAutonomy(
        tenantId,
        workerId,
        autonomyLevel,
        approved ?? true
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
      const {
        tenantId = 'joshua_jardin',
        experimentId,
        actualOutcome,
        decision,
        lessonsLearned
      } = req.body;

      if (!experimentId || !decision) {
        return res.status(400).json({ error: 'experimentId and decision are required' });
      }

      const updated = await BusinessDiscoveryService.updateExperimentResults(
        tenantId,
        experimentId,
        actualOutcome || 'Measured outcome',
        decision,
        lessonsLearned || 'No notes provided'
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
