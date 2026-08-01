import { pgTable, serial, text, timestamp, boolean, integer, jsonb, index, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Businesses table
export const businesses = pgTable('businesses', {
  id: text('id').primaryKey(), // Using text for business string id (e.g. 'apex-plumbing')
  name: text('name').notNull(),
  industry: text('industry'),
  website: text('website'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  tone: text('tone').default('friendly'),
  description: text('description'),
  services: jsonb('services').default('[]'),
  faqs: jsonb('faqs').default('[]'),
  widgetColor: text('widget_color').default('#0284c7'),
  widgetGreeting: text('widget_greeting'),
  widgetPlaceholder: text('widget_placeholder'),
  integrations: jsonb('integrations').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Users table (Role-based access)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Firebase UID. Optional initially for seed/migration, but required for Auth.
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').default('user'), // 'owner', 'manager', 'technician', 'user'
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  onboarded: boolean('onboarded').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('users_business_id_idx').on(table.businessId),
}));

// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Leads table
export const leads = pgTable('leads', {
  id: text('id').primaryKey(), // Keep as text to support existing 'lead-1', 'lead-2'
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  status: text('status').default('new'), // 'new', 'contacted', 'in_progress', 'closed_won', 'closed_lost'
  notes: text('notes'),
  source: text('source'), // 'chat', 'widget', 'manual'
  chatSessionId: text('chat_session_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('leads_business_id_idx').on(table.businessId),
}));

// Appointments table
export const appointments = pgTable('appointments', {
  id: text('id').primaryKey(), // Keep as text to support 'apt-1', 'apt-2'
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  leadId: text('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email'),
  clientPhone: text('client_phone'),
  serviceName: text('service_name').notNull(),
  dateTime: timestamp('date_time').notNull(),
  status: text('status').default('pending'), // 'pending', 'confirmed', 'completed', 'cancelled'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('appointments_business_id_idx').on(table.businessId),
}));

// Chats (AI Conversations) table
export const chats = pgTable('chats', {
  id: text('id').primaryKey(), // 'session-1'
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  visitorName: text('visitor_name'),
  visitorEmail: text('visitor_email'),
  visitorPhone: text('visitor_phone'),
  leadCaptured: boolean('lead_captured').default(false),
  appointmentBooked: boolean('appointment_booked').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('chats_business_id_idx').on(table.businessId),
}));

// Messages table (within Chats)
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  chatId: text('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  sender: text('sender').notNull(), // 'bot', 'user', 'owner'
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Automations table
export const automations = pgTable('automations', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull().unique(),
  followUpDelayMinutes: integer('follow_up_delay_minutes').default(5),
  followUpTemplateEmail: text('follow_up_template_email'),
  followUpTemplateSMS: text('follow_up_template_sms'),
  followUpEnabled: boolean('follow_up_enabled').default(true),
  reviewRequestDelayDays: integer('review_request_delay_days').default(1),
  reviewTemplateEmail: text('review_template_email'),
  reviewTemplateSMS: text('review_template_sms'),
  reviewEnabled: boolean('review_enabled').default(true),
  reviewLink: text('review_link'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Automation Logs table
export const automationLogs = pgTable('automation_logs', {
  id: text('id').primaryKey(), // log-1, log-2
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'follow_up', 'review_request'
  leadName: text('lead_name'),
  recipient: text('recipient'),
  channel: text('channel'), // 'email', 'sms'
  templateName: text('template_name'),
  content: text('content'),
  status: text('status'), // 'sent', 'failed'
  sentAt: timestamp('sent_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('automation_logs_business_id_idx').on(table.businessId),
}));

// Invoices table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  appointmentId: text('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(), // stored in cents
  status: text('status').default('pending'), // 'pending', 'paid', 'overdue'
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('invoices_business_id_idx').on(table.businessId),
}));

// Payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  invoiceId: integer('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // stored in cents
  method: text('method').default('card'),
  status: text('status').default('pending'),
  stripePaymentId: text('stripe_payment_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('payments_business_id_idx').on(table.businessId),
}));

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  userEmail: text('user_email').notNull(),
  action: text('action').notNull(),
  ip: text('ip'),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  businessIdIdx: index('audit_logs_business_id_idx').on(table.businessId),
}));

