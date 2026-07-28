// src/lib/demo-profiles.ts
import { OnboardingAnswers } from '../types/universal-onboarding.ts';

export interface DemoProfilePreset {
  key: string;
  name: string;
  industryTag: string;
  description: string;
  answers: OnboardingAnswers;
}

export const DEMO_PROFILES: Record<string, DemoProfilePreset> = {
  joshua_jardin: {
    key: 'joshua_jardin',
    name: 'Joshua Jardin (Solo Reseller)',
    industryTag: 'Resale / E-Commerce',
    description: 'Solo reseller on eBay with mixed inventory backlog (clothing, toys, collectibles, cosmetics, household), iPhone + Windows laptop, building AI tools on a tight budget.',
    answers: {
      businessName: 'Jardin Goods & Resale',
      ownerName: 'Joshua Jardin',
      businessDescription: 'Solo resale business sourcing mixed inventory (vintage clothing, toys, collectibles, cosmetics, household items) and selling online.',
      industry: 'Resale & E-Commerce',
      subIndustrySpecialty: 'Multi-category eBay Resale & Collectibles',
      location: 'San Diego, CA',
      serviceArea: 'Nationwide (Shipping via USPS/UPS)',
      website: 'https://stores.ebay.com/jardin-resale',
      email: 'joshua.jardin@jardinresale.com',
      phone: '619-555-0182',
      yearsOperating: '2 years',

      stage: 'Established solo business',
      businessModel: ['Marketplace selling', 'E-commerce', 'Products'],
      customBusinessModelNotes: 'Direct inventory sourcing and resale across online channels.',

      productsServicesOffered: 'Clothing, plush toys, vintage collectibles, cosmetics, household electronics',
      typicalCustomer: 'Bargain hunters, vintage collectors, online shoppers seeking rare items',
      customerDiscoveryMethods: ['Marketplace search', 'eBay recommendations', 'Organic web search'],
      customerContactMethods: ['eBay messaging', 'Email'],
      salesBookingProcess: 'Buyer places order on eBay or marketplace, item packed and shipped within 24 hours',
      paymentCollectionMethod: 'eBay Managed Payments (Direct deposit to bank)',
      schedulingProcess: 'N/A - Daily shipping schedules and sourcing trips',
      customerFollowUpMethod: 'Manual messaging on eBay for tracking & delivery updates',
      inventoryHandling: 'Stored in home storage space; significant unlisted inventory backlog waiting for draft creation',
      marketingHandling: 'Relies on marketplace organic traffic and listing SEO keywords',
      recordStorageMethod: 'Excel spreadsheets, eBay seller hub reports',
      teamSizeCount: '1 (Solo Owner)',
      currentSoftwareList: ['eBay Seller Hub', 'Excel Spreadsheets', 'iPhone Camera App', 'Windows Laptop Web Browser'],

      systemsUsed: [
        'Online marketplaces',
        'E-commerce platform',
        'Spreadsheets',
        'Paper or manual processes',
        'Gmail or business email'
      ],
      otherSystemsNotes: 'Uses iPhone for listing photography and Windows PC for batch listing upload.',

      painPoints: [
        'Too much repetitive work',
        'Inventory problems',
        'Slow customer replies',
        'Marketing inconsistency',
        'Too much owner involvement'
      ],
      customPainPointNotes: 'Creating titles, descriptions, and price comparisons for unlisted inventory takes hours of manual work.',

      goals: [
        'Save time',
        'Automate repetitive work',
        'Increase revenue',
        'Organize operations',
        'Build an online presence'
      ],
      customGoalNotes: 'Automate draft listing creation and cross-listing to free up time for product sourcing and AI software development.',

      monthlyBudgetRange: '$50 - $150 / month',
      techComfortLevel: 'High',
      preferredAutomationLevel: 'Human-in-the-loop Approval',
      actionsRequiringApproval: [
        'Publishing new marketplace listings',
        'Accepting buyer discount offers',
        'Issuing buyer refunds'
      ],
      privacyComplianceConcerns: 'Keep customer shipping addresses private; respect marketplace seller rules.',
      forbiddenConnections: ['Unverified third-party tools that post directly without approval'],
      immediatePriority: 'Clear unlisted inventory backlog by generating fast draft listings and automated pricing suggestions.',
      desiredTimeline: 'Immediate (Within 7 days)'
    }
  },

  ricardos_restaurant: {
    key: 'ricardos_restaurant',
    name: "Ricardo's Restaurant",
    industryTag: 'Food Service / Hospitality',
    description: "Family-owned Italian restaurant with high dine-in & takeout volume, experiencing missed phone calls and unorganized catering inquiries.",
    answers: {
      businessName: "Ricardo's Trattoria & Pizzeria",
      ownerName: 'Ricardo Rossi',
      businessDescription: 'Authentic Italian dining, handmade pasta, wood-fired pizza, and catering services.',
      industry: 'Restaurant & Food Service',
      subIndustrySpecialty: 'Casual Dining & Italian Catering',
      location: 'Chicago, IL',
      serviceArea: 'Greater Chicago Metropolitan Area',
      website: 'https://ricardostrattoria.com',
      email: 'ricardo@ricardostrattoria.com',
      phone: '312-555-0149',
      yearsOperating: '8 years',

      stage: 'Small team',
      businessModel: ['Food service', 'Appointments', 'Services', 'Mixed business models'],
      customBusinessModelNotes: 'Dine-in, takeout, online delivery orders, and large event catering.',

      productsServicesOffered: 'Dine-in seating, pizza & pasta takeout, online ordering, private event catering',
      typicalCustomer: 'Local families, neighborhood diners, corporate event planners',
      customerDiscoveryMethods: ['Google Business Profile', 'Yelp', 'Local foot traffic', 'Word of mouth'],
      customerContactMethods: ['Phone call', 'Website contact form', 'In-person'],
      salesBookingProcess: 'In-person order, phone reservations, third-party delivery apps',
      paymentCollectionMethod: 'Toast POS (Credit card & Cash)',
      schedulingProcess: 'Table reservations via OpenTable; phone notepad for catering events',
      customerFollowUpMethod: 'Occasional email newsletter, manual response to Google reviews',
      inventoryHandling: 'Weekly food distributor orders; manual paper clipboard counts',
      marketingHandling: 'Facebook page posts, seasonal menu specials',
      recordStorageMethod: 'Toast POS reporting, paper binders',
      teamSizeCount: '12 (Kitchen staff, servers, manager)',
      currentSoftwareList: ['Toast POS', 'OpenTable', 'Google Business Profile', 'Mailchimp'],

      systemsUsed: [
        'Point-of-sale system',
        'Phone system',
        'Google Calendar',
        'Website',
        'Social media',
        'Paper or manual processes'
      ],
      otherSystemsNotes: 'Toast POS handles card transactions. Phone rings constantly during 6-8pm dinner rush.',

      painPoints: [
        'Missed calls',
        'Customer service problems',
        'Slow customer replies',
        'Scheduling problems',
        'Marketing inconsistency'
      ],
      customPainPointNotes: 'Staff cannot answer incoming calls during peak dinner hours, losing catering leads and reservation bookings.',

      goals: [
        'Reduce missed opportunities',
        'Improve customer service',
        'Increase revenue',
        'Improve customer retention',
        'Automate repetitive work'
      ],
      customGoalNotes: 'Answering all phone calls automatically with an AI Receptionist for reservations, menu FAQs, and catering lead capture.',

      monthlyBudgetRange: '$200 - $500 / month',
      techComfortLevel: 'Medium',
      preferredAutomationLevel: 'Human-in-the-loop Approval',
      actionsRequiringApproval: [
        'Confirming catering quotes over $300',
        'Responding to negative 1-star reviews'
      ],
      privacyComplianceConcerns: 'Food allergy disclosures; PCI DSS payment security compliance.',
      forbiddenConnections: ['Automatic food order changes without chef notification'],
      immediatePriority: 'Capture 100% of missed phone calls with AI Voice/SMS receptionist during dinner rush.',
      desiredTimeline: 'Within 14 days'
    }
  },

  apex_plumbing: {
    key: 'apex_plumbing',
    name: 'Apex Plumbing Contractors',
    industryTag: 'Home Services / Contracting',
    description: 'Residential & commercial plumbing contractor managing emergency calls, technician dispatching, on-site quotes, and invoice collection.',
    answers: {
      businessName: 'Apex Plumbing & Drain Services',
      ownerName: 'Marcus Vance',
      businessDescription: 'Licensed residential and commercial plumbing services, emergency drain cleaning, water heater installations.',
      industry: 'Home Services & Contracting',
      subIndustrySpecialty: 'Residential Plumbing & Emergency Repair',
      location: 'Dallas, TX',
      serviceArea: 'Dallas-Fort Worth Metroplex',
      website: 'https://apexplumbingdallas.com',
      email: 'marcus@apexplumbingdallas.com',
      phone: '214-555-0193',
      yearsOperating: '5 years',

      stage: 'Growing company',
      businessModel: ['Services', 'Appointments', 'Projects'],
      customBusinessModelNotes: 'On-demand dispatch jobs, project quotes, maintenance contracts.',

      productsServicesOffered: 'Emergency leak repair, drain cleaning, water heater replacement, sewer line inspection',
      typicalCustomer: 'Homeowners, property managers, commercial facility directors',
      customerDiscoveryMethods: ['Google Local Services Ads', 'Yelp', 'HomeAdvisor', 'Repeat customers'],
      customerContactMethods: ['Phone call', 'Text message', 'Website quote request form'],
      salesBookingProcess: 'Dispatch call -> Technician on-site quote -> Approval -> Work execution -> Payment',
      paymentCollectionMethod: 'On-site card reader, QuickBooks online invoice',
      schedulingProcess: 'ServiceTitan dispatch calendar',
      customerFollowUpMethod: 'Manual follow-up call after job completion for review request',
      inventoryHandling: 'Truck stock inventory checked weekly; wholesale plumbing supplier orders',
      marketingHandling: 'Google LSA ads managed by local agency',
      recordStorageMethod: 'ServiceTitan CRM, QuickBooks Online',
      teamSizeCount: '6 (Owner, office manager, 4 field technicians)',
      currentSoftwareList: ['ServiceTitan', 'QuickBooks Online', 'Twilio SMS', 'Google Workspace'],

      systemsUsed: [
        'CRM',
        'Scheduling software',
        'Phone system',
        'Text messaging',
        'Accounting software',
        'Payment processor'
      ],
      otherSystemsNotes: 'Office manager handles phone calls 8am-5pm. Emergency calls after hours often go to voicemail.',

      painPoints: [
        'Missed calls',
        'Lack of leads',
        'Poor follow-up',
        'Scheduling problems',
        'Too much repetitive work'
      ],
      customPainPointNotes: 'After-hours emergency calls go unanswered, losing $500-$2,000 emergency jobs to competitors who answer first.',

      goals: [
        'Increase revenue',
        'Reduce missed opportunities',
        'Improve customer service',
        'Automate repetitive work',
        'Hire fewer administrative staff'
      ],
      customGoalNotes: 'Achieve 24/7 instant lead response and automated job booking for emergency plumbing dispatch.',

      monthlyBudgetRange: '$300 - $750 / month',
      techComfortLevel: 'Medium',
      preferredAutomationLevel: 'Human-in-the-loop Approval',
      actionsRequiringApproval: [
        'Dispatching technician for jobs over $1,000',
        'Sending custom discounted estimates'
      ],
      privacyComplianceConcerns: 'Texas State Board of Plumbing Examiners licensing rules compliance.',
      forbiddenConnections: ['Unapproved schedule changes to field technician routes'],
      immediatePriority: 'Implement 24/7 AI call answering and automated technician dispatch qualification.',
      desiredTimeline: 'Immediate'
    }
  }
};
