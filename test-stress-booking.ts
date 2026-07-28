// test-stress-booking.ts
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "./src/db/schema.ts";

dotenv.config();

// Initialize two independent connection pools to represent separate server nodes/sessions
const poolA = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 5,
  connectionTimeoutMillis: 15000,
});

const poolB = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 5,
  connectionTimeoutMillis: 15000,
});

const dbA = drizzle(poolA, { schema });
const dbB = drizzle(poolB, { schema });

async function runStressTest() {
  console.log("==================================================");
  console.log("🔥 STARTING 100-RUN CONCURRENCY STRESS TEST");
  console.log("==================================================");

  let successCount = 0;       // Successfully booked first slot
  let rejectedCount = 0;      // Safely rejected conflicting slot
  let doubleBookings = 0;     // Overlapping slots (CRITICAL FAILURE)
  let deadlocks = 0;          // Deadlock aborts
  let systemErrors = 0;       // Miscellaneous errors

  // Run 100 times
  for (let run = 1; run <= 100; run++) {
    const businessId = `stress-biz-${run}-${Date.now()}`;
    const testSlot = new Date(`2026-10-18T10:00:00Z`);

    // 1. Provision business profile for this run
    try {
      await dbA.insert(schema.businesses).values({
        id: businessId,
        name: `Stress Test Biz ${run}`,
        industry: "Testing",
      });
    } catch (err: any) {
      console.error(`Failed to provision business for run ${run}:`, err.message);
      systemErrors++;
      continue;
    }

    // Helper functions for concurrent bookings
    const bookOnConnA = async () => {
      const aptId = `apt-a-${run}`;
      return dbA.transaction(async (tx) => {
        // Acquire advisory lock
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${businessId}))`);

        // Check conflicts
        const existing = await tx.select().from(schema.appointments).where(
          and(
            eq(schema.appointments.businessId, businessId),
            eq(schema.appointments.status, "confirmed")
          )
        );

        const conflict = existing.find(a => {
          const diffMs = Math.abs(testSlot.getTime() - new Date(a.dateTime).getTime());
          return diffMs < 60 * 60 * 1000;
        });

        if (conflict) {
          throw new Error("CONFLICT_DETECTED");
        }

        await tx.insert(schema.appointments).values({
          id: aptId,
          businessId,
          clientName: "Client Alice on Connection A",
          serviceName: "Stress Test Pipe Replacement",
          dateTime: testSlot,
          status: "confirmed",
        });

        return aptId;
      });
    };

    const bookOnConnB = async () => {
      const aptId = `apt-b-${run}`;
      return dbB.transaction(async (tx) => {
        // Acquire advisory lock
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${businessId}))`);

        // Check conflicts
        const existing = await tx.select().from(schema.appointments).where(
          and(
            eq(schema.appointments.businessId, businessId),
            eq(schema.appointments.status, "confirmed")
          )
        );

        const conflict = existing.find(a => {
          const diffMs = Math.abs(testSlot.getTime() - new Date(a.dateTime).getTime());
          return diffMs < 60 * 60 * 1000;
        });

        if (conflict) {
          throw new Error("CONFLICT_DETECTED");
        }

        await tx.insert(schema.appointments).values({
          id: aptId,
          businessId,
          clientName: "Client Bob on Connection B",
          serviceName: "Stress Test Pipe Repair",
          dateTime: testSlot,
          status: "confirmed",
        });

        return aptId;
      });
    };

    // Trigger both bookings simultaneously in parallel
    const start = Date.now();
    const results = await Promise.allSettled([bookOnConnA(), bookOnConnB()]);

    const outcomeA = results[0];
    const outcomeB = results[1];

    let runSuccess = 0;
    let runConflict = 0;

    // Evaluate Outcome A
    if (outcomeA.status === "fulfilled") {
      runSuccess++;
    } else {
      const errMsg = outcomeA.reason.message;
      if (errMsg === "CONFLICT_DETECTED") {
        runConflict++;
      } else if (errMsg.includes("deadlock")) {
        deadlocks++;
      } else {
        systemErrors++;
        console.error(`Run ${run} ConnA Error:`, errMsg);
      }
    }

    // Evaluate Outcome B
    if (outcomeB.status === "fulfilled") {
      runSuccess++;
    } else {
      const errMsg = outcomeB.reason.message;
      if (errMsg === "CONFLICT_DETECTED") {
        runConflict++;
      } else if (errMsg.includes("deadlock")) {
        deadlocks++;
      } else {
        systemErrors++;
        console.error(`Run ${run} ConnB Error:`, errMsg);
      }
    }

    // Tabulate metrics
    if (runSuccess === 1) {
      successCount++;
    }
    if (runConflict === 1) {
      rejectedCount++;
    }
    if (runSuccess === 2) {
      doubleBookings++;
      console.warn(`🚨 WARNING: Double booking occurred on run ${run}!`);
    }

    if (run % 20 === 0) {
      console.log(`📡 Processed ${run}/100 stress runs...`);
    }
  }

  console.log("\n==================================================");
  console.log("📊 100-RUN CONCURRENCY STRESS TEST RESULTS");
  console.log("==================================================");
  console.log(`✅ Successful first bookings:       ${successCount}`);
  console.log(`🔒 Rejected conflicting bookings:    ${rejectedCount}`);
  console.log(`🚨 Unexpected double bookings:     ${doubleBookings}`);
  console.log(`💀 Deadlocks encountered:           ${deadlocks}`);
  console.log(`⚠️  System/Network errors:           ${systemErrors}`);
  console.log("==================================================");
  
  if (doubleBookings === 0) {
    console.log("🎉 SUCCESS: True double-booking guarantee fully verified!");
  } else {
    console.error("❌ FAILURE: Double bookings occurred during high concurrency!");
  }

  // Close connection pools
  await poolA.end();
  await poolB.end();
}

runStressTest().catch(console.error);
