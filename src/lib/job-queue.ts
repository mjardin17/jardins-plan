import { db } from "../db/index.ts";
import { automationLogs } from "../db/schema.ts";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger.ts";

export interface JobPayload {
  [key: string]: any;
}

export interface JobHandler {
  (payload: JobPayload, jobId: string): Promise<void>;
}

export class DurableJobQueue {
  private static handlers: Map<string, JobHandler> = new Map();
  private static isWorkerRunning = false;
  private static workerIntervalMs = 5000;
  private static workerTimer: NodeJS.Timeout | null = null;
  public static readonly workerId = `worker_${process.pid}_${Math.random().toString(36).substring(2, 7)}`;
  private static readonly LOCK_LEASE_MS = 30000; // 30 second lease

  /**
   * Register a job handler for a given job type.
   */
  public static registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
    logger.info(`[DurableJobQueue] Registered handler for job type: ${type} on ${this.workerId}`);
  }

  /**
   * Enqueue a new background job into PostgreSQL.
   */
  public static async enqueue(
    businessId: string,
    jobType: string,
    payload: JobPayload,
    options?: {
      queue?: string;
      idempotencyKey?: string;
      maxAttempts?: number;
      delayMs?: number;
    }
  ): Promise<string> {
    const queue = options?.queue || "default";
    const maxAttempts = options?.maxAttempts || 3;
    const runAt = options?.delayMs ? Date.now() + options.delayMs : Date.now();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Check idempotency in PostgreSQL
    if (options?.idempotencyKey) {
      const existing = await db
        .select()
        .from(automationLogs)
        .where(
          and(
            eq(automationLogs.businessId, businessId),
            eq(automationLogs.type, "background_job")
          )
        );

      for (const rec of existing) {
        try {
          const parsed = JSON.parse(rec.content || "{}");
          if (parsed.idempotencyKey === options.idempotencyKey) {
            logger.info(`[DurableJobQueue] Idempotent job hit for key: ${options.idempotencyKey}`);
            return parsed.jobId || `job_${rec.id}`;
          }
        } catch {}
      }
    }

    const contentObj = {
      jobId,
      jobType,
      queue,
      payload,
      attempts: 0,
      maxAttempts,
      idempotencyKey: options?.idempotencyKey || null,
      runAt,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
    };

    await db.insert(automationLogs).values({
      id: jobId,
      businessId,
      type: "background_job",
      leadName: jobId,
      recipient: jobType,
      channel: queue,
      templateName: "pending",
      content: JSON.stringify(contentObj),
      status: "pending",
    });

    logger.info(`[DurableJobQueue] Enqueued job ${jobId} (type: ${jobType}) for business ${businessId}`);

    // Trigger immediate async pick-up attempt
    setImmediate(() => this.processNextJobs().catch(() => {}));

    return jobId;
  }

  /**
   * Recover stale locked jobs (workers crashed or terminated mid-execution).
   */
  public static async recoverStaleLocks(): Promise<number> {
    const now = Date.now();
    const processingRecords = await db
      .select()
      .from(automationLogs)
      .where(
        and(
          eq(automationLogs.type, "background_job"),
          eq(automationLogs.status, "processing")
        )
      );

    let recoveredCount = 0;

    for (const record of processingRecords) {
      try {
        const meta = JSON.parse(record.content || "{}");
        const lockedAt = meta.lockedAt || 0;
        // If lease expired, return to pending state
        if (now - lockedAt > this.LOCK_LEASE_MS) {
          meta.lockedAt = null;
          meta.lockedBy = null;
          await db
            .update(automationLogs)
            .set({
              status: "pending",
              templateName: "pending",
              content: JSON.stringify(meta),
            })
            .where(eq(automationLogs.id, record.id));
          recoveredCount++;
          logger.warn(`[DurableJobQueue] Recovered stale lock for job ${record.id} (locked by ${meta.lockedBy || 'unknown'})`);
        }
      } catch {}
    }

    return recoveredCount;
  }

  /**
   * Process next available pending jobs with atomic update.
   */
  public static async processNextJobs(limit: number = 5): Promise<number> {
    const now = Date.now();

    // Check for stale locks first
    await this.recoverStaleLocks().catch(() => {});

    const pendingRecords = await db
      .select()
      .from(automationLogs)
      .where(
        and(
          eq(automationLogs.type, "background_job"),
          eq(automationLogs.status, "pending")
        )
      )
      .limit(limit);

    let processedCount = 0;

    for (const record of pendingRecords) {
      let jobMeta: any = {};
      try {
        jobMeta = JSON.parse(record.content || "{}");
      } catch {
        continue;
      }

      if (jobMeta.runAt && jobMeta.runAt > now) {
        continue; // Not ready to run yet
      }

      jobMeta.lockedAt = now;
      jobMeta.lockedBy = this.workerId;

      // Atomic lock update
      const [updated] = await db
        .update(automationLogs)
        .set({
          status: "processing",
          templateName: "processing",
          content: JSON.stringify(jobMeta),
        })
        .where(
          and(
            eq(automationLogs.id, record.id),
            eq(automationLogs.status, "pending")
          )
        )
        .returning();

      if (!updated) {
        continue; // Lock failed
      }

      const handler = this.handlers.get(jobMeta.jobType);
      const currentAttempts = (jobMeta.attempts || 0) + 1;
      jobMeta.attempts = currentAttempts;

      if (!handler) {
        logger.error(`[DurableJobQueue] No handler registered for job type: ${jobMeta.jobType}`);
        jobMeta.lastError = `No handler registered for type: ${jobMeta.jobType}`;
        await db
          .update(automationLogs)
          .set({
            status: "failed",
            templateName: "failed",
            content: JSON.stringify(jobMeta),
          })
          .where(eq(automationLogs.id, record.id));
        continue;
      }

      try {
        await handler(jobMeta.payload || {}, jobMeta.jobId || `job_${record.id}`);

        jobMeta.lockedAt = null;
        jobMeta.lockedBy = null;
        await db
          .update(automationLogs)
          .set({
            status: "completed",
            templateName: "completed",
            content: JSON.stringify(jobMeta),
          })
          .where(eq(automationLogs.id, record.id));

        processedCount++;
        logger.info(`[DurableJobQueue] Job ${jobMeta.jobId || record.id} completed successfully by ${this.workerId}.`);
      } catch (err: any) {
        const errorMessage = err?.message || String(err);
        const willRetry = currentAttempts < (jobMeta.maxAttempts || 3);
        jobMeta.lastError = errorMessage;
        jobMeta.lockedAt = null;
        jobMeta.lockedBy = null;

        logger.error(
          `[DurableJobQueue] Job ${jobMeta.jobId || record.id} failed (Attempt ${currentAttempts}/${jobMeta.maxAttempts}): ${errorMessage}`
        );

        if (willRetry) {
          const backoffMs = Math.pow(2, currentAttempts) * 1000;
          jobMeta.runAt = Date.now() + backoffMs;

          await db
            .update(automationLogs)
            .set({
              status: "pending",
              templateName: "pending",
              content: JSON.stringify(jobMeta),
            })
            .where(eq(automationLogs.id, record.id));
        } else {
          await db
            .update(automationLogs)
            .set({
              status: "dead_letter",
              templateName: "dead_letter",
              content: JSON.stringify(jobMeta),
            })
            .where(eq(automationLogs.id, record.id));
          logger.error(`[DurableJobQueue] Job ${jobMeta.jobId || record.id} moved to DEAD LETTER queue.`);
        }
      }
    }

    return processedCount;
  }

  /**
   * Retry a dead-lettered job.
   */
  public static async retryDeadLetter(jobId: string): Promise<boolean> {
    const records = await db
      .select()
      .from(automationLogs)
      .where(
        and(
          eq(automationLogs.type, "background_job"),
          eq(automationLogs.id, jobId),
          eq(automationLogs.status, "dead_letter")
        )
      );

    if (records.length === 0) return false;

    const record = records[0];
    try {
      const meta = JSON.parse(record.content || "{}");
      meta.attempts = 0;
      meta.runAt = Date.now();
      meta.lastError = null;

      await db
        .update(automationLogs)
        .set({
          status: "pending",
          templateName: "pending",
          content: JSON.stringify(meta),
        })
        .where(eq(automationLogs.id, jobId));

      logger.info(`[DurableJobQueue] Dead letter job ${jobId} resubmitted to pending status.`);
      setImmediate(() => this.processNextJobs().catch(() => {}));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start the background polling worker.
   */
  public static startWorker(intervalMs: number = 5000): void {
    if (this.isWorkerRunning) return;
    this.isWorkerRunning = true;
    this.workerIntervalMs = intervalMs;

    logger.info(`[DurableJobQueue] Worker started (${this.workerId}). Polling every ${intervalMs}ms`);

    this.workerTimer = setInterval(async () => {
      try {
        await this.processNextJobs();
      } catch (err) {
        logger.error("[DurableJobQueue] Error in worker processing cycle:", err);
      }
    }, this.workerIntervalMs);
  }

  /**
   * Stop the background worker cleanly.
   */
  public static stopWorker(): void {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
    }
    this.isWorkerRunning = false;
    logger.info(`[DurableJobQueue] Worker stopped (${this.workerId}).`);
  }
}
