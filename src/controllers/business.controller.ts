import { Request, Response } from "express";
import { db as pgDb } from "../db/index.ts";
import { businesses, users, automations } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { getAuthenticatedUserEmail } from "../middleware/auth.middleware.ts";
import { logger } from "../lib/logger.ts";

export function serializeBusiness(biz: any) {
  if (!biz) return null;
  return {
    id: biz.id,
    name: biz.name,
    industry: biz.industry,
    website: biz.website,
    phone: biz.phone,
    email: biz.email,
    address: biz.address,
    tone: biz.tone,
    description: biz.description,
    services: biz.services,
    faqs: biz.faqs,
    widgetColor: biz.widgetColor,
    widgetGreeting: biz.widgetGreeting,
    widgetPlaceholder: biz.widgetPlaceholder,
  };
}

export class BusinessController {
  public static async getBusiness(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      if (!user.businessId) {
        return res.json({ business: null });
      }

      const bizResult = await pgDb.select().from(businesses).where(eq(businesses.id, user.businessId));
      const rawBiz = bizResult[0];
      res.json({ business: serializeBusiness(rawBiz) });
    } catch (err: any) {
      logger.error("Error in BusinessController.getBusiness:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public static async getBusinessById(req: Request, res: Response) {
    try {
      const bizResult = await pgDb.select().from(businesses).where(eq(businesses.id, req.params.businessId));
      const rawBiz = bizResult[0];
      if (!rawBiz) return res.status(404).json({ error: "Business not found" });
      res.json({ business: serializeBusiness(rawBiz) });
    } catch (err: any) {
      logger.error("Error in BusinessController.getBusinessById:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public static async onboardBusiness(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const profile = req.body;
      const businessId = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const newBusiness = {
        id: businessId,
        name: profile.name,
        industry: profile.industry || "General Business",
        website: profile.website || "",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        tone: profile.tone || "friendly",
        description: profile.description || "",
        services: profile.services || [],
        faqs: profile.faqs || [],
        widgetColor: profile.widgetColor || "#0284c7",
        widgetGreeting: profile.widgetGreeting || `Hello! I'm ${profile.name}'s virtual assistant. How can I help you today?`,
        widgetPlaceholder: profile.widgetPlaceholder || "Ask me anything..."
      };

      await pgDb.transaction(async (tx) => {
        await tx.insert(businesses).values(newBusiness).onConflictDoUpdate({
          target: businesses.id,
          set: newBusiness
        });

        await tx.update(users).set({
          businessId: businessId,
          onboarded: true
        }).where(eq(users.email, email));

        const defaultAuto = {
          businessId: businessId,
          followUpDelayMinutes: 5,
          followUpTemplateEmail: `Hi {LeadName},\n\nThanks for reaching out to ${profile.name}! Our AI assistant passed along your info regarding {ServicesRequested}.\n\nWe will get back to you shortly. You can also reach us at ${profile.phone}.\n\nWarmly,\n${profile.name} Support`,
          followUpTemplateSMS: `Hi {LeadName}! Thanks for contacting ${profile.name}. We'll call or text you shortly about {ServicesRequested}.`,
          followUpEnabled: true,
          reviewRequestDelayDays: 1,
          reviewTemplateEmail: `Hi {ClientName},\n\nThank you for choosing ${profile.name}!\n\nCould you please take 1 minute to leave us a review?\n{ReviewLink}\n\nThanks again!\n${profile.name}`,
          reviewTemplateSMS: `Hi {ClientName}, thanks for your business with ${profile.name}! Please take a second to leave us a review: {ReviewLink}`,
          reviewEnabled: false,
          reviewLink: `https://g.page/${businessId}/review`
        };

        await tx.insert(automations).values(defaultAuto).onConflictDoUpdate({
          target: automations.businessId,
          set: defaultAuto
        });
      });

      res.json({ success: true, business: newBusiness });
    } catch (err: any) {
      logger.error("Error in BusinessController.onboardBusiness:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
