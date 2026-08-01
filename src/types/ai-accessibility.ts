// src/types/ai-accessibility.ts
import { EvidenceClassification } from './deployable-improvement.ts';

export type AIAccessibilityFindingStatus =
  | 'verified_present'
  | 'verified_missing'
  | 'partially_present'
  | 'inaccessible'
  | 'unknown'
  | 'not_applicable';

export type AIAccessibilityDimension =
  | 'crawlability'
  | 'robots_txt'
  | 'xml_sitemap'
  | 'structured_data'
  | 'org_schema'
  | 'local_business_schema'
  | 'product_schema'
  | 'service_schema'
  | 'offer_pricing_data'
  | 'faq_structure'
  | 'contact_info'
  | 'location_info'
  | 'business_hours'
  | 'product_catalog'
  | 'service_catalog'
  | 'inventory_availability'
  | 'scheduling_booking'
  | 'customer_support'
  | 'checkout_payment'
  | 'machine_readable_policies'
  | 'knowledge_base'
  | 'api_availability'
  | 'authorized_agent_interfaces'
  | 'data_freshness'
  | 'provenance'
  | 'security'
  | 'privacy_consent'
  | 'human_escalation';

export interface AIAccessibilityFinding {
  id: string;
  dimension: AIAccessibilityDimension;
  label: string;
  status: AIAccessibilityFindingStatus;
  evidence: string;
  evidenceSource: string;
  confidence: number; // 0.0 - 1.0
  businessImpact: 'high' | 'medium' | 'low';
  securityImpact: 'high' | 'medium' | 'low' | 'none';
  recommendedRemediation: string;
  humanConfirmationRequirement: boolean;
}

export interface AIAccessibilityReadinessScores {
  aiDiscoverability: number; // 0-100
  aiAnswerability: number; // 0-100
  aiRecommendation: number; // 0-100
  aiTransaction: number; // 0-100
  dataTrustworthiness: number; // 0-100
  securityReadiness: number; // 0-100
  overallAgentReady: number; // 0-100
  explanationRules: string[];
}

export interface ProfileFieldMetadata<T = any> {
  value: T;
  evidenceClassification: EvidenceClassification;
  source: string;
  lastVerifiedDate: string;
  confidence: number;
  visibility: 'public' | 'private';
  ownerConfirmationStatus: 'confirmed' | 'unconfirmed' | 'rejected';
}

export interface CanonicalBusinessProfile {
  id: string;
  tenantId: string;
  businessIdentity: ProfileFieldMetadata<{
    legalName: string;
    publicName: string;
    description: string;
    websiteUrl: string;
    industryCategory: string;
  }>;
  locations: ProfileFieldMetadata<Array<{
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    geoCoordinates?: { latitude: number; longitude: number };
  }>>;
  hours: ProfileFieldMetadata<Array<{
    dayOfWeek: string;
    opens: string;
    closes: string;
  }>>;
  contacts: ProfileFieldMetadata<{
    publicEmail: string;
    publicPhone: string;
    supportUrl?: string;
  }>;
  products: ProfileFieldMetadata<Array<{
    id: string;
    name: string;
    description: string;
    sku?: string;
    price: number;
    currency: string;
    availability: string;
  }>>;
  services: ProfileFieldMetadata<Array<{
    id: string;
    name: string;
    description: string;
    price?: number;
    currency?: string;
    durationMinutes?: number;
    bookingUrl?: string;
  }>>;
  policies: ProfileFieldMetadata<{
    privacyPolicyUrl?: string;
    termsUrl?: string;
    returnPolicyUrl?: string;
    aiAgentAccessPolicy?: string;
  }>;
  faqs: ProfileFieldMetadata<Array<{
    question: string;
    answer: string;
    category?: string;
  }>>;
  capabilities: ProfileFieldMetadata<{
    hasBookingApi: boolean;
    hasCustomerSupportHandoff: boolean;
    hasCheckoutApi: boolean;
    hasMcpCapability: boolean;
  }>;
  dataOwner: string;
  provenance: {
    lastVerifiedDate: string;
    verifiedBy: string;
    hash: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AIAccessibilityPreviewDiff {
  improvementId: string;
  title: string;
  originalMarkup?: string;
  proposedMarkup: string;
  proposedJsonLd?: Record<string, any>;
  sanitizedHtml: string;
  diffSummary: string[];
  containsSecretsOrPrivateData: boolean;
}

export interface AIAccessibilityAssessmentResult {
  tenantId: string;
  evaluatedAt: string;
  websiteUrl: string;
  findings: AIAccessibilityFinding[];
  scores: AIAccessibilityReadinessScores;
  profile: CanonicalBusinessProfile;
  suggestedImprovementCount: number;
}
