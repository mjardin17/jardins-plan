import { Request, Response } from "express";
import { db as pgDb } from "../db/index.ts";
import { leads, appointments, chats, messages, invoices, payments, users } from "../db/schema.ts";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedUserEmail, validateName, validateEmail, validatePhone } from "../middleware/auth.middleware.ts";
import { logger } from "../lib/logger.ts";

export class CRMController {
  public static async getLeads(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const bizLeads = await pgDb.select().from(leads).where(eq(leads.businessId, user.businessId));
      res.json({ leads: bizLeads });
    } catch (err: any) {
      logger.error("Error in CRMController.getLeads:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public static async createLead(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const { name, email: leadEmail, phone, status, notes } = req.body;
      if (!validateName(name)) {
        return res.status(400).json({ error: "Please enter a valid lead name." });
      }
      if (leadEmail && !validateEmail(leadEmail)) {
        return res.status(400).json({ error: "Invalid lead email format." });
      }
      if (phone && !validatePhone(phone)) {
        return res.status(400).json({ error: "Invalid lead phone format." });
      }

      const newLeadId = `lead-${Date.now()}`;
      const newLead = {
        id: newLeadId,
        businessId: user.businessId,
        name,
        email: leadEmail || "",
        phone: phone || "",
        status: status || "new",
        notes: notes || "",
        createdAt: new Date(),
        source: "manual",
        chatSessionId: null
      };

      await pgDb.insert(leads).values(newLead);
      res.json({ success: true, lead: newLead });
    } catch (err: any) {
      logger.error("Error in CRMController.createLead:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public static async getAppointments(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const appts = await pgDb.select().from(appointments).where(eq(appointments.businessId, user.businessId));
      res.json({ appointments: appts });
    } catch (err: any) {
      logger.error("Error in CRMController.getAppointments:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public static async getInvoices(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const invs = await pgDb.select().from(invoices).where(eq(invoices.businessId, user.businessId));
      res.json({ invoices: invs });
    } catch (err: any) {
      logger.error("Error in CRMController.getInvoices:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
