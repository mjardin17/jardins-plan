// src/types/universal-onboarding.ts

export type BusinessStage =
  | 'Idea'
  | 'New business'
  | 'Side hustle'
  | 'Established solo business'
  | 'Small team'
  | 'Growing company'
  | 'Multi-location company'
  | 'Enterprise';

export type BusinessModelType =
  | 'Products'
  | 'Services'
  | 'Subscriptions'
  | 'Appointments'
  | 'Projects'
  | 'Retail'
  | 'E-commerce'
  | 'Marketplace selling'
  | 'Food service'
  | 'Events'
  | 'Mixed business models'
  | 'Custom model';

export type SystemCategory =
  | 'Gmail or business email'
  | 'Google Calendar'
  | 'Microsoft Outlook'
  | 'Website'
  | 'CRM'
  | 'Phone system'
  | 'Text messaging'
  | 'Accounting software'
  | 'Payment processor'
  | 'E-commerce platform'
  | 'Online marketplaces'
  | 'Social media'
  | 'Inventory system'
  | 'Scheduling software'
  | 'Point-of-sale system'
  | 'Spreadsheets'
  | 'Paper or manual processes'
  | 'Other systems';

export type PainPointCategory =
  | 'Missed calls'
  | 'Slow customer replies'
  | 'Too much repetitive work'
  | 'Poor follow-up'
  | 'Lack of leads'
  | 'Low sales'
  | 'Scheduling problems'
  | 'Unorganized records'
  | 'Inventory problems'
  | 'Marketing inconsistency'
  | 'Customer service problems'
  | 'Employee coordination'
  | 'Reporting problems'
  | 'Too much owner involvement'
  | 'Other custom problem';

export type GoalCategory =
  | 'Increase revenue'
  | 'Save time'
  | 'Reduce missed opportunities'
  | 'Improve customer service'
  | 'Organize operations'
  | 'Automate repetitive work'
  | 'Hire fewer administrative staff'
  | 'Grow to another location'
  | 'Build an online presence'
  | 'Improve marketing'
  | 'Improve customer retention'
  | 'Launch a new business'
  | 'Other custom goal';

export interface OnboardingAnswers {
  // 1. Business Identity
  businessName: string;
  ownerName: string;
  businessDescription: string;
  industry: string;
  subIndustrySpecialty: string;
  location: string;
  serviceArea: string;
  website: string;
  email: string;
  phone: string;
  yearsOperating: string;

  // 2. Business Stage
  stage: BusinessStage;

  // 3. Business Model
  businessModel: BusinessModelType[];
  customBusinessModelNotes?: string;

  // 4. Operations
  productsServicesOffered: string;
  typicalCustomer: string;
  customerDiscoveryMethods: string[];
  customerContactMethods: string[];
  salesBookingProcess: string;
  paymentCollectionMethod: string;
  schedulingProcess: string;
  customerFollowUpMethod: string;
  inventoryHandling: string;
  marketingHandling: string;
  recordStorageMethod: string;
  teamSizeCount: string; // employees/contractors
  currentSoftwareList: string[];

  // 5. Current Systems
  systemsUsed: SystemCategory[];
  otherSystemsNotes?: string;

  // 6. Pain Points (Ranked or selected)
  painPoints: PainPointCategory[];
  customPainPointNotes?: string;

  // 7. Goals
  goals: GoalCategory[];
  customGoalNotes?: string;

  // 8. Constraints
  monthlyBudgetRange: string;
  techComfortLevel: 'Low' | 'Medium' | 'High' | 'Expert';
  preferredAutomationLevel: 'Full Human Control' | 'Human-in-the-loop Approval' | 'High Autonomous Operations';
  actionsRequiringApproval: string[];
  privacyComplianceConcerns: string;
  forbiddenConnections: string[];
  immediatePriority: string;
  desiredTimeline: string;
}

export type FactSource = 'owner_provided' | 'imported' | 'ai_inferred' | 'unknown';
export type FactVerificationStatus = 'confirmed' | 'needs_confirmation' | 'rejected';

export interface FactEntry<T = any> {
  value: T;
  source: FactSource;
  confidence: number; // 0.0 - 1.0
  status: FactVerificationStatus;
  notes?: string;
}

export interface StructuredBusinessProfile {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Profile Sections with provenance tracking
  identity: {
    name: FactEntry<string>;
    owner: FactEntry<string>;
    description: FactEntry<string>;
    industry: FactEntry<string>;
    subIndustry: FactEntry<string>;
    location: FactEntry<string>;
    serviceArea: FactEntry<string>;
    website: FactEntry<string>;
    email: FactEntry<string>;
    phone: FactEntry<string>;
    yearsOperating: FactEntry<string>;
  };

  stage: FactEntry<BusinessStage>;
  models: FactEntry<BusinessModelType[]>;

