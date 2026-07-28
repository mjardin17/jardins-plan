import { Router } from "express";
import { BusinessController } from "../controllers/business.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/", requireAuth, BusinessController.getBusiness);
router.get("/:businessId", BusinessController.getBusinessById);
router.post("/onboard", requireAuth, BusinessController.onboardBusiness);

export default router;
