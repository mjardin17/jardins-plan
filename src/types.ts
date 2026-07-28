export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  tone: 'professional' | 'friendly' | 'casual' | 'enthusiastic';
  description: string;
  faqs: { question: string; answer: string }[];
  bookingLink?: string;
  pricingInfo?: string;
  services: { name: string; price: string; duration: string; description: string }[];
  widgetColor: string;
  widgetGreeting: string;
  widgetPlaceholder: string;
}

export interface Lead {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'in_progress' | 'closed_won' | 'closed_lost';
  notes: string;
  createdAt: string;
  source: 'chat' | 'widget' | 'manual';
  chatSessionId?: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  leadId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  dateTime: string; // ISO string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  businessId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  leadCaptured: boolean;
  appointmentBooked: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  createdAt: string;
}

export interface AutomationLog {
  id: string;
  businessId: string;
  type: 'follow_up' | 'review_request';
  leadName: string;
  recipient: string;
  channel: 'email' | 'sms';
  templateName: string;
  content: string;
  status: 'sent' | 'failed' | 'scheduled';
  sentAt: string;
}

export interface AutomationSettings {
  followUpDelayMinutes: number;
  followUpTemplateEmail: string;
  followUpTemplateSMS: string;
  followUpEnabled: boolean;
  reviewRequestDelayDays: number;
  reviewTemplateEmail: string;
  reviewTemplateSMS: string;
  reviewEnabled: boolean;
  reviewLink: string;
}

export interface UserAccount {
  email: string;
  businessId?: string;
  name: string;
  onboarded: boolean;
}
