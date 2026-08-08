import { Request, Response } from "express";
import { GrowthService } from "../services/growth.service.ts";
import { getAuthenticatedUserEmail } from "../middleware/auth.middleware.ts";
import { getUserByEmail } from "../db/tenant-context.ts";
import { logger } from "../lib/logger.ts";

async function resolveTenantAuth(req: Request, res: Response): Promise<{ tenantId: string; email: string } | null> {
  const email = getAuthenticatedUserEmail(req);
  if (!email) {
    res.status(401).json({ success: false, error: "Unauthorized: Authentication token missing or invalid." });
    return null;
  }

  const user = await getUserByEmail(email);
  if (!user || !user.businessId) {
    res.status(401).json({ success: false, error: "Unauthorized: User not associated with a valid business tenant." });
    return null;
  }

  const serverTenantId = user.businessId;

  // Verify that any client-supplied tenant overrides match server tenant
  const clientTenantId = (req.query.tenantId as string) || req.body?.tenantId || (req.headers["x-tenant-id"] as string);
  if (clientTenantId && clientTenantId !== serverTenantId) {
    res.status(403).json({ success: false, error: "Forbidden: Client-supplied tenant identity mismatch with authenticated session." });
    return null;
  }

  return { tenantId: serverTenantId, email };
}

export class GrowthController {
  public static async getExecutiveIntelligence(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;
      const data = await GrowthService.getExecutiveIntelligence(auth.tenantId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getExecutiveIntelligence:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch executive intelligence" });
    }
  }

  public static async getOpportunityFeed(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;
      const data = await GrowthService.getOpportunityFeed(auth.tenantId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getOpportunityFeed:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch opportunity feed" });
    }
  }

  public static async getStrategyBoard(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;
      const data = await GrowthService.getStrategyBoard(auth.tenantId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getStrategyBoard:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch strategy board" });
    }
  }

  public static async getCompetitiveIntel(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;
      const data = await GrowthService.getCompetitiveIntel(auth.tenantId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getCompetitiveIntel:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch competitive intelligence" });
    }
  }

  public static async addCompetitor(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;
      const { name, pricing, reviews, advantages, weaknesses } = req.body;
      const data = await GrowthService.addCompetitor(auth.tenantId, {
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
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;
      const data = await GrowthService.getBusinessScorecard(auth.tenantId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getBusinessScorecard:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch business scorecard" });
    }
  }

  public static async getSelfImprovementInsights(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;
      const data = await GrowthService.getSelfImprovementInsights(auth.tenantId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.getSelfImprovementInsights:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch self-improvement insights" });
    }
  }

  public static async runDiagnostics(req: Request, res: Response) {
    try {
      const auth = await resolveTenantAuth(req, res);
      if (!auth) return;
      const data = await GrowthService.runRealDiagnostics(auth.tenantId);
      return res.json(data);
    } catch (err: any) {
      logger.error("Error in GrowthController.runDiagnostics:", err);
      return res.status(500).json({ error: err.message || "Failed to run system diagnostics" });
    }
  }
}
