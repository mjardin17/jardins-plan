import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitFork, Play, Clock, Sliders, CheckCircle, AlertTriangle, 
  HelpCircle, Sparkles, Plus, Trash2, ArrowRight, Save, ToggleLeft, 
  ToggleRight, RefreshCw, Layers, Database, ArrowDown, Bot, Phone, Mail, 
  UserPlus, FileText, CheckSquare, Zap, Activity, Users, ShieldAlert, 
  ShieldCheck, Lock, Key, Globe, Share2, TrendingUp, Cpu, CheckCircle2, 
  AlertCircle, ChevronRight, ChevronDown, RefreshCcw, DollarSign, MessageSquare
} from 'lucide-react';

interface Connector {
  id: string;
  name: string;
  category: 'crm' | 'accounting' | 'calendar' | 'email' | 'sms' | 'payment' | 'storage' | 'pm' | 'ecommerce' | 'comm' | 'marketing' | 'bi';
  icon: React.ReactNode;
  provider: string;
  authType: 'OAuth 2.0' | 'API Key' | 'Mutual TLS' | 'Custom Tokens';
  status: 'active' | 'degraded' | 'inactive';
  permissions: string[];
  recentRequests: number;
  maxRequests: number;
  latencyMs: number;
  version: string;
  recentFailuresCount: number;
  lastUsed: string;
  authConfigured: boolean;
  rateLimitResetSec: number;
  retryStrategy: {
    maxRetries: number;
    backoff: 'exponential' | 'linear';
    fallbackActive: boolean;
  };
}

interface WorkflowStep {
  id: string;
  type: 'condition' | 'loop' | 'delay' | 'ai_decision' | 'human_approval' | 'action_email' | 'action_sms' | 'action_mcp' | 'parallel';
  title: string;
  config: {
    prompt?: string;
    delayMinutes?: number;
    value?: string;
    operator?: string;
    retries?: number;
    branches?: WorkflowStep[][]; // for parallel branches
    approvalRole?: string;
  };
  status?: 'idle' | 'running' | 'completed' | 'failed' | 'waiting';
}

interface Workflow {
  id: string;
  name: string;
  triggerEvent: string;
  isEnabled: boolean;
  steps: WorkflowStep[];
  createdAt: string;
}

interface EventBusSubscription {
  id: string;
  eventId: string;
  connectorId: string;
  secureScope: string;
  status: 'active' | 'paused';
}

interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  trigger: string;
  status: 'success' | 'failed' | 'running' | 'waiting';
  startedAt: string;
  durationMs: number;
  auditTrail: string[];
}

