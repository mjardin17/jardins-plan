import { Request, Response } from "express";
import { db as pgDb } from "../db/index.ts";
import { marketplaceApps, marketplaceAppAnalytics, users } from "../db/schema.ts";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUserEmail } from "../middleware/auth.middleware.ts";
import { logger } from "../lib/logger.ts";

export const PREDEFINED_MARKETPLACE_APPS = [
  {
    id: "app-hubspot-sync",
    name: "HubSpot CRM Bidirectional Sync",
    developer: "Enterprise Ecosystem Labs",
    category: "CRM & Sales",
    version: "2.4.0",
    description: "Real-time sync of leads, deals, contacts, and activity timeline between AI Workforce and HubSpot CRM.",
    permissionsNeeded: ["read:leads", "write:leads", "read:contacts", "write:timeline"],
    digitalSignature: "sig_rsa4096_verified_hubspot_official",
    iconBg: "bg-orange-500",
  },
  {
    id: "app-slack-dispatch",
    name: "Slack Team Ops & Dispatch Bot",
    developer: "Operations Core",
    category: "Communication",
    version: "1.8.2",
    description: "Pushes immediate lead notifications, dispatch alerts, and AI action approvals into Slack channels.",
    permissionsNeeded: ["write:channels", "read:users"],
    digitalSignature: "sig_rsa4096_verified_slack_app",
    iconBg: "bg-purple-600",
  },
  {
    id: "app-quickbooks-billing",
    name: "QuickBooks Online Auto-Invoicing",
    developer: "Intuit Ecosystem Partner",
    category: "Finance & Accounting",
    version: "3.1.0",
    description: "Automatically generates QB invoices, registers customer payments, and syncs tax calculations.",
    permissionsNeeded: ["read:invoices", "write:invoices", "read:payments"],
    digitalSignature: "sig_rsa4096_verified_intuit",
    iconBg: "bg-emerald-600",
  }
];

export class MarketplaceController {
  public static async getApps(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const installed = await pgDb.select().from(marketplaceApps).where(eq(marketplaceApps.businessId, user.businessId));

      const apps = PREDEFINED_MARKETPLACE_APPS.map(app => {
        const inst = installed.find(i => i.appId === app.id);
        return {
          ...app,
          isInstalled: !!inst,
          enabled: inst ? inst.enabled : false,
          permissionsGranted: inst ? inst.permissionsGranted : [],
          installedVersion: inst ? inst.version : null,
          digitalSignature: inst ? inst.digitalSignature : app.digitalSignature,
          installedAt: inst ? inst.createdAt : null,
        };
      });

      res.json({ apps });
    } catch (err: any) {
      logger.error("Error in MarketplaceController.getApps:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public static async installApp(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const { appId } = req.params;
      const coreApp = PREDEFINED_MARKETPLACE_APPS.find(a => a.id === appId);
      if (!coreApp) return res.status(404).json({ error: "Extension not found in catalog" });

      const existing = await pgDb.select()
        .from(marketplaceApps)
        .where(and(eq(marketplaceApps.businessId, user.businessId), eq(marketplaceApps.appId, appId)));

      let installedRecord;
      if (existing.length > 0) {
        installedRecord = await pgDb.update(marketplaceApps)
          .set({
            enabled: true,
            permissionsGranted: coreApp.permissionsNeeded,
            version: coreApp.version,
            updatedAt: new Date()
          })
          .where(eq(marketplaceApps.id, existing[0].id))
          .returning();
      } else {
        installedRecord = await pgDb.insert(marketplaceApps)
          .values({
            businessId: user.businessId,
            appId,
            enabled: true,
            permissionsGranted: coreApp.permissionsNeeded,
            version: coreApp.version,
            digitalSignature: coreApp.digitalSignature,
          })
          .returning();
      }

      await pgDb.insert(marketplaceAppAnalytics).values({
        businessId: user.businessId,
        appId,
        eventType: "install",
        status: "success",
        durationMs: 120,
        message: `Successfully installed extension '${coreApp.name}' v${coreApp.version}`,
        metadata: { permissionsGranted: coreApp.permissionsNeeded, user: user.name }
      });

      res.json({ success: true, app: installedRecord[0] });
    } catch (err: any) {
      logger.error("Error in MarketplaceController.installApp:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public static async uninstallApp(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    try {
      const userResult = await pgDb.select().from(users).where(eq(users.email, email));
      const user = userResult[0];
      if (!user || !user.businessId) return res.status(401).json({ error: "Unauthorized" });

      const { appId } = req.params;
      await pgDb.delete(marketplaceApps)
        .where(and(eq(marketplaceApps.businessId, user.businessId), eq(marketplaceApps.appId, appId)));

      await pgDb.insert(marketplaceAppAnalytics).values({
        businessId: user.businessId,
        appId,
        eventType: "uninstall",
        status: "success",
        durationMs: 45,
        message: `Successfully uninstalled extension '${appId}'`,
        metadata: { user: user.name }
      });

      res.json({ success: true });
    } catch (err: any) {
      logger.error("Error in MarketplaceController.uninstallApp:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
