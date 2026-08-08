import { Request, Response } from "express";
import { CompetitorRepository } from "../repositories/competitor.repository.ts";
import { getAuthenticatedUserEmail } from "../middleware/auth.middleware.ts";
import { getUserByEmail } from "../db/tenant-context.ts";
import { logger } from "../lib/logger.ts";

export class CompetitorController {
  public static async getCompetitors(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const user = await getUserByEmail(email);
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const requestedTenantId = (req.query?.tenantId || req.body?.tenantId || req.headers["x-tenant-id"]) as string | undefined;
      if (requestedTenantId && requestedTenantId !== user.businessId) {
        return res.status(403).json({ error: "Forbidden: Cross-tenant access denied" });
      }

      const competitors = await CompetitorRepository.findByBusinessId(user.businessId);
      return res.json({ success: true, competitors });
    } catch (err: any) {
      logger.error("Error in CompetitorController.getCompetitors:", err);
      return res.status(500).json({ error: "Failed to fetch competitors" });
    }
  }

  public static async addCompetitor(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const user = await getUserByEmail(email);
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const requestedTenantId = (req.body?.tenantId || req.query?.tenantId || req.headers["x-tenant-id"]) as string | undefined;
      if (requestedTenantId && requestedTenantId !== user.businessId) {
        return res.status(403).json({ error: "Forbidden: Cross-tenant access denied" });
      }

      const newComp = await CompetitorRepository.create({
        businessId: user.businessId,
        name: req.body.name || "New Competitor",
        pricing: req.body.pricing || "Standard",
        reviews: req.body.reviews || "4.0★",
        advantages: req.body.advantages || "Local presence",
        weaknesses: req.body.weaknesses || "Manual scheduling",
        tactics: req.body.tactics || "Promote digital booking"
      });
      return res.json({ success: true, competitor: newComp });
    } catch (err: any) {
      logger.error("Error in CompetitorController.addCompetitor:", err);
      return res.status(500).json({ error: "Failed to add competitor" });
    }
  }
}

