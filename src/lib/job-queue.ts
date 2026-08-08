import { db } from "../db/index.ts";
import { backgroundJobs, businesses } from "../db/schema.ts";
import { eq, and, lte, lt } from "drizzle-orm";
import { logger } from "./logger.ts";
import { withTenantContext, TenantTransaction } from "../db/tenant-context.ts";

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
  private static activeBusinessIds: Set<string> = new Set(["apex-plumbing"]);
  private static lastBusinessFetch = 0;
  private static cachedBusinessIds: string[] = ["apex-plumbing"];
  public static readonly workerId = `worker_${process.pid}_${Math.random().toString(36).substring(2, 7)}`;
  private static readonly LOCK_LEASE_MS = 30000; // 30 second lease

  /**
   * Helper to resolve active business IDs with caching and throttling to avoid DB pool exhaustion.
   */
  private static async getBusinessIds(): Promise<string[]> {
    if (this.activeBusinessIds.size > 0) {
      return Array.from(this.activeBusinessIds);
    }

    const now = Date.now();
    // Throttle queries to businesses table to at most once every 60 seconds
    if (now - this.lastBusinessFetch < 60000 && this.cachedBusinessIds.length > 0) {
      return this.cachedBusinessIds;
    }

    try {
      this.lastBusinessFetch = now;
      const bizList = await db.select({ id: businesses.id }).from(businesses);
      if (bizList && bizList.length > 0) {
        this.cachedBusinessIds = bizList.map((b) => b.id);
        return this.cachedBusinessIds;
      }
    } catch {
      // Return cached or default business ID silently on transient DB connection hiccups
    }

    return this.cachedBusinessIds.length > 0 ? this.cachedBusinessIds : ["apex-plumbing"];
  }

  /**
   * Register a job handler for a given job type.
   */
  public static registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
    logger.info(`[DurableJobQueue] Registered handler for job type: ${type} on ${this.workerId}`);
  }

  /**
   * Enqueue a new background job into PostgreSQL under tenant context.
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

    return await withTenantContext(businessId, async (tx) => {
      // Check idempotency in PostgreSQL
      if (options?.idempotencyKey) {
        const existing = await tx
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

      await tx.insert(backgroundJobs).values({
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

      this.activeBusinessIds.add(businessId);
      logger.info(`[DurableJobQueue] Enqueued job ${jobId} (type: ${jobType}) for business ${businessId}`);

      // Trigger immediate async pick-up attempt
      setImmediate(() => this.processNextJobs(5, businessId).catch(() => {}));

      return jobId;
    });
  }

  /**
   * Recover stale locked jobs (workers crashed or terminated mid-execution).
   */
  public static async recoverStaleLocks(targetBusinessId?: string, existingTx?: TenantTransaction): Promise<number> {
    if (!targetBusinessId) {
      const bizIds = await this.getBusinessIds();
      let totalRecovered = 0;
      for (const bId of bizIds) {
        totalRecovered += await this.recoverStaleLocks(bId, existingTx).catch(() => 0);
      }
      return totalRecovered;
    }

    return await withTenantContext(targetBusinessId, async (tx) => {
      const cutoff = new Date(Date.now() - this.LOCK_LEASE_MS);
      const processingRecords = await tx
        .select()
        .from(backgroundJobs)
        .where(
          and(
            eq(backgroundJobs.businessId, targetBusinessId),
            eq(backgroundJobs.status, "processing"),
            lt(backgroundJobs.lockedAt, cutoff)
          )
        );

      let recoveredCount = 0;

      for (const record of processingRecords) {
        try {
          await tx
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
    }, existingTx);
  }

  /**
   * Process next available pending jobs with atomic update under tenant context.
   */
  public static async processNextJobs(limit: number = 5, targetBusinessId?: string): Promise<number> {
    if (!targetBusinessId) {
      const bizIds = await this.getBusinessIds();
      let totalProcessed = 0;
      for (const bId of bizIds) {
        const count = await this.processNextJobs(limit, bId).catch(() => 0);
        if (count > 0) {
          totalProcessed += count;
          this.activeBusinessIds.add(bId);
        }
      }
      return totalProcessed;
    }

    return await withTenantContext(targetBusinessId, async (tx) => {
      const now = new Date();

      // Check for stale locks first
      await this.recoverStaleLocks(targetBusinessId, tx).catch(() => {});

      const pendingRecords = await tx
        .select()
        .from(backgroundJobs)
        .where(
          and(
            eq(backgroundJobs.businessId, targetBusinessId),
            eq(backgroundJobs.status, "pending"),
            lte(backgroundJobs.runAt, now)
          )
        )
        .limit(limit);

      let processedCount = 0;

      for (const record of pendingRecords) {
        // Atomic lock update
        const [updated] = await tx
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
          await tx
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

          await tx
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

            await tx
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
            await tx
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
    });
  }

  /**
   * Retry a dead-lettered job under tenant context.
   */
  public static async retryDeadLetter(jobId: string, businessId?: string): Promise<boolean> {
    if (!businessId) {
      const bizIds = await this.getBusinessIds();
      for (const bId of bizIds) {
        const ok = await this.retryDeadLetter(jobId, bId).catch(() => false);
        if (ok) {
          this.activeBusinessIds.add(bId);
          return true;
        }
      }
      return false;
    }

    return await withTenantContext(businessId, async (tx) => {
      const records = await tx
        .select()
        .from(backgroundJobs)
        .where(
          and(
            eq(backgroundJobs.id, jobId),
            eq(backgroundJobs.businessId, businessId),
            eq(backgroundJobs.status, "dead_letter")
          )
        );

      if (records.length === 0) return false;

      await tx
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
      setImmediate(() => this.processNextJobs(5, businessId).catch(() => {}));
      return true;
    });
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