// Knowledge Base table
export const knowledgeBase = pgTable('knowledge_base', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('general'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('knowledge_base_business_id_idx').on(table.businessId),
}));

// Settings / Twilio / Stripe Integration Config table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull().unique(),
  twilioPhone: text('twilio_phone'),
  twilioSid: text('twilio_sid'),
  twilioToken: text('twilio_token'),
  stripeSecretKey: text('stripe_secret_key'),
  emailConfig: jsonb('email_config'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Rate Limits table for distributed/Cloud Run scaling
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  hits: integer('hits').notNull().default(0),
  resetAt: timestamp('reset_at').notNull(),
});

// Relationships
export const businessesRelations = relations(businesses, ({ many, one }) => ({
  users: many(users),
  customers: many(customers),
  leads: many(leads),
  appointments: many(appointments),
  chats: many(chats),
  automations: one(automations, {
    fields: [businesses.id],
    references: [automations.businessId],
  }),
  automationLogs: many(automationLogs),
  invoices: many(invoices),
  payments: many(payments),
  auditLogs: many(auditLogs),
  knowledgeBase: many(knowledgeBase),
  settings: one(settings, {
    fields: [businesses.id],
    references: [settings.businessId],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  business: one(businesses, {
    fields: [customers.businessId],
    references: [businesses.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  business: one(businesses, {
    fields: [leads.businessId],
    references: [businesses.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  business: one(businesses, {
    fields: [appointments.businessId],
    references: [businesses.id],
  }),
  lead: one(leads, {
    fields: [appointments.leadId],
    references: [leads.id],
  }),
  invoices: many(invoices),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  business: one(businesses, {
    fields: [chats.businessId],
    references: [businesses.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const automationsRelations = relations(automations, ({ one }) => ({
  business: one(businesses, {
    fields: [automations.businessId],
    references: [businesses.id],
  }),
}));

export const automationLogsRelations = relations(automationLogs, ({ one }) => ({
  business: one(businesses, {
    fields: [automationLogs.businessId],
    references: [businesses.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  business: one(businesses, {
    fields: [invoices.businessId],
    references: [businesses.id],
  }),
  appointment: one(appointments, {
    fields: [invoices.appointmentId],
    references: [appointments.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  business: one(businesses, {
    fields: [payments.businessId],
    references: [businesses.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  business: one(businesses, {
    fields: [auditLogs.businessId],
    references: [businesses.id],
  }),
}));

export const knowledgeBaseRelations = relations(knowledgeBase, ({ one }) => ({
  business: one(businesses, {
    fields: [knowledgeBase.businessId],
    references: [businesses.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  business: one(businesses, {
    fields: [settings.businessId],
    references: [businesses.id],
  }),
}));

// Core AI Workforce Tables
export const agents = pgTable('agents', {
  id: text('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  status: text('status').default('active').notNull(), // 'active', 'inactive', 'hireable'
  description: text('description').notNull(),
  instructions: text('instructions').notNull(),
  avatarColor: text('avatar_color').notNull(),
  provider: text('provider').default('gemini').notNull(), // 'gemini', 'openai', 'claude', 'grok', 'ollama'
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('agents_business_id_idx').on(table.businessId),
}));

export const agentTasks = pgTable('agent_tasks', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'in_progress', 'completed', 'failed', 'paused'
  priority: integer('priority').default(3).notNull(), // 1 to 5 (1 is highest)
  retries: integer('retries').default(0).notNull(),
  maxRetries: integer('max_retries').default(3).notNull(),
  payload: jsonb('payload').default('{}'),
  result: jsonb('result').default('{}'),
  runAt: timestamp('run_at'),
  dependencyChain: jsonb('dependency_chain').default('[]'), // IDs of task dependencies
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('agent_tasks_business_id_idx').on(table.businessId),
  statusIdx: index('agent_tasks_status_idx').on(table.status),
}));

export const agentMemory = pgTable('agent_memory', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  category: text('category').default('general').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('agent_memory_business_id_idx').on(table.businessId),
  keyIdx: index('agent_memory_key_idx').on(table.key),
}));

export const mcpTools = pgTable('mcp_tools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  schema: jsonb('schema').notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  version: text('version').default('1.0.0').notNull(),
  category: text('category').notNull(), // 'calendar', 'email', 'crm', 'messaging', 'billing', 'productivity'
});

export const crmLogs = pgTable('crm_logs', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  leadId: text('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type').notNull(), // 'timeline', 'score_change', 'custom_field', 'task_created', 'note_added'
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('crm_logs_business_id_idx').on(table.businessId),
  leadIdIdx: index('crm_logs_lead_id_idx').on(table.leadId),
}));

export const workflows = pgTable('workflows', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  triggerEvent: text('trigger_event').notNull(),
  steps: jsonb('steps').default('[]'),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('workflows_business_id_idx').on(table.businessId),
}));

export const voiceCalls = pgTable('voice_calls', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  direction: text('direction').notNull(),
  fromNumber: text('from_number').notNull(),
  toNumber: text('to_number').notNull(),
  status: text('status').notNull(),
  durationSeconds: integer('duration_seconds').default(0).notNull(),
  transcript: text('transcript'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('voice_calls_business_id_idx').on(table.businessId),
}));

export const technicianJobs = pgTable('technician_jobs', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  techName: text('tech_name').notNull(),
  customerName: text('customer_name').notNull(),
  address: text('address').notNull(),
  status: text('status').notNull(),
  jobPhotos: jsonb('job_photos').default('[]'),
  signatureUrl: text('signature_url'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('technician_jobs_business_id_idx').on(table.businessId),
}));

// Phase 41: Social Media Command Center Tables
export const socialPosts = pgTable('social_posts', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  platform: text('platform').notNull(), // 'facebook', 'instagram', 'threads', 'x', 'linkedin', 'pinterest', 'tiktok', 'youtube', 'google_business'
  content: text('content').notNull(),
  status: text('status').default('scheduled').notNull(), // 'scheduled', 'published', 'paused', 'failed'
  scheduledFor: timestamp('scheduled_for').notNull(),
  imagePrompt: text('image_prompt'),
  mediaUrl: text('media_url'),
  brandVoice: text('brand_voice').default('professional'),
  evergreen: boolean('evergreen').default(false).notNull(),
  // Analytics fields
  reach: integer('reach').default(0).notNull(),
  engagement: integer('engagement').default(0).notNull(),
  likes: integer('likes').default(0).notNull(),
  comments: integer('comments').default(0).notNull(),
  shares: integer('shares').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  followers: integer('followers').default(0).notNull(),
  conversionRate: text('conversion_rate').default('0.0%').notNull(),
  bookingsGenerated: integer('bookings_generated').default(0).notNull(),
  revenueGenerated: integer('revenue_generated').default(0).notNull(), // stored in cents
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('social_posts_business_id_idx').on(table.businessId),
  platformIdx: index('social_posts_platform_idx').on(table.platform),
  statusIdx: index('social_posts_status_idx').on(table.status),
}));

export const socialMediaLibrary = pgTable('social_media_library', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  mediaType: text('media_type').notNull(), // 'photo', 'video', 'logo', 'color', 'hashtag', 'caption'
  urlOrValue: text('url_or_value').notNull(),
  name: text('name').notNull(),
  approved: boolean('approved').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('social_media_library_business_id_idx').on(table.businessId),
  typeIdx: index('social_media_library_type_idx').on(table.mediaType),
}));

export const socialBrandVoice = pgTable('social_brand_voice', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull().unique(),
  voice: text('voice').default('professional').notNull(), // 'professional', 'humorous', 'luxury', 'family-friendly', 'local_business', 'energetic', 'educational'
  approvedHashtags: jsonb('approved_hashtags').default('[]'),
  approvedCaptions: jsonb('approved_captions').default('[]'),
  brandColors: jsonb('brand_colors').default('[]'),
  updatedAt: timestamp('updated_at').defaultNow(),
});


// Phase 49: Business Knowledge & Memory Engine Tables
export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('general').notNull(), // 'FAQ', 'SOP', 'Manual', 'Handbook', 'Pricing', 'Policy', 'Training', 'Script', 'Guideline'
  fileType: text('file_type').default('txt').notNull(), // 'pdf', 'docx', 'txt', 'csv', 'web'
  tags: jsonb('tags').default('[]'),
  version: integer('version').default(1).notNull(),
  status: text('status').default('approved').notNull(), // 'approved', 'draft', 'archived'
  roleRequired: text('role_required').default('agent').notNull(), // 'owner', 'manager', 'agent'
  versionHistory: jsonb('version_history').default('[]'),
  updateHistory: jsonb('update_history').default('[]'),
  duplicateHash: text('duplicate_hash'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('knowledge_documents_business_id_idx').on(table.businessId),
}));

export const businessMemory = pgTable('business_memory', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  key: text('key').notNull(), // e.g. 'customer_preferences', 'frequently_asked_questions', 'common_objections', 'successful_sales_approaches', 'preferred_communication_style', 'seasonal_trends', 'popular_services'
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('business_memory_business_id_idx').on(table.businessId),
}));

export const aiResponsesFeedback = pgTable('ai_responses_feedback', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  agentName: text('agent_name').notNull(),
  channel: text('channel').notNull(), // 'support', 'sales', 'marketing', 'scheduling'
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  feedback: text('feedback').notNull(), // 'approved', 'corrected', 'flagged'
  correction: text('correction'),
  accuracyScore: integer('accuracy_score').default(100).notNull(),
  userEmail: text('user_email'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('ai_responses_feedback_business_id_idx').on(table.businessId),
}));

export const knowledgeAnalytics = pgTable('knowledge_analytics', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  metricName: text('metric_name').notNull(), // e.g., 'most_used_documents', 'unused_documents', 'search_frequency', 'knowledge_gaps', 'ai_confidence_trends', 'corrections_history'
  metricValue: jsonb('metric_value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('knowledge_analytics_business_id_idx').on(table.businessId),
}));

export const multiAgentRegistry = pgTable('multi_agent_registry', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  capabilities: jsonb('capabilities').default('[]').notNull(),
  permissions: jsonb('permissions').default('[]').notNull(),
  knowledgeAccess: jsonb('knowledge_access').default('[]').notNull(),
  assignedTools: jsonb('assigned_tools').default('[]').notNull(),
  status: text('status').default('active').notNull(), // 'active', 'inactive', 'coaching'
  avatarColor: text('avatar_color').default('slate-500').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('multi_agent_registry_business_id_idx').on(table.businessId),
}));

export const multiAgentWorkflowRuns = pgTable('multi_agent_workflow_runs', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  workflowType: text('workflow_type').notNull(), // e.g., 'new_customer', 'estimate_request', 'invoice_reminder'
  status: text('status').default('pending').notNull(), // 'pending', 'in_progress', 'completed', 'failed', 'needs_intervention'
  timeline: jsonb('timeline').default('[]').notNull(), // sequence of handoffs & agent thoughts
  sharedContext: jsonb('shared_context').default('{}').notNull(), // payload passed around
  supervisorLogs: jsonb('supervisor_logs').default('[]').notNull(), // supervisor agent monitor logs
  totalTokens: integer('total_tokens').default(0).notNull(),
  totalCost: text('total_cost').default('0.0').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('multi_agent_runs_business_id_idx').on(table.businessId),
}));

