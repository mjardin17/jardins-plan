// src/db/migrate.ts
import fs from "fs";
import path from "path";
import { db } from "./index.ts";
import {
  businesses,
  users,
  leads,
  appointments,
  chats,
  messages,
  automations,
  automationLogs,
  auditLogs
} from "./schema.ts";
import { eq } from "drizzle-orm";

export async function runMigration() {
  console.log("🚀 Starting database migration from db.json to Cloud SQL...");

  const dbJsonPath = path.join(process.cwd(), "db.json");
  if (!fs.existsSync(dbJsonPath)) {
    console.log("ℹ️ db.json not found, skipping migration.");
    return;
  }

  try {
    const rawData = fs.readFileSync(dbJsonPath, "utf-8");
    const data = JSON.parse(rawData);

    // 1. Migrate Businesses
    if (data.businesses && Array.isArray(data.businesses)) {
      console.log(`Migrating ${data.businesses.length} businesses...`);
      for (const biz of data.businesses) {
        // Check if already migrated
        const existing = await db.select().from(businesses).where(eq(businesses.id, biz.id));
        if (existing.length === 0) {
          await db.insert(businesses).values({
            id: biz.id,
            name: biz.name,
            industry: biz.industry || "Home Services",
            website: biz.website || "",
            phone: biz.phone || "",
            email: biz.email || "",
            address: biz.address || "",
            tone: biz.tone || "friendly",
            description: biz.description || "",
            services: biz.services || [],
            faqs: biz.faqs || [],
            widgetColor: biz.widgetColor || "#0284c7",
            widgetGreeting: biz.widgetGreeting || "",
            widgetPlaceholder: biz.widgetPlaceholder || "",
            integrations: biz.integrations || {},
            createdAt: biz.createdAt ? new Date(biz.createdAt) : new Date(),
          });
          console.log(`✅ Business '${biz.id}' migrated.`);
        } else {
          console.log(`ℹ️ Business '${biz.id}' already exists in Postgres.`);
        }
      }
    }

    // 2. Migrate Users
    if (data.users && Array.isArray(data.users)) {
      console.log(`Migrating ${data.users.length} users...`);
      for (const user of data.users) {
        const existing = await db.select().from(users).where(eq(users.email, user.email));
        if (existing.length === 0) {
          await db.insert(users).values({
            email: user.email,
            name: user.name,
            role: "owner", // Default to owner/manager for migrated users
            businessId: user.businessId || "apex-plumbing",
            onboarded: user.onboarded ?? true,
            createdAt: new Date(),
          });
          console.log(`✅ User '${user.email}' migrated.`);
        } else {
          console.log(`ℹ️ User '${user.email}' already exists in Postgres.`);
        }
      }
    }

    // 3. Migrate Leads
    if (data.leads && Array.isArray(data.leads)) {
      console.log(`Migrating ${data.leads.length} leads...`);
      for (const lead of data.leads) {
        const existing = await db.select().from(leads).where(eq(leads.id, lead.id));
        if (existing.length === 0) {
          await db.insert(leads).values({
            id: lead.id,
            businessId: lead.businessId || "apex-plumbing",
            name: lead.name,
            email: lead.email || "",
            phone: lead.phone || "",
            status: lead.status || "new",
            notes: lead.notes || "",
            source: lead.source || "manual",
            chatSessionId: lead.chatSessionId || null,
            createdAt: lead.createdAt ? new Date(lead.createdAt) : new Date(),
          });
          console.log(`✅ Lead '${lead.id}' migrated.`);
        }
      }
    }

    // 4. Migrate Appointments
    if (data.appointments && Array.isArray(data.appointments)) {
      console.log(`Migrating ${data.appointments.length} appointments...`);
      for (const apt of data.appointments) {
        const existing = await db.select().from(appointments).where(eq(appointments.id, apt.id));
        if (existing.length === 0) {
          await db.insert(appointments).values({
            id: apt.id,
            businessId: apt.businessId || "apex-plumbing",
            leadId: apt.leadId || null,
            clientName: apt.clientName,
            clientEmail: apt.clientEmail || "",
            clientPhone: apt.clientPhone || "",
            serviceName: apt.serviceName,
            dateTime: new Date(apt.dateTime),
            status: apt.status || "pending",
            notes: apt.notes || "",
            createdAt: apt.createdAt ? new Date(apt.createdAt) : new Date(),
          });
          console.log(`✅ Appointment '${apt.id}' migrated.`);
        }
      }
    }

    // 5. Migrate Chats & Chat Messages
    if (data.chats && Array.isArray(data.chats)) {
      console.log(`Migrating ${data.chats.length} chats...`);
      for (const chat of data.chats) {
        const existing = await db.select().from(chats).where(eq(chats.id, chat.id));
        if (existing.length === 0) {
          await db.insert(chats).values({
            id: chat.id,
            businessId: chat.businessId || "apex-plumbing",
            visitorName: chat.visitorName || "",
            visitorEmail: chat.visitorEmail || "",
            visitorPhone: chat.visitorPhone || "",
            leadCaptured: chat.leadCaptured || false,
            appointmentBooked: chat.appointmentBooked || false,
            createdAt: chat.createdAt ? new Date(chat.createdAt) : new Date(),
            updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : new Date(),
          });
          console.log(`✅ Chat '${chat.id}' migrated.`);

          // Migrate sub-messages if any
          if (chat.messages && Array.isArray(chat.messages)) {
            console.log(`Migrating ${chat.messages.length} messages for chat '${chat.id}'...`);
            for (const msg of chat.messages) {
              await db.insert(messages).values({
                chatId: chat.id,
                sender: msg.sender,
                text: msg.text,
                createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
              });
            }
          }
        }
      }
    }

    // 6. Migrate Automations
    if (data.automations && typeof data.automations === "object") {
      console.log("Migrating automations...");
      for (const [bizId, auto] of Object.entries(data.automations)) {
        const existing = await db.select().from(automations).where(eq(automations.businessId, bizId));
        if (existing.length === 0) {
          await db.insert(automations).values({
            businessId: bizId,
            followUpDelayMinutes: (auto as any).followUpDelayMinutes ?? 5,
            followUpTemplateEmail: (auto as any).followUpTemplateEmail || "",
            followUpTemplateSMS: (auto as any).followUpTemplateSMS || "",
            followUpEnabled: (auto as any).followUpEnabled ?? true,
            reviewRequestDelayDays: (auto as any).reviewRequestDelayDays ?? 1,
            reviewTemplateEmail: (auto as any).reviewTemplateEmail || "",
            reviewTemplateSMS: (auto as any).reviewTemplateSMS || "",
            reviewEnabled: (auto as any).reviewEnabled ?? true,
            reviewLink: (auto as any).reviewLink || "",
          });
          console.log(`✅ Automations for business '${bizId}' migrated.`);
        }
      }
    }

    // 7. Migrate Automation Logs
    if (data.automationLogs && Array.isArray(data.automationLogs)) {
      console.log(`Migrating ${data.automationLogs.length} automation logs...`);
      for (const log of data.automationLogs) {
        const existing = await db.select().from(automationLogs).where(eq(automationLogs.id, log.id));
        if (existing.length === 0) {
          await db.insert(automationLogs).values({
            id: log.id,
            businessId: log.businessId || "apex-plumbing",
            type: log.type,
            leadName: log.leadName || "",
            recipient: log.recipient || "",
            channel: log.channel || "",
            templateName: log.templateName || "",
            content: log.content || "",
            status: log.status || "sent",
            sentAt: log.sentAt ? new Date(log.sentAt) : new Date(),
          });
        }
      }
    }

    // 8. Migrate Audit Logs
    if (data.auditLogs && Array.isArray(data.auditLogs)) {
      console.log(`Migrating ${data.auditLogs.length} audit logs...`);
      for (const log of data.auditLogs) {
        await db.insert(auditLogs).values({
          businessId: log.businessId || "apex-plumbing",
          userEmail: log.userEmail || log.email || "system",
          action: log.action || "LOG_ACTION",
          ip: log.ip || "127.0.0.1",
          details: log.details || "",
          timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
        });
      }
    }

    console.log("🎉 Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    throw error;
  }
}
