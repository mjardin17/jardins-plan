import { Router, Request, Response } from "express";
import { db } from "../db/index.ts";
import { sql } from "drizzle-orm";
import { obsManager } from "../lib/observability.ts";
import { DurableJobQueue } from "../lib/job-queue.ts";
import { validateEnvironment } from "../config/env-validator.ts";

const router = Router();

// Process Liveness Probes
router.get("/liveness", (req: Request, res: Response) => {
  res.status(200).json({ status: "alive", timestamp: new Date().toISOString() });
});

router.get("/health/live", (req: Request, res: Response) => {
  res.status(200).json({ status: "alive", timestamp: new Date().toISOString() });
});

// Process Readiness Probes
async function checkReadiness(): Promise<{ ready: boolean; error?: string; persistenceMode: string }> {
  const envValidation = validateEnvironment();
  if (!envValidation.success) {
    return {
      ready: false,
      error: `Environment validation failed: ${envValidation.errors.join("; ")}`,
      persistenceMode: envValidation.persistenceMode,
    };
  }

  try {
    await db.execute(sql`SELECT 1`);
  } catch (err: any) {
    return {
      ready: false,
      error: `Database ping failed: ${err.message}`,
      persistenceMode: envValidation.persistenceMode,
    };
  }

  return { ready: true, persistenceMode: envValidation.persistenceMode };
}

router.get("/readiness", async (req: Request, res: Response) => {
  const result = await checkReadiness();
  if (result.ready) {
    res.status(200).json({ status: "ready", persistenceMode: result.persistenceMode, timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({ status: "not_ready", error: result.error, timestamp: new Date().toISOString() });
  }
});

router.get("/health/ready", async (req: Request, res: Response) => {
  const result = await checkReadiness();
  if (result.ready) {
    res.status(200).json({ status: "ready", persistenceMode: result.persistenceMode, timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({ status: "not_ready", error: result.error, timestamp: new Date().toISOString() });
  }
});

// Full Health Report
router.get("/health", async (req: Request, res: Response) => {
  let dbStatus = "healthy";
  let dbLatencyMs = 0;
  const startDb = Date.now();

  try {
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - startDb;
  } catch (err: any) {
    dbStatus = "unhealthy";
  }

  const envValidation = validateEnvironment();
  const liveMetrics = obsManager.getLiveMetrics();

  const isHealthy = dbStatus === "healthy" && envValidation.success;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    workerId: DurableJobQueue.workerId,
    persistenceMode: envValidation.persistenceMode,
    environmentValidation: {
      success: envValidation.success,
      errors: envValidation.errors,
      warnings: envValidation.warnings,
    },
    services: {
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      jobQueue: { status: "healthy", activeWorker: DurableJobQueue.workerId },
      aiRouter: { status: process.env.GEMINI_API_KEY ? "healthy" : "degraded" },
    },
    system: {
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      cpuUsagePercent: liveMetrics.cpuUsage,
      nodeVersion: process.version,
    },
  });
});

router.get("/api/health", async (req: Request, res: Response) => {
  res.redirect("/health");
});

// Enterprise OpenTelemetry / Metrics Endpoint
router.get("/metrics", (req: Request, res: Response) => {
  const liveMetrics = obsManager.getLiveMetrics();
  const mem = process.memoryUsage();

  res.setHeader("Content-Type", "text/plain");
  res.send(`
# HELP process_uptime_seconds Total process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP process_memory_rss_bytes Resident Set Size memory in bytes
# TYPE process_memory_rss_bytes gauge
process_memory_rss_bytes ${mem.rss}

# HELP process_memory_heap_used_bytes Heap used in bytes
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes ${mem.heapUsed}

# HELP system_cpu_usage_percent CPU usage percentage
# TYPE system_cpu_usage_percent gauge
system_cpu_usage_percent ${liveMetrics.cpuUsage}

# HELP http_requests_per_minute Estimated requests per minute
# TYPE http_requests_per_minute gauge
http_requests_per_minute ${liveMetrics.requestsPerMinute}

# HELP http_avg_response_time_ms Average response time in ms
# TYPE http_avg_response_time_ms gauge
http_avg_response_time_ms ${liveMetrics.avgResponseTimeMs}

# HELP queue_length Pending background queue jobs
# TYPE queue_length gauge
queue_length ${liveMetrics.queueLength}
  `.trim());
});

export default router;