export const multiAgentPerformance = pgTable('multi_agent_performance', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  agentRole: text('agent_role').notNull(), // e.g. 'receptionist', 'sales_manager'
  tasksCompleted: integer('tasks_completed').default(0).notNull(),
  successRate: integer('success_rate').default(100).notNull(),
  avgCompletionTimeSec: integer('avg_completion_time_sec').default(0).notNull(),
  handoffSuccessRate: integer('handoff_success_rate').default(100).notNull(),
  customerSatisfaction: integer('customer_satisfaction').default(95).notNull(),
  costUsd: text('cost_usd').default('0.0').notNull(),
  tokenUsage: integer('token_usage').default(0).notNull(),
  failureReasons: jsonb('failure_reasons').default('[]').notNull(),
  coachingRecommendations: jsonb('coaching_recommendations').default('[]').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('multi_agent_perf_business_id_idx').on(table.businessId),
}));

export const businessObjectives = pgTable('business_objectives', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  owner: text('owner').notNull(),
  priority: text('priority').notNull(), // 'low', 'medium', 'high', 'critical'
  deadline: text('deadline').notNull(),
  successMetrics: jsonb('success_metrics').default('[]').notNull(), // list of metric expectations
  progress: integer('progress').default(0).notNull(), // 0 to 100
  riskLevel: text('risk_level').default('low').notNull(), // 'low', 'medium', 'high'
  status: text('status').default('not_started').notNull(), // 'not_started', 'planning', 'in_progress', 'completed', 'behind_schedule', 'at_risk'
  dependencies: jsonb('dependencies').default('[]').notNull(), // titles or IDs of depending objectives/tasks
  actualCost: text('actual_cost').default('0.00').notNull(),
  actualRoi: text('actual_roi').default('0.00').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('business_obj_business_id_idx').on(table.businessId),
}));

