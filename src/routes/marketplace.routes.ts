import { Router } from "express";
import { MarketplaceController } from "../controllers/marketplace.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/apps", requireAuth, MarketplaceController.getApps);
router.post("/apps/:appId/install", requireAuth, MarketplaceController.installApp);
router.post("/apps/:appId/uninstall", requireAuth, MarketplaceController.uninstallApp);

export default router;
