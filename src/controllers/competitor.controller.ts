import { Request, Response } from "express";
import { CompetitorRepository } from "../repositories/competitor.repository.ts";
import { getAuthenticatedUserEmail } from "../middleware/auth.middleware.ts";
import { db as pgDb } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.ts";

export class CompetitorController {
  public static async getCompetitors(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const competitors = await CompetitorRepository.findByBusinessId(user.businessId);
      res.json({ success: true, competitors });
    } catch (err: any) {
      logger.error("Error in CompetitorController.getCompetitors:", err);
      res.status(500).json({ error: "Failed to fetch competitors" });
    }
  }

  public static async addCompetitor(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const newComp = await CompetitorRepository.create({
        businessId: user.businessId,
        name: req.body.name || "New Competitor",
        pricing: req.body.pricing || "Standard",
        reviews: req.body.reviews || "4.0★",
        advantages: req.body.advantages || "Local presence",
        weaknesses: req.body.weaknesses || "Manual scheduling",
        tactics: req.body.tactics || "Promote digital booking"
      });
      res.json({ success: true, competitor: newComp });
    } catch (err: any) {
      logger.error("Error in CompetitorController.addCompetitor:", err);
      res.status(500).json({ error: "Failed to add competitor" });
    }
  }
}