export const objectiveExecutionPlans = pgTable('objective_execution_plans', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  objectiveId: integer('objective_id').references(() => businessObjectives.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  tasks: jsonb('tasks').default('[]').notNull(), // array of plans, agents, tools, ROI, risk, duration, approval type
  estimatedRoi: text('estimated_roi').notNull(),
  estimatedCost: text('estimated_cost').notNull(),
  timeEstimate: text('time_estimate').notNull(),
  businessImpact: text('business_impact').notNull(),
  confidenceScore: integer('confidence_score').default(85).notNull(),
  explanation: text('explanation').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected', 'executed'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('obj_exec_plan_business_id_idx').on(table.businessId),
}));

export const autonomousApprovals = pgTable('autonomous_approvals', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  requestType: text('request_type').notNull(), // e.g. 'execute_campaign', 'pricing_update', 'refund', 'inventory_buy'
  requesterRole: text('requester_role').notNull(), // AI Specialist Role
  requiredRole: text('required_role').notNull(), // e.g. 'owner', 'manager', 'finance', 'legal'
  status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected'
  payload: jsonb('payload').default('{}').notNull(), // payload of the request
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('auto_appr_business_id_idx').on(table.businessId),
}));

export const executiveBriefings = pgTable('executive_briefings', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  targetRole: text('target_role').notNull(), // 'ceo', 'cfo', 'marketing', 'sales', 'operations', 'customer_success'
  briefingDate: text('briefing_date').notNull(), // YYYY-MM-DD
  yesterdaySummary: text('yesterday_summary').notNull(),
  todayFocus: text('today_focus').notNull(),
  risksDetected: jsonb('risks_detected').default('[]').notNull(),
  winsYesterday: jsonb('wins_yesterday').default('[]').notNull(),
  recommendedPriorities: jsonb('recommended_priorities').default('[]').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('exec_brief_business_id_idx').on(table.businessId),
}));

