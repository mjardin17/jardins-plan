import { Router } from "express";
import { CompetitorController } from "../controllers/competitor.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/", requireAuth, CompetitorController.getCompetitors);
router.post("/", requireAuth, CompetitorController.addCompetitor);

export default router;
