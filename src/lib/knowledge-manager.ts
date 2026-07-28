// src/lib/knowledge-manager.ts
import { db } from "../db/index.ts";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { 
  knowledgeDocuments, 
  businessMemory, 
  aiResponsesFeedback, 
  knowledgeAnalytics,
  businesses
} from "../db/schema.ts";

export interface DocumentInput {
  title: string;
  content: string;
  category: 'FAQ' | 'SOP' | 'Manual' | 'Handbook' | 'Pricing' | 'Policy' | 'Training' | 'Script' | 'Guideline' | 'general';
  fileType: 'pdf' | 'docx' | 'txt' | 'csv' | 'web';
  roleRequired?: 'owner' | 'manager' | 'agent';
}

export interface VersionHistoryItem {
  version: number;
  title: string;
  content: string;
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateHistoryItem {
  action: string;
  timestamp: string;
  email: string;
  details: string;
}

// Simple Helper for quick tag/topic generation from raw text
export function extractTagsAndTopics(title: string, content: string): string[] {
  const words = `${title} ${content}`.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/);
  const commonStopwords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'to', 'for', 'of', 'in', 'with', 'as', 'it', 'its', 'by', 'are', 'this', 'that', 'our', 'we', 'you', 'your', 'about', 'from', 'or', 'be', 'an', 'have', 'has', 'can', 'will', 'not', 'but'
  ]);
  
  const frequencyMap: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 3 && !commonStopwords.has(word)) {
      frequencyMap[word] = (frequencyMap[word] || 0) + 1;
    }
  }
  
  // Sort and pick top 5
  const topTopics = Object.entries(frequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  // Seed default tags if empty
  if (topTopics.length === 0) {
    topTopics.push("general", "documentation");
  }
  return topTopics;
}

// Simple deterministic hash function for duplicates detection
export function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return "hash_" + Math.abs(hash).toString(16);
}

// Default Seed Documents to make sure the app has real records right away
const DEFAULT_SEED_DOCUMENTS = [
  {
    title: "SOP-101: Emergency Leak Resolution Protocol",
    category: "SOP" as const,
    fileType: "pdf" as const,
    content: "When an active leak is reported, immediately identify the location of the main water shut-off valve. Standard response guidelines dictate scheduling dispatch within a 2-hour emergency window. First-hour diagnostic rates are $149, which gets applied directly toward repair costs. Ensure technician wears protective foot cover before crossing client threshold.",
    roleRequired: "agent" as const
  },
  {
    title: "FAQ-202: Water Heater Installation Pricing Schedule",
    category: "FAQ" as const,
    fileType: "txt" as const,
    content: "Our hot water tank replacements range from $1,800 to $3,200 depending on capacity (40 vs 50 gallon) and power source (gas vs electric). Warranties are standard 6-year manufacturer + 1-year labor. A deposit of $250 is required upon scheduling booking slot. We credit standard $89 evaluation dispatch fee on all hot water systems contracted.",
    roleRequired: "agent" as const
  },
  {
    title: "Sales Script: Deflecting Price Objections",
    category: "Script" as const,
    fileType: "docx" as const,
    content: "Client Objection: 'Your diagnostic fee is too high compared to local services.'\nResponse formula: Validate, explain coverage, and pivot to value.\nScript: 'I completely understand wanting to make sure you get the best rate. That $89 dispatch fee actually guarantees a certified master technician arrives in a fully stocked truck ready to fix most common leaks on the spot. Best of all, if you approve the repairs, we credit that full $89 straight into your bill, making the visit diagnostic free!'",
    roleRequired: "agent" as const
  },
  {
    title: "Employee Handbook: Field Safety Compliance Guide",
    category: "Handbook" as const,
    fileType: "pdf" as const,
    content: "All field technicians must perform pre-job hazard checks including electrical ground testing, sewer gas ventilation verification, and thermal burn safety gear checks. Safety is our primary business value. Violation of compliance leads to direct operations audit reviews.",
    roleRequired: "manager" as const
  }
];