// Phase 53: Unified Communications & Voice AI Platform Tables
export const receptionistConfig = pgTable('receptionist_config', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull().unique(),
  enabled: boolean('enabled').default(true).notNull(),
  greetScript: text('greet_script').notNull(),
  leadQualRules: jsonb('lead_qual_rules').default('[]').notNull(), // fields to qualify e.g. name, phone, issue, budget
  emergencyRouting: text('emergency_routing').notNull(), // phone number to route emergencies to
  businessHours: jsonb('business_hours').default('{}').notNull(), // e.g. {monday: {start: '09:00', end: '17:00'}}
  escalationRules: jsonb('escalation_rules').default('[]').notNull(), // array of escalation paths
  voiceProfile: text('voice_profile').default('en-US-Neural2-F').notNull(),
  voicemailDetection: boolean('voicemail_detection').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const unifiedCommsTimeline = pgTable('unified_comms_timeline', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  leadId: text('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'call', 'sms', 'email', 'appointment', 'invoice', 'review', 'marketing', 'chat', 'note'
  title: text('title').notNull(),
  content: text('content').notNull(),
  status: text('status'), // 'completed', 'sent', 'pending', 'paid', 'missed', etc.
  assignedAgent: text('assigned_agent'),
  metadata: jsonb('metadata').default('{}').notNull(), // e.g. duration, recording_url, rating, amount
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('comms_timeline_business_id_idx').on(table.businessId),
}));

// Phase 54: AI App Marketplace & Extension Platform Tables
export const marketplaceApps = pgTable('marketplace_apps', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  appId: text('app_id').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  permissionsGranted: jsonb('permissions_granted').default('[]').notNull(), // Scopes e.g. ["tenant_data", "secrets", "crm", "billing"]
  version: text('version').default('1.0.0').notNull(),
  digitalSignature: text('digital_signature').default('sha256-verified-core').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessAppIdx: index('marketplace_business_app_idx').on(table.businessId, table.appId),
}));

