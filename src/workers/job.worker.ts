import { DurableJobQueue } from "../lib/job-queue.ts";
import { logger } from "../lib/logger.ts";

export function initializeWorkers() {
  // Register lead revival background job handler
  DurableJobQueue.registerHandler("lead_revival_sequence", async (payload, jobId) => {
    logger.info(`[JobWorker] Executing lead_revival_sequence for job ${jobId}`, payload);
    // Simulate lead revival sequence execution
    await new Promise((resolve) => setTimeout(resolve, 500));
    logger.info(`[JobWorker] Lead revival sequence complete for lead: ${payload.leadId || "all"}`);
  });

  // Register review request background job handler
  DurableJobQueue.registerHandler("review_request_sms", async (payload, jobId) => {
    logger.info(`[JobWorker] Executing review_request_sms for job ${jobId}`, payload);
    await new Promise((resolve) => setTimeout(resolve, 300));
    logger.info(`[JobWorker] Review request SMS dispatched to: ${payload.phone || "customer"}`);
  });

  // Register diagnostic ping handler
  DurableJobQueue.registerHandler("diagnostic_ping", async (payload, jobId) => {
    logger.info(`[JobWorker] Processing diagnostic_ping job ${jobId}`);
  });

  // Start background worker polling loop
  DurableJobQueue.startWorker(5000);
}
