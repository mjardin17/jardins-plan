import { Router } from "express";
import { JobsController } from "../controllers/jobs.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/enqueue", JobsController.enqueueJob);
router.get("/", JobsController.getJobs);
router.post("/dead-letter/:jobId/retry", requireAuth, JobsController.retryDeadLetter);

export default router;