export const marketplaceAppAnalytics = pgTable('marketplace_app_analytics', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  appId: text('app_id').notNull(),
  eventType: text('event_type').notNull(), // 'install', 'update', 'uninstall', 'execution', 'failure', 'sandbox_blocked'
  status: text('status').default('success').notNull(), // 'success', 'error'
  durationMs: integer('duration_ms').default(0).notNull(),
  message: text('message'),
  metadata: jsonb('metadata').default('{}').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  analyticsBusinessAppIdx: index('analytics_business_app_idx').on(table.businessId, table.appId),
}));

// Phase 61: Durable Application State & Persistent Background Job Queue
export const competitors = pgTable('competitors', {
  id: serial('id').primaryKey(),
  businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  pricing: text('pricing').notNull(),
  reviews: text('reviews').notNull(),
  advantages: text('advantages').notNull(),
  weaknesses: text('weaknesses').notNull(),
  tactics: text('tactics').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('competitors_business_id_idx').on(table.businessId),
}));

export const backgroundJobs = pgTable('background_jobs', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull(),
  queue: text('queue').default('default').notNull(),
  type: text('type').notNull(),
  payload: jsonb('payload').default('{}').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed', 'dead_letter'
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  idempotencyKey: text('idempotency_key'),
  lockedAt: timestamp('locked_at'),
  lockedBy: text('locked_by'),
  lastError: text('last_error'),
  runAt: timestamp('run_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  businessIdIdx: index('background_jobs_business_id_idx').on(table.businessId),
  statusIdx: index('background_jobs_status_idx').on(table.status),
  idempotencyKeyIdx: index('background_jobs_idempotency_key_idx').on(table.idempotencyKey),
}));

// Durable Multi-Tenant Connection Hub & Worker Activation Engine Tables
export const encryptedCredentials = pgTable('encrypted_credentials', {
  id: serial('id').primaryKey(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  connectorId: text('connector_id').notNull(),
  encryptedData: text('encrypted_data').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  keyVersion: text('key_version').default('v2:gcm').notNull(),
  redactedPreview: text('redacted_preview').notNull(),
  expiresAt: timestamp('expires_at'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantConnectorIdx: index('encrypted_credentials_tenant_connector_idx').on(table.tenantId, table.connectorId),
}));

export const oauthStates = pgTable('oauth_states', {
  token: text('token').primaryKey(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').notNull(),
  connectorId: text('connector_id').notNull(),
  redirectUri: text('redirect_uri').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  usedAt: timestamp('used_at'),
}, (table) => ({
  tenantTokenIdx: index('oauth_states_tenant_token_idx').on(table.tenantId, table.token),
}));

export const workerConfigurations = pgTable('worker_configurations', {
  id: serial('id').primaryKey(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  workerId: text('worker_id').notNull(),
  workerRole: text('worker_role').notNull(),
  activationState: text('activation_state').notNull(),
  approvalPolicy: text('approval_policy').default('ALWAYS_ASK').notNull(),
  requiredConnectors: jsonb('required_connectors').default('[]').notNull(),
  missingDependencies: jsonb('missing_dependencies').default('[]').notNull(),
  activationBlockers: jsonb('activation_blockers').default('[]').notNull(),
  stateHistory: jsonb('state_history').default('[]').notNull(),
  lastExecutionAt: timestamp('last_execution_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantWorkerIdx: index('worker_config_tenant_worker_idx').on(table.tenantId, table.workerId),
}));

export const approvalRequests = pgTable('approval_requests', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  workerId: text('worker_id').notNull(),
  executionId: text('execution_id').notNull(),
  actionType: text('action_type').notNull(),
  isHighRisk: boolean('is_high_risk').default(false).notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'
  payload: jsonb('payload').default('{}').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantExecutionIdx: index('approval_requests_tenant_exec_idx').on(table.tenantId, table.executionId),
}));

export const workflowExecutions = pgTable('workflow_executions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  workerId: text('worker_id').notNull(),
  workflowType: text('workflow_type').notNull(),
  status: text('status').default('PENDING_APPROVAL').notNull(), // 'PENDING_APPROVAL', 'APPROVED', 'SENT_SIMULATED', 'EVENT_CREATED', 'FAILED'
  idempotencyKey: text('idempotency_key').unique(),
  payload: jsonb('payload').default('{}').notNull(),
  result: jsonb('result').default('{}').notNull(),
  steps: jsonb('steps').default('[]').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantWorkflowIdx: index('workflow_exec_tenant_type_idx').on(table.tenantId, table.workflowType),
}));