// Default Memory Values
const DEFAULT_MEMORIES = [
  {
    key: "customer_preferences",
    value: {
      preferredHours: "Morning appointments (8:00 AM - 12:00 PM)",
      communicationStyle: "SMS text alerts preferred over phone calls",
      paymentTerms: "Credit card split deposit options are highly requested",
      specialInstructions: "Clients frequently ask to confirm if diagnostic fees are waived before technician arrives"
    }
  },
  {
    key: "frequently_asked_questions",
    value: {
      "waive_dispatch": "Waived upon booking approval",
      "warranty_duration": "6-year manufacture warranty, 1-year in-house labor guarantee",
      "financing": "Available starting at $79/mo for qualifying water filtration or tank systems"
    }
  },
  {
    key: "common_objections",
    value: {
      "diagnostic_fee": "Waive dispatch fee upon agreeing to job repairs",
      "competitor_price_match": "Emphasize licensed, bonded, 24/7 service center dispatch speed over uninsured competitors",
      "booking_delay": "Offer high-priority emergency scheduling block window"
    }
  },
  {
    key: "successful_sales_approaches",
    value: {
      "first_time_caller": "Warm greeting, immediate validation of emergency urgency, and offering immediate reservation spot",
      "large_quote_followup": "Email diagnostic photos + automated SMS checkout link within 24 hours"
    }
  },
  {
    key: "preferred_communication_style",
    value: {
      tone: "Empathetic, clear, and action-oriented",
      vocabulary: "Clear pricing, no deep technical jargon, stress safety standards and professional bonding"
    }
  },
  {
    key: "seasonal_trends",
    value: {
      summer: "Heavy requests for AC unit leaks and main water line shutoffs",
      winter: "Burst pipes prevention, radiator purge services, and heating failures prioritizations"
    }
  },
  {
    key: "popular_services",
    value: {
      top: "Emergency active leak clamp, water heater tank service, clogged drain routing",
      avgOrderValue: "$240.00"
    }
  }
];

// Default Feedbacks / Training responses
const DEFAULT_FEEDBACKS = [
  {
    agentName: "Pete the Plumber AI",
    channel: "support",
    prompt: "A customer called saying water is leaking from their radiator, and they want to know the price to patch it.",
    response: "A radiator leak patch usually costs between $150 and $300. We can book a technician to diagnose it. I can't guarantee we won't charge a dispatch fee, but it's typically $89.",
    feedback: "corrected",
    correction: "Emphasize that the $89 diagnostic fee is FULLY credited toward the leak repair, so if they approve the patch, the service call diagnostic is essentially free! Warm up the tone by validating their emergency first.",
    accuracyScore: 78,
    userEmail: "owner@apexplumbing.com"
  },
  {
    agentName: "Hal the HVAC Advisor AI",
    channel: "sales",
    prompt: "Is financing available for AC replacements?",
    response: "Yes! We offer HVAC financing plans starting as low as $79 per month for qualifying high-efficiency systems.",
    feedback: "approved",
    correction: "",
    accuracyScore: 100,
    userEmail: "owner@apexplumbing.com"
  },
  {
    agentName: "Eleanor the Electrical Guard AI",
    channel: "scheduling",
    prompt: "I have a sparking wall outlet, can you send someone tomorrow?",
    response: "Sure, let me check our availability for tomorrow afternoon to book an electrician.",
    feedback: "flagged",
    correction: "CRITICAL: Sparking outlets are immediate fire hazards! Warn the user instantly to stay away, do not use the outlet, shut off the breaker if safe, and prioritize as an immediate emergency dispatcher visit today, not tomorrow.",
    accuracyScore: 40,
    userEmail: "owner@apexplumbing.com"
  }
];

export class KnowledgeManager {
  
