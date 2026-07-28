import { Request, Response } from "express";
import { GrowthService } from "../services/growth.service.ts";
import { GrowthRepository } from "../repositories/growth.repository.ts";
import { logger } from "../lib/logger.ts";

export class GrowthController {
  public static async getExecutiveIntelligence(req: Request, res: Response) {
    try {
      const user = (req as any).user || { businessId: "apex-plumbing", email: "user@example.com" };
      const data = await GrowthService.getExecutiveIntelligence(user.businessId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getExecutiveIntelligence:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch executive intelligence" });
    }
  }

  public static async getOpportunityFeed(req: Request, res: Response) {
    try {
      const user = (req as any).user || { businessId: "apex-plumbing", email: "user@example.com" };
      const data = await GrowthService.getOpportunityFeed(user.businessId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getOpportunityFeed:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch opportunity feed" });
    }
  }

  public static async getStrategyBoard(req: Request, res: Response) {
    try {
      const user = (req as any).user || { businessId: "apex-plumbing", email: "user@example.com" };
      const data = await GrowthService.getStrategyBoard(user.businessId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getStrategyBoard:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch strategy board" });
    }
  }

  public static async getCompetitiveIntel(req: Request, res: Response) {
    try {
      const user = (req as any).user || { businessId: "apex-plumbing", email: "user@example.com" };
      const data = await GrowthService.getCompetitiveIntel(user.businessId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getCompetitiveIntel:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch competitive intelligence" });
    }
  }

  public static async addCompetitor(req: Request, res: Response) {
    try {
      const user = (req as any).user || { businessId: "apex-plumbing", email: "user@example.com" };
      const { name, pricing, reviews, advantages, weaknesses } = req.body;
      const data = await GrowthService.addCompetitor(user.businessId, {
        name,
        pricing: pricing || "Standard",
        reviews: reviews || "4.0★",
        advantages: advantages || "Local presence",
        weaknesses: weaknesses || "Manual dispatch",
      });
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.addCompetitor:", err);
      return res.status(500).json({ error: err.message || "Failed to add competitor" });
    }
  }

  public static async getBusinessScorecard(req: Request, res: Response) {
    try {
      const user = (req as any).user || { businessId: "apex-plumbing", email: "user@example.com" };
      const data = await GrowthService.getBusinessScorecard(user.businessId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getBusinessScorecard:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch business scorecard" });
    }
  }

  public static async getSelfImprovementInsights(req: Request, res: Response) {
    try {
      const user = (req as any).user || { businessId: "apex-plumbing", email: "user@example.com" };
      const data = await GrowthService.getSelfImprovementInsights(user.businessId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getSelfImprovementInsights:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch self-improvement insights" });
    }
  }

  public static async runDiagnostics(req: Request, res: Response) {
    try {
      const user = (req as any).user || { businessId: "apex-plumbing", email: "user@example.com" };
      const data = await GrowthService.runRealDiagnostics(user.businessId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.runDiagnostics:", err);
      return res.status(500).json({ error: err.message || "Failed to run system diagnostics" });
    }
  }
}