export default function VisualWorkflowBuilder({ businessId }: { businessId: string }) {
  // Navigation tabs for the dashboard
  const [activeTab, setActiveTab] = useState<'workflows' | 'connectors' | 'health' | 'event_bus' | 'security'>('workflows');

  // Loaders
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Workflow builder list & selected state
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  
  // Active workflow details inside the editor
  const [workflowName, setWorkflowName] = useState('Lead Quick-Response Router');
  const [triggerEvent, setTriggerEvent] = useState('new_lead');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  // Simulation execution state
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState<number>(-1);
  const [simLog, setSimLog] = useState<string[]>([]);
  const [pendingApprovalStep, setPendingApprovalStep] = useState<{ workflowId: string; stepId: string; title: string } | null>(null);

  // Connection Registry
  const [connectors, setConnectors] = useState<Connector[]>([
    {
      id: 'crm-salesforce',
      name: 'Salesforce CRM Suite',
      category: 'crm',
      icon: <Users size={16} className="text-blue-500" />,
      provider: 'Salesforce Inc.',
      authType: 'OAuth 2.0',
      status: 'active',
      permissions: ['contacts.read', 'leads.write', 'opportunities.manage'],
      recentRequests: 2140,
      maxRequests: 5000,
      latencyMs: 142,
      version: 'v57.0',
      recentFailuresCount: 0,
      lastUsed: '2026-07-18 16:11',
      authConfigured: true,
      rateLimitResetSec: 340,
      retryStrategy: { maxRetries: 3, backoff: 'exponential', fallbackActive: true }
    },
    {
      id: 'accounting-quickbooks',
      name: 'QuickBooks Ledger',
      category: 'accounting',
      icon: <Database size={16} className="text-emerald-500" />,
      provider: 'Intuit Corp',
      authType: 'OAuth 2.0',
      status: 'active',
      permissions: ['invoices.read', 'payments.write', 'ledger.audit'],
      recentRequests: 840,
      maxRequests: 3000,
      latencyMs: 185,
      version: 'v4_REST',
      recentFailuresCount: 1,
      lastUsed: '2026-07-18 15:45',
      authConfigured: true,
      rateLimitResetSec: 920,
      retryStrategy: { maxRetries: 4, backoff: 'exponential', fallbackActive: true }
    },
    {
      id: 'calendar-google',
      name: 'Google Calendar API',
      category: 'calendar',
      icon: <Clock size={16} className="text-red-500" />,
      provider: 'Google Workspace',
      authType: 'OAuth 2.0',
      status: 'active',
      permissions: ['calendar.events.write', 'calendar.freebusy.read'],
      recentRequests: 4120,
      maxRequests: 10000,
      latencyMs: 92,
      version: 'v3_OAuth',
      recentFailuresCount: 0,
      lastUsed: '2026-07-18 16:20',
      authConfigured: true,
      rateLimitResetSec: 150,
      retryStrategy: { maxRetries: 3, backoff: 'linear', fallbackActive: false }
    },
    {
      id: 'email-sendgrid',
      name: 'SendGrid Mail Carrier',
      category: 'email',
      icon: <Mail size={16} className="text-sky-500" />,
      provider: 'Twilio SendGrid',
      authType: 'API Key',
      status: 'active',
      permissions: ['mail.send', 'templates.read'],
      recentRequests: 1890,
      maxRequests: 15000,
      latencyMs: 110,
      version: 'v3',
      recentFailuresCount: 0,
      lastUsed: '2026-07-18 16:18',
      authConfigured: true,
      rateLimitResetSec: 480,
      retryStrategy: { maxRetries: 3, backoff: 'exponential', fallbackActive: true }
    },
    {
      id: 'sms-twilio',
      name: 'Twilio SMS Core',
      category: 'sms',
      icon: <Phone size={16} className="text-rose-500" />,
      provider: 'Twilio Inc.',
      authType: 'API Key',
      status: 'active',
      permissions: ['sms.send', 'numbers.lookup'],
      recentRequests: 3220,
      maxRequests: 10000,
      latencyMs: 105,
      version: 'v2010_REST',
      recentFailuresCount: 0,
      lastUsed: '2026-07-18 16:22',
      authConfigured: true,
      rateLimitResetSec: 210,
      retryStrategy: { maxRetries: 5, backoff: 'exponential', fallbackActive: true }
    },
    {
      id: 'payment-stripe',
      name: 'Stripe Payment Gateway',
      category: 'payment',
      icon: <DollarSign size={16} className="text-purple-500" />,
      provider: 'Stripe Inc.',
      authType: 'API Key',
      status: 'active',
      permissions: ['charges.create', 'refunds.write', 'checkout.sessions'],
      recentRequests: 1450,
      maxRequests: 8000,
      latencyMs: 115,
      version: '2023-10-16',
      recentFailuresCount: 0,
      lastUsed: '2026-07-18 16:19',
      authConfigured: true,
      rateLimitResetSec: 120,
      retryStrategy: { maxRetries: 3, backoff: 'exponential', fallbackActive: true }
    },
    {
      id: 'storage-aws-s3',
      name: 'Amazon S3 Object Storage',
      category: 'storage',
      icon: <Database size={16} className="text-amber-500" />,
      provider: 'Amazon Web Services',
      authType: 'API Key',
      status: 'active',
      permissions: ['s3.bucket.read', 's3.object.write'],
      recentRequests: 620,
      maxRequests: 20000,
      latencyMs: 135,
      version: 'v4_Signature',
      recentFailuresCount: 0,
      lastUsed: '2026-07-18 14:10',
      authConfigured: true,
      rateLimitResetSec: 850,
      retryStrategy: { maxRetries: 3, backoff: 'linear', fallbackActive: false }
    },
    {
      id: 'pm-jira',
      name: 'Jira Work Management',
      category: 'pm',
      icon: <FileText size={16} className="text-indigo-500" />,
      provider: 'Atlassian',
      authType: 'OAuth 2.0',
      status: 'degraded',
      permissions: ['issues.write', 'projects.read'],
      recentRequests: 420,
      maxRequests: 2000,
      latencyMs: 290,
      version: 'v3_REST',
      recentFailuresCount: 4,
      lastUsed: '2026-07-18 15:30',
      authConfigured: true,
      rateLimitResetSec: 110,
      retryStrategy: { maxRetries: 3, backoff: 'exponential', fallbackActive: true }
    },
    {
      id: 'ecommerce-shopify',
      name: 'Shopify Store Connector',
      category: 'ecommerce',
      icon: <Zap size={16} className="text-lime-600" />,
      provider: 'Shopify Inc.',
      authType: 'OAuth 2.0',
      status: 'active',
      permissions: ['orders.read', 'inventory.sync'],
      recentRequests: 1120,
      maxRequests: 5000,
      latencyMs: 124,
      version: '2024-04',
      recentFailuresCount: 0,
      lastUsed: '2026-07-18 16:02',
      authConfigured: true,
      rateLimitResetSec: 320,
      retryStrategy: { maxRetries: 3, backoff: 'exponential', fallbackActive: true }
    },
    {
      id: 'comm-slack',
      name: 'Slack Notification Dispatcher',
      category: 'comm',
      icon: <MessageSquare size={16} className="text-pink-600" />,
      provider: 'Slack Technologies',
      authType: 'OAuth 2.0',
      status: 'active',
      permissions: ['chat.write', 'channels.read'],
      recentRequests: 2540,
      maxRequests: 8000,
      latencyMs: 82,
      version: 'WebAPI',
      recentFailuresCount: 0,
      lastUsed: '2026-07-18 16:21',
      authConfigured: true,
      rateLimitResetSec: 420,
      retryStrategy: { maxRetries: 3, backoff: 'linear', fallbackActive: false }
    },
    {
      id: 'marketing-hubspot',
      name: 'HubSpot Marketing Automation',
      category: 'marketing',
      icon: <TrendingUp size={16} className="text-orange-500" />,
      provider: 'HubSpot Inc.',
      authType: 'OAuth 2.0',
      status: 'active',
      permissions: ['contacts.write', 'campaigns.read'],
      recentRequests: 1320,
      maxRequests: 4000,
      latencyMs: 165,
      version: 'v3_CRM',
      recentFailuresCount: 0,
      lastUsed: '2026-07-18 15:58',
      authConfigured: true,
      rateLimitResetSec: 510,
      retryStrategy: { maxRetries: 4, backoff: 'exponential', fallbackActive: true }
    },
    {
      id: 'bi-tableau',
      name: 'Tableau Business Intelligence',
      category: 'bi',
      icon: <Activity size={16} className="text-cyan-500" />,
      provider: 'Salesforce',
      authType: 'Custom Tokens',
      status: 'inactive',
      permissions: ['reports.embed', 'data.extract'],
      recentRequests: 0,
      maxRequests: 1000,
      latencyMs: 0,
      version: 'v3.18',
      recentFailuresCount: 0,
      lastUsed: 'Never',
      authConfigured: false,
      rateLimitResetSec: 0,
      retryStrategy: { maxRetries: 3, backoff: 'exponential', fallbackActive: true }
    }
  ]);

  // Event Catalog
  const EVENT_BUS_EVENTS = [
    { id: 'new_lead', name: 'New Lead Created', desc: 'Fires when a customer profile is initiated via web forms, widget chats, or human imports.', count: 42 },
    { id: 'invoice_paid', name: 'Invoice Paid', desc: 'Fires instantly upon successful cryptographic settlement confirmation from the payment processor.', count: 18 },
    { id: 'booking_confirmed', name: 'Booking Confirmed', desc: 'Triggered when a dispatch scheduler matches a crew slot with customer approval.', count: 32 },
    { id: 'call_missed', name: 'Call Missed', desc: 'Logged when a call center agent or AI responder records a dropped caller session.', count: 14 },
    { id: 'review_received', name: 'Customer Review Received', desc: 'Fired when post-visit rating submissions index into the active CRM logs.', count: 8 },
    { id: 'knowledge_updated', name: 'Knowledge Base Updated', desc: 'Fired when corporate SOP files or troubleshooting instructions are modified.', count: 5 },
    { id: 'ai_recommendation_accepted', name: 'AI Recommendation Accepted', desc: 'Fires when an executive operator accepts a living strategy or simulation parameter.', count: 12 }
  ];

  // Event Bus Subscriptions State
  const [eventSubscriptions, setEventSubscriptions] = useState<EventBusSubscription[]>([
    { id: 'SUB-001', eventId: 'new_lead', connectorId: 'crm-salesforce', secureScope: 'leads.write', status: 'active' },
    { id: 'SUB-002', eventId: 'invoice_paid', connectorId: 'accounting-quickbooks', secureScope: 'payments.write', status: 'active' },
    { id: 'SUB-003', eventId: 'booking_confirmed', connectorId: 'calendar-google', secureScope: 'calendar.events.write', status: 'active' },
    { id: 'SUB-004', eventId: 'call_missed', connectorId: 'comm-slack', secureScope: 'chat.write', status: 'active' },
    { id: 'SUB-005', eventId: 'review_received', connectorId: 'marketing-hubspot', secureScope: 'contacts.write', status: 'active' }
  ]);

  // Selected Connector for detail view
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>('crm-salesforce');

  // Trigger catalog definitions for Visual Workflow Editor
  const TRIGGERS = [
    { id: 'new_lead', name: 'New Lead Created', icon: <UserPlus size={14} className="text-emerald-500" /> },
    { id: 'invoice_paid', name: 'Invoice Paid', icon: <Zap size={14} className="text-emerald-500" /> },
    { id: 'booking_confirmed', name: 'Booking Confirmed', icon: <CheckSquare size={14} className="text-sky-500" /> },
    { id: 'call_missed', name: 'Call Missed', icon: <Phone size={14} className="text-amber-500" /> },
    { id: 'review_received', name: 'Review Received', icon: <Sparkles size={14} className="text-yellow-500" /> },
    { id: 'knowledge_updated', name: 'Knowledge Base Updated', icon: <FileText size={14} className="text-indigo-500" /> },
    { id: 'ai_recommendation_accepted', name: 'AI Recommendation Accepted', icon: <Bot size={14} className="text-purple-500" /> }
  ];

  // Available visual workflow action blocks
  const NODE_TYPES = [
    { type: 'condition', name: 'Condition Node', desc: 'If/Else variable routing branch', color: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100' },
    { type: 'loop', name: 'Loop Block', desc: 'Repeat action across items list', color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100' },
    { type: 'delay', name: 'Delay Gate', desc: 'Pause duration before next step', color: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100' },
    { type: 'ai_decision', name: 'AI Decision Block', desc: 'Use Gemini for cognitive branching', color: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100' },
    { type: 'human_approval', name: 'Human Approval Step', desc: 'Pause flow for operator confirmation', color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100' },
    { type: 'action_email', name: 'Send SMTP Email', desc: 'Outbox email notifying stakeholders', color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100' },
    { type: 'action_sms', name: 'Send Twilio SMS', desc: 'Deliver instant SMS notification', color: 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100' },
    { type: 'action_mcp', name: 'External MCP Connector', desc: 'Call downstream connected API route', color: 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' },
    { type: 'parallel', name: 'Parallel Branch', desc: 'Run multiple action sequences side-by-side', color: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100' }
  ];

  // Workflow logs history
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowExecutionLog[]>([
    {
      id: 'LOG-101',
      workflowId: 'WF-101',
      workflowName: 'Lead Quick-Response Router',
      trigger: 'New Lead Created',
      status: 'success',
      startedAt: '2026-07-18 14:32',
      durationMs: 480,
      auditTrail: [
        'Event bus intercepted "new_lead" event with ID: LD-7791.',
        'Step 1: Running cognitive sentiment parsing on "HVAC replacement request". Intent classified as HIGH.',
        'Step 2: Condition check matched. Proceeding along "is_high_intent" branch.',
        'Step 3: Dispatched Twilio SMS with customized booking URL payload. Status: SENT.',
        'Workflow completed successfully in 480ms.'
      ]
    },
    {
      id: 'LOG-102',
      workflowId: 'WF-102',
      workflowName: 'Instant QuickBooks Invoicer',
      trigger: 'Invoice Paid',
      status: 'success',
      startedAt: '2026-07-18 15:11',
      durationMs: 720,
      auditTrail: [
        'Event bus intercepted "invoice_paid" event with transactional schema hash.',
        'Step 1: Pushed settlement payload to QuickBooks REST. Authentication verified via secure crypt key.',
        'Step 2: Dispatched automated Slack confirmation notification to channel #revenue-alerts.',
        'Workflow completed successfully in 720ms.'
      ]
    }
  ]);

  // Initialize workspaces
  useEffect(() => {
    // Generate initial workflow templates if empty
    const initialWorkflowsList: Workflow[] = [
      {
        id: 'WF-101',
        name: 'Lead Quick-Response Router',
        triggerEvent: 'new_lead',
        isEnabled: true,
        steps: [
          { id: 'step-1', type: 'ai_decision', title: 'Qualify Lead Sentiment via Gemini', config: { prompt: 'Verify if lead has high intent and requires immediate dispatch helper.', retries: 3 } },
          { id: 'step-2', type: 'condition', title: 'Check If Qualified', config: { value: 'is_high_intent', operator: 'equals' } },
          { id: 'step-3', type: 'parallel', title: 'Execute Coordinated Outreach', config: {
            branches: [
              [
                { id: 'step-3a', type: 'action_sms', title: 'Send Automated Booking Invite', config: { prompt: 'Outbound text schedule link' } }
              ],
              [
                { id: 'step-3b', type: 'action_email', title: 'Dispatch PDF FAQ Sheet', config: { prompt: 'Outbound backup email' } }
              ]
            ]
          } }
        ],
        createdAt: '2026-07-12 11:00'
      },
      {
        id: 'WF-102',
        name: 'Instant QuickBooks Invoicer',
        triggerEvent: 'invoice_paid',
        isEnabled: true,
        steps: [
          { id: 'step-q1', type: 'action_mcp', title: 'Synchronize Intuit Ledger', config: { retries: 4 } },
          { id: 'step-q2', type: 'human_approval', title: 'Executive Approval: Match Invoice', config: { approvalRole: 'Owner' } },
          { id: 'step-q3', type: 'action_email', title: 'Dispatch Cryptographically Signed Receipt', config: { retries: 3 } }
        ],
        createdAt: '2026-07-14 14:22'
      }
    ];

    setWorkflows(initialWorkflowsList);
    setSelectedWorkflow(initialWorkflowsList[0]);
    setWorkflowName(initialWorkflowsList[0].name);
    setTriggerEvent(initialWorkflowsList[0].triggerEvent);
    setSteps(initialWorkflowsList[0].steps);
  }, []);

  const handleSelectWorkflow = (wf: Workflow) => {
    setSelectedWorkflow(wf);
    setWorkflowName(wf.name);
    setTriggerEvent(wf.triggerEvent);
    setSteps(wf.steps);
  };

  const addStep = (type: any) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      title: `New ${type.replace('_', ' ').toUpperCase()} Node`,
      config: { retries: 3, delayMinutes: 10 }
    };
    setSteps([...steps, newStep]);
  };

  const deleteStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleUpdateStepTitle = (id: string, newTitle: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  // Add event bus subscription
  const handleAddSubscription = (eventId: string, connectorId: string) => {
    const conn = connectors.find(c => c.id === connectorId);
    if (!conn) return;
    const newSub: EventBusSubscription = {
      id: `SUB-${Math.floor(Math.random() * 900) + 100}`,
      eventId,
      connectorId,
      secureScope: conn.permissions[0] || 'access.minimum',
      status: 'active'
    };
    setEventSubscriptions(prev => [...prev, newSub]);
    
    // Add audit trail logging
    const newLogItem = `Secured Event Bus Subscription created. Connected [${eventId.toUpperCase()}] event to [${conn.name}] under strict scope [${newSub.secureScope}].`;
    setWorkflowLogs(prev => [
      {
        id: `LOG-ADD-${Date.now()}`,
        workflowId: 'SEC-AUDIT',
        workflowName: 'Security & Access Control Configurator',
        trigger: 'System Audit Event',
        status: 'success',
        startedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        durationMs: 12,
        auditTrail: [newLogItem, 'Lease-privilege verified.', 'Tenant container sandbox: secured.']
      },
      ...prev
    ]);
  };

  // Remove subscription
  const handleRemoveSubscription = (subId: string) => {
    setEventSubscriptions(prev => prev.filter(s => s.id !== subId));
  };

  // Toggle Subscription status
  const handleToggleSubscription = (subId: string) => {
    setEventSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s));
  };

  // Save the workflow settings
  const saveWorkflow = async () => {
    setIsSaving(true);
    try {
      const updatedWf: Workflow = {
        id: selectedWorkflow ? selectedWorkflow.id : `WF-${Date.now()}`,
        name: workflowName,
        triggerEvent,
        isEnabled: selectedWorkflow ? selectedWorkflow.isEnabled : true,
        steps,
        createdAt: selectedWorkflow ? selectedWorkflow.createdAt : new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      if (selectedWorkflow) {
        setWorkflows(prev => prev.map(w => w.id === selectedWorkflow.id ? updatedWf : w));
      } else {
        setWorkflows(prev => [...prev, updatedWf]);
      }
      setSelectedWorkflow(updatedWf);
      alert('Universal Integration Fabric: Visual workflow saved securely. Cryptographic checksums registered.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Run the visual workflow execution simulation
  const triggerSimulationRun = () => {
    if (steps.length === 0) return;
    setIsRunningSim(true);
    setSimStepIndex(0);
    setSimLog([`[EVENT BUS] Intercepted trigger: ${triggerEvent.toUpperCase()}`]);
    setPendingApprovalStep(null);
  };

  // Run simulation steps incrementally
  useEffect(() => {
    if (!isRunningSim || simStepIndex < 0 || simStepIndex >= steps.length) {
      if (simStepIndex >= steps.length && isRunningSim) {
        setIsRunningSim(false);
        setSimStepIndex(-1);
        
        // Add final entry to logs list
        const logId = `LOG-SIM-${Date.now().toString().substring(8)}`;
        const newLog: WorkflowExecutionLog = {
          id: logId,
          workflowId: selectedWorkflow?.id || 'WF-SIM',
          workflowName: workflowName,
          trigger: TRIGGERS.find(t => t.id === triggerEvent)?.name || triggerEvent,
          status: 'success',
          startedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          durationMs: steps.length * 150,
          auditTrail: [...simLog, 'Simulation completed successfully. Zero persistent side effects generated.']
        };
        setWorkflowLogs(prev => [newLog, ...prev]);
      }
      return;
    }

    const timer = setTimeout(() => {
      const step = steps[simStepIndex];
      let stepDescription = ``;

      if (step.type === 'human_approval') {
        // Pause simulation and prompt approval in the sidebar
        setPendingApprovalStep({
          workflowId: selectedWorkflow?.id || 'WF-SIM',
          stepId: step.id,
          title: step.title
        });
        setIsRunningSim(false);
        setSimLog(prev => [...prev, `[PAUSED] Pending human approval at step: "${step.title}"`]);
        return;
      }

      if (step.type === 'ai_decision') {
        stepDescription = `[AI COGNITIVE DEVIATION] Step ${simStepIndex + 1}: Gemini analyzed trigger payload. Qualified branch returned positive.`;
      } else if (step.type === 'condition') {
        stepDescription = `[CONDITIONAL CHECK] Step ${simStepIndex + 1}: Operator match evaluated successfully. Value [${step.config.value || 'is_high_intent'}] checked.`;
      } else if (step.type === 'delay') {
        stepDescription = `[DELAY GATE] Step ${simStepIndex + 1}: Sleeping workflow state variables for ${step.config.delayMinutes || 10} minutes. Buffer simulated cleanly.`;
      } else if (step.type === 'action_sms') {
        stepDescription = `[SMS DISPATCH] Step ${simStepIndex + 1}: Triggered mock cellular SMS transmission. Payload checksum matches outbox schema.`;
      } else if (step.type === 'action_email') {
        stepDescription = `[SMTP CARRIER] Step ${simStepIndex + 1}: Composed SMTP payload with automated calendaring token blocks.`;
      } else if (step.type === 'action_mcp') {
        stepDescription = `[MCP CLIENT] Step ${simStepIndex + 1}: Verified signature scope, executing downstream connector tool. Success.`;
      } else if (step.type === 'parallel') {
        stepDescription = `[PARALLEL EXECUTION MULTIPLEX] Step ${simStepIndex + 1}: Forked execution state. Spawning parallel outreach sequences.`;
      } else {
        stepDescription = `[NODE EXECUTE] Step ${simStepIndex + 1}: Processed node "${step.title}" successfully.`;
      }

      setSimLog(prev => [...prev, stepDescription]);
      setSimStepIndex(prev => prev + 1);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isRunningSim, simStepIndex, steps]);

  // Handle manual approval
  const handleApproveStep = (approved: boolean) => {
    if (!pendingApprovalStep) return;
    
    const decisionText = approved ? 'APPROVED' : 'DENIED';
    setSimLog(prev => [
      ...prev,
      `[HUMAN IN THE LOOP] Operator ${decisionText} step "${pendingApprovalStep.title}". Resuming execution thread.`
    ]);
    
    setPendingApprovalStep(null);
    setSimStepIndex(prev => prev + 1);
    setIsRunningSim(true);
  };

  // Recommended actions click handlers
  const handleFixConnector = (connectorId: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        return {
          ...c,
          status: 'active',
          recentFailuresCount: 0,
          latencyMs: 120
        };
      }
      return c;
    }));
    alert(`Recommended Actions Triggered: rotated OAuth credentials and synchronized least-privilege scopes for [${connectorId}]. Status restored to ACTIVE.`);
  };

  // Toggle least privilege permission scopes
  const handleToggleScope = (connectorId: string, permission: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        const hasPermission = c.permissions.includes(permission);
        const updatedPermissions = hasPermission 
          ? c.permissions.filter(p => p !== permission)
          : [...c.permissions, permission];
        return { ...c, permissions: updatedPermissions };
      }
      return c;
    }));
  };

  const getConnectorCount = (status: 'active' | 'degraded' | 'inactive') => {
    return connectors.filter(c => c.status === status).length;
  };

  const averageLatency = Math.round(
    connectors.filter(c => c.status !== 'inactive').reduce((acc, curr) => acc + curr.latencyMs, 0) / 
    connectors.filter(c => c.status !== 'inactive').length
  );

  return (
    <div className="space-y-6" id="integration-automation-fabric-panel">
      {/* Universal Top Branding Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg" id="integration-hero">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.35),transparent)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-black border border-indigo-500/20 uppercase tracking-widest">
              <GitFork size={11} className="text-indigo-400 animate-pulse" /> Orchestration Control Suite
            </div>
            <h1 className="text-2xl font-black tracking-tight">Phase 58: Universal Integration & Automation Fabric</h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Transform AI Workforce OS into the central orchestration engine for your company. Standardize credentials, wire event-driven visual workflow paths, subscribe secure pipelines via the event bus, and monitor infrastructure telemetry through the health center.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 shrink-0">
            <div className="text-center">
              <span className="block text-[9px] font-black text-slate-400 uppercase">Engine Status</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Orchestrator Online
              </span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700" />
            <div className="text-center">
              <span className="block text-[9px] font-black text-slate-400 uppercase">Telemetry Latency</span>
              <span className="text-xs font-bold text-sky-400 mt-0.5">{averageLatency}ms AVG</span>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Integration Controls Submenu Tabs */}
      <div className="bg-white border border-slate-100 rounded-2xl p-2 flex items-center justify-between shadow-sm overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          {[
            { id: 'workflows', label: 'Visual Workflow Studio', icon: <GitFork size={13} /> },
            { id: 'connectors', label: 'Connector Catalog', icon: <Layers size={13} /> },
            { id: 'health', label: 'Health & Quota Center', icon: <Activity size={13} /> },
            { id: 'event_bus', label: 'Secure Event Bus', icon: <Database size={13} /> },
            { id: 'security', label: 'Least-Privilege Crypt Vault', icon: <Lock size={13} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black shrink-0">
          <ShieldCheck size={12} className="animate-pulse" />
          <span>Tenant Isolated Container: SECURE</span>
        </div>
      </div>

      {/* ======================================= */}
      {/* TAB 1: VISUAL WORKFLOW BUILDER STUDIO */}
      {/* ======================================= */}
      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="visual-workflow-studio-panel">
          
          {/* Controls & Steps Catalogue Side-panel */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Choose Workflow */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Orchestrations</p>
              <div className="space-y-1.5">
                {workflows.map(wf => (
                  <button
                    key={wf.id}
                    onClick={() => handleSelectWorkflow(wf)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedWorkflow?.id === wf.id 
                        ? 'border-indigo-600 bg-indigo-50/10 text-indigo-950 font-bold'
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="block truncate">{wf.name}</span>
                      <span className="block text-[8px] text-slate-400">Trigger: {wf.triggerEvent}</span>
                    </div>
                    <span className={`h-2 w-2 rounded-full ${wf.isEnabled ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setSelectedWorkflow(null);
                  setWorkflowName('Custom Pipeline ' + (workflows.length + 1));
                  setTriggerEvent('new_lead');
                  setSteps([]);
                }}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl text-slate-700 font-extrabold text-[10px] uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus size={11} /> Create custom pipeline
              </button>
            </div>

            {/* Step 1: Choose Trigger Event */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Choose Subscribed Trigger</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {TRIGGERS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTriggerEvent(t.id)}
                    className={`w-full text-left p-2 rounded-xl border text-[11px] font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                      triggerEvent === t.id 
                        ? 'bg-indigo-50/80 border-indigo-400/80 text-indigo-950 shadow-sm'
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {t.icon}
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Visual Node catalog */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Action Block Catalog</p>
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                {NODE_TYPES.map(n => (
                  <button
                    key={n.type}
                    onClick={() => addStep(n.type)}
                    className={`p-2.5 border rounded-xl text-left transition-all hover:shadow cursor-pointer ${n.color}`}
                  >
                    <h4 className="text-[11px] font-black flex items-center gap-1.5">
                      <Plus size={10} />
                      {n.name}
                    </h4>
                    <p className="text-[8px] text-slate-500 font-medium mt-0.5 leading-normal">{n.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center visual graph workspace */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 space-y-5">
              
              {/* Settings Header bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2 flex-1">
                  <Sliders size={16} className="text-indigo-600" />
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="text-sm font-black text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full"
                    placeholder="Enter Workflow Name"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerSimulationRun}
                    disabled={isRunningSim || steps.length === 0}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play size={11} /> Simulate Run
                  </button>
                  <button
                    onClick={saveWorkflow}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={11} /> {isSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>

              {/* Graphical nodes alignment canvas */}
              <div className="space-y-4 relative flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[400px]">
                
                {/* Visual Connector Lines Grid behind */}
                <div className="absolute inset-y-0 w-[2px] bg-slate-200/60 left-1/2 -ml-[1px] z-0" />

                {/* Subscribed Trigger Node representation */}
                <div className="w-full max-w-sm bg-slate-900 text-white border border-slate-950 p-4 rounded-2xl shadow-md text-center relative z-10">
                  <span className="block text-[8px] font-black uppercase tracking-widest text-indigo-300">SECURE EVENT BUS INTERCEPTOR</span>
                  <h4 className="text-xs font-black mt-1 flex items-center justify-center gap-1.5">
                    {TRIGGERS.find(t => t.id === triggerEvent)?.icon}
                    <span>When: {TRIGGERS.find(t => t.id === triggerEvent)?.name || triggerEvent}</span>
                  </h4>
                  <div className="mt-1 flex items-center justify-center gap-2 text-[8px] text-slate-400 font-bold">
                    <span>Tenant isolated: YES</span>
                    <span>•</span>
                    <span>Credential scopes checked: VERIFIED</span>
                  </div>
                </div>

                {/* Empty flowchart indicator */}
                {steps.length === 0 ? (
                  <div className="w-full max-w-sm bg-white border border-dashed border-slate-200 p-8 rounded-2xl text-center text-slate-400 relative z-10 mt-6">
                    <ArrowDown className="mx-auto text-slate-300 animate-bounce mb-2" size={24} />
                    <p className="text-xs font-black text-slate-800">Visual Flow Is Empty</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Select specialized triggers and action block nodes from the panels on the left to map operational routes.</p>
                  </div>
                ) : (
                  steps.map((step, idx) => {
                    const isStepRunning = isRunningSim && simStepIndex === idx;
                    const isStepCompleted = isRunningSim && simStepIndex > idx;
                    const isStepIdle = !isRunningSim || simStepIndex < idx;

                    return (
                      <React.Fragment key={step.id}>
                        {/* Downward connecting arrow icon */}
                        <div className="flex flex-col items-center relative z-10">
                          <ArrowDown size={14} className={`text-slate-300 my-1 ${isStepRunning ? 'text-indigo-500 animate-bounce' : ''}`} />
                        </div>

                        {/* Node Card */}
                        <div className={`w-full max-w-md bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative z-10 ${
                          isStepRunning ? 'border-indigo-500 ring-2 ring-indigo-100' :
                          isStepCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-150'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`h-5 w-5 rounded-full font-black text-[10px] flex items-center justify-center ${
                                isStepRunning ? 'bg-indigo-600 text-white animate-pulse' :
                                isStepCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {isStepCompleted ? '✓' : idx + 1}
                              </span>
                              <div>
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => handleUpdateStepTitle(step.id, e.target.value)}
                                  className="text-xs font-black text-slate-800 bg-transparent border-b border-transparent focus:outline-none focus:border-indigo-400"
                                />
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">{step.type.replace('_', ' ')} Block</span>
                                  {isStepRunning && <span className="text-[8px] font-black text-indigo-600 animate-pulse uppercase">Executing...</span>}
                                  {isStepCompleted && <span className="text-[8px] font-black text-emerald-600 uppercase">Success</span>}
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={() => deleteStep(step.id)}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Node configurations based on block type */}
                          <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-[10px]">
                            {step.type === 'ai_decision' && (
                              <div className="space-y-1">
                                <span className="font-bold text-slate-500 uppercase text-[8px]">Cognitive Reasoning Prompt (Gemini API)</span>
                                <textarea 
                                  className="w-full bg-white border border-slate-200 p-2 rounded text-[10px] font-mono leading-relaxed"
                                  placeholder="Formulate instructions for Gemini triage criteria..."
                                  defaultValue={step.config?.prompt || ""}
                                />
                              </div>
                            )}

                            {step.type === 'delay' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-500 uppercase text-[8px]">Duration Timer Gate:</span>
                                <input 
                                  type="number" 
                                  className="w-16 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-center text-slate-800 font-bold" 
                                  defaultValue={step.config?.delayMinutes || 10} 
                                />
                                <span className="text-slate-400">minutes buffer</span>
                              </div>
                            )}

                            {step.type === 'condition' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-500 uppercase text-[8px]">Router Match:</span>
                                <select className="bg-white border border-slate-200 rounded p-0.5 text-[9px] font-bold">
                                  <option>Equals</option>
                                  <option>Contains</option>
                                  <option>Greater Than</option>
                                </select>
                                <input 
                                  type="text" 
                                  className="w-28 bg-white border border-slate-200 px-2 py-0.5 rounded text-[9px] font-mono" 
                                  placeholder="match value..." 
                                  defaultValue={step.config?.value || ""} 
                                />
                              </div>
                            )}

                            {step.type === 'human_approval' && (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-indigo-600 uppercase text-[8px] flex items-center gap-0.5">
                                    <Users size={9} /> Human Approval Required
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400">Clearance Role: Owner</span>
                                </div>
                                <p className="text-[9px] text-slate-500">Flow halts here. Generates notification on dashboard until manual confirmation is completed.</p>
                              </div>
                            )}

                            {step.type === 'parallel' && (
                              <div className="border border-teal-100 rounded-lg p-2 bg-teal-50/10 space-y-2">
                                <span className="font-bold text-teal-700 uppercase text-[8px]">Parallel Streams (Multiplexed Execution)</span>
                                <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-semibold">
                                  <div className="p-1 bg-white border border-teal-50 rounded">
                                    <span className="block text-teal-600 font-bold">SMS Branch</span>
                                    <span className="text-slate-400 block text-[8px]">Outbound Booking Link</span>
                                  </div>
                                  <div className="p-1 bg-white border border-teal-50 rounded">
                                    <span className="block text-indigo-600 font-bold">Email Branch</span>
                                    <span className="text-slate-400 block text-[8px]">Outbound PDF FAQ</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Global node controls */}
                            <div className="flex items-center justify-between text-[8px] text-slate-400 font-black border-t border-slate-100 pt-2">
                              <span>FAIL RETRIES: {step.config?.retries || 3}x (EXPONENTIAL BACKOFF)</span>
                              <span className="text-emerald-600">SECURE SCOPE: VERIFIED</span>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar: Simulation tracking & Human approvals */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Interactive Simulation Console */}
            <div className="bg-slate-950 text-slate-100 rounded-2xl p-4 shadow-md space-y-3 font-mono text-[10px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-extrabold text-indigo-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Sliders size={12} /> Execution Sandbox
                </span>
                {isRunningSim ? (
                  <span className="text-[8px] bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 px-1.5 py-0.5 rounded-full animate-pulse uppercase">
                    Running
                  </span>
                ) : (
                  <span className="text-[8px] text-slate-500 font-bold">STANDBY</span>
                )}
              </div>

              {/* Simulation trace output */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {simLog.length === 0 ? (
                  <div className="text-center p-6 text-slate-500 italic">
                    Press "Simulate Run" on the canvas to execute visual workflow automation pipeline.
                  </div>
                ) : (
                  simLog.map((log, idx) => (
                    <div key={idx} className="leading-relaxed border-b border-slate-900 pb-1.5">
                      <span className="text-slate-500 font-bold">[{idx + 1}]</span> {log}
                    </div>
                  ))
                )}
              </div>

              {/* Progress Bar indicator */}
              {isRunningSim && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-slate-400">
                    <span>Simulating pipeline load...</span>
                    <span>{Math.round(((simStepIndex + 1) / steps.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div 
                      className="bg-indigo-500 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${((simStepIndex + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Human in the loop active approvals panel */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator Approvals Sandbox</p>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              </div>

              {pendingApprovalStep ? (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-950">Approval Pending</p>
                      <p className="text-[9px] text-slate-500 leading-normal mt-0.5">Workflow requires authorization before continuing outreach dispatch tasks.</p>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-amber-100 font-bold text-[10px] text-slate-800">
                    Node: "{pendingApprovalStep.title}"
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApproveStep(true)}
                      className="py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Authorize
                    </button>
                    <button
                      onClick={() => handleApproveStep(false)}
                      className="py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-400 text-xs">
                  No active pending approvals. Simulation must reach "Human Approval" blocks to halt execution.
                </div>
              )}
            </div>

            {/* Execution logs audit trail history */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Logs Audit Trail</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-[10px]">
                {workflowLogs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-800 truncate max-w-[120px]">{log.workflowName}</span>
                      <span className={`text-[8px] uppercase ${log.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-slate-400 flex justify-between">
                      <span>Trigger: {log.trigger}</span>
                      <span>{log.durationMs}ms</span>
                    </div>
                    {/* Collapsible logs traces */}
                    <div className="border-t border-slate-200/60 mt-1.5 pt-1.5 space-y-1 font-mono text-[9px] text-slate-500 leading-normal">
                      {log.auditTrail.slice(0, 2).map((tr, tIdx) => (
                        <div key={tIdx}>• {tr}</div>
                      ))}
                      {log.auditTrail.length > 2 && (
                        <div className="text-[8px] text-slate-400 font-sans font-bold">+{log.auditTrail.length - 2} audit entries</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* TAB 2: MODULAR CONNECTOR CATALOG */}
      {/* ======================================= */}
      {activeTab === 'connectors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="connector-catalog-panel">
          
          {/* Connector Sidebar Catalogue */}
          <div className="lg:col-span-4 bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-5">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Enterprise Stack Conduits</h3>
              <h4 className="text-sm font-black text-slate-900">12 Modular API Connectors</h4>
              <p className="text-xs text-slate-500 mt-1">Configure credentials, check permissions, and manage rate limits across corporate service layers.</p>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {connectors.map(conn => (
                <button
                  key={conn.id}
                  onClick={() => setSelectedConnectorId(conn.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedConnectorId === conn.id
                      ? 'border-indigo-600 bg-indigo-50/10 text-indigo-950 font-bold'
                      : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl border border-slate-100">
                      {conn.icon}
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-900">{conn.name}</span>
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider">{conn.category} • {conn.authType}</span>
                    </div>
                  </div>

                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                    conn.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    conn.status === 'degraded' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {conn.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Connector Deep Inspection Console */}
          <div className="lg:col-span-8">
            {(() => {
              const conn = connectors.find(c => c.id === selectedConnectorId);
              if (!conn) return null;

              return (
                <div className="bg-white border border-slate-150 rounded-3xl shadow-sm p-6 space-y-6">
                  
                  {/* Connector Top Info */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 scale-110">
                        {conn.icon}
                      </div>
                      <div>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">{conn.category} Connector</span>
                        <h3 className="text-base font-black text-slate-900 mt-1">{conn.name}</h3>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">API Carrier Provider: {conn.provider}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block text-[8px] text-slate-400 uppercase font-black">Auth Integrity</span>
                      {conn.authConfigured ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                          <CheckCircle size={10} /> Key configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full mt-1">
                          <AlertCircle size={10} /> Pending keys
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Metrics Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <span className="block text-[8px] text-slate-400 uppercase font-black">Rate Limits</span>
                      <span className="block text-xs font-black text-slate-800 mt-1">
                        {conn.recentRequests.toLocaleString()} / {conn.maxRequests.toLocaleString()}
                      </span>
                      <span className="block text-[8px] text-slate-400 mt-0.5">Resets in {conn.rateLimitResetSec}s</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <span className="block text-[8px] text-slate-400 uppercase font-black">API Latency</span>
                      <span className="block text-xs font-black text-indigo-600 mt-1">
                        {conn.latencyMs > 0 ? `${conn.latencyMs}ms` : 'Offline'}
                      </span>
                      <span className="block text-[8px] text-slate-400 mt-0.5">Healthy threshold: 250ms</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <span className="block text-[8px] text-slate-400 uppercase font-black">Authentication Type</span>
                      <span className="block text-xs font-black text-slate-800 mt-1">{conn.authType}</span>
                      <span className="block text-[8px] text-slate-400 mt-0.5">TLS Cryptography</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <span className="block text-[8px] text-slate-400 uppercase font-black">Version Standard</span>
                      <span className="block text-xs font-black text-slate-800 mt-1">{conn.version}</span>
                      <span className="block text-[8px] text-slate-400 mt-0.5">Up-to-date compatibility</span>
                    </div>
                  </div>

                  {/* Credentials / Auth Panel */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-4">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                      Credentials Vault Integration
                    </h4>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase">Authorization Scope Token</label>
                          <input 
                            type="password" 
                            disabled 
                            value="********************************"
                            className="w-full bg-slate-100 border border-slate-200 p-2 rounded-xl font-mono text-[11px]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase">Callback Redirect URI</label>
                          <input 
                            type="text" 
                            disabled 
                            value="https://ais-dev-63fosz3u6c4n2ju4bacz73-767455093414.us-east1.run.app/api/oauth/callback"
                            className="w-full bg-slate-100 border border-slate-200 p-2 rounded-xl text-[10px] text-slate-600 font-mono"
                          />
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-500 leading-normal flex items-start gap-1.5">
                        <Lock size={12} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>All security variables reside inside the tenant vault container, encrypted via AES-256 GCM. The AI assistant can formulate logic rules but is blocked from reading raw cryptographic credential hashes.</span>
                      </div>
                    </div>
                  </div>

                  {/* Capabilities List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Inherent Capabilities</span>
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-indigo-600" />
                          <span>Real-time Event Webhook subscriptions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-indigo-600" />
                          <span>Automatic Metadata Schema Synchronization</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-indigo-600" />
                          <span>Decoupled Multi-role Tenant Access Guard</span>
                        </div>
                      </div>
                    </div>

                    {/* Retry & Fallback Configuration */}
                    <div className="space-y-2.5">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Error Handling & Strategy</span>
                      <div className="space-y-2 text-[11px] text-slate-600 font-semibold bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex justify-between">
                          <span>Max Fail Retries</span>
                          <span className="text-slate-800 font-bold">{conn.retryStrategy.maxRetries} attempts</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Retry Sched Strategy</span>
                          <span className="text-slate-800 font-bold capitalize">{conn.retryStrategy.backoff} Backoff</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Safety Fallback Route</span>
                          <span className={conn.retryStrategy.fallbackActive ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {conn.retryStrategy.fallbackActive ? 'Active' : 'Not configured'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Permissions & Least-Privilege Scoping */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scope Permission Matrix</span>
                      <span className="text-[9px] text-indigo-600 font-bold">Least-Privilege Enforced</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {['contacts.read', 'leads.write', 'opportunities.manage', 'invoices.read', 'payments.write', 'ledger.audit'].map(perm => {
                        const isGranted = conn.permissions.includes(perm);
                        return (
                          <button
                            key={perm}
                            onClick={() => handleToggleScope(conn.id, perm)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isGranted 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isGranted ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                            {perm}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Degraded UI warning recovery */}
                  {conn.status === 'degraded' && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-slate-700 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">Degraded Connection Status Detected</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">API gateway intercepted {conn.recentFailuresCount} authentication handshake timeout failures on recent calls. Automatic retries successfully bypassed errors, but renewal is highly recommended.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleFixConnector(conn.id)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shrink-0 cursor-pointer"
                      >
                        Renew Handshake Credentials
                      </button>
                    </div>
                  )}

                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* TAB 3: INTEGRATION HEALTH & QUOTA CENTER */}
      {/* ======================================= */}
      {activeTab === 'health' && (
        <div className="space-y-6" id="integration-health-center-panel">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider">Connectors Online</span>
              <span className="block text-2xl font-black text-slate-950">
                {getConnectorCount('active')} <span className="text-xs text-slate-400 font-bold">/ {connectors.length}</span>
              </span>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                ● {getConnectorCount('active') + getConnectorCount('degraded')} authorized pools ready
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider">Degraded Channels</span>
              <span className="block text-2xl font-black text-amber-600">
                {getConnectorCount('degraded')} <span className="text-xs text-slate-400 font-bold">handshake alert</span>
              </span>
              <p className="text-[10px] text-slate-400 font-semibold">Self-healing retry strategies active</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider">Average Dispatch Latency</span>
              <span className="block text-2xl font-black text-indigo-600">{averageLatency}ms</span>
              <p className="text-[10px] text-slate-400 font-semibold">95th percentile SLA: 180ms</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider">Unified Quota Balance</span>
              <span className="block text-2xl font-black text-sky-600">74.2%</span>
              <p className="text-[10px] text-slate-400 font-semibold">Renewing in 13 days</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Health Center list of Quotas and Consumption */}
            <div className="lg:col-span-8 bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-5">
              <div>
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Active Quota Consumption</h4>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">Connector Request Quotas & API Latency</h3>
              </div>

              <div className="space-y-4">
                {connectors.filter(c => c.status !== 'inactive').map(conn => {
                  const percent = Math.round((conn.recentRequests / conn.maxRequests) * 100);
                  return (
                    <div key={conn.id} className="space-y-1.5 border-b border-slate-50 pb-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          {conn.icon}
                          <span className="text-slate-900">{conn.name}</span>
                        </div>
                        <span className="text-slate-600">{conn.recentRequests.toLocaleString()} / {conn.maxRequests.toLocaleString()} ({percent}%)</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              percent > 85 ? 'bg-rose-500' :
                              percent > 60 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0 min-w-[50px] text-right">{conn.latencyMs}ms ping</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quota Actions & Failure log */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Failure history sandbox */}
              <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-4">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Self-Healing Actions</span>
                
                <div className="space-y-3">
                  <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold text-rose-800">
                      <span>Jira Handshake Outage</span>
                      <span>15:30</span>
                    </div>
                    <p className="text-slate-600 leading-normal">Handshake failed with 401 Unauthorized token. Retried automatically via exponential backoff (attempt 2 of 3) and restored degraded access.</p>
                  </div>

                  <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>QuickBooks Timeout Fix</span>
                      <span>14:22</span>
                    </div>
                    <p className="text-slate-600 leading-normal">Handshake timeout threshold (250ms) exceeded. API routed seamlessly to secondary local SQLite cache. Production restored instantly.</p>
                  </div>
                </div>
              </div>

              {/* Recommended actions list */}
              <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-3.5">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Actions</span>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-xs transition-all">
                    <div>
                      <span className="block font-bold text-slate-900">Rotate Jira OAuth</span>
                      <span className="block text-[9px] text-slate-400">Restore degraded performance status</span>
                    </div>
                    <button 
                      onClick={() => handleFixConnector('pm-jira')}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer"
                    >
                      Authorize
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-xs transition-all border-t border-slate-100 pt-2.5">
                    <div>
                      <span className="block font-bold text-slate-900">Revoke Tableau scope</span>
                      <span className="block text-[9px] text-slate-400">Connector is inactive; scope is wide</span>
                    </div>
                    <button 
                      onClick={() => handleFixConnector('bi-tableau')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* TAB 4: SECURE EVENT BUS SUBSCRIPTIONS */}
      {/* ======================================= */}
      {activeTab === 'event_bus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="secure-event-bus-panel">
          
          {/* Create new subscription picker */}
          <div className="lg:col-span-4 bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Secure Event Router</h3>
              <h4 className="text-sm font-black text-slate-900">Add Connector Subscription</h4>
              <p className="text-xs text-slate-500 mt-1">Directly route system operations to downstream connectors securely under TLS validation.</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const eventId = (e.currentTarget.elements.namedItem('eventId') as HTMLSelectElement).value;
              const connectorId = (e.currentTarget.elements.namedItem('connectorId') as HTMLSelectElement).value;
              handleAddSubscription(eventId, connectorId);
            }} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">System Trigger Event</label>
                <select name="eventId" className="w-full border border-slate-200 rounded-xl p-2.5 bg-white cursor-pointer font-bold">
                  {EVENT_BUS_EVENTS.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">Target Connector Pipe</label>
                <select name="connectorId" className="w-full border border-slate-200 rounded-xl p-2.5 bg-white cursor-pointer font-bold">
                  {connectors.filter(c => c.status !== 'inactive').map(conn => (
                    <option key={conn.id} value={conn.id}>{conn.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus size={11} /> Subscribe secure pipeline
              </button>
            </form>
          </div>

          {/* Subscriptions Grid & Event Stream */}
          <div className="lg:col-span-8 bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-6">
            
            {/* Header */}
            <div className="border-b border-slate-50 pb-3">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Active Event Handlers</h4>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">Secure Event Bus Orchestration Matrix</h3>
            </div>

            {/* Matrix subscriptions table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Trigger Event</th>
                    <th className="p-3">Target API pipe</th>
                    <th className="p-3">Least-Privilege Scope</th>
                    <th className="p-3">Telemetry Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {eventSubscriptions.map(sub => {
                    const event = EVENT_BUS_EVENTS.find(e => e.id === sub.eventId);
                    const conn = connectors.find(c => c.id === sub.connectorId);
                    
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-950">
                          {event?.name || sub.eventId}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-bold text-slate-600">
                            {conn?.icon}
                            <span>{conn?.name}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-indigo-600 font-bold bg-slate-50/50">
                          {sub.secureScope}
                        </td>
                        <td className="p-3">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            sub.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleSubscription(sub.id)}
                            className="px-2 py-1 border border-slate-150 hover:bg-slate-50 rounded-lg font-bold text-[9px] text-slate-600 cursor-pointer"
                          >
                            {sub.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleRemoveSubscription(sub.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={11} className="inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Event trigger simulator logs snippet */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-white space-y-3 font-mono text-[10px]">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-indigo-300">
                <span>Cryptographic Event Bus Hub logs</span>
                <span className="text-emerald-400">Symmetric Enclave Isolated</span>
              </div>
              <div className="space-y-1 text-slate-300 max-h-36 overflow-y-auto">
                <div>[SECURE BUS] Intercepted booking_confirmed. Dispatching schema to Google Calendar... Done in 92ms.</div>
                <div>[SECURE BUS] Intercepted invoice_paid. Executed matching QuickBooks ledger query... Ledger inserted.</div>
                <div>[SECURE BUS] Isolation validation checked. Zero cross-tenant context leak indexes found.</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* TAB 5: SECURITY VAULT & LEAST PRIVILEGE */}
      {/* ======================================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="security-crypt-vault-panel">
          
          {/* Security details sidebar */}
          <div className="lg:col-span-4 bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-5">
            <div>
              <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 w-fit mb-2">
                <Lock size={10} className="text-slate-600" /> Platform Security V1
              </span>
              <h4 className="text-sm font-black text-slate-900">Least-Privilege Cryptography Vault</h4>
              <p className="text-xs text-slate-500 mt-1">Decoupled execution engine with real-time token protection and symmetric credential masking.</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-1.5">
                <span className="font-bold text-indigo-900 flex items-center gap-1"><ShieldCheck size={13} /> Tenant Isolation Level 4</span>
                <p className="text-[10px] text-slate-600 leading-normal">
                  All connector parameters and subscription graphs are mapped inside a strict container memory scope partitioned by cryptographically unique identifiers. No cross-tenant lookup can leak.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-1.5">
                <span className="font-bold text-emerald-900 flex items-center gap-1"><Key size={13} /> Encrypted at Rest</span>
                <p className="text-[10px] text-slate-600 leading-normal">
                  Credentials are encrypted using AES-256 GCM. Private key handles reside in remote software security modules completely separate from client render trees.
                </p>
              </div>
            </div>
          </div>

          {/* Crypt vault details */}
          <div className="lg:col-span-8 bg-white border border-slate-150 rounded-3xl shadow-sm p-6 space-y-6">
            
            {/* Header */}
            <div className="border-b border-slate-50 pb-3">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Secret Management</h4>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">Least-Privilege Scope & Credential Enclave</h3>
            </div>

            {/* Matrix of API Credential Secrets in Settings */}
            <div className="space-y-4">
              {[
                { name: 'GEMINI_API_KEY', type: 'Server secret', status: 'Online & Encrypted', icon: <Bot size={14} className="text-purple-600" /> },
                { name: 'STRIPE_SECRET_KEY', type: 'Payment gateway auth', status: 'Online & Encrypted', icon: <DollarSign size={14} className="text-emerald-600" /> },
                { name: 'TWILIO_AUTH_TOKEN', type: 'SMS cellular auth', status: 'Online & Encrypted', icon: <Phone size={14} className="text-rose-600" /> },
                { name: 'SMTP_PASSWORD_GMAIL', type: 'Mailing secure auth', status: 'Online & Encrypted', icon: <Mail size={14} className="text-sky-600" /> },
                { name: 'POSTGRES_DB_URI', type: 'Database connection string', status: 'Online & Encrypted', icon: <Database size={14} className="text-amber-600" /> }
              ].map((secret, sIdx) => (
                <div key={sIdx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-slate-200 rounded-xl">
                      {secret.icon}
                    </div>
                    <div>
                      <span className="block text-xs font-mono font-black text-slate-800">{secret.name}</span>
                      <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">{secret.type}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded-full font-mono">
                      AES-256 GCM Masked
                    </span>
                    <span className="block text-[8px] text-slate-400 mt-0.5">{secret.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Verification certificate check */}
            <div className="p-4 bg-indigo-950 rounded-2xl text-white space-y-3 font-mono text-[11px] border border-indigo-900">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-indigo-300">
                <span>Cryptographic Isolation Seal</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Platform cryptographic identity checks executed successfully. Client tokens decouple perfectly. Zero data overlap has been discovered. Tenant scope clearance validation: passed.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Role-Based Clearance Footer banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="space-y-2 max-w-xl">
          <span className="text-[9px] bg-sky-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
            <Users size={10} /> Active Role-Based Clearance Controls
          </span>
          <h3 className="font-extrabold text-base">Orchestration Security Framework</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Integration Fabric strictly implements enterprise role-based separation. Only active operators with **Owner** credentials can modify API keys, create Event Bus subscriptions, or configure least-privilege matrices. Admin agents possess runtime trigger privileges, while Technicians access field status updates only.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center self-stretch md:self-auto flex-shrink-0">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 min-w-[120px]">
            <p className="text-xl font-black text-sky-400">Owner</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Access level 3</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 min-w-[120px]">
            <p className="text-xl font-black text-purple-400">Admin</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Access level 2</p>
          </div>
        </div>
      </div>

    </div>
  );
}
