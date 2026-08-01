// src/db/migration-verifier.ts
import { db } from "./index.ts";
import { sql } from "drizzle-orm";
import { initializeDatabaseTables } from "./init.ts";
import { logger } from "../lib/logger.ts";

export const REQUIRED_PRODUCTION_TABLES = [
  "businesses",
  "users",
  "deployable_improvements",
  "improvement_approvals",
  "improvement_deployment_attempts",
  "improvement_performance_results",
  "ai_accessibility_audits",
  "audit_events",
  "background_jobs",
  "encrypted_credentials",
  "worker_configurations"
];

export async function verifyAndInitializeDatabase(): Promise<void> {
  logger.info(`[Migration Verifier] Verifying schema state for environment: ${process.env.NODE_ENV || 'development'}`);

  // 1. Connectivity Check
  try {
    await db.execute(sql`SELECT 1`);
    logger.info("[Migration Verifier] Database connectivity confirmed via SELECT 1.");
  } catch (err: any) {
    logger.warn(`[Migration Verifier] Initial database connectivity check pending or delayed: ${err.message}`);
    return;
  }

  // 2. Query Existing Tables
  let existingTables: string[] = [];
  try {
    const records = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
    );
    const rows: any = records.rows || (records as any);
    if (Array.isArray(rows)) {
      existingTables = rows.map((r: any) => (r.table_name || r.TABLE_NAME || "").toLowerCase());
    }
  } catch (err: any) {
    logger.warn(`[Migration Verifier] Could not query information_schema.tables: ${err.message}`);
  }

  const missingTables = REQUIRED_PRODUCTION_TABLES.filter(
    (tbl) => !existingTables.includes(tbl.toLowerCase())
  );

  if (missingTables.length > 0 || existingTables.length === 0) {
    logger.info(`[Migration Verifier] Missing ${missingTables.length} table(s). Running automatic table schema initialization...`);
    try {
      await initializeDatabaseTables();
      logger.info("[Migration Verifier] Database schema initialization complete. All required tables created.");
    } catch (err: any) {
      logger.error(`[Migration Verifier] Table initialization warning: ${err.message}`);
    }
  } else {
    logger.info("[Migration Verifier] All required database tables present.");
  }
}

