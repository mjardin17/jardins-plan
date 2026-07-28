import { DurableJobQueue } from "../lib/job-queue.ts";
import { db } from "../db/index.ts";
import { businesses } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export async function runQueueTests() {
  console.log("----------------------------------------");
  console.log("⚡ Running Durable Job Queue Tests...");

  const testBusinessId = "apex-plumbing";
  let handlerExecuted = false;

  // Ensure test business exists in database for FK constraint
  const existingBiz = await db.select().from(businesses).where(eq(businesses.id, testBusinessId));
  if (existingBiz.length === 0) {
    await db.insert(businesses).values({
      id: testBusinessId,
      name: "Apex Plumbing",
      industry: "Contractor"
    }).onConflictDoNothing();
  }

  // 1. Register test handler
  DurableJobQueue.registerHandler("test_queue_job", async (payload, jobId) => {
    if (payload.testKey === "test_val") {
      handlerExecuted = true;
    }
  });

  // 2. Enqueue job
  const jobId = await DurableJobQueue.enqueue(
    testBusinessId,
    "test_queue_job",
    { testKey: "test_val" },
    { idempotencyKey: `idemp_${Date.now()}` }
  );

  if (!jobId || !jobId.startsWith("job_")) {
    throw new Error("Queue test failed: Enqueued job ID format invalid.");
  }

  // 3. Process jobs synchronously
  const processedCount = await DurableJobQueue.processNextJobs();
  if (processedCount < 1) {
    throw new Error("Queue test failed: No jobs processed by queue worker.");
  }

  if (!handlerExecuted) {
    throw new Error("Queue test failed: Registered job handler was not executed.");
  }

  // 4. Test Idempotency
  const key = `idemp_repeat_${Date.now()}`;
  const firstId = await DurableJobQueue.enqueue(testBusinessId, "test_queue_job", {}, { idempotencyKey: key });
  const secondId = await DurableJobQueue.enqueue(testBusinessId, "test_queue_job", {}, { idempotencyKey: key });

  if (firstId !== secondId) {
    throw new Error("Queue test failed: Idempotency check failed (different IDs returned).");
  }

  console.log("  ✅ Durable Queue Enqueue: Passed");
  console.log("  ✅ Atomic Worker Processing: Passed");
  console.log("  ✅ Queue Idempotency Guarantee: Passed");
  console.log("  ✅ All Queue Tests Passed!");
}
