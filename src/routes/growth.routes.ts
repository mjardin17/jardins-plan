import { Router } from "express";
import { GrowthController } from "../controllers/growth.controller.ts";
import { validate } from "../middleware/validation.ts";
import { z } from "zod";

const router = Router();

const addCompetitorSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Competitor name is required"),
    pricing: z.string().optional().default("Standard Pricing"),
    reviews: z.string().optional().default("4.0★"),
    advantages: z.string().optional().default("Local brand presence"),
    weaknesses: z.string().optional().default("Slower emergency response"),
  }),
});

// Phase 60 & 61 Growth Platform Routes
router.get("/executive-intelligence", GrowthController.getExecutiveIntelligence);
router.get("/opportunity-feed", GrowthController.getOpportunityFeed);
router.get("/strategy-board", GrowthController.getStrategyBoard);
router.get("/competitive-intel", GrowthController.getCompetitiveIntel);
router.post("/competitive-intel", validate(addCompetitorSchema), GrowthController.addCompetitor);
router.get("/business-scorecard", GrowthController.getBusinessScorecard);
router.get("/self-improve-insights", GrowthController.getSelfImprovementInsights);
router.post("/run-regression", GrowthController.runDiagnostics);

export default router;