  operations: {
    productsServices: FactEntry<string>;
    targetCustomer: FactEntry<string>;
    discoveryChannels: FactEntry<string[]>;
    contactMethods: FactEntry<string[]>;
    salesProcess: FactEntry<string>;
    paymentMethods: FactEntry<string>;
    schedulingMethod: FactEntry<string>;
    followUpMethod: FactEntry<string>;
    inventoryMethod: FactEntry<string>;
    marketingMethod: FactEntry<string>;
    recordMethod: FactEntry<string>;
    teamSize: FactEntry<string>;
  };

  systems: FactEntry<SystemCategory[]>;
  painPoints: FactEntry<PainPointCategory[]>;
  goals: FactEntry<GoalCategory[]>;

  constraints: {
    budget: FactEntry<string>;
    techComfort: FactEntry<string>;
    automationLevel: FactEntry<string>;
    approvalBoundary: FactEntry<string[]>;
    forbiddenSystems: FactEntry<string[]>;
    immediatePriority: FactEntry<string>;
    timeline: FactEntry<string>;
  };

  aiInferences: Array<{
    id: string;
    fieldKey: string;
    label: string;
    inferredValue: string;
    rationale: string;
    confidence: number;
    status: FactVerificationStatus;
  }>;

  profileCompletionPct: number;
}

export type MaturityDimensionKey =
  | 'foundation'
  | 'customerAcquisition'
  | 'salesProcess'
  | 'customerCommunication'
  | 'operations'
  | 'scheduling'
  | 'inventory'
  | 'financialOrganization'
  | 'marketing'
  | 'technology'
  | 'automation'
  | 'reporting'
  | 'ownerDependency'
  | 'growthReadiness';

export type MaturityStage =
  | 'Not established'
  | 'Manual'
  | 'Basic'
  | 'Organized'
  | 'Partially automated'
  | 'Optimized';

export interface DimensionAssessment {
  key: MaturityDimensionKey;
  title: string;
  stage: MaturityStage;
  scorePct: number;
  evidence: string;
  mainWeakness: string;
  recommendedNextStep: string;
  confidence: number;
}

export interface BusinessMaturityAssessment {
  dimensions: Record<MaturityDimensionKey, DimensionAssessment>;
  overallStage: MaturityStage;
  overallScorePct: number;
  summary: string;
}

export type CapabilityStatus =
  | 'RECOMMENDED ONLY'
  | 'DESIGN COMPLETE'
  | 'IMPLEMENTED BUT UNTESTED'
  | 'WORKING IN SANDBOX'
  | 'PARTIALLY VERIFIED'
  | 'VERIFIED WORKING'
  | 'BLOCKED BY CONNECTION'
  | 'NOT IMPLEMENTED';

export interface OpportunityItem {
  id: string;
  title: string;
  category: string;
  observation: string;
  whyItMatters: string;
  evidence: string;
  proposedImprovement: string;
  expectedBenefit: string;
  requiredSystems: string[];
  humanApprovalRequired: boolean;
  capabilityStatus: CapabilityStatus;
  externalIntegrationRequired: boolean;
  verifiedWorking: boolean;
  rank: number;
  impactScore: number; // 1 - 10
  difficultyScore: number; // 1 - 10
  disclaimer?: string;
}

export type ReusableWorkerRole =
  | 'Business Growth Advisor'
  | 'AI Receptionist'
  | 'Lead Qualification Agent'
  | 'Customer Follow-Up Agent'
  | 'Scheduling Agent'
  | 'Sales Assistant'
  | 'Customer Service Agent'
  | 'Marketing Agent'
  | 'Social Media Agent'
  | 'Review Management Agent'
  | 'Operations Coordinator'
  | 'Inventory Assistant'
  | 'Listing Assistant'
  | 'Pricing Assistant'
  | 'Bookkeeping Assistant'
  | 'Reporting Analyst'
  | 'Knowledge Assistant'
  | 'Compliance Support Assistant'
  | 'Website Assistant'
  | 'Human Approval Coordinator';

export interface RecommendedWorker {
  id: string;
  name: string;
  role: ReusableWorkerRole;
  problemAddressed: string;
  inputsRequired: string[];
  systemsRequired: string[];
  actionsTaken: string[];
  actionsRequiringApproval: string[];
  expectedOutcome: string;
  priority: 'High' | 'Medium' | 'Low';
  difficulty: 'Easy' | 'Moderate' | 'Complex';
  status: CapabilityStatus;
  missingIntegrations: string[];
  verificationStatus: string;
}

export interface IndustryPack {
  id: string;
  name: string;
  description: string;
  terminology: Record<string, string>;
  commonWorkflows: string[];
  commonPainPoints: string[];
  defaultWorkerRoles: ReusableWorkerRole[];
  typicalIntegrations: string[];
  industryQuestions: string[];
  metrics: string[];
  complianceReminders: string[];
}
