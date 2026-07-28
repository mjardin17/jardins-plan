import { db } from "../db/index.ts";
import { automationLogs } from "../db/schema.ts";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger.ts";

export interface CompetitorData {
  id?: string;
  businessId: string;
  name: string;
  pricing: string;
  reviews: string;
  advantages: string;
  weaknesses: string;
  tactics: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export class CompetitorRepository {
  public static async findByBusinessId(businessId: string): Promise<CompetitorData[]> {
    try {
      return await db.transaction(async (tx) => {
        await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${businessId}', false);`));
        const records = await tx
          .select()
          .from(automationLogs)
          .where(
            and(
              eq(automationLogs.businessId, businessId),
              eq(automationLogs.type, "competitor_intel")
            )
          );

        return records.map((rec) => {
          let parsed: any = {};
          try {
            parsed = JSON.parse(rec.content || "{}");
          } catch {
            parsed = {};
          }
          return {
            id: rec.id,
            businessId: rec.businessId,
            name: parsed.name || rec.leadName || "Competitor",
            pricing: parsed.pricing || "Standard",
            reviews: parsed.reviews || "4.0★",
            advantages: parsed.advantages || "Local presence",
            weaknesses: parsed.weaknesses || "Manual scheduling",
            tactics: parsed.tactics || rec.templateName || "Promote flat-rate pricing and instant booking.",
            createdAt: rec.sentAt,
            updatedAt: rec.sentAt,
          };
        });
      });
    } catch (err) {
      logger.error("[CompetitorRepository] Error finding competitors:", err);
      return [];
    }
  }

  public static async create(competitor: Omit<CompetitorData, "id">): Promise<CompetitorData> {
    const id = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      name: competitor.name,
      pricing: competitor.pricing,
      reviews: competitor.reviews,
      advantages: competitor.advantages,
      weaknesses: competitor.weaknesses,
      tactics: competitor.tactics,
    };

    return await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${competitor.businessId}', false);`));
      const [inserted] = await tx
        .insert(automationLogs)
        .values({
          id,
          businessId: competitor.businessId,
          type: "competitor_intel",
          leadName: competitor.name,
          channel: "database",
          templateName: competitor.tactics,
          content: JSON.stringify(payload),
          status: "active",
        })
        .returning();

      return {
        id: inserted.id,
        businessId: inserted.businessId,
        name: competitor.name,
        pricing: competitor.pricing,
        reviews: competitor.reviews,
        advantages: competitor.advantages,
        weaknesses: competitor.weaknesses,
        tactics: competitor.tactics,
        createdAt: inserted.sentAt,
        updatedAt: inserted.sentAt,
      };
    });
  }

  public static async seedDefaultsIfEmpty(businessId: string): Promise<CompetitorData[]> {
    const existing = await this.findByBusinessId(businessId);
    if (existing.length > 0) {
      return existing;
    }

    const defaults = [
      {
        businessId,
        name: "Budget Drain Pros",
        pricing: "Economy ($90/hr)",
        reviews: "3.9★ (55 reviews)",
        advantages: "Extremely cheap rates",
        weaknesses: "Frequent customer complaints about delays",
        tactics: "Highlight our 100% On-Time guarantee in search ads",
      },
      {
        businessId,
        name: "Titan Rooter & Plumbing",
        pricing: "Premium ($185/hr)",
        reviews: "4.8★ (410 reviews)",
        advantages: "High search visibility, large fleet",
        weaknesses: "High diagnostic dispatch fees ($89)",
        tactics: "Promote $0 Diagnostic Fee with repair agreement",
      },
      {
        businessId,
        name: "Quick Fix Handyman Services",
        pricing: "Mid-tier ($120/hr)",
        reviews: "4.2★ (28 reviews)",
        advantages: "Broad general service catalog",
        weaknesses: "Unlicensed for major drain or main line work",
        tactics: "Emphasize licensed master plumbing qualification",
      },
    ];

    const seeded: CompetitorData[] = [];
    for (const def of defaults) {
      const created = await this.create(def);
      seeded.push(created);
    }

    return seeded;
  }
}
