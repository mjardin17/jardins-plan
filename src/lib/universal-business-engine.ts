// src/lib/universal-business-engine.ts
import {
  OnboardingAnswers,
  StructuredBusinessProfile,
  FactEntry,
  FactSource,
  FactVerificationStatus,
  BusinessMaturityAssessment,
  DimensionAssessment,
  MaturityDimensionKey,
  MaturityStage,
  OpportunityItem,
  RecommendedWorker,
  ReusableWorkerRole,
  CapabilityStatus
} from '../types/universal-onboarding.ts';
import { getIndustryPack } from './industry-packs.ts';

// Helper to create owner-provided fact entry
function ownerFact<T>(val: T): FactEntry<T> {
  return {
    value: val,
    source: 'owner_provided',
    confidence: 1.0,
    status: 'confirmed'
  };
}

// Helper to create AI-inferred fact entry
function inferredFact<T>(val: T, confidence = 0.75, notes?: string): FactEntry<T> {
  return {
    value: val,
    source: 'ai_inferred',
    confidence,
    status: 'needs_confirmation',
    notes
  };
}

// =========================================================
// 1. BUSINESS PROFILE ENGINE
// =========================================================

export function buildBusinessProfile(answersInput?: Partial<OnboardingAnswers>): StructuredBusinessProfile {
  const answers: Partial<OnboardingAnswers> = answersInput || {};
  const profileId = `biz_prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const painPoints = answers.painPoints || [];
  const systemsUsed = answers.systemsUsed || [];
  const goals = answers.goals || [];
  const discoveryChannels = answers.customerDiscoveryMethods || [];
  const contactMethods = answers.customerContactMethods || [];
  const actionsRequiringApproval = answers.actionsRequiringApproval || [];
  const forbiddenConnections = answers.forbiddenConnections || [];
  const businessModel = answers.businessModel || ['Services'];

  // AI Inferences derived strictly from observations without blending with owner facts
  const aiInferences: StructuredBusinessProfile['aiInferences'] = [];

  // Observation 1: Automation opportunity
  if (painPoints.includes('Too much repetitive work') || painPoints.includes('Slow customer replies')) {
    aiInferences.push({
      id: 'inf_1',
      fieldKey: 'automationPotential',
      label: 'High Repeatability Potential',
      inferredValue: 'Substantial manual workflow friction identified in daily customer touchpoints.',
      rationale: 'Owner reported pain points around repetitive tasks and response delays.',
      confidence: 0.88,
      status: 'needs_confirmation'
    });
  }

  // Observation 2: System Integration Gaps
  if (systemsUsed.includes('Spreadsheets') || systemsUsed.includes('Paper or manual processes')) {
    aiInferences.push({
      id: 'inf_2',
      fieldKey: 'dataSiloRisk',
      label: 'Manual Data Silo Friction',
      inferredValue: 'Business relies on disconnected manual records or spreadsheets.',
      rationale: 'Systems list includes manual paper/spreadsheet tracking without API sync.',
      confidence: 0.92,
      status: 'needs_confirmation'
    });
  }

  // Observation 3: After-hours capture risk
  if (painPoints.includes('Missed calls') || painPoints.includes('Scheduling problems')) {
    aiInferences.push({
      id: 'inf_3',
      fieldKey: 'afterHoursRevenueLeak',
      label: 'Revenue Leakage via Unanswered Calls',
      inferredValue: 'Inbound inquiries during peak hours or after-hours are lost to competitors.',
      rationale: 'Reported missed calls as a primary operational bottleneck.',
      confidence: 0.85,
      status: 'needs_confirmation'
    });
  }

  // Calculate completeness score
  let filledFields = 0;
  const checkFields = [
    answers.businessName, answers.ownerName, answers.industry, answers.stage,
    answers.productsServicesOffered, answers.typicalCustomer, answers.monthlyBudgetRange
  ];
  checkFields.forEach(f => { if (f && typeof f === 'string' && f.trim().length > 0) filledFields++; });
  if (systemsUsed.length > 0) filledFields++;
  if (painPoints.length > 0) filledFields++;
  if (goals.length > 0) filledFields++;

  const profileCompletionPct = Math.round((filledFields / 10) * 100);

  const profile: StructuredBusinessProfile = {
    id: profileId,
    createdAt: now,
    updatedAt: now,

    identity: {
      name: ownerFact(answers.businessName || 'Unnamed Business'),
      owner: ownerFact(answers.ownerName || 'Business Owner'),
      description: ownerFact(answers.businessDescription || 'No description provided'),
      industry: ownerFact(answers.industry || 'General Business'),
      subIndustry: ownerFact(answers.subIndustrySpecialty || 'General'),
      location: ownerFact(answers.location || 'Not Specified'),
      serviceArea: ownerFact(answers.serviceArea || 'Local'),
      website: ownerFact(answers.website || 'None'),
      email: ownerFact(answers.email || 'None'),
      phone: ownerFact(answers.phone || 'None'),
      yearsOperating: ownerFact(answers.yearsOperating || '0')
    },

    stage: ownerFact(answers.stage || 'Established solo business'),
    models: ownerFact(businessModel),

    operations: {
      productsServices: ownerFact(answers.productsServicesOffered || 'General services'),
      targetCustomer: ownerFact(answers.typicalCustomer || 'General public'),
      discoveryChannels: ownerFact(discoveryChannels),
      contactMethods: ownerFact(contactMethods),
      salesProcess: ownerFact(answers.salesBookingProcess || 'Direct inquiries'),
      paymentMethods: ownerFact(answers.paymentCollectionMethod || 'Credit card / Invoice'),
      schedulingMethod: ownerFact(answers.schedulingProcess || 'Manual scheduling'),
      followUpMethod: ownerFact(answers.customerFollowUpMethod || 'Manual follow-up'),
      inventoryMethod: ownerFact(answers.inventoryHandling || 'Manual tracking'),
      marketingMethod: ownerFact(answers.marketingHandling || 'Word of mouth'),
      recordMethod: ownerFact(answers.recordStorageMethod || 'Spreadsheets'),
      teamSize: ownerFact(answers.teamSizeCount || '1')
    },

    systems: ownerFact(systemsUsed),
    painPoints: ownerFact(painPoints),
    goals: ownerFact(goals),

    constraints: {
      budget: ownerFact(answers.monthlyBudgetRange || '$100 - $300'),
      techComfort: ownerFact(answers.techComfortLevel || 'Medium'),
      automationLevel: ownerFact(answers.preferredAutomationLevel || 'Human-in-the-loop Approval'),
      approvalBoundary: ownerFact(actionsRequiringApproval),
      forbiddenSystems: ownerFact(forbiddenConnections),
      immediatePriority: ownerFact(answers.immediatePriority || 'Save time and increase efficiency'),
      timeline: ownerFact(answers.desiredTimeline || 'Immediate')
    },

    aiInferences,
    profileCompletionPct
  };

  return profile;
}

// Update profile fact (Owner confirmation / edit interface)
export function updateProfileFact(
  profile: StructuredBusinessProfile,
  fieldPath: string,
  newValue: any,
  status: FactVerificationStatus = 'confirmed'
): StructuredBusinessProfile {
  const updated = JSON.parse(JSON.stringify(profile)) as StructuredBusinessProfile;
  updated.updatedAt = new Date().toISOString();

  // If path refers to an inference in aiInferences
  const inference = updated.aiInferences.find(i => i.id === fieldPath || i.fieldKey === fieldPath);
  if (inference) {
    inference.status = status;
    if (newValue !== undefined) {
      inference.inferredValue = String(newValue);
    }
    return updated;
  }

  // Handle direct profile updates
  if (fieldPath === 'identity.name') updated.identity.name = { value: newValue, source: 'owner_provided', confidence: 1.0, status };
  else if (fieldPath === 'identity.industry') updated.identity.industry = { value: newValue, source: 'owner_provided', confidence: 1.0, status };
  else if (fieldPath === 'identity.phone') updated.identity.phone = { value: newValue, source: 'owner_provided', confidence: 1.0, status };

  return updated;
}

// =========================================================
// 2. BUSINESS MATURITY ASSESSMENT
// =========================================================

export function assessBusinessMaturity(profile: StructuredBusinessProfile): BusinessMaturityAssessment {
  const systems = profile?.systems?.value || [];
  const painPoints = profile?.painPoints?.value || [];
  const teamSize = profile?.operations?.teamSize?.value || '1';
  const stage = profile?.stage?.value || 'Established solo business';
  const recordMethod = (profile?.operations?.recordMethod?.value || '').toLowerCase();
  const inventoryMethod = (profile?.operations?.inventoryMethod?.value || '').toLowerCase();
  const schedulingMethod = (profile?.operations?.schedulingMethod?.value || '').toLowerCase();
  const discoveryChannels = profile?.operations?.discoveryChannels?.value || [];
  const contactMethods = profile?.operations?.contactMethods?.value || [];
  const goals = profile?.goals?.value || [];

  const dims: Record<MaturityDimensionKey, DimensionAssessment> = {
    foundation: {
      key: 'foundation',
      title: 'Business Foundation',
      stage: stage === 'Enterprise' || stage === 'Growing company' ? 'Organized' : 'Basic',
      scorePct: stage === 'Enterprise' ? 90 : stage === 'Growing company' ? 75 : 55,
      evidence: `Operating stage declared as "${stage}" with team size "${teamSize}".`,
      mainWeakness: stage === 'Idea' || stage === 'New business' ? 'Unproven operational history' : 'High reliance on key personnel',
      recommendedNextStep: 'Formalize standard operational playbooks and role descriptions.',
      confidence: 0.9
    },

    customerAcquisition: {
      key: 'customerAcquisition',
      title: 'Customer Acquisition',
      stage: discoveryChannels.length > 2 ? 'Organized' : 'Basic',
      scorePct: discoveryChannels.length > 2 ? 70 : 45,
      evidence: `Sourcing leads through ${discoveryChannels.join(', ') || 'organic channels'}.`,
      mainWeakness: painPoints.includes('Lack of leads') ? 'Lead acquisition volume is volatile and unoptimized.' : 'Reliance on word-of-mouth without structured outbound marketing.',
      recommendedNextStep: 'Deploy automated lead capture widgets and speed-to-lead instant response.',
      confidence: 0.85
    },

    salesProcess: {
      key: 'salesProcess',
      title: 'Sales Process',
      stage: systems.includes('CRM') || systems.includes('Point-of-sale system') ? 'Partially automated' : 'Manual',
      scorePct: systems.includes('CRM') ? 75 : 40,
      evidence: `Sales process recorded: "${profile?.operations?.salesProcess?.value || 'Direct inquiries'}".`,
      mainWeakness: painPoints.includes('Low sales') || painPoints.includes('Slow customer replies') ? 'Slow conversion velocity and manual follow-up delays.' : 'Inconsistent sales follow-up frequency.',
      recommendedNextStep: 'Implement multi-touch automated follow-up sequences for open quotes.',
      confidence: 0.88
    },

    customerCommunication: {
      key: 'customerCommunication',
      title: 'Customer Communication',
      stage: painPoints.includes('Missed calls') ? 'Manual' : 'Basic',
      scorePct: painPoints.includes('Missed calls') ? 35 : 60,
      evidence: `Contact channels: ${contactMethods.join(', ') || 'Phone/Email'}.`,
      mainWeakness: painPoints.includes('Missed calls') ? 'High volume of missed calls during peak operating hours.' : 'Delayed message response windows.',
      recommendedNextStep: 'Activate 24/7 AI Receptionist for immediate call/SMS answering.',
      confidence: 0.92
    },

    operations: {
      key: 'operations',
      title: 'Operations',
      stage: painPoints.includes('Too much repetitive work') ? 'Manual' : 'Organized',
      scorePct: painPoints.includes('Too much repetitive work') ? 40 : 65,
      evidence: `Operations handled with team size ${teamSize}.`,
      mainWeakness: 'Repetitive manual tasks consume owner time.',
      recommendedNextStep: 'Delegate routine administrative workflows to specialized AI Assistants.',
      confidence: 0.85
    },

    scheduling: {
      key: 'scheduling',
      title: 'Scheduling & Dispatch',
      stage: systems.includes('Scheduling software') || schedulingMethod.includes('opentable') || schedulingMethod.includes('servicetitan') ? 'Partially automated' : 'Manual',
      scorePct: systems.includes('Scheduling software') ? 70 : 35,
      evidence: `Scheduling method: "${profile?.operations?.schedulingMethod?.value || 'Manual'}".`,
      mainWeakness: painPoints.includes('Scheduling problems') ? 'Manual double-booking or delayed appointment booking.' : 'Lack of instant self-service booking options.',
      recommendedNextStep: 'Integrate automated scheduling agent synced with master calendar.',
      confidence: 0.90
    },

    inventory: {
      key: 'inventory',
      title: 'Inventory & Stock',
      stage: systems.includes('Inventory system') ? 'Organized' : inventoryMethod.includes('backlog') || painPoints.includes('Inventory problems') ? 'Manual' : 'Basic',
      scorePct: systems.includes('Inventory system') ? 75 : 35,
      evidence: `Inventory handling: "${profile?.operations?.inventoryMethod?.value || 'Manual'}".`,
      mainWeakness: inventoryMethod.includes('unlisted') || painPoints.includes('Inventory problems') ? 'Unlisted inventory backlog or manual stock reconciliation.' : 'Lack of real-time inventory synchronization.',
      recommendedNextStep: 'Deploy AI Inventory & Draft Listing Assistant.',
      confidence: 0.88
    },

    financialOrganization: {
      key: 'financialOrganization',
      title: 'Financial Organization',
      stage: systems.includes('Accounting software') && systems.includes('Payment processor') ? 'Organized' : 'Basic',
      scorePct: systems.includes('Accounting software') ? 75 : 50,
      evidence: `Payment method: "${profile?.operations?.paymentMethods?.value || 'Standard'}".`,
      mainWeakness: 'Manual invoice tracking or reconciliation delays.',
      recommendedNextStep: 'Connect payment gateway to automated bookkeeping ledger.',
      confidence: 0.85
    },

    marketing: {
      key: 'marketing',
      title: 'Marketing & Reviews',
      stage: painPoints.includes('Marketing inconsistency') ? 'Manual' : 'Basic',
      scorePct: painPoints.includes('Marketing inconsistency') ? 35 : 55,
      evidence: `Marketing handling: "${profile?.operations?.marketingMethod?.value || 'Organic'}".`,
      mainWeakness: 'Inconsistent campaign publishing and uncollected review opportunities.',
      recommendedNextStep: 'Launch automated review generation & social content creation agents.',
      confidence: 0.82
    },

    technology: {
      key: 'technology',
      title: 'Technology Integration',
      stage: systems.length >= 4 ? 'Partially automated' : 'Basic',
      scorePct: Math.min(85, Math.max(20, systems.length * 15)),
      evidence: `Connected software list count: ${systems.length}.`,
      mainWeakness: 'Disconnected software tools operating in silos.',
      recommendedNextStep: 'Unify current tools through centralized API integration layer.',
      confidence: 0.90
    },

    automation: {
      key: 'automation',
      title: 'Automation Maturity',
      stage: profile?.constraints?.automationLevel?.value === 'High Autonomous Operations' ? 'Partially automated' : 'Basic',
      scorePct: profile?.constraints?.automationLevel?.value === 'High Autonomous Operations' ? 65 : 40,
      evidence: `Preferred automation level: "${profile?.constraints?.automationLevel?.value || 'Human-in-the-loop Approval'}".`,
      mainWeakness: 'Lack of event-driven autonomous background workflows.',
      recommendedNextStep: 'Deploy initial human-in-the-loop autonomous workers.',
      confidence: 0.92
    },

    reporting: {
      key: 'reporting',
      title: 'Reporting & Analytics',
      stage: recordMethod.includes('pos') || recordMethod.includes('servicetitan') ? 'Organized' : 'Manual',
      scorePct: recordMethod.includes('excel') || recordMethod.includes('paper') ? 35 : 65,
      evidence: `Record storage: "${profile?.operations?.recordMethod?.value || 'Spreadsheets'}".`,
      mainWeakness: 'Lack of real-time executive dashboard summarizing revenue & productivity metrics.',
      recommendedNextStep: 'Set up automated weekly performance summary reports.',
      confidence: 0.85
    },

    ownerDependency: {
      key: 'ownerDependency',
      title: 'Owner Dependency',
      stage: painPoints.includes('Too much owner involvement') || teamSize === '1' ? 'Manual' : 'Organized',
      scorePct: teamSize === '1' ? 30 : 65,
      evidence: `Team structure size: ${teamSize}. Owner involvement level high.`,
      mainWeakness: 'Business operations stall when the owner is away or busy.',
      recommendedNextStep: 'Offload routine phone, scheduling, and follow-up tasks to AI Workforce.',
      confidence: 0.94
    },

    growthReadiness: {
      key: 'growthReadiness',
      title: 'Growth Readiness',
      stage: 'Basic',
      scorePct: 50,
      evidence: `Primary goals include: ${goals.join(', ') || 'Increase revenue'}.`,
      mainWeakness: 'Operational bottlenecks restrict capacity for scaling volume.',
      recommendedNextStep: 'Remove operational friction before scaling marketing acquisition.',
      confidence: 0.85
    }
  };

  const scores = Object.values(dims).map(d => d.scorePct);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let overallStage: MaturityStage = 'Basic';
  if (avgScore < 40) overallStage = 'Manual';
  else if (avgScore < 60) overallStage = 'Basic';
  else if (avgScore < 75) overallStage = 'Organized';
  else if (avgScore < 88) overallStage = 'Partially automated';
  else overallStage = 'Optimized';

  return {
    dimensions: dims,
    overallStage,
    overallScorePct: avgScore,
    summary: `Business evaluated at "${overallStage}" stage (${avgScore}% operational maturity). Primary focus areas: resolving owner bottlenecks and automating customer touchpoints.`
  };
}

// =========================================================
// 3. BOTTLENECK & OPPORTUNITY ENGINE
// =========================================================

export function identifyOpportunities(
  profile: StructuredBusinessProfile,
  maturity: BusinessMaturityAssessment
): OpportunityItem[] {
  const painPoints = profile?.painPoints?.value || [];
  const goals = profile?.goals?.value || [];
  const systems = profile?.systems?.value || [];
  const industry = (profile?.identity?.industry?.value || '').toLowerCase();
  const opportunities: OpportunityItem[] = [];

  // Opportunity 1: Missed Call & Instant Intake Response
  if (painPoints.includes('Missed calls') || painPoints.includes('Slow customer replies') || painPoints.length === 0) {
    opportunities.push({
      id: 'opp_missed_calls',
      title: '24/7 Instant Inbound Response & AI Receptionist',
      category: 'Customer Acquisition & Service',
      observation: 'Inbound phone calls and website messages are delayed or go to voicemail during peak hours.',
      whyItMatters: 'Up to 78% of customers buy from the business that responds first. Missed calls equal lost revenue.',
      evidence: `Owner reported pain points: "${painPoints.length > 0 ? painPoints.filter(p => p.includes('calls') || p.includes('replies')).join(', ') : 'Slow response friction'}".`,
      proposedImprovement: 'Deploy 24/7 AI Receptionist with instant SMS call-back and automated appointment intake.',
      expectedBenefit: 'Recover 30-50% of lost inbound leads without hiring additional front-desk staff.',
      requiredSystems: ['Twilio / Phone System', 'Google Calendar / POS'],
      humanApprovalRequired: false,
      capabilityStatus: 'VERIFIED WORKING',
      externalIntegrationRequired: true,
      verifiedWorking: true,
      rank: 1,
      impactScore: 9,
      difficultyScore: 3,
      disclaimer: 'Voice capabilities depend on active telephony carrier setup.'
    });
  }

  // Opportunity 2: Unlisted Inventory / Draft Listing Automation (Resale / E-Commerce)
  if (industry.includes('resale') || industry.includes('e-commerce') || painPoints.includes('Inventory problems') || painPoints.includes('Too much repetitive work')) {
    opportunities.push({
      id: 'opp_inventory_drafting',
      title: 'Automated Item Listing & Inventory Backlog Clearance',
      category: 'Operational Efficiency',
      observation: 'Physical inventory sits unlisted due to the high time required for photography, title writing, and price research.',
      whyItMatters: 'Unlisted inventory represents tied-up working capital that earns zero return.',
      evidence: `Inventory method: "${profile?.operations?.inventoryMethod?.value || 'Manual'}". Pain point: "${painPoints.join(', ')}".`,
      proposedImprovement: 'Use AI Vision & Listing Assistant to generate drafted marketplace titles, descriptions, and price suggestions from photo uploads.',
      expectedBenefit: 'Reduce listing creation time by 80%, unlocking hidden inventory capital.',
      requiredSystems: ['eBay API / Marketplace Platform', 'Camera Upload'],
      humanApprovalRequired: true,
      capabilityStatus: 'IMPLEMENTED BUT UNTESTED',
      externalIntegrationRequired: true,
      verifiedWorking: false,
      rank: 2,
      impactScore: 9,
      difficultyScore: 4,
      disclaimer: 'Listing publications require final owner approval before posting.'
    });
  }

  // Opportunity 3: Customer Lead Follow-Up Automation
  if (painPoints.includes('Poor follow-up') || painPoints.includes('Lack of leads') || goals.includes('Increase revenue') || opportunities.length < 2) {
    opportunities.push({
      id: 'opp_lead_followup',
      title: 'Automated Multi-Channel Lead Nurturing & Re-engagement',
      category: 'Sales Conversion',
      observation: 'Open estimates and past inquiries receive limited or zero systematic follow-up.',
      whyItMatters: 'Follow-up within 24 hours increases quote acceptance rates by over 40%.',
      evidence: `Follow-up method: "${profile?.operations?.followUpMethod?.value || 'Manual'}".`,
      proposedImprovement: 'Implement automated email/SMS follow-up drips triggered by lead status changes.',
      expectedBenefit: 'Increase lead-to-sale conversion rate by 15-25%.',
      requiredSystems: ['CRM / Email Service', 'Twilio SMS'],
      humanApprovalRequired: true,
      capabilityStatus: 'VERIFIED WORKING',
      externalIntegrationRequired: false,
      verifiedWorking: true,
      rank: 3,
      impactScore: 8,
      difficultyScore: 3
    });
  }

  // Opportunity 4: Automated Review Collection & Reputation Growth
  if (goals.includes('Build an online presence') || goals.includes('Improve customer service') || industry.includes('restaurant') || industry.includes('plumb') || opportunities.length < 3) {
    opportunities.push({
      id: 'opp_review_management',
      title: 'Automated Review Request & Sentiment Management',
      category: 'Marketing & Reputation',
      observation: 'Satisfied customers rarely leave public online reviews unless proactively prompted.',
      whyItMatters: 'Higher star ratings and review counts directly drive local search visibility.',
      evidence: `Marketing method: "${profile?.operations?.marketingMethod?.value || 'Organic'}".`,
      proposedImprovement: 'Trigger automated post-transaction review requests via SMS with AI review response drafts.',
      expectedBenefit: 'Generate 3x-5x more positive 5-star Google reviews monthly.',
      requiredSystems: ['Google Business Profile API', 'SMS Gateway'],
      humanApprovalRequired: true,
      capabilityStatus: 'VERIFIED WORKING',
      externalIntegrationRequired: true,
      verifiedWorking: true,
      rank: 4,
      impactScore: 8,
      difficultyScore: 2
    });
  }

  // Opportunity 5: Strategic Business Growth & Executive Analysis
  opportunities.push({
    id: 'opp_strategic_advisor',
    title: 'Autonomous Executive Business Advisor & KPI Tracking',
    category: 'Strategic Planning',
    observation: 'The business owner spends time on low-value operational tasks rather than high-level strategic growth.',
    whyItMatters: 'Without strategic direction, small businesses stall at plateau revenue thresholds.',
    evidence: `Operating stage: "${profile?.stage?.value || 'Established'}". Owner dependency score high.`,
    proposedImprovement: 'Deploy Business Growth Advisor to run automated weekly performance audits and strategic roadmap updates.',
    expectedBenefit: 'Provides actionable executive strategy and weekly operational clarity.',
    requiredSystems: ['AI Workforce Platform'],
    humanApprovalRequired: false,
    capabilityStatus: 'VERIFIED WORKING',
    externalIntegrationRequired: false,
    verifiedWorking: true,
    rank: 5,
    impactScore: 9,
    difficultyScore: 2,
    disclaimer: 'Business strategy recommendations are informational only and do not replace legal or certified financial counsel.'
  });

  // Return max 5 primary opportunities ranked by impact
  return opportunities.sort((a, b) => a.rank - b.rank).slice(0, 5);
}

// =========================================================
// 4. UNIVERSAL AI WORKFORCE DESIGN ENGINE
// =========================================================

export function designWorkforce(
  profile: StructuredBusinessProfile,
  opportunities: OpportunityItem[]
): RecommendedWorker[] {
  const industry = (profile?.identity?.industry?.value || '').toLowerCase();
  const pack = getIndustryPack(industry);
  const painPoints = profile?.painPoints?.value || [];
  const systems = profile?.systems?.value || [];
  const models = profile?.models?.value || [];
  const workers: RecommendedWorker[] = [];

  // Always include Core Executive Worker: Business Growth Advisor
  workers.push({
    id: 'wrk_growth_advisor',
    name: 'Executive Growth Advisor',
    role: 'Business Growth Advisor',
    problemAddressed: 'Lack of strategic roadmap and automated weekly business analysis.',
    inputsRequired: ['Business Profile', 'Monthly Revenue Goals', 'Operations Data'],
    systemsRequired: ['Internal AI Engine'],
    actionsTaken: ['Analyzes operational bottlenecks', 'Generates weekly strategic growth reports', 'Suggests priority tasks'],
    actionsRequiringApproval: ['Applying strategic roadmap changes'],
    expectedOutcome: 'Continuous strategic guidance and weekly performance clarity.',
    priority: 'High',
    difficulty: 'Easy',
    status: 'VERIFIED WORKING',
    missingIntegrations: [],
    verificationStatus: 'Verified working in production engine'
  });

  // Industry-Pack or Pain-Point-based Worker 2: AI Receptionist
  if (painPoints.includes('Missed calls') || painPoints.includes('Slow customer replies') || (pack && pack.defaultWorkerRoles.includes('AI Receptionist')) || workers.length === 1) {
    workers.push({
      id: 'wrk_receptionist',
      name: `${profile?.identity?.name?.value || 'Business'} AI Receptionist`,
      role: 'AI Receptionist',
      problemAddressed: 'Unanswered phone calls and delayed lead response times.',
      inputsRequired: ['Business FAQs', 'Service Menu / Pricing', 'Calendar Availability'],
      systemsRequired: ['Twilio / Phone System', 'Google Calendar / POS'],
      actionsTaken: ['Answers inbound calls/SMS 24/7', 'Answers customer questions', 'Collects customer intake details'],
      actionsRequiringApproval: ['Confirming non-standard booking requests'],
      expectedOutcome: '100% call response rate and instant lead capture.',
      priority: 'High',
      difficulty: 'Moderate',
      status: 'VERIFIED WORKING',
      missingIntegrations: systems.includes('Phone system') ? [] : ['Telephony Connection Required'],
      verificationStatus: 'Verified working in sandbox'
    });
  }

  // Resale/E-Commerce specific workers
  if (industry.includes('resale') || industry.includes('e-commerce') || models.includes('Marketplace selling')) {
    workers.push({
      id: 'wrk_inventory_assistant',
      name: 'Inventory & Draft Listing Assistant',
      role: 'Listing Assistant',
      problemAddressed: 'Unlisted inventory backlog and manual marketplace draft creation.',
      inputsRequired: ['Item Photos', 'Brand/Condition Details'],
      systemsRequired: ['Marketplace API (eBay/Shopify)'],
      actionsTaken: ['Analyzes product photos', 'Generates titles & descriptions', 'Suggests listing prices'],
      actionsRequiringApproval: ['Publishing final listing to live marketplace'],
      expectedOutcome: '80% faster item listing creation.',
      priority: 'High',
      difficulty: 'Moderate',
      status: 'IMPLEMENTED BUT UNTESTED',
      missingIntegrations: ['eBay Developer API Connection'],
      verificationStatus: 'Code implemented, requires seller OAuth connection'
    });

    workers.push({
      id: 'wrk_pricing_assistant',
      name: 'Marketplace Pricing Research Assistant',
      role: 'Pricing Assistant',
      problemAddressed: 'Inconsistent item pricing and missed profit margins.',
      inputsRequired: ['Item Title/UPC', 'Condition'],
      systemsRequired: ['Marketplace Price Comparison API'],
      actionsTaken: ['Scrapes sold comps', 'Calculates average sold price', 'Recommends competitive list price'],
      actionsRequiringApproval: ['Changing active listing prices'],
      expectedOutcome: 'Higher sell-through rates and optimal profit margins.',
      priority: 'Medium',
      difficulty: 'Easy',
      status: 'DESIGN COMPLETE',
      missingIntegrations: ['Pricing Comps Scraper Integration'],
      verificationStatus: 'Design specification complete'
    });
  }

  // Restaurant specific workers
  if (industry.includes('restaurant') || industry.includes('food')) {
    workers.push({
      id: 'wrk_review_manager',
      name: 'Guest Review & Reputation Agent',
      role: 'Review Management Agent',
      problemAddressed: 'Unanswered guest reviews on Google & Yelp.',
      inputsRequired: ['Customer Review Feed', 'Brand Tone'],
      systemsRequired: ['Google Business Profile API', 'Yelp API'],
      actionsTaken: ['Monitors incoming reviews', 'Drafts polite, personalized replies', 'Prompts happy diners for reviews'],
      actionsRequiringApproval: ['Publishing response to 1-star or 2-star reviews'],
      expectedOutcome: 'Improved online reputation and higher search ranking.',
      priority: 'Medium',
      difficulty: 'Easy',
      status: 'VERIFIED WORKING',
      missingIntegrations: [],
      verificationStatus: 'Verified working'
    });
  }

  // Home Services / Contractor specific workers
  if (industry.includes('plumb') || industry.includes('contractor') || industry.includes('home service')) {
    workers.push({
      id: 'wrk_dispatch_agent',
      name: '24/7 Emergency Dispatch & Qualification Agent',
      role: 'Lead Qualification Agent',
      problemAddressed: 'Unqualified after-hours calls and technician route delays.',
      inputsRequired: ['Service Area Zip Codes', 'Emergency Job Rates', 'Technician Schedules'],
      systemsRequired: ['ServiceTitan / Housecall Pro API'],
      actionsTaken: ['Screens caller urgency', 'Gathers job site address & issue photos', 'Books dispatch slot'],
      actionsRequiringApproval: ['Dispatching technician for high-value job'],
      expectedOutcome: 'Instant emergency dispatch booking without owner phone interruption.',
      priority: 'High',
      difficulty: 'Moderate',
      status: 'PARTIALLY VERIFIED',
      missingIntegrations: ['ServiceTitan API Key'],
      verificationStatus: 'Partially verified with local mock payload'
    });
  }

  // Universal Customer Follow-up & Review Agent
  workers.push({
    id: 'wrk_followup_agent',
    name: 'Customer Follow-Up & Review Agent',
    role: 'Customer Follow-Up Agent',
    problemAddressed: 'Lack of systematic post-sale follow-up and review collection.',
    inputsRequired: ['Customer Contact List', 'Completed Job Records'],
    systemsRequired: ['CRM', 'Twilio SMS'],
    actionsTaken: ['Sends thank you SMS after service', 'Requests 5-star Google reviews', 'Nurtures open quotes'],
    actionsRequiringApproval: ['Sending custom promotional discount codes'],
    expectedOutcome: '30% increase in repeat customer bookings and positive review volume.',
    priority: 'Medium',
    difficulty: 'Easy',
    status: 'VERIFIED WORKING',
    missingIntegrations: [],
    verificationStatus: 'Verified working in production engine'
  });

  return workers;
}
