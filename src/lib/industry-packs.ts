// src/lib/industry-packs.ts
import { IndustryPack } from '../types/universal-onboarding.ts';

export const INDUSTRY_PACKS: Record<string, IndustryPack> = {
  resale_ecommerce: {
    id: 'resale_ecommerce',
    name: 'Resale & E-Commerce Industry Pack',
    description: 'Tailored workflows for solo resellers, consignment shops, e-commerce stores, and marketplace sellers.',
    terminology: {
      customer: 'Buyer / Customer',
      service: 'Listing / Product Item',
      booking: 'Order / Purchase',
      inventory: 'SKU / Item Condition / Inventory',
    },
    commonWorkflows: [
      'Multi-marketplace cross-listing (eBay, Poshmark, Mercari)',
      'Item sourcing, grading, and draft listing generation',
      'Pricing research & automated competitor price comparisons',
      'Shipping, label printing, and buyer messaging'
    ],
    commonPainPoints: [
      'Unlisted inventory backlog',
      'Manual copy-pasting across marketplaces',
      'Inconsistent item pricing',
      'Slow response to buyer inquiries'
    ],
    defaultWorkerRoles: [
      'Inventory Assistant',
      'Listing Assistant',
      'Pricing Assistant',
      'Customer Service Agent',
      'Marketing Agent'
    ],
    typicalIntegrations: [
      'eBay API',
      'Shopify',
      'Poshmark Sync',
      'Pirate Ship / USPS',
      'Spreadsheets'
    ],
    industryQuestions: [
      'What percentage of your inventory is currently unlisted?',
      'Which marketplaces do you actively sell on?',
      'How do you determine listing prices?'
    ],
    metrics: [
      'Sell-through rate',
      'Average Days-to-Sell',
      'Gross Profit per Item',
      'Unlisted Inventory Value'
    ],
    complianceReminders: [
      'Marketplace seller performance policy compliance',
      'Sales tax nexus and reporting requirements'
    ]
  },

  restaurant: {
    id: 'restaurant',
    name: 'Restaurant & Food Service Industry Pack',
    description: 'Tailored workflows for dining establishments, cafes, bakeries, and food trucks.',
    terminology: {
      customer: 'Diner / Guest',
      service: 'Menu Item / Reservation / Catering',
      booking: 'Table Reservation / Catering Order',
      inventory: 'Ingredients / Food Supplies',
    },
    commonWorkflows: [
      'Phone call answering & table reservations',
      'Online menu management & takeout order confirmation',
      'Customer review monitoring & response management',
      'Special events & catering lead follow-up'
    ],
    commonPainPoints: [
      'Missed phone calls during peak meal hours',
      'Managing table reservation cancellations/no-shows',
      'Negative online review management on Google/Yelp',
      'Unorganized catering inquiries'
    ],
    defaultWorkerRoles: [
      'AI Receptionist',
      'Customer Service Agent',
      'Review Management Agent',
      'Lead Qualification Agent',
      'Social Media Agent'
    ],
    typicalIntegrations: [
      'Toast POS / Square',
      'OpenTable / Resy',
      'Google Business Profile',
      'Yelp Business API',
      'SMS Gateway'
    ],
    industryQuestions: [
      'How do guests currently book tables or place takeout orders?',
      'How do you handle missed phone calls during lunch or dinner rush?',
      'What is your primary method for getting customer reviews?'
    ],
    metrics: [
      'Average Table Turnover Rate',
      'Missed Call Conversion Rate',
      'Online Review Rating Average',
      'Catering Order Lead Volume'
    ],
    complianceReminders: [
      'Health department allergen disclosure rules',
      'Food safety & storage temperature record compliance'
    ]
  },

  home_services: {
    id: 'home_services',
    name: 'Home Services & Contractor Industry Pack',
    description: 'Tailored workflows for plumbers, electricians, HVAC, landscapers, and field contractors.',
    terminology: {
      customer: 'Homeowner / Property Manager',
      service: 'Job / Repair Service / Quote',
      booking: 'Dispatch Appointment / On-site Visit',
      inventory: 'Parts / Tools / Materials',
    },
    commonWorkflows: [
      '24/7 Emergency call answering & job dispatch',
      'Lead intake, job qualification, and estimate generation',
      'Appointment arrival reminders & SMS updates',
      'Post-service invoice follow-up & review collection'
    ],
    commonPainPoints: [
      'Losing jobs to competitors due to missed phone calls',
      'Unqualified tire-kicker calls wasting technician time',
      'Manual scheduling conflicts & dispatch delays',
      'Uncollected invoices and slow follow-ups'
    ],
    defaultWorkerRoles: [
      'AI Receptionist',
      'Lead Qualification Agent',
      'Scheduling Agent',
      'Customer Follow-Up Agent',
      'Review Management Agent'
    ],
    typicalIntegrations: [
      'Housecall Pro / ServiceTitan',
      'Google Calendar / Outlook',
      'Twilio Voice / SMS',
      'QuickBooks Online',
      'Stripe Payment Gateway'
    ],
    industryQuestions: [
      'How are emergency calls handled outside standard business hours?',
      'Do you offer instant job estimates or require on-site visits?',
      'What software do you use for dispatching technicians?'
    ],
    metrics: [
      'Lead Response Time (Speed to Lead)',
      'Quote Acceptance Rate',
      'Average Revenue per Dispatch Job',
      'Technician Utilization Rate'
    ],
    complianceReminders: [
      'State contractor licensing disclosure rules',
      'Permit requirement verification before job execution'
    ]
  }
};

export function getIndustryPack(industryString?: string): IndustryPack | null {
  if (!industryString) return null;

  const lower = industryString.toLowerCase();
  if (lower.includes('resale') || lower.includes('e-commerce') || lower.includes('retail') || lower.includes('ebay') || lower.includes('poshmark')) {
    return INDUSTRY_PACKS.resale_ecommerce;
  }
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe') || lower.includes('dining')) {
    return INDUSTRY_PACKS.restaurant;
  }
  if (lower.includes('plumb') || lower.includes('contractor') || lower.includes('hvac') || lower.includes('home service') || lower.includes('electric') || lower.includes('repair')) {
    return INDUSTRY_PACKS.home_services;
  }

  return null;
}
