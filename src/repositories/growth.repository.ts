import { db } from "../db/index.ts";
import { withTenantContext, TenantTransaction, getUserByEmail as getTenantUserByEmail } from "../db/tenant-context.ts";
import {
  leads,
  appointments,
  users,
  businesses,
  auditLogs,
  backgroundJobs,
} from "../db/schema.ts";
import { eq, count } from "drizzle-orm";

export class GrowthRepository {
  public static async getUserByEmail(email: string, passedTx?: TenantTransaction) {
    if (passedTx) {
      const results = await passedTx.select().from(users).where(eq(users.email, email.trim()));
      return results[0] || null;
    }
    return getTenantUserByEmail(email);
  }

  public static async getLeadsByBusinessId(businessId: string, passedTx?: TenantTransaction): Promise<Array<typeof leads.$inferSelect>> {
    if (passedTx) {
      return passedTx.select().from(leads).where(eq(leads.businessId, businessId));
    }
    return withTenantContext(businessId, async (tx) => {
      return tx.select().from(leads).where(eq(leads.businessId, businessId));
    });
  }

  public static async getAppointmentsByBusinessId(businessId: string, passedTx?: TenantTransaction): Promise<Array<typeof appointments.$inferSelect>> {
    if (passedTx) {
      return passedTx.select().from(appointments).where(eq(appointments.businessId, businessId));
    }
    return withTenantContext(businessId, async (tx) => {
      return tx.select().from(appointments).where(eq(appointments.businessId, businessId));
    });
  }

  public static async getBusinessById(businessId: string, passedTx?: TenantTransaction): Promise<typeof businesses.$inferSelect | null> {
    if (passedTx) {
      const results = await passedTx.select().from(businesses).where(eq(businesses.id, businessId));
      return results[0] || null;
    }
    return withTenantContext(businessId, async (tx) => {
      const results = await tx.select().from(businesses).where(eq(businesses.id, businessId));
      return results[0] || null;
    });
  }

  public static async createAuditLog(log: {
    businessId: string;
    userEmail: string;
    action: string;
    ip: string;
    details: string;
  }, passedTx?: TenantTransaction) {
    const doInsert = async (tx: TenantTransaction) => {
      await tx.insert(auditLogs).values({
        businessId: log.businessId,
        userEmail: log.userEmail,
        action: log.action,
        ip: log.ip,
        details: log.details,
      });
    };
    if (passedTx) {
      return doInsert(passedTx);
    }
    return withTenantContext(log.businessId, doInsert);
  }

  public static async getSystemHealthMetrics(businessId?: string, passedTx?: TenantTransaction) {
    if (!businessId) {
      const [leadsCount] = await db.select({ value: count() }).from(leads);
      const [apptsCount] = await db.select({ value: count() }).from(appointments);
      const [usersCount] = await db.select({ value: count() }).from(users);
      const [jobsCount] = await db.select({ value: count() }).from(backgroundJobs);

      return {
        totalLeads: Number(leadsCount?.value || 0),
        totalAppointments: Number(apptsCount?.value || 0),
        totalUsers: Number(usersCount?.value || 0),
        totalBackgroundJobs: Number(jobsCount?.value || 0),
      };
    }

    const query = async (tx: TenantTransaction) => {
      const [leadsCount] = await tx.select({ value: count() }).from(leads).where(eq(leads.businessId, businessId));
      const [apptsCount] = await tx.select({ value: count() }).from(appointments).where(eq(appointments.businessId, businessId));
      const [usersCount] = await tx.select({ value: count() }).from(users).where(eq(users.businessId, businessId));
      const [jobsCount] = await tx.select({ value: count() }).from(backgroundJobs).where(eq(backgroundJobs.businessId, businessId));

      return {
        totalLeads: Number(leadsCount?.value || 0),
        totalAppointments: Number(apptsCount?.value || 0),
        totalUsers: Number(usersCount?.value || 0),
        totalBackgroundJobs: Number(jobsCount?.value || 0),
      };
    };

    if (passedTx) {
      return query(passedTx);
    }
    return withTenantContext(businessId, query);
  }
}
