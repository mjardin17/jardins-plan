import { db } from "../db/index.ts";
import {
  leads,
  appointments,
  users,
  businesses,
  auditLogs,
  automationLogs,
} from "../db/schema.ts";
import { eq, count, and } from "drizzle-orm";

export class GrowthRepository {
  public static async getUserByEmail(email: string) {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0] || null;
  }

  public static async getLeadsByBusinessId(businessId: string) {
    return db.select().from(leads).where(eq(leads.businessId, businessId));
  }

  public static async getAppointmentsByBusinessId(businessId: string) {
    return db.select().from(appointments).where(eq(appointments.businessId, businessId));
  }

  public static async getBusinessById(businessId: string) {
    const results = await db.select().from(businesses).where(eq(businesses.id, businessId));
    return results[0] || null;
  }

  public static async createAuditLog(log: {
    businessId: string;
    userEmail: string;
    action: string;
    ip: string;
    details: string;
  }) {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(auditLogs).values({
      businessId: log.businessId,
      userEmail: log.userEmail,
      action: log.action,
      ip: log.ip,
      details: log.details,
    });
  }

  public static async getSystemHealthMetrics() {
    const [leadsCount] = await db.select({ value: count() }).from(leads);
    const [apptsCount] = await db.select({ value: count() }).from(appointments);
    const [usersCount] = await db.select({ value: count() }).from(users);
    const [jobsCount] = await db
      .select({ value: count() })
      .from(automationLogs)
      .where(eq(automationLogs.type, "background_job"));

    return {
      totalLeads: Number(leadsCount?.value || 0),
      totalAppointments: Number(apptsCount?.value || 0),
      totalUsers: Number(usersCount?.value || 0),
      totalBackgroundJobs: Number(jobsCount?.value || 0),
    };
  }
}
