import { Request, Response } from "express";
import { DurableJobQueue } from "../lib/job-queue.ts";
import { logger } from "../lib/logger.ts";
import { db } from "../db/index.ts";
import { backgroundJobs } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";

export class JobsController {
  public static async enqueueJob(req: Request, res: Response) {
    try {
      const { businessId, jobType, payload, queue, idempotencyKey, delayMs } = req.body;
      if (!businessId || !jobType) {
        return res.status(400).json({ error: "businessId and jobType are required." });
      }

      const jobId = await DurableJobQueue.enqueue(
        businessId,
        jobType,
        payload || {},
        { queue, idempotencyKey, delayMs }
      );

      res.json({ success: true, jobId, workerId: DurableJobQueue.workerId });
    } catch (err: any) {
      logger.error("Error in JobsController.enqueueJob:", err);
      res.status(500).json({ error: err.message || "Failed to enqueue job" });
    }
  }

  public static async getJobs(req: Request, res: Response) {
    try {
      const { businessId } = req.query;

      const jobs = (businessId && typeof businessId === "string")
        ? await db.select().from(backgroundJobs).where(eq(backgroundJobs.businessId, businessId)).orderBy(desc(backgroundJobs.createdAt)).limit(50)
        : await db.select().from(backgroundJobs).orderBy(desc(backgroundJobs.createdAt)).limit(50);

      res.json({ jobs });
    } catch (err: any) {
      logger.error("Error in JobsController.getJobs:", err);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  }

  public static async retryDeadLetter(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const success = await DurableJobQueue.retryDeadLetter(jobId);
      if (!success) {
        return res.status(404).json({ error: "Dead letter job not found or not eligible for retry." });
      }
      res.json({ success: true, message: `Job ${jobId} resubmitted to queue.` });
    } catch (err: any) {
      logger.error("Error in JobsController.retryDeadLetter:", err);
      res.status(500).json({ error: "Failed to retry job" });
    }
  }
}
