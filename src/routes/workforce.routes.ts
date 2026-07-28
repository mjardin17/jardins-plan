import { Router } from "express";
import { WorkforceController } from "../controllers/workforce.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/execute-agent", requireAuth, WorkforceController.executeAgent);
router.get("/industry-packs", WorkforceController.getIndustryPacks);
router.get("/mcp-tools", WorkforceController.getMcpTools);
router.post("/run-workflow", requireAuth, WorkforceController.executeWorkflow);
router.get("/audit/phase65-validation", WorkforceController.runPhase65Validation);
router.post("/audit/phase65-validation", WorkforceController.runPhase65Validation);

export default router;
