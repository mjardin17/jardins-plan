// src/repositories/business-discovery.repository.ts
import { db } from "../db/index.ts";
import { withTenantContext, TenantTransaction } from "../db/tenant-context.ts";
import { businessMemory, auditLogs } from "../db/schema.ts";
import { eq, and } from "drizzle-orm";
import {
  BusinessProfile,
  BusinessEvidence,
  BusinessUnknown,
  BusinessHealthAssessment,
  BusinessOpportunity,
  ImprovementRoadmapItem,
  BusinessExperiment,
  WorkerAutonomyControl
} from "../types/business-discovery.ts";
import { logger } from "../lib/logger.ts";

export interface TenantDiscoveryData {
  profile: BusinessProfile;
  evidence: BusinessEvidence[];
  unknowns: BusinessUnknown[];
  health: BusinessHealthAssessment;
  opportunities: BusinessOpportunity[];
  roadmap: ImprovementRoadmapItem[];
  experiments: BusinessExperiment[];
  workers: WorkerAutonomyControl[];
}

// Memory store backed by DB
const discoveryCache = new Map<string, TenantDiscoveryData>();

export class BusinessDiscoveryRepository {
  /**
   * Retrieves all discovery data for a given tenant ID.
   */
  public static async getTenantData(tenantId: string, passedTx?: TenantTransaction): Promise<TenantDiscoveryData | null> {
    if (discoveryCache.has(tenantId)) {
      return discoveryCache.get(tenantId)!;
    }

    try {
      const executeQuery = async (tx: TenantTransaction) => {
        const records = await tx
          .select()
          .from(businessMemory)
          .where(
            and(
              eq(businessMemory.businessId, tenantId),
              eq(businessMemory.key, "discovery_engine_state")
            )
          );

        if (records && records.length > 0) {
          const rawVal = records[0].value;
          const parsed: TenantDiscoveryData = typeof rawVal === "string" ? JSON.parse(rawVal) : (rawVal as any);
          discoveryCache.set(tenantId, parsed);
          return parsed;
        }
        return null;
      };

      if (passedTx) {
        return await executeQuery(passedTx);
      }
      return await withTenantContext(tenantId, executeQuery);
    } catch (err: any) {
      if (process.env.NODE_ENV === "production") {
        logger.error(`[BusinessDiscoveryRepository] CRITICAL: DB query failed for tenant ${tenantId} in PRODUCTION. Fallback prohibited.`);
        throw new Error(`PRODUCTION DATABASE FAILURE: Could not fetch discovery record for ${tenantId}: ${err?.message}`);
      }
      logger.warn(`[BusinessDiscoveryRepository] Could not fetch DB record for tenant ${tenantId}, using fallback memory.`);
    }

    return null;
  }

  /**
   * Saves or updates discovery data for a given tenant ID.
   */
  public static async saveTenantData(tenantId: string, data: TenantDiscoveryData, passedTx?: TenantTransaction): Promise<void> {
    discoveryCache.set(tenantId, data);

    try {
      const executeSave = async (tx: TenantTransaction) => {
        const existing = await tx
          .select({ id: businessMemory.id })
          .from(businessMemory)
          .where(
            and(
              eq(businessMemory.businessId, tenantId),
              eq(businessMemory.key, "discovery_engine_state")
            )
          );

        if (existing && existing.length > 0) {
          await tx
            .update(businessMemory)
            .set({
              value: data as any,
              updatedAt: new Date()
            })
            .where(eq(businessMemory.id, existing[0].id));
        } else {
          await tx
            .insert(businessMemory)
            .values({
              businessId: tenantId,
              key: "discovery_engine_state",
              value: data as any,
              updatedAt: new Date()
            });
        }
      };

      if (passedTx) {
        await executeSave(passedTx);
      } else {
        await withTenantContext(tenantId, executeSave);
      }

      logger.info(`[BusinessDiscoveryRepository] Persisted discovery state for tenant [${tenantId}].`);
    } catch (err: any) {
      if (process.env.NODE_ENV === "production") {
        logger.error(`[BusinessDiscoveryRepository] CRITICAL: DB save failed for tenant ${tenantId} in PRODUCTION. Fallback prohibited.`);
        throw new Error(`PRODUCTION DATABASE FAILURE: Could not save discovery record for ${tenantId}: ${err?.message}`);
      }
      logger.warn(`[BusinessDiscoveryRepository] Fallback memory save active for tenant ${tenantId}.`);
    }
  }

  /**
   * Logs administrative / security action to audit trail.
   */
  public static async logAuditAction(
    tenantId: string,
    userEmail: string,
    action: string,
    details: string,
    passedTx?: TenantTransaction
  ): Promise<void> {
    try {
      const executeLog = async (tx: TenantTransaction) => {
        await tx.insert(auditLogs).values({
          businessId: tenantId,
          userEmail,
          action,
          ip: "127.0.0.1",
          details
        });
      };

      if (passedTx) {
        await executeLog(passedTx);
      } else {
        await withTenantContext(tenantId, executeLog);
      }
    } catch (err) {
      logger.warn(`[BusinessDiscoveryRepository] Could not log audit action to DB.`);
    }
  }

  /**
   * Helper for testing cache clearing
   */
  public static clearCache(): void {
    discoveryCache.clear();
  }
}