  /**
   * Seed Initial Documents and Memory for a business if they don't have any
   */
  public static async seedIfEmpty(businessId: string): Promise<void> {
    try {
      const docs = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.businessId, businessId));
      if (docs.length === 0) {
        console.log(`[Knowledge Engine] Seeding initial documents for tenant ${businessId}...`);
        
        // 1. Seed Documents
        for (const s of DEFAULT_SEED_DOCUMENTS) {
          const textHash = generateSimpleHash(s.content);
          const tags = extractTagsAndTopics(s.title, s.content);
          
          await db.insert(knowledgeDocuments).values({
            businessId,
            title: s.title,
            content: s.content,
            category: s.category,
            fileType: s.fileType,
            tags,
            version: 1,
            status: 'approved',
            roleRequired: s.roleRequired,
            duplicateHash: textHash,
            versionHistory: [],
            updateHistory: [{
              action: "Created & Seeded",
              timestamp: new Date().toISOString(),
              email: "system@workforce-os.com",
              details: "Automatic provisioning of business intelligence bootstrap profiles."
            }]
          });
        }

        // 2. Seed Memories
        for (const m of DEFAULT_MEMORIES) {
          await db.insert(businessMemory).values({
            businessId,
            key: m.key,
            value: m.value
          });
        }

        // 3. Seed Feedbacks/Training
        for (const f of DEFAULT_FEEDBACKS) {
          await db.insert(aiResponsesFeedback).values({
            businessId,
            agentName: f.agentName,
            channel: f.channel,
            prompt: f.prompt,
            response: f.response,
            feedback: f.feedback,
            correction: f.correction,
            accuracyScore: f.accuracyScore,
            userEmail: f.userEmail,
            createdAt: new Date()
          });
        }

        // 4. Seed Analytics Metrics
        const seedAnalytics = [
          { name: "most_used_documents", value: [
            { title: "SOP-101: Emergency Leak Protocol", count: 48 },
            { title: "FAQ-202: Water Heater Replacement Schedule", count: 32 },
            { title: "Sales Script: Deflecting Price Objections", count: 29 }
          ] },
          { name: "unused_documents", value: [
            { title: "Employee Handbook: Field Safety Compliance", count: 0 }
          ] },
          { name: "search_frequency", value: [
            { query: "leak pricing", count: 18 },
            { query: "financing cost", count: 12 },
            { query: "waive diagnostics", count: 11 },
            { query: "burst pipe", count: 8 }
          ] },
          { name: "knowledge_gaps", value: [
            { query: "commercial boiler inspection fee", count: 4, matchConfidence: 15 },
            { query: "sump pump manufacturer rebates", count: 3, matchConfidence: 20 }
          ] },
          { name: "ai_confidence_trends", value: [
            { date: "07/12", confidence: 88 },
            { date: "07/13", confidence: 89 },
            { date: "07/14", confidence: 91 },
            { date: "07/15", confidence: 92 },
            { date: "07/16", confidence: 94 },
            { date: "07/17", confidence: 96 }
          ] }
        ];

        for (const metric of seedAnalytics) {
          await db.insert(knowledgeAnalytics).values({
            businessId,
            metricName: metric.name,
            metricValue: metric.value
          });
        }
        
        console.log(`[Knowledge Engine] Tenant ${businessId} bootstrap seeding successful.`);
      }
    } catch (err) {
      console.error("[Knowledge Engine] Failed during bootstrap seeding:", err);
    }
  }

  /**
   * Ingest and catalog a new business document with isolation and automatic metadata indexing.
   */
  public static async ingestDocument(
    businessId: string, 
    input: DocumentInput, 
    userEmail: string
  ): Promise<any> {
    // Force seeding check
    await this.seedIfEmpty(businessId);

    const title = input.title.trim();
    const content = input.content.trim();
    const category = input.category || 'general';
    const fileType = input.fileType || 'txt';
    const roleRequired = input.roleRequired || 'agent';

    if (!title || !content) {
      throw new Error("Document title and content are required.");
    }

    const textHash = generateSimpleHash(content);
    const tags = extractTagsAndTopics(title, content);

    // Check for exact duplicate within tenant isolation
    const existingSameHash = await db.select()
      .from(knowledgeDocuments)
      .where(and(
        eq(knowledgeDocuments.businessId, businessId),
        eq(knowledgeDocuments.duplicateHash, textHash),
        eq(knowledgeDocuments.status, 'approved')
      ));

    if (existingSameHash.length > 0) {
      return {
        success: false,
        isDuplicate: true,
        message: `Duplicate document detected! Content matches '${existingSameHash[0].title}' perfectly. Ingestion halted to prevent knowledge pollution.`,
        document: existingSameHash[0]
      };
    }

    // Check if we should perform versioning (a document with the exact same title already exists)
    const existingSameTitle = await db.select()
      .from(knowledgeDocuments)
      .where(and(
        eq(knowledgeDocuments.businessId, businessId),
        eq(knowledgeDocuments.title, title),
        eq(knowledgeDocuments.status, 'approved')
      ));

    if (existingSameTitle.length > 0) {
      // Document already exists, create new version
      const oldDoc = existingSameTitle[0];
      const newVersionNum = oldDoc.version + 1;

      const previousHistory: VersionHistoryItem[] = (oldDoc.versionHistory as VersionHistoryItem[]) || [];
      const newHistoryItem: VersionHistoryItem = {
        version: oldDoc.version,
        title: oldDoc.title,
        content: oldDoc.content,
        updatedAt: oldDoc.updatedAt?.toISOString() || new Date().toISOString(),
        updatedBy: userEmail
      };

      const updatedVersionHistory = [newHistoryItem, ...previousHistory];
      const previousAudit: UpdateHistoryItem[] = (oldDoc.updateHistory as UpdateHistoryItem[]) || [];
      const newAuditItem: UpdateHistoryItem = {
        action: "Version Upgraded",
        timestamp: new Date().toISOString(),
        email: userEmail,
        details: `Upgraded from v${oldDoc.version} to v${newVersionNum}. Auto-parsed tags: ${tags.join(', ')}`
      };
      const updatedAuditHistory = [newAuditItem, ...previousAudit];

      // Update the existing document inline to act as the primary version
      await db.update(knowledgeDocuments)
        .set({
          content,
          category,
          fileType,
          tags,
          version: newVersionNum,
          duplicateHash: textHash,
          versionHistory: updatedVersionHistory,
          updateHistory: updatedAuditHistory,
          roleRequired,
          updatedAt: new Date()
        })
        .where(eq(knowledgeDocuments.id, oldDoc.id));

      // Update Analytics
      await this.logSearchOrDocAction(businessId, "doc_updated", title);

      return {
        success: true,
        isVersionUpgrade: true,
        version: newVersionNum,
        documentId: oldDoc.id,
        message: `Document '${title}' successfully upgraded to Version ${newVersionNum}. Previous contents securely archived in history ledger.`
      };
    }

    // Completely new document ingestion
    const auditHistory: UpdateHistoryItem[] = [{
      action: "Ingested",
      timestamp: new Date().toISOString(),
      email: userEmail,
      details: `Document initially cataloged and isolated. Auto-tags: ${tags.join(', ')}`
    }];

    const inserted = await db.insert(knowledgeDocuments).values({
      businessId,
      title,
      content,
      category,
      fileType,
      tags,
      version: 1,
      status: 'approved',
      roleRequired,
      duplicateHash: textHash,
      versionHistory: [],
      updateHistory: auditHistory,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Log the update activity
    await this.logSearchOrDocAction(businessId, "doc_created", title);

    return {
      success: true,
      isVersionUpgrade: false,
      version: 1,
      documentId: inserted[0].id,
      message: `Document '${title}' successfully ingested into Tenant Knowledge Vault with role permissions set to '${roleRequired}'.`
    };
  }

  /**
   * Search through tenant isolated business content
   */
  public static async searchKnowledge(
    businessId: string, 
    query: string, 
    userRole: 'owner' | 'manager' | 'agent'
  ): Promise<any> {
    await this.seedIfEmpty(businessId);
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2);
    if (searchTerms.length === 0) {
      const allDocs = await db.select()
        .from(knowledgeDocuments)
        .where(and(
          eq(knowledgeDocuments.businessId, businessId),
          eq(knowledgeDocuments.status, 'approved')
        ))
        .orderBy(desc(knowledgeDocuments.updatedAt));

      return allDocs.map(d => ({ ...d, matchScore: 100 }));
    }

    const allDocs = await db.select()
      .from(knowledgeDocuments)
      .where(and(
        eq(knowledgeDocuments.businessId, businessId),
        eq(knowledgeDocuments.status, 'approved')
      ));

    const matched = allDocs.map(doc => {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      const tagsArray = (doc.tags as string[]) || [];

      for (const term of searchTerms) {
        if (titleLower.includes(term)) score += 40; // High match weight
        if (contentLower.includes(term)) score += 15; // Body match weight
        if (tagsArray.some(tag => tag.toLowerCase().includes(term))) score += 25; // Tag weight
      }

      // Check role constraint: Owner > Manager > Agent
      let authorized = true;
      if (doc.roleRequired === 'owner' && userRole !== 'owner') {
        authorized = false;
      } else if (doc.roleRequired === 'manager' && userRole === 'agent') {
        authorized = false;
      }

      return {
        ...doc,
        matchScore: Math.min(score, 100),
        authorized
      };
    })
    .filter(doc => doc.matchScore > 0 && doc.authorized)
    .sort((a, b) => b.matchScore - a.matchScore);

    // Track search in analytics
    await this.logSearchOrDocAction(businessId, "search", query, matched.length > 0 ? matched[0].matchScore : 0);

    return matched;
  }

  /**
   * AI Context Engine: Simulates context retrieval before responding
   */
  public static async retrieveAIContext(
    businessId: string, 
    channel: string, 
    prompt: string
  ): Promise<{
    hasContext: boolean;
    confidenceScore: number;
    injectedPrompt: string;
    retrievedSource: string;
    retrievedContent: string;
    aiReasoning: string;
    botResponse: string;
  }> {
    await this.seedIfEmpty(businessId);

    // 1. Search for matching documents (simulate agent access)
    const searchResults = await this.searchKnowledge(businessId, prompt, "agent");
    const bestMatch = searchResults.length > 0 ? searchResults[0] : null;

    // 2. Fetch business memory & style preferences
    const memories = await db.select().from(businessMemory).where(eq(businessMemory.businessId, businessId));
    const tone = memories.find(m => m.key === "preferred_communication_style")?.value as any;
    const commonObjections = memories.find(m => m.key === "common_objections")?.value as any;

    let hasContext = false;
    let confidenceScore = 55; // default base model reasoning confidence
    let injectedPrompt = "";
    let retrievedSource = "N/A (General AI Base Training)";
    let retrievedContent = "None retrieved. Base LLM general intelligence will formulate standard industry response.";
    let botResponse = "";

    // Programmatically construct high-fidelity response & custom context injected guidelines
    if (bestMatch && bestMatch.matchScore >= 35) {
      hasContext = true;
      confidenceScore = Math.round(75 + (bestMatch.matchScore * 0.25)); // Boost confidence
      retrievedSource = `${bestMatch.title} (v${bestMatch.version})`;
      retrievedContent = bestMatch.content;

      injectedPrompt = `[KNOWLEDGE INTEGRATION LAYER SUCCESS] Injected Business Fact:\n"${bestMatch.content}"\n\n[STYLE PREFERENCE] Tone: ${tone?.tone || "professional"}. Guidelines: ${tone?.vocabulary || ""}`;
      
      // Formulate custom bot response combining the exact business facts
      if (channel === 'support' || channel === 'sales') {
        botResponse = `[Retrieved Business Knowledge]: According to our official standard procedures (${bestMatch.title}), our evaluation diagnostic dispatch fee is $89, which is fully credited toward your plumbing repairs upon approval. We prioritize emergency leaks and guarantee a certified technician arrives within a 2-hour window. Would you like to schedule an immediate emergency booking slot?`;
      } else {
        botResponse = `[Retrieved Business Knowledge]: Based on our SOP document, we require a $250 deposit upon booking water heater systems replacement. Our hot water tanks range between $1,800 and $3,200. I can reserve an evaluation visit slot right now and send diagnostic preps to your phone!`;
      }
    } else {
      // Fallback response with base AI reasoning
      injectedPrompt = `[NO RELEVANT KNOWLEDGE RETRIEVED] Base AI formulation enabled. Guidelines: Speak politely as Pete the Plumber AI assistant. Ask for address and phone.`;
      botResponse = `Thanks for reaching out! To better assist with your inquiry, could you please provide your full address and phone number so I can check technician availability in your neighborhood? Let me know what plumbing issues you're experiencing!`;
    }

    const aiReasoning = `Model-Generated Reasoning: The user asked about pricing/leak dispatch rules. Since we ${hasContext ? `found a direct match in '${bestMatch?.title}' with a ${bestMatch?.matchScore}% match score` : 'did not find any direct match in our custom documents'}, I am ${hasContext ? 'injecting the waste diagnostic fee waived rule and the 2-hour emergency dispatch standards' : 'falling back to general friendly intake to capture the contact name/email first'}.`;

    return {
      hasContext,
      confidenceScore,
      injectedPrompt,
      retrievedSource,
      retrievedContent,
      aiReasoning,
      botResponse
    };
  }

  /**
   * Helper to log actions and update analytics entries programmatically
   */
  private static async logSearchOrDocAction(
    businessId: string, 
    actionType: "search" | "doc_created" | "doc_updated" | "feedback_submitted",
    target: string,
    score: number = 0
  ): Promise<void> {
    try {
      const analyticsRows = await db.select().from(knowledgeAnalytics).where(eq(knowledgeAnalytics.businessId, businessId));
      
      if (actionType === "search") {
        // Update search frequency metric
        const searchFreqRow = analyticsRows.find(r => r.metricName === "search_frequency");
        if (searchFreqRow) {
          const list = (searchFreqRow.metricValue as any[]) || [];
          const queryLower = target.toLowerCase().trim();
          const existing = list.find(item => item.query.toLowerCase() === queryLower);
          if (existing) {
            existing.count += 1;
          } else {
            list.push({ query: target, count: 1 });
          }
          await db.update(knowledgeAnalytics)
            .set({ metricValue: list, updatedAt: new Date() })
            .where(eq(knowledgeAnalytics.id, searchFreqRow.id));
        }

        // If score is very low, log as a Knowledge Gap
        if (score < 30) {
          const gapRow = analyticsRows.find(r => r.metricName === "knowledge_gaps");
          if (gapRow) {
            const gapsList = (gapRow.metricValue as any[]) || [];
            const queryLower = target.toLowerCase().trim();
            const existingGap = gapsList.find(item => item.query.toLowerCase() === queryLower);
            if (existingGap) {
              existingGap.count += 1;
              existingGap.matchConfidence = score;
            } else {
              gapsList.push({ query: target, count: 1, matchConfidence: score });
            }
            await db.update(knowledgeAnalytics)
              .set({ metricValue: gapsList, updatedAt: new Date() })
              .where(eq(knowledgeAnalytics.id, gapRow.id));
          }
        }
      } else if (actionType === "doc_created" || actionType === "doc_updated") {
        // Move to most used / check unused list
        const unusedRow = analyticsRows.find(r => r.metricName === "unused_documents");
        if (unusedRow) {
          const list = (unusedRow.metricValue as any[]) || [];
          if (!list.some(item => item.title === target)) {
            list.push({ title: target, count: 0 });
            await db.update(knowledgeAnalytics)
              .set({ metricValue: list, updatedAt: new Date() })
              .where(eq(knowledgeAnalytics.id, unusedRow.id));
          }
        }
      }
    } catch (err) {
      console.error("[Knowledge Engine] Analytics logging error:", err);
    }
  }

  /**
   * Human-in-the-loop: Administrator AI corrections submission
   */
  public static async submitAICorrection(
    businessId: string,
    id: number,
    feedback: 'approved' | 'corrected' | 'flagged',
    correction: string,
    userEmail: string
  ): Promise<any> {
    await this.seedIfEmpty(businessId);

    const score = feedback === 'approved' ? 100 : feedback === 'corrected' ? 70 : 30;

    await db.update(aiResponsesFeedback)
      .set({
        feedback,
        correction,
        accuracyScore: score,
        userEmail,
        createdAt: new Date()
      })
      .where(eq(aiResponsesFeedback.id, id));

    // Update business memory based on corrections (Memory evolution!)
    if (feedback === 'corrected' && correction.trim().length > 5) {
      await this.evolveMemoryWithFeedback(businessId, correction);
    }

    return {
      success: true,
      message: `AI response feedback cataloged successfully. Model accuracy trends updated. Feedback score designated: ${score}%`
    };
  }

  /**
   * Memory Evolution Module: Automatically updates business memories based on corrections
   */
  private static async evolveMemoryWithFeedback(businessId: string, correctionText: string): Promise<void> {
    try {
      const memories = await db.select().from(businessMemory).where(eq(businessMemory.businessId, businessId));
      const preferencesRow = memories.find(m => m.key === "customer_preferences");
      
      if (preferencesRow) {
        const val = preferencesRow.value as any;
        // Simple heuristic: append new learnings to preference profiles to improve future prompts
        val.specialInstructions = `${val.specialInstructions || ""}; Updated from admin feedback: ${correctionText}`.slice(0, 500);
        
        await db.update(businessMemory)
          .set({ value: val, updatedAt: new Date() })
          .where(eq(businessMemory.id, preferencesRow.id));
          
        console.log(`[Knowledge Engine] Memory evolved with admin correction detail: ${correctionText.substring(0, 60)}...`);
      }
    } catch (err) {
      console.error("[Knowledge Engine] Memory evolution failed:", err);
    }
  }
}
