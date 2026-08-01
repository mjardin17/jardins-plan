import { db } from "../db/index.ts";
import { backgroundJobs } from "../db/schema.ts";
import { eq, and, lte, lt } from "drizzle-orm";
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
    const runAtDate = new Date(options?.delayMs ? Date.now() + options.delayMs : Date.now());
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Check idempotency in PostgreSQL
    if (options?.idempotencyKey) {
      const existing = await db
        .select()
        .from(backgroundJobs)
        .where(
          and(
            eq(backgroundJobs.businessId, businessId),
            eq(backgroundJobs.idempotencyKey, options.idempotencyKey)
          )
        );

      if (existing.length > 0) {
        logger.info(`[DurableJobQueue] Idempotent job hit for key: ${options.idempotencyKey}`);
        return existing[0].id;
      }
    }

    await db.insert(backgroundJobs).values({
      id: jobId,
      businessId,
      queue,
      type: jobType,
      payload: payload || {},
      status: "pending",
      attempts: 0,
      maxAttempts,
      idempotencyKey: options?.idempotencyKey || null,
      runAt: runAtDate,
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
    const cutoff = new Date(Date.now() - this.LOCK_LEASE_MS);
    const processingRecords = await db
      .select()
      .from(backgroundJobs)
      .where(
        and(
          eq(backgroundJobs.status, "processing"),
          lt(backgroundJobs.lockedAt, cutoff)
        )
      );

    let recoveredCount = 0;

    for (const record of processingRecords) {
      try {
        await db
          .update(backgroundJobs)
          .set({
            status: "pending",
            lockedAt: null,
            lockedBy: null,
            updatedAt: new Date(),
          })
          .where(eq(backgroundJobs.id, record.id));
        recoveredCount++;
        logger.warn(`[DurableJobQueue] Recovered stale lock for job ${record.id} (locked by ${record.lockedBy || 'unknown'})`);
      } catch {}
    }

    return recoveredCount;
  }

  /**
   * Process next available pending jobs with atomic update.
   */
  public static async processNextJobs(limit: number = 5): Promise<number> {
    const now = new Date();

    // Check for stale locks first
    await this.recoverStaleLocks().catch(() => {});

    const pendingRecords = await db
      .select()
      .from(backgroundJobs)
      .where(
        and(
          eq(backgroundJobs.status, "pending"),
          lte(backgroundJobs.runAt, now)
        )
      )
      .limit(limit);

    let processedCount = 0;

    for (const record of pendingRecords) {
      // Atomic lock update
      const [updated] = await db
        .update(backgroundJobs)
        .set({
          status: "processing",
          lockedAt: now,
          lockedBy: this.workerId,
          updatedAt: now,
        })
        .where(
          and(
            eq(backgroundJobs.id, record.id),
            eq(backgroundJobs.status, "pending")
          )
        )
        .returning();

      if (!updated) {
        continue; // Lock failed
      }

      const handler = this.handlers.get(record.type);
      const currentAttempts = (record.attempts || 0) + 1;

      if (!handler) {
        logger.error(`[DurableJobQueue] No handler registered for job type: ${record.type}`);
        await db
          .update(backgroundJobs)
          .set({
            status: "failed",
            lastError: `No handler registered for type: ${record.type}`,
            attempts: currentAttempts,
            lockedAt: null,
            lockedBy: null,
            updatedAt: new Date(),
          })
          .where(eq(backgroundJobs.id, record.id));
        continue;
      }

      try {
        await handler((record.payload as JobPayload) || {}, record.id);

        await db
          .update(backgroundJobs)
          .set({
            status: "completed",
            attempts: currentAttempts,
            lockedAt: null,
            lockedBy: null,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(backgroundJobs.id, record.id));

        processedCount++;
        logger.info(`[DurableJobQueue] Job ${record.id} (type: ${record.type}) completed successfully by ${this.workerId}.`);
      } catch (err: any) {
        const errorMessage = err?.message || String(err);
        const maxAtt = record.maxAttempts || 3;
        const willRetry = currentAttempts < maxAtt;

        logger.error(
          `[DurableJobQueue] Job ${record.id} failed (Attempt ${currentAttempts}/${maxAtt}): ${errorMessage}`
        );

        if (willRetry) {
          const backoffMs = Math.pow(2, currentAttempts) * 1000;
          const nextRunAt = new Date(Date.now() + backoffMs);

          await db
            .update(backgroundJobs)
            .set({
              status: "pending",
              attempts: currentAttempts,
              lastError: errorMessage,
              runAt: nextRunAt,
              lockedAt: null,
              lockedBy: null,
              updatedAt: new Date(),
            })
            .where(eq(backgroundJobs.id, record.id));
        } else {
          await db
            .update(backgroundJobs)
            .set({
              status: "dead_letter",
              attempts: currentAttempts,
              lastError: errorMessage,
              lockedAt: null,
              lockedBy: null,
              updatedAt: new Date(),
            })
            .where(eq(backgroundJobs.id, record.id));
          logger.error(`[DurableJobQueue] Job ${record.id} moved to DEAD LETTER queue.`);
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
      .from(backgroundJobs)
      .where(
        and(
          eq(backgroundJobs.id, jobId),
          eq(backgroundJobs.status, "dead_letter")
        )
      );

    if (records.length === 0) return false;

    await db
      .update(backgroundJobs)
      .set({
        status: "pending",
        attempts: 0,
        runAt: new Date(),
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(backgroundJobs.id, jobId));

    logger.info(`[DurableJobQueue] Dead letter job ${jobId} resubmitted to pending status.`);
    setImmediate(() => this.processNextJobs().catch(() => {}));
    return true;
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

