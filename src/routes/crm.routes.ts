import { Router } from "express";
import { CRMController } from "../controllers/crm.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/leads", requireAuth, CRMController.getLeads);
router.post("/leads", requireAuth, CRMController.createLead);
router.get("/appointments", requireAuth, CRMController.getAppointments);
router.get("/invoices", requireAuth, CRMController.getInvoices);

export default router;