export const auditEvents = pgTable('audit_events', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  actor: text('actor').notNull(),
  actionType: text('action_type').notNull(),
  targetConnectorOrWorker: text('target_connector_or_worker').notNull(),
  details: text('details').notNull(),
  status: text('status').default('SUCCESS').notNull(),
  externalRefId: text('external_ref_id'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  tenantTimestampIdx: index('audit_events_tenant_time_idx').on(table.tenantId, table.timestamp),
}));

export const deployableImprovements = pgTable('deployable_improvements', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  opportunityId: text('opportunity_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  problemBeingSolved: text('problem_being_solved').notNull(),
  capabilityType: text('capability_type').notNull(),
  businessOutcome: text('business_outcome').notNull(),
  scenarios: jsonb('scenarios').default('[]').notNull(),
  assumptions: jsonb('assumptions').default('[]').notNull(),
  confidenceScore: real('confidence_score').default(0.8).notNull(),
  risks: jsonb('risks').default('[]').notNull(),
  requiredConnectors: jsonb('required_connectors').default('[]').notNull(),
  requiredCredentials: jsonb('required_credentials').default('[]').notNull(),
  requiredApprovals: jsonb('required_approvals').default('[]').notNull(),
  dependencies: jsonb('dependencies').default('[]').notNull(),
  deploymentStatus: text('deployment_status').default('recommended').notNull(),
  measurementPlan: jsonb('measurement_plan').default('{}').notNull(),
  activeDeploymentAttemptId: text('active_deployment_attempt_id'),
  lastApprovalId: text('last_approval_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantImprovementIdx: index('deployable_imp_tenant_idx').on(table.tenantId, table.deploymentStatus),
}));

export const improvementApprovals = pgTable('improvement_approvals', {
  id: text('id').primaryKey(),
  improvementId: text('improvement_id').references(() => deployableImprovements.id, { onDelete: 'cascade' }).notNull(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  approver: text('approver').notNull(),
  approvedScope: jsonb('approved_scope').default('[]').notNull(),
  policyUsed: text('policy_used').notNull(),
  expiresAt: timestamp('expires_at'),
  rejectionReason: text('rejection_reason'),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantApprovalIdx: index('imp_approval_tenant_idx').on(table.tenantId, table.improvementId),
}));

export const improvementDeploymentAttempts = pgTable('improvement_deployment_attempts', {
  id: text('id').primaryKey(),
  improvementId: text('improvement_id').references(() => deployableImprovements.id, { onDelete: 'cascade' }).notNull(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  attemptNumber: integer('attempt_number').notNull(),
  status: text('status').notNull(),
  log: jsonb('log').default('[]').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  rollbackLog: jsonb('rollback_log').default('[]'),
}, (table) => ({
  tenantAttemptIdx: index('imp_attempt_tenant_idx').on(table.tenantId, table.improvementId),
}));

export const improvementPerformanceResults = pgTable('improvement_performance_results', {
  id: text('id').primaryKey(),
  improvementId: text('improvement_id').references(() => deployableImprovements.id, { onDelete: 'cascade' }).notNull(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  evaluationDate: timestamp('evaluation_date').defaultNow().notNull(),
  status: text('status').notNull(),
  comparisonToBaseline: jsonb('comparison_to_baseline').default('{}').notNull(),
  comparisonToScenarios: jsonb('comparison_to_scenarios').default('{}').notNull(),
  financialBenefitStatus: text('financial_benefit_status').notNull(),
  recommendation: text('recommendation').notNull(),
  notes: text('notes'),
}, (table) => ({
  tenantPerfIdx: index('imp_perf_tenant_idx').on(table.tenantId, table.improvementId),
}));

export const aiAccessibilityAudits = pgTable('ai_accessibility_audits', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  websiteUrl: text('website_url').notNull(),
  findings: jsonb('findings').default('[]').notNull(),
  scores: jsonb('scores').default('{}').notNull(),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
}, (table) => ({
  tenantAuditIdx: index('ai_access_audit_tenant_idx').on(table.tenantId, table.evaluatedAt),
}));






