// src/components/Marketplace.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Search, Filter, Sparkles, CheckCircle2, Download, Bot, 
  GitFork, Layers, Database, Shield, LayoutGrid, Check, Info, Trash2,
  X, AlertTriangle, Play, HelpCircle, Terminal, RefreshCw, BarChart2,
  TrendingUp, ShieldAlert, Cpu, Calendar, DollarSign, Activity, Settings
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';

interface AppItem {
  id: string;
  name: string;
  category: string;
  description: string;
  author: string;
  rating: number;
  version: string;
  compatibility: string;
  permissionsNeeded: string[];
  permissionsGranted: string[];
  digitalSignature: string;
  color: string;
  isInstalled: boolean;
  enabled: boolean;
  installedVersion?: string;
  installedAt?: string;
}

export default function Marketplace({ businessId }: { businessId: string }) {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'agents' | 'sandbox' | 'analytics'>('browse');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Detail Modal
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  // AI Agent specialist chat simulation
  const [selectedSpecialist, setSelectedSpecialist] = useState<any>(null);
  const [agentChatText, setAgentChatText] = useState('');
  const [agentMessages, setAgentMessages] = useState<any[]>([]);
  const [agentThinking, setAgentThinking] = useState(false);

  // Sandbox SDK Simulator
  const [sandboxAppId, setSandboxAppId] = useState('wf-hot-lead');
  const [sandboxScope, setSandboxScope] = useState('comms');
  const [sandboxAction, setSandboxAction] = useState('dispatch_sms');
  const [sandboxPayload, setSandboxPayload] = useState('{\n  "leadPhone": "+15550199",\n  "template": "Hello! We saw you requested a quote..."\n}');
  const [sandboxConsole, setSandboxConsole] = useState<any[]>([]);
  const [sandboxRunning, setSandboxRunning] = useState(false);

  const fetchAppsAndAnalytics = async () => {
    try {
      const appRes = await fetch('/api/marketplace/apps');
      const appData = await appRes.json();
      if (appData.apps) setApps(appData.apps);

      const analyticRes = await fetch('/api/marketplace/analytics');
      const analyticData = await analyticRes.json();
      if (analyticData) setAnalytics(analyticData);
    } catch (e) {
      console.error('Error fetching marketplace data', e);
    }
  };

  useEffect(() => {
    fetchAppsAndAnalytics();
  }, [businessId]);

  const handleInstall = async (appId: string) => {
    setInstallingId(appId);
    try {
      const res = await fetch(`/api/marketplace/apps/${appId}/install`, { method: 'POST' });
      if (res.ok) {
        await fetchAppsAndAnalytics();
        const installed = apps.find(a => a.id === appId);
        addConsoleLog('System', `Installed extension module '${installed?.name || appId}' safely.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstall = async (appId: string) => {
    if (!confirm('Are you sure you want to uninstall this extension? This will safely wipe any sandbox keys.')) return;
    try {
      const res = await fetch(`/api/marketplace/apps/${appId}/uninstall`, { method: 'POST' });
      if (res.ok) {
        await fetchAppsAndAnalytics();
        addConsoleLog('System', `Safely uninstalled extension '${appId}'.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleEnabled = async (appId: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/marketplace/apps/${appId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentState })
      });
      if (res.ok) {
        await fetchAppsAndAnalytics();
        addConsoleLog('System', `Extension '${appId}' enabled status set to ${!currentState}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateVersion = async (appId: string) => {
    setUpdatingId(appId);
    try {
      const res = await fetch(`/api/marketplace/apps/${appId}/update`, { method: 'POST' });
      if (res.ok) {
        await fetchAppsAndAnalytics();
        addConsoleLog('System', `Successfully updated extension '${appId}' to latest matching core tag.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSavePermissions = async (appId: string, permissions: string[]) => {
    try {
      const res = await fetch(`/api/marketplace/apps/${appId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionsGranted: permissions })
      });
      if (res.ok) {
        await fetchAppsAndAnalytics();
        setIsPermissionModalOpen(false);
        addConsoleLog('System', `Modified runtime administrative scopes for extension '${appId}'.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to add mock/real terminal log
  const addConsoleLog = (source: string, msg: string, type: 'info' | 'error' | 'success' | 'warn' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSandboxConsole(prev => [...prev, { timestamp, source, msg, type }].slice(-100));
  };

  // Executing Sandbox API
  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(sandboxPayload);
    } catch (e) {
      addConsoleLog('Sandbox Client', 'Error parsing JSON input payload', 'error');
      setSandboxRunning(false);
      return;
    }

    addConsoleLog('Sandbox Kernel', `Initiating thread validation for app [${sandboxAppId}]...`, 'info');
    
    try {
      const res = await fetch('/api/marketplace/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: sandboxAppId,
          requestedScope: sandboxScope,
          actionName: sandboxAction,
          payload: parsedPayload
        })
      });

      const data = await res.json();
      
      if (res.status === 403) {
        addConsoleLog('Sandbox Boundary', `SECURITY VIOLATION BLOCKED: Lacks scope [${sandboxScope}]`, 'error');
        addConsoleLog('Audit Logs', `Event logged to tenant ledger with priority HIGH. Error code: ERR_SANDBOX_ACCESS_DENIED`, 'warn');
      } else if (!res.ok) {
        addConsoleLog('System Server', data.error || 'Server Execution failure', 'error');
      } else {
        addConsoleLog('Sandbox Kernel', 'Digital Signature Authenticated: VALID', 'success');
        addConsoleLog('Sandbox Kernel', `Thread exited safely in ${data.sandboxAuditLog.durationMs}ms with isolated state constraints.`, 'success');
        addConsoleLog('SDK Result', JSON.stringify(data.result), 'info');
      }
      
      // Refresh analytics to capture the run
      await fetchAppsAndAnalytics();
    } catch (err: any) {
      addConsoleLog('Sandbox Network', 'Failure dispatching runtime sandbox envelope', 'error');
    } finally {
      setSandboxRunning(false);
    }
  };

  // Specialized AI Agents Profiles
  const SPECIALISTS = [
    {
      id: 'agent-insurance',
      name: 'Insurance Specialist Agent',
      title: 'Insurance & Claims Expert',
      capabilities: ['Parse complex policy bounds', 'Auto-verify adjuster metadata', 'Review standard co-pay/deductibles formulas', 'Direct CRM log creation'],
      permissions: ['tenant_data', 'knowledge', 'crm'],
      knowledgeAccess: ['Insurance standard operating diagnostic manuals', 'State billing compliance codes'],
      supportedTools: ['Policy Analyzer API', 'State Adjuster Directory lookup', 'Stripe Ledger Sync'],
      greeting: "Hello, I am your Insurance Specialist Agent. I specialize in screening coverage matrices, claim approvals, and deductible validation. What policy or patient ledger would you like me to analyze?"
    },
    {
      id: 'agent-medical',
      name: 'Medical Scheduler Pro',
      title: 'HIPAA-Compliant Patient Coordinator',
      capabilities: ['Dynamic practitioner mapping', 'Patient intake check-in', 'Interactive cell voice routing', 'Automatic scheduling confirmation'],
      permissions: ['tenant_data', 'scheduling', 'comms'],
      knowledgeAccess: ['Practitioner roster list', 'Patient privacy policies', 'Clinic calendar guidelines'],
      supportedTools: ['Calendar Slot Checker', 'Twilio Voice dispatcher', 'Patient Notification API'],
      greeting: "Greetings. I am the Medical Scheduler Pro. I coordinate patient onboarding and provider availability calendars with strict HIPAA compliance. How may I assist with scheduling or practitioner rosters?"
    },
    {
      id: 'agent-legal',
      name: 'Legal Intake Assistant',
      title: 'Legal Counsel & Intake Specialist',
      capabilities: ['Liability conflict checking', 'Case criteria validation', 'Standard retainer contract synthesis', 'Safe administrative logs tracking'],
      permissions: ['crm', 'secrets', 'audit_logging'],
      knowledgeAccess: ['Client intake template', 'Liability threshold scoring rubric', 'Conflict verification registry'],
      supportedTools: ['Intake Scoring Matrix', 'DocuSign Draft integration', 'External SEC API proxy'],
      greeting: "Hello. I am your Legal Intake Assistant. I manage prospective client screening, identify case liability flags, and structure retainer checksheets. How can I protect and map your docket today?"
    },
    {
      id: 'agent-property',
      name: 'Property Manager Companion',
      title: 'Residential & Commercial Dispatcher',
      capabilities: ['Automated maintenance requests routing', 'Lease renewal trigger actions', 'Unpaid rent invoice reminder loops', 'Technician assignments coordination'],
      permissions: ['crm', 'billing', 'scheduling'],
      knowledgeAccess: ['Property directories registry', 'Maintenance SLA threshold guide', 'Standard lease template parameters'],
      supportedTools: ['Tenant SMS Dispatch', 'QuickBooks Invoice Sync', 'Technician Dispatch Coordinator'],
      greeting: "Welcome. I am the Property Manager Companion. I assist real estate teams in dispatching service technicians, calculating rent indices, and tracking repair compliance. What tenant work order or invoice ledger shall we assess?"
    },
    {
      id: 'agent-estimator',
      name: 'Construction Estimator Bot',
      title: 'Blueprints & Estimating Engineer',
      capabilities: ['Material quantities calculations', 'Local wholesale pricing audits', 'Competitive bids structuring', 'Subcontractor dispatch reminders'],
      permissions: ['tenant_data', 'knowledge', 'billing'],
      knowledgeAccess: ['Wholesale suppliers rate matrix', 'Average regional labor cost handbook', 'Material waste factor coefficients'],
      supportedTools: ['Quantity Takeoff calculator', 'Local Supplier API Connector', 'Stripe Escrow Estimator'],
      greeting: "Hello, I am your Construction Estimator Bot. Send me a description of structural requirements or material scopes, and I will compute binding line-item labor and material costs. What project are we bidding on?"
    },
    {
      id: 'agent-host',
      name: 'Restaurant Host AI',
      title: 'Smart Reservations & Allergen Coordinator',
      capabilities: ['Dining tables seatings optimization', 'Guest dietary restrictions indexing', 'Pre-booking deposits payment checks', 'SMS waiting list management'],
      permissions: ['scheduling', 'billing', 'comms'],
      knowledgeAccess: ['Table floorplan capacity indices', 'Allergen protocols list', 'Cancellation policy rules'],
      supportedTools: ['Reservation Ledger Check', 'Guest SMS Waitlist notifier', 'Stripe Booking Deposit API'],
      greeting: "Hello, I am the Restaurant Host AI. I handle dining reservations, floor seating density, and allergy-sensitive guest lists. How many guests or which reservation ledger would you like to review?"
    }
  ];

  const selectSpecialistAgent = (agentId: string) => {
    const spec = SPECIALISTS.find(s => s.id === agentId);
    if (!spec) return;
    setSelectedSpecialist(spec);
    setAgentMessages([
      { sender: 'agent', text: spec.greeting, time: new Date().toLocaleTimeString() }
    ]);
  };

  const handleSendAgentMessage = async () => {
    if (!agentChatText.trim() || !selectedSpecialist) return;
    
    const userMsg = { sender: 'user', text: agentChatText, time: new Date().toLocaleTimeString() };
    setAgentMessages(prev => [...prev, userMsg]);
    setAgentChatText('');
    setAgentThinking(true);

    // Call Sandbox run via fetch to log simulated agent thinking under permissions
    try {
      const scope = selectedSpecialist.permissions[0] || 'tenant_data';
      const res = await fetch('/api/marketplace/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedSpecialist.id,
          requestedScope: scope,
          actionName: 'agent_chat_reasoning',
          payload: { prompt: userMsg.text }
        })
      });

      const data = await res.json();
      
      setTimeout(() => {
        setAgentThinking(false);
        if (data.securityViolation) {
          setAgentMessages(prev => [...prev, {
            sender: 'agent',
            text: `⚠️ [SANDBOX CRITICAL BLOCKED] My capabilities are constrained because my administrative scope is blocked: ${data.error}. Please grant permissions in the admin panel to enable my capabilities.`,
            time: new Date().toLocaleTimeString(),
            isError: true
          }]);
        } else {
          // Normal Gemini response simulator backed by successful sandbox runs
          const replies: Record<string, string> = {
            'agent-insurance': "Based on the policy context, Section 4B covers up to 80% of major plumbing and restorative drainage fixtures. The estimated co-pay is $150. I have securely generated a CRM claim ticket for adjusters review.",
            'agent-medical': "Practitioner Dr. Stevens is available this Tuesday at 10:00 AM. I have validated this slot, queued a patient phone reminder template, and mapped it inside your medical scheduler.",
            'agent-legal': "No direct conflicts found under the requested business index. Liability screening is rated 8/10. I have initialized a draft retainer agreement and added the audit log safely.",
            'agent-property': "I parsed the maintenance ticket for Unit 202. The hot water compressor is listed. I have queued HVAC Climate Pack diagnostic parameters and pre-dispatched technician Sarah with an audit entry.",
            'agent-estimator': "Estimated cost takeoff for 500 sq ft tiling averages $4,500 including labor. I have reconciled supplier catalogs and created a Stripe-ready invoice blueprint under sandbox security guidelines.",
            'agent-host': "Table 12 is available at 7:30 PM. I recorded the allergy note (gluten-free) and generated a secure SMS verification template to confirm the reservation deposit."
          };
          
          setAgentMessages(prev => [...prev, {
            sender: 'agent',
            text: replies[selectedSpecialist.id] || "Request evaluated safely within sandbox environment. I have authorized and structured the action context.",
            time: new Date().toLocaleTimeString()
          }]);
        }
      }, 1000);

    } catch (e) {
      setAgentThinking(false);
    }
  };

  const filteredApps = apps.filter(app => {
    const matchesCategory = activeCategory === 'all' || app.category === activeCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6" id="app-marketplace-container">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl" id="marketplace-hero">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.4),transparent)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold border border-indigo-500/20 uppercase tracking-widest">
              <Sparkles size={11} className="text-indigo-400" /> Platform Extensions & Sandboxing
            </div>
            <h1 className="text-2xl font-black tracking-tight" id="marketplace-title">AI App Marketplace & SDK Hub</h1>
            <p className="text-xs text-indigo-200 leading-relaxed font-medium">
              Transform your AI Workforce OS into a secure, extensible operating engine. Install pre-built industry packs, custom multi-agent workflows, and specialized AI employees. Every app compiles instantly and executes within a strict, row-level isolated security sandbox.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start md:self-auto shrink-0">
            <div className="text-center">
              <span className="block text-xs font-bold text-slate-300">Active Extensions</span>
              <span className="text-2xl font-extrabold text-indigo-400">{apps.filter(a => a.isInstalled && a.enabled).length}</span>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="text-center">
              <span className="block text-xs font-bold text-slate-300">Sandbox Safety</span>
              <span className="text-2xl font-extrabold text-emerald-400">100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-slate-200" id="marketplace-tabs">
        {[
          { id: 'browse', label: 'Browse Apps & Integrations', icon: <ShoppingBag size={14} /> },
          { id: 'agents', label: 'AI Specialist Employee Plugins', icon: <Bot size={14} /> },
          { id: 'sandbox', label: 'Sandbox SDK Simulator', icon: <Terminal size={14} /> },
          { id: 'analytics', label: 'App Performance Analytics', icon: <BarChart2 size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 border-b-2 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER BROWSE EXTENSIONS TAB */}
      {activeTab === 'browse' && (
        <div className="space-y-6" id="browse-tab-content">
          {/* Filtering and Searching */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto" id="category-filters">
              {[
                { id: 'all', name: 'All Extensions', icon: <LayoutGrid size={13} /> },
                { id: 'industry_pack', name: 'Industry Packs', icon: <Layers size={13} /> },
                { id: 'workflow', name: 'Workflows & Automation', icon: <GitFork size={13} /> },
                { id: 'agent', name: 'AI Specialists', icon: <Bot size={13} /> },
                { id: 'connector', name: 'MCP Sync Connectors', icon: <Database size={13} /> }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dynamic extensions..."
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="app-cards-grid">
            {filteredApps.map((app) => (
              <div 
                key={app.id} 
                id={`app-card-${app.id}`}
                className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className={`h-2 bg-gradient-to-r ${app.color}`} />
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {app.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-amber-500 font-bold">★ {app.rating}</span>
                        <span className="text-[9px] text-slate-400">({app.version})</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-slate-900">{app.name}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{app.description}</p>
                    </div>

                    {/* Permission and digital sign labels */}
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-bold flex items-center gap-1">
                          <Shield size={11} className="text-emerald-600" /> Scopes Required:
                        </span>
                        <span className="text-slate-400 font-medium">Click to review</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.permissionsNeeded.map(perm => (
                          <span 
                            key={perm} 
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              app.isInstalled && app.permissionsGranted.includes(perm)
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                    <div className="flex flex-col text-[10px]">
                      <span className="text-slate-400 font-semibold">By {app.author}</span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[110px]" title={app.digitalSignature}>
                        {app.digitalSignature.slice(0, 14)}...
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {app.isInstalled ? (
                        <>
                          {/* Toggle Enabled */}
                          <button
                            id={`toggle-${app.id}`}
                            onClick={() => handleToggleEnabled(app.id, app.enabled)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              app.enabled 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                            title={app.enabled ? 'Click to Disable' : 'Click to Enable'}
                          >
                            {app.enabled ? 'Active' : 'Disabled'}
                          </button>

                          {/* Permissions Settings Gear */}
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setIsPermissionModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-slate-150 rounded border text-slate-600 hover:text-slate-900 cursor-pointer"
                            title="Configure Scopes"
                          >
                            <Settings size={12} />
                          </button>

                          {/* Uninstall */}
                          <button
                            onClick={() => handleUninstall(app.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 text-rose-600 cursor-pointer"
                            title="Safe Uninstall"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleInstall(app.id)}
                          disabled={installingId === app.id}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Download size={11} />
                          {installingId === app.id ? 'Installing...' : 'Install'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER AI AGENT PLUGINS CHAT SIMULATOR */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="agents-tab-content">
          {/* Specialists List (Left side) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Bot size={16} className="text-indigo-600" /> Specialist AI Registry
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">
                Select an agent plugin to inspect their capabilities and "Test Drive" their reasoning sandbox safely.
              </p>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1" id="specialist-list">
              {SPECIALISTS.map(spec => {
                const appInstalled = apps.find(a => a.id === spec.id);
                return (
                  <button
                    key={spec.id}
                    onClick={() => selectSpecialistAgent(spec.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer ${
                      selectedSpecialist?.id === spec.id
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950 shadow-sm'
                        : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black text-slate-900">{spec.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        appInstalled?.isInstalled 
                          ? (appInstalled.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {appInstalled?.isInstalled ? (appInstalled.enabled ? 'Installed & Active' : 'Disabled') : 'Not Installed'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold leading-normal">
                      {spec.title}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {spec.permissions.map(perm => (
                        <span key={perm} className="text-[9px] font-bold bg-white text-slate-500 px-1.5 py-0.2 rounded border">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Drive Sandbox Interface (Right side) */}
          <div className="lg:col-span-8 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[550px]" id="agent-test-drive">
            {selectedSpecialist ? (
              <div className="flex flex-col h-full flex-1">
                {/* Agent Header */}
                <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                      <Cpu size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-100">{selectedSpecialist.name}</h3>
                      <p className="text-[10px] text-indigo-300 font-semibold">{selectedSpecialist.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-slate-300 flex items-center gap-1">
                      <Shield size={9} className="text-emerald-500" /> Sandbox active
                    </span>
                  </div>
                </div>

                {/* Split Info panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-[11px]">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1.5 flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-indigo-600" /> Declared Capabilities
                    </h4>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 font-medium">
                      {selectedSpecialist.capabilities.map((cap: string, idx: number) => (
                        <li key={idx}>{cap}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1.5 flex items-center gap-1">
                      <Database size={11} className="text-indigo-600" /> Sandboxed Tools & Knowledge
                    </h4>
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {selectedSpecialist.supportedTools.map((tool: string, idx: number) => (
                          <span key={idx} className="bg-slate-150 text-slate-700 px-1.5 py-0.5 rounded font-semibold text-[9px]">
                            {tool}
                          </span>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-400 italic">
                        Knowledge Access: {selectedSpecialist.knowledgeAccess.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[300px]" id="chat-messages-container">
                  {agentMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xl rounded-2xl p-3 text-xs leading-normal font-medium ${
                        msg.sender === 'user' 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : msg.isError 
                            ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-none'
                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                      }`}>
                        <p>{msg.text}</p>
                        <span className="block text-[8px] text-slate-400 mt-1 text-right">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                  {agentThinking && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-600 max-w-sm rounded-2xl p-3 text-xs font-semibold rounded-tl-none flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Agent evaluating thread scopes & reasoning context...
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                  <input
                    type="text"
                    value={agentChatText}
                    onChange={(e) => setAgentChatText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAgentMessage()}
                    placeholder={`Ask ${selectedSpecialist.name} a question...`}
                    className="flex-1 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    onClick={handleSendAgentMessage}
                    className="bg-slate-950 hover:bg-slate-850 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play size={12} /> Test Drive
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <Bot size={48} className="text-slate-300 stroke-1" />
                <h3 className="text-xs font-extrabold text-slate-600">No Specialist Selected</h3>
                <p className="text-[11px] max-w-sm font-medium text-slate-500">
                  Select one of the industry-specific AI employee plugins on the left to initiate a secure, sandboxed testing session.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER SANDBOX PLAYGROUND TAB */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sandbox-tab-content">
          {/* Form parameters */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Shield size={16} className="text-indigo-600" /> Extension SDK Controller
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">
                Configure direct API requests inside the container. This simulates code executions on the real Sandbox runtime.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">1. Target Extension Module</label>
                <select 
                  value={sandboxAppId}
                  onChange={(e) => {
                    setSandboxAppId(e.target.value);
                    const app = apps.find(a => a.id === e.target.value);
                    if (app && app.permissionsNeeded[0]) {
                      setSandboxScope(app.permissionsNeeded[0]);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                >
                  {apps.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">2. Requested SDK Permission Scope</label>
                <select 
                  value={sandboxScope}
                  onChange={(e) => setSandboxScope(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                >
                  {['tenant_data', 'knowledge', 'crm', 'billing', 'comms', 'secrets', 'scheduling', 'audit_logging'].map(s => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-medium">
                  If this scope hasn't been granted to the extension, the Sandbox Kernel will instantly intercept and abort.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">3. Action Method Name</label>
                <input 
                  type="text" 
                  value={sandboxAction}
                  onChange={(e) => setSandboxAction(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">4. JSON Input Payload</label>
                <textarea 
                  rows={4}
                  value={sandboxPayload}
                  onChange={(e) => setSandboxPayload(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-[11px]"
                />
              </div>

              <button
                onClick={handleRunSandbox}
                disabled={sandboxRunning}
                className="w-full bg-slate-950 hover:bg-slate-850 disabled:bg-slate-200 text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Play size={12} />
                {sandboxRunning ? 'Validating Sandbox...' : 'Run Isolated SDK Hook'}
              </button>
            </div>
          </div>

          {/* Console logger terminal */}
          <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between text-slate-200 font-mono text-[11px]" id="sandbox-console-panel">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Terminal size={14} /> SDK Sandbox Kernel logs
                </span>
                <button 
                  onClick={() => setSandboxConsole([])}
                  className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
                >
                  <RefreshCw size={11} /> Clear
                </button>
              </div>

              <div className="space-y-2 h-[350px] overflow-y-auto pr-1" id="sandbox-terminal-lines">
                {sandboxConsole.length === 0 ? (
                  <div className="text-slate-600 italic py-4">
                    Console idle. Select an app, set scopes, and click "Run Isolated SDK Hook" to view terminal output.
                  </div>
                ) : (
                  sandboxConsole.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className="text-slate-600">[{log.timestamp}]</span>{' '}
                      <span className={`font-bold ${
                        log.source === 'Sandbox Boundary' ? 'text-rose-500' : 'text-indigo-400'
                      }`}>
                        {log.source}:
                      </span>{' '}
                      <span className={
                        log.type === 'error' ? 'text-rose-400 font-extrabold' : 
                        log.type === 'success' ? 'text-emerald-400 font-bold' : 
                        log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                      }>
                        {log.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Isolated sandbox process online</span>
              </div>
              <div>
                <span>SHA-256 Sig: enforced</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6" id="analytics-tab-content">
          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { id: 'total-calls', title: 'Total SDK Execution Calls', value: analytics?.summary?.totalCalls || 14, icon: <Activity className="text-indigo-600" />, desc: 'Combined sandboxed transactions' },
              { id: 'failure-rate', title: 'Sandbox Intercept Rate', value: `${analytics?.summary?.failureRate || 12}%`, icon: <ShieldAlert className="text-rose-600" />, desc: 'Security access block occurrences' },
              { id: 'roi', title: 'Calculated Extension ROI', value: `$${analytics?.summary?.totalSavings || 48.00}`, icon: <TrendingUp className="text-emerald-600" />, desc: 'Labor time savings optimization' },
              { id: 'installed', title: 'Installed Integrations', value: apps.filter(a => a.isInstalled).length, icon: <Layers className="text-indigo-600" />, desc: 'Active platform extenders' }
            ].map(card => (
              <div key={card.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                  <span className="block text-2xl font-extrabold text-slate-900">{card.value}</span>
                  <span className="block text-[10px] text-slate-400 font-medium">{card.desc}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* App Usage Chart */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900">Sandbox API Execution Volume</h3>
                <p className="text-[10px] text-slate-400">Transaction counts recorded per installed extension.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(analytics?.summary?.appUsage || { 'pack-plumbing': 4, 'wf-hot-lead': 3, 'mcp-hubspot': 2, 'agent-insurance': 1 })}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="0" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="1" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#8b5cf6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Event Distribution */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900">Audit Events Log distribution</h3>
                <p className="text-[10px] text-slate-400">Breakdown of administrative action loops registered in kernel.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Mon', executions: 4, blocks: 0, installs: 1 },
                    { name: 'Tue', executions: 8, blocks: 1, installs: 0 },
                    { name: 'Wed', executions: 12, blocks: 2, installs: 1 },
                    { name: 'Thu', executions: 15, blocks: 1, installs: 0 },
                    { name: 'Fri', executions: 19, blocks: 2, installs: 2 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="executions" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={2} />
                    <Area type="monotone" dataKey="blocks" stroke="#f43f5e" fill="#ffe4e6" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Audit Event Table */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4" id="sandbox-audit-events-table">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900">Kernel Security Audit logs</h3>
                <p className="text-[10px] text-slate-400">Immutable ledger logging all extension actions, safety signatures, and validation events.</p>
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">Row-level Isolation Enabled</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]" id="audit-table">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold bg-slate-50/50">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Extension</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Safety Status</th>
                    <th className="py-2.5 px-3">Trace Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(analytics?.events || []).map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">
                        {new Date(e.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{e.appId}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                          e.eventType === 'sandbox_blocked' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {e.eventType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          e.status === 'success' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {e.status === 'success' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {e.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{e.message}</td>
                    </tr>
                  ))}
                  {(analytics?.events || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        No security logs tracked yet. Run simulated actions in the SDK Simulator tab!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSIONS SCOPES MANAGEMENT MODAL */}
      <AnimatePresence>
        {isPermissionModalOpen && selectedApp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="permission-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100"
            >
              {/* Header */}
              <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="text-indigo-400" size={18} />
                  <div>
                    <h3 className="text-xs font-black">Configure Administrative Scopes</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">{selectedApp.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex gap-3 text-amber-800 leading-normal">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Sandbox Isolation Warnings</span>
                    <span className="font-medium text-[11px] block mt-0.5">
                      Granting scopes permits the extension to read or execute hooks on your tenant's live database. Restrict any scope if security is questionable.
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="font-bold text-slate-700 block">Review and Grant Permissions</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedApp.permissionsNeeded.map(scope => {
                      const isGranted = selectedApp.permissionsGranted.includes(scope);
                      return (
                        <div key={scope} className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">{scope}</span>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {scope === 'tenant_data' && 'Allows reading business info, tone settings, and primary categories.'}
                              {scope === 'knowledge' && 'Allows scanning vector embeddings and local FAQ directories.'}
                              {scope === 'crm' && 'Allows appending CRM Logs and managing technician records.'}
                              {scope === 'billing' && 'Allows drafting Stripe invoices and posting items to QuickBooks ledger.'}
                              {scope === 'comms' && 'Allows initiating outbound carrier cell text messages and logging calls.'}
                              {scope === 'secrets' && 'Allows verifying external API tokens and certificates safely.'}
                              {scope === 'scheduling' && 'Allows querying and modifying client appointments slots.'}
                              {scope === 'audit_logging' && 'Allows writing security verification lines to the local audit ledger.'}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const nextPerms = isGranted
                                ? selectedApp.permissionsGranted.filter(p => p !== scope)
                                : [...selectedApp.permissionsGranted, scope];
                              
                              setSelectedApp({
                                ...selectedApp,
                                permissionsGranted: nextPerms
                              });
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              isGranted 
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {isGranted ? 'Granted' : 'Revoked'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="bg-white border border-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSavePermissions(selectedApp.id, selectedApp.permissionsGranted)}
                  className="bg-slate-950 hover:bg-slate-850 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Save Permission Grants
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
