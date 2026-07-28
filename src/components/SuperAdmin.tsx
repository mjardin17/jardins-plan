// src/components/SuperAdmin.tsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, TrendingUp, Cpu, Server, Activity, Plus, Search, 
  Trash2, ToggleLeft, ToggleRight, Settings, DollarSign, Key, CheckCircle2, RefreshCw,
  AlertTriangle, Clock, Database, Play, Terminal, ArrowUpRight, BarChart2, Wifi, Layers, Bell, Sparkles, Shield
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

interface Tenant {
  id: string;
  name: string;
  industry: string;
  billingPlan: 'free' | 'growth' | 'enterprise';
  tokensUsed: number;
  status: 'active' | 'suspended';
  voiceAIGated: boolean;
  mcpGated: boolean;
}

export default function SuperAdmin({ businessId }: { businessId: string }) {
  const [activeTab, setActiveTab] = useState<'tenants' | 'config' | 'diagnostics' | 'observability' | 'intelligence'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Platform Intelligence state
  const [intelReport, setIntelReport] = useState<any>(null);
  const [intelLoading, setIntelLoading] = useState(false);
  
  // Usage statistics
  const [totalTokens, setTotalTokens] = useState(14829940);
  const [totalTenants, setTotalTenants] = useState(142);
  const [avgLatency, setAvgLatency] = useState(192); // ms

  // License keys builder
  const [licenseKey, setLicenseKey] = useState('');
  const [generatedLicense, setGeneratedLicense] = useState<string | null>(null);
  const [targetPlan, setTargetPlan] = useState<'growth' | 'enterprise'>('growth');

  // Phase 43 & 44 Configuration Status & Startup Report States
  const [configStatuses, setConfigStatuses] = useState<any[]>([]);
  const [startupReport, setStartupReport] = useState<any>(null);

  // Phase 45 Self-Diagnostics State
  const [diagnostics, setDiagnostics] = useState<any[]>([]);

  // Phase 47 Observability & SRE Operations Center States
  const [obsReport, setObsReport] = useState<any>(null);
  const [obsLoading, setObsLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [simCategory, setSimCategory] = useState('AI Inference');
  const [simMessage, setSimMessage] = useState('Gemini API prompt compilation failed: unexpected system latency token count exceeds maximum context window.');
  const [simSuccess, setSimSuccess] = useState(false);

  // Sparkline data for Token overhead
  const tokenTrendData = [
    { day: 'Mon', tokens: 1200000 },
    { day: 'Tue', tokens: 1540000 },
    { day: 'Wed', tokens: 1980000 },
    { day: 'Thu', tokens: 1720000 },
    { day: 'Fri', tokens: 2300000 },
    { day: 'Sat', tokens: 2900000 },
    { day: 'Sun', tokens: 3200000 }
  ];

  useEffect(() => {
    fetchTenants();
  }, [businessId]);

  const fetchConfigStatus = async () => {
    try {
      const res = await fetch('/api/workforce/admin/config-status');
      if (res.ok) {
        const data = await res.json();
        setConfigStatuses(data.statuses || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStartupReport = async () => {
    try {
      const res = await fetch('/api/workforce/admin/startup-report');
      if (res.ok) {
        const data = await res.json();
        setStartupReport(data.report || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch('/api/workforce/admin/diagnostics');
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data.diagnostics || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchObservabilityReport = async () => {
    try {
      const res = await fetch('/api/workforce/admin/observability');
      if (res.ok) {
        const data = await res.json();
        setObsReport(data.report || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIntelligenceReport = async () => {
    try {
      setIntelLoading(true);
      const res = await fetch('/api/workforce/admin/intelligence');
      if (res.ok) {
        const data = await res.json();
        setIntelReport(data.report || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIntelLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'config') {
      fetchConfigStatus();
      fetchStartupReport();
    } else if (activeTab === 'diagnostics') {
      fetchDiagnostics();
    } else if (activeTab === 'observability') {
      fetchObservabilityReport();
      // Poll every 2.5 seconds for true live metric variation
      const interval = setInterval(fetchObservabilityReport, 2500);
      return () => clearInterval(interval);
    } else if (activeTab === 'intelligence') {
      fetchIntelligenceReport();
      // Poll every 10 seconds for platform intelligence updates
      const interval = setInterval(fetchIntelligenceReport, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workforce/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGate = async (tenantId: string, flag: 'voice' | 'mcp') => {
    // Optimistic state update
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        return {
          ...t,
          voiceAIGated: flag === 'voice' ? !t.voiceAIGated : t.voiceAIGated,
          mcpGated: flag === 'mcp' ? !t.mcpGated : t.mcpGated
        };
      }
      return t;
    }));

    try {
      await fetch(`/api/workforce/admin/tenants/${tenantId}/gate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const generateLicenseKey = () => {
    const key = `AIO-KEY-${Math.random().toString(36).substring(3, 11).toUpperCase()}-${targetPlan.toUpperCase()}`;
    setGeneratedLicense(key);
    alert('Enterprise API Multi-tenant subscription Key generated successfully!');
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Super Admin Title */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck size={22} className="text-rose-600" /> Executive Multi-Tenant Admin Panel
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Global super-operator monitor managing server token costs, tenant database isolations, license volume, and dynamic feature flag gates (Phase 17).
          </p>
        </div>

        <div className="bg-rose-50 text-rose-800 text-[10px] font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 border border-rose-200">
          <Activity size={12} className="animate-pulse" /> Platform Operations Healthy
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-100 pb-px gap-6">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tenants' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users size={14} /> Multi-Tenant Workspaces
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'config' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings size={14} /> Environment & Connections
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'diagnostics' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity size={14} /> Self-Diagnostics Center
        </button>
        <button
          onClick={() => setActiveTab('observability')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'observability' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers size={14} className="text-emerald-500" /> SRE Operations Center
        </button>
        <button
          onClick={() => setActiveTab('intelligence')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 px-1 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'intelligence' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles size={14} className="text-rose-500 animate-pulse" /> Platform Intelligence
        </button>
      </div>

      {activeTab === 'tenants' && (
        <div className="space-y-6">
          {/* KPI Stats Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'TOTAL TENANT WORKSPACES', val: totalTenants, subtitle: 'Live Multi-tenant isolation', icon: <Users size={16} className="text-indigo-600" /> },
              { title: 'CUMULATIVE TOKENS RUN', val: totalTokens.toLocaleString(), subtitle: 'Gemini 1.5 & Flash models', icon: <Cpu size={16} className="text-purple-600" /> },
              { title: 'SYSTEM DISPATCH LATENCY', val: `${avgLatency} ms`, subtitle: 'MCP Webhook connection speed', icon: <Server size={16} className="text-sky-600" /> },
              { title: 'REVENUE RUN-RATE', val: '$41,200', subtitle: 'Stripe SaaS integrations', icon: <DollarSign size={16} className="text-emerald-600" /> }
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{kpi.title}</span>
                  {kpi.icon}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{kpi.val}</h3>
                <p className="text-[10px] text-slate-400 font-semibold">{kpi.subtitle}</p>
              </div>
            ))}
          </div>

          {/* Grid: Charts & License key generator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Token Cost Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GLOBAL WORKFORCE TOKEN OVERHEAD</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tokenTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="tokens" stroke="#7c3aed" fillOpacity={0.1} fill="#7c3aed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Multi-Tenant Licensing */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GENERATE LICENSE / API SUBSCRIPTION KEYS</p>
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Target Plan Tier</label>
                  <select 
                    value={targetPlan}
                    onChange={(e: any) => setTargetPlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs"
                  >
                    <option value="growth">Apex Growth Subscription</option>
                    <option value="enterprise">Apex Enterprise High-Volume</option>
                  </select>
                </div>

                <button
                  onClick={generateLicenseKey}
                  className="w-full bg-slate-950 hover:bg-slate-850 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Key size={13} /> Generate Key Code
                </button>

                {generatedLicense && (
                  <div className="bg-emerald-50/50 p-3 border border-emerald-350 rounded-xl space-y-1 text-center">
                    <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider block">GENERATED KEY CODE</span>
                    <span className="font-mono text-xs font-bold text-emerald-950 select-all block">{generatedLicense}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tenant List Workspace Table with dynamic Feature Flags Gating */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE SaaS TENANT ISOLATION DATABASES</p>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search workspaces..."
                  className="w-full bg-slate-50 border pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Workspace/ID</th>
                    <th className="py-3 px-4">Industry Sector</th>
                    <th className="py-3 px-4">Plan Level</th>
                    <th className="py-3 px-4 text-center">Voice AI Gate</th>
                    <th className="py-3 px-4 text-center">MCP SDK Gate</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="text-xs text-slate-700 hover:bg-slate-50/50">
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900 block">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.id}</span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-500">{t.industry}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          t.billingPlan === 'enterprise' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.billingPlan}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => handleToggleGate(t.id, 'voice')}
                          className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
                        >
                          {t.voiceAIGated ? <ToggleLeft size={22} className="text-slate-300" /> : <ToggleRight size={22} className="text-emerald-500" />}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => handleToggleGate(t.id, 'mcp')}
                          className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
                        >
                          {t.mcpGated ? <ToggleLeft size={22} className="text-slate-300" /> : <ToggleRight size={22} className="text-emerald-500" />}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded">
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Environment Active Mode</span>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                startupReport?.environment === 'production' ? 'bg-red-500 text-white animate-pulse' : 'bg-rose-500 text-white'
              }`}>
                {startupReport?.environment ? `${startupReport.environment} MODE` : 'DEVELOPMENT MODE'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Workforce OS operates with adaptive configuration safety boundaries. In development, temporary fallback secrets are injected in-memory only and optional integrations are safely bypassed. In production, any missing core secrets or database connections trigger immediate server shutdown.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Connection status grid */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dynamic Connection Status Monitor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {configStatuses.map((status, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">{status.name}</span>
                      <span className="text-[10px] text-slate-500 block">{status.description}</span>
                    </div>
                    <div>
                      {status.status === 'connected' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-200">
                          <CheckCircle2 size={12} /> Connected
                        </span>
                      ) : status.status === 'warning' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-amber-200">
                          ⚠️ Degraded
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-rose-100">
                          ⚠️ Missing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Startup validation report */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">OS Boot & Startup Report</h3>
              {startupReport ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <span className="text-xs text-slate-500">Validation Timestamp</span>
                    <span className="text-[10px] font-mono text-slate-600">{new Date(startupReport.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="space-y-2.5">
                    {Object.entries(startupReport.details || {}).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-semibold text-slate-800">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Loading startup diagnostics...</p>
              )}
            </div>
          </div>

          {/* Configuration guidance with Zero-Exposure policy */}
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              🛡️ Zero-Exposure Operator Security Directive
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              API credentials, private certificates, and database connection strings are encrypted in transit and never loaded onto frontend DOM objects. All integration checks run server-side via custom proxy routers. Under no circumstances are live secrets, decryption keys, or raw strings rendered in the developer console or administrative dashboard interfaces.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Automated Diagnostics Health Check Matrix</h3>
              <button 
                onClick={fetchDiagnostics}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl transition-all"
              >
                <RefreshCw size={12} /> Run Force Diagnostic Poll
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {diagnostics.map((diag, idx) => (
                <div key={idx} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 md:max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 capitalize">{diag.category}</span>
                      {diag.status === 'healthy' ? (
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded">Healthy</span>
                      ) : diag.status === 'warning' ? (
                        <span className="bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded">Warning</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded animate-pulse">Critical</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{diag.message}</p>
                    {diag.fix && (
                      <div className="bg-amber-50/50 p-2 border border-amber-100 rounded-xl text-[11px] text-amber-800 mt-1">
                        <span className="font-bold uppercase tracking-wider text-[9px] block">Recommended operator fix:</span>
                        {diag.fix}
                      </div>
                    )}
                  </div>
                  <div>
                    {diag.status === 'healthy' ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl block text-center min-w-[120px]">
                        ✓ Operational
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl block text-center min-w-[120px]">
                        ⚠️ Review Required
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Mode Graceful Degradation Explanation (Phase 46) */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              🛡️ SAFE MODE DEGRADATION SYSTEM (PHASE 46)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              When non-critical APIs or hardware integrations fail, the system activates isolated sandbox channels to prevent full service collapse. Your business workspace continues to operationalize without latency overhead:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-2">
              <div className="bg-slate-800 p-3.5 rounded-xl space-y-1">
                <span className="font-bold text-amber-400 block">Stripe Gateway Offline</span>
                <p className="text-slate-400 text-[11px]">SaaS billing is suspended, fallback checkout links generate mock receipts, and CRM lead records persist without disruption.</p>
              </div>
              <div className="bg-slate-800 p-3.5 rounded-xl space-y-1">
                <span className="font-bold text-amber-400 block">Gemini API Unavailable</span>
                <p className="text-slate-400 text-[11px]">AI automation is bypassed, smart summarizations are skipped, and the chatbot escalates inquiries to manual customer desk operations.</p>
              </div>
              <div className="bg-slate-800 p-3.5 rounded-xl space-y-1">
                <span className="font-bold text-amber-400 block">Twilio SMS Gateway Offline</span>
                <p className="text-slate-400 text-[11px]">Mobile texting drops, and automated updates gracefully convert to email or local system notifications log boards.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'observability' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-slate-950 text-white p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Shield size={120} className="text-white" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  <Activity size={12} className="animate-pulse" /> SRE REAL-TIME OBSERVABILITY ENGINE ACTIVE
                </span>
                <h3 className="text-base font-extrabold text-white">AI Workforce OS — Site Reliability Dashboard</h3>
                <p className="text-xs text-slate-400">
                  Automated service monitoring, dynamic exception trace capture, immutable audit timelines, and fault-tolerant auto-recovery loops.
                </p>
              </div>
              <button
                onClick={fetchObservabilityReport}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 self-start md:self-center transition-all shadow-md shadow-rose-900/20"
              >
                <RefreshCw size={13} className="animate-spin-slow" /> Force Refresh Metrics
              </button>
            </div>
          </div>

          {/* 1. CENTRAL OPERATIONS DASHBOARD — 16 Service status grid */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Central Operations & Services Dashboard
                </h3>
                <p className="text-[11px] text-slate-400">Real-time status probes with automatic health checking and uptime metrics.</p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-150 px-2 py-1 rounded">
                PROBING INTERVAL: 2500ms
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {obsReport?.services ? (
                obsReport.services.map((srv: any, idx: number) => {
                  const isHealthy = srv.status === 'Healthy';
                  const isWarning = srv.status === 'Warning';
                  const isCritical = srv.status === 'Critical';
                  const isOffline = srv.status === 'Offline';

                  return (
                    <div key={idx} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3.5 rounded-xl transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{srv.name}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isHealthy ? 'bg-emerald-500' :
                          isWarning ? 'bg-amber-500 animate-pulse' :
                          isCritical ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                        }`} />
                      </div>
                      
                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="text-slate-400">Status</span>
                        <span className={`font-extrabold uppercase ${
                          isHealthy ? 'text-emerald-700' :
                          isWarning ? 'text-amber-700' :
                          isCritical ? 'text-rose-700' : 'text-slate-500'
                        }`}>
                          {srv.status}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="text-slate-400">Uptime</span>
                        <span className="font-mono font-bold text-slate-700">{srv.uptime}%</span>
                      </div>

                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="text-slate-400">Avg Latency</span>
                        <span className="font-mono font-semibold text-slate-600">
                          {srv.latencyMs > 0 ? `${srv.latencyMs}ms` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-4 text-center py-6 text-xs text-slate-400">
                  Loading central operations services registry...
                </div>
              )}
            </div>
          </div>

          {/* 2. LIVE PERFORMANCE METRICS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                System Hardware & Traffic Telemetry
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[
                  { label: "CPU Usage", val: `${obsReport?.metrics?.cpuUsage ?? 0}%`, sub: "Multi-core balance" },
                  { label: "RAM Allocated", val: `${obsReport?.metrics?.memoryUsage ?? 0} MB`, sub: "V8 memory pool" },
                  { label: "Disk Volume", val: `${obsReport?.metrics?.diskUsage ?? 0}%`, sub: "Persistent storage" },
                  { label: "DB Active Pools", val: `${obsReport?.metrics?.dbConnections ?? 0} conns`, sub: "Postgres pool" },
                  { label: "Queries latency", val: `${obsReport?.metrics?.avgQueryTimeMs ?? 0}ms`, sub: "Drizzle lookup speed" },
                  { label: "Active Queue", val: `${obsReport?.metrics?.queueLength ?? 0} jobs`, sub: "Workflow tasks" },
                  { label: "Worker Activity", val: `${obsReport?.metrics?.workerActivity ?? 0}%`, sub: "Threads busy" },
                  { label: "RPM (Traffic)", val: `${obsReport?.metrics?.requestsPerMinute ?? 0}`, sub: "Incoming hits" },
                ].map((m, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{m.label}</span>
                    <span className="text-sm font-extrabold text-slate-900 block font-mono">{m.val}</span>
                    <span className="text-[9px] text-slate-400 block">{m.sub}</span>
                  </div>
                ))}
              </div>

              {/* Response Time Trends */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-500 uppercase">Server Response Latency Analysis</span>
                  <div className="flex gap-4">
                    <span className="text-emerald-600 font-bold">AVG: {obsReport?.metrics?.avgResponseTimeMs ?? 0}ms</span>
                    <span className="text-amber-600 font-bold">95th %ile: {obsReport?.metrics?.p95ResponseTimeMs ?? 0}ms</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500" style={{ width: '70%' }} title="Standard distribution" />
                  <div className="bg-amber-400" style={{ width: '25%' }} title="95th Tail latency" />
                  <div className="bg-rose-500" style={{ width: '5%' }} title="Critical outlier delay" />
                </div>
              </div>
            </div>

            {/* Error rate meter */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Operational Error Rate
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Ratio of failed HTTP/Webhook processes versus active worker requests.</p>
              </div>

              <div className="flex items-center justify-center py-4">
                <div className="text-center space-y-1 relative">
                  <div className="text-3xl font-black text-rose-600 font-mono tracking-tighter">
                    {obsReport?.metrics?.errorRate ?? 0}%
                  </div>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {obsReport?.metrics?.errorRate > 3 ? "WARNING THRESHOLD" : "NOMINAL RANGE"}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-505 border-t border-slate-50 pt-3">
                <span className="font-bold text-slate-700">Fail-safe actions triggered: </span>
                If error rate exceeds <strong className="text-rose-600">5.0%</strong> over 60 seconds, SRE circuit breakers suspend unessential CRM texting campaigns.
              </div>
            </div>
          </div>

          {/* 3. AI OBSERVABILITY PLATFORM */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-rose-600" /> AI LLM Observability & Token Auditing
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Individual prompt diagnostics, model token usage, latency metrics, and hallucination guardrail flags.</p>
              </div>
              <div className="flex gap-4 text-xs font-bold text-slate-600">
                <span>Success Rate: <strong className="text-emerald-600 font-mono">98.4%</strong></span>
                <span>Avg Latency: <strong className="text-purple-600 font-mono">542ms</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Inference Provider</th>
                    <th className="py-2.5 px-3">Token Usage</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Cost (Est)</th>
                    <th className="py-2.5 px-3 text-center">Retries</th>
                    <th className="py-2.5 px-3 text-center">Fallback Model</th>
                    <th className="py-2.5 px-3 text-center">Hallucination Flag</th>
                    <th className="py-2.5 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-mono">
                  {obsReport?.aiRequests?.map((req: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{req.provider}</td>
                      <td className="py-2.5 px-3 text-slate-600">{req.tokenUsage.toLocaleString()} tokens</td>
                      <td className="py-2.5 px-3 text-slate-600">{req.latencyMs}ms</td>
                      <td className="py-2.5 px-3 text-indigo-600 font-semibold">${req.costUSD.toFixed(5)}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{req.retries}</td>
                      <td className="py-2.5 px-3 text-center">
                        {req.fallbackUsed ? (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-extrabold uppercase">YES</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {req.hallucinationFlagged ? (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-extrabold uppercase animate-pulse">FLAGGED</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {req.success ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-extrabold uppercase">SUCCESS</span>
                        ) : (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-extrabold uppercase">FAILED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. ERROR CENTER & STRESS TESTING */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    SRE Central Error Aggregator
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Captured server exceptions categorized, indexed, and aggregated by frequency.</p>
                </div>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2.5 py-1 rounded">
                  {obsReport?.exceptions?.length || 0} GROUPS DETECTED
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {obsReport?.exceptions?.map((ex: any, idx: number) => (
                  <div key={idx} className="py-3.5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                          {ex.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Last occurrence: {new Date(ex.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        Frequency: {ex.frequency}x
                      </span>
                    </div>

                    <p className="text-xs font-bold text-rose-900 bg-rose-50/50 p-2 border border-rose-100 rounded-xl leading-relaxed">
                      {ex.message}
                    </p>

                    {/* Stack Trace Accordion (Admin only) */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Secure Stack Trace (Operator View)</span>
                      <pre className="bg-slate-900 text-slate-300 text-[10px] p-3 rounded-xl overflow-x-auto font-mono max-h-24">
                        {ex.stack}
                      </pre>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-[11px] text-amber-900 space-y-0.5">
                      <strong className="text-[10px] uppercase font-bold text-amber-800 block">Recommended Fix</strong>
                      <p className="font-semibold">{ex.recommendedFix}</p>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-505 font-semibold">
                      <span>Affected Users: {ex.affectedUsers.join(", ")}</span>
                      <span>Affected Orgs: {ex.affectedBusinesses.join(", ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SRE Reliability Stress Test Form */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  SRE Reliability Stress Checking
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Manually dispatch mock server exceptions to test Circuit Breakers, safe mode failover mechanics, and real-time dashboard responsiveness.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Incident Category</label>
                  <select
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:border-rose-600 focus:outline-none"
                  >
                    <option value="AI Inference">AI Inference API</option>
                    <option value="Stripe Billing">Stripe Billing Webhook</option>
                    <option value="Postgres Database">Postgres Database Deadlock</option>
                    <option value="System Webhook">System Webhook Payload</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Exception message</label>
                  <textarea
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    placeholder="Enter exception reason message..."
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono focus:border-rose-600 focus:outline-none h-20 resize-none"
                  />
                </div>

                <button
                  onClick={async () => {
                    try {
                      setSimSuccess(false);
                      const res = await fetch('/api/workforce/admin/observability/simulate-error', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ category: simCategory, message: simMessage })
                      });
                      if (res.ok) {
                        setSimSuccess(true);
                        fetchObservabilityReport();
                        setTimeout(() => setSimSuccess(false), 2500);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Play size={13} /> Inject Mock Exception Trace
                </button>

                {simSuccess && (
                  <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold p-3 border border-emerald-200 rounded-xl text-center">
                    ✓ Exception injected! Exception traces grouped, alerts triggered, and auto-recovery initiated.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. LIVE INCIDENT ALERTS & SYSTEM AUTO-RECOVERY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Alerts Panel */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell size={14} className="text-rose-600 animate-bounce" /> Live SRE Incident Alerts
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Active anomalies requiring administrative approval, configurations overhaul, or model adjustments.</p>
              </div>

              <div className="space-y-3">
                {obsReport?.alerts?.filter((al: any) => !al.resolved).length > 0 ? (
                  obsReport.alerts.filter((al: any) => !al.resolved).map((al: any) => (
                    <div key={al.id} className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                      <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">
                            {al.severity} INCIDENT
                          </span>
                          <span className="text-[9px] text-rose-400 font-semibold font-mono">
                            {new Date(al.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">{al.message}</p>
                        <div className="text-[10px] text-rose-900 bg-rose-100/50 p-2 rounded-lg font-semibold border border-rose-200">
                          <span className="block uppercase text-[8px] tracking-wider text-rose-800">Action:</span>
                          {al.recommendedAction}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] text-slate-500">Affected: {al.affectedSystems.join(", ")}</span>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/workforce/admin/observability/resolve-alert', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ alertId: al.id })
                                });
                                if (res.ok) {
                                  fetchObservabilityReport();
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-all"
                          >
                            Resolve Alert
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle2 size={14} /> Zero active critical incidents detected. Platform fully robust.
                  </div>
                )}
              </div>
            </div>

            {/* Recovery Automation Logs */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" /> SRE Closed-Loop Auto-Recovery Actions
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Immutable summary of self-healing tasks dispatched by circuit breakers before escalating incidents to managers.</p>
              </div>

              <div className="divide-y divide-slate-100">
                {obsReport?.recoveryActions?.map((rec: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          AUTO-RECOVERY SUCCESSFUL
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {new Date(rec.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 block">Target: {rec.target}</span>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">{rec.details}</p>
                      <span className="text-[9px] text-slate-400 font-mono block">Attemped iterations: {rec.attempts} loop</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. IMMUTABLE AUDIT TIMELINE */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={14} className="text-slate-900" /> Immutable Platform Audit Timeline
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Secure ledger of all logins, permission adjustments, administrative decisions, and core workflows.</p>
              </div>

              {/* Filtering */}
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit trail..."
                  className="bg-slate-50 border p-2 rounded-xl text-xs focus:outline-none focus:border-rose-600"
                />
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="bg-slate-50 border p-2 rounded-xl text-xs focus:outline-none focus:border-rose-600 font-semibold"
                >
                  <option value="all">All Actions</option>
                  <option value="user_login">Logins Only</option>
                  <option value="permission_change">Permission Gating</option>
                  <option value="billing_event">Stripe Billing</option>
                  <option value="workflow_execution">Workflow Execs</option>
                  <option value="administrative_action">Operator Actions</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Operator / Actor</th>
                    <th className="py-2.5 px-3">Logged Action</th>
                    <th className="py-2.5 px-3">Operational Details</th>
                    <th className="py-2.5 px-3 text-center">Security Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-mono">
                  {obsReport?.audits
                    ?.filter((aud: any) => {
                      const matchesSearch = aud.details.toLowerCase().includes(auditSearch.toLowerCase()) || aud.userEmail.toLowerCase().includes(auditSearch.toLowerCase());
                      const matchesFilter = auditActionFilter === 'all' || aud.action === auditActionFilter;
                      return matchesSearch && matchesFilter;
                    })
                    ?.map((aud: any) => (
                      <tr key={aud.id} className="hover:bg-slate-50/50 font-semibold text-slate-750">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(aud.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{aud.userEmail}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                            {aud.action.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-semibold">{aud.details}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-extrabold">IMMUTABLE</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles size={120} className="text-rose-500" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  <Sparkles size={12} className="animate-pulse" /> CONTINUOUS LEARNING & INTELLIGENCE ENGINE
                </span>
                <h3 className="text-base font-extrabold text-white">Executive Platform Intelligence Hub</h3>
                <p className="text-xs text-slate-300">
                  Analyzing performance trends, cross-tenant adoption, predictive capacities, and self-healing engine optimizations under strict privacy isolation.
                </p>
              </div>
              <button
                onClick={fetchIntelligenceReport}
                disabled={intelLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 self-start md:self-center transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={intelLoading ? "animate-spin" : ""} />
                {intelLoading ? "Analyzing..." : "Regenerate Intelligence Insights"}
              </button>
            </div>
          </div>

          {/* Core Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                title: "PLATFORM OVERALL HEALTH",
                value: `${intelReport?.summaryMetrics?.platformOverallHealth ?? 98.6}%`,
                desc: "Average health probes across all services",
                color: "text-emerald-600 bg-emerald-50 border-emerald-100"
              },
              {
                title: "CUSTOMER SUCCESS SCORE",
                value: `${intelReport?.summaryMetrics?.customerOverallSuccessScore ?? 79.0}/100`,
                desc: "Aggregated SaaS tenant business success",
                color: "text-rose-600 bg-rose-50 border-rose-100"
              },
              {
                title: "UNLOCKED AI EFFICIENCY",
                value: `$${(intelReport?.summaryMetrics?.unlockedAIEfficiencyUsd ?? 28400).toLocaleString()}`,
                desc: "Estimated value saved by AI workforce automation",
                color: "text-purple-600 bg-purple-50 border-purple-100"
              },
              {
                title: "SYSTEM EFFICIENCY INDEX",
                value: `${intelReport?.summaryMetrics?.systemEfficiencyIndex ?? 94.2}%`,
                desc: "Resource allocation to queue backlog ratio",
                color: "text-sky-600 bg-sky-50 border-sky-100"
              }
            ].map((metric, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{metric.title}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">{metric.value}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${metric.color}`}>ACTIVE</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">{metric.desc}</p>
              </div>
            ))}
          </div>

          {/* Double Column Row: Forecasts & Benchmarks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Capacity & Demand Forecast */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-rose-600" /> Predictive Capacity & Bottleneck Forecasting
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Machine learning resource scale projections over a 30-day moving window.</p>
              </div>

              <div className="h-64">
                {intelReport?.predictiveForecast ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={intelReport.predictiveForecast}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="timestamp" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="infrastructureDemandScale" name="Demand Scale" stroke="#8884d8" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="workerUtilizationRate" name="Worker Util %" stroke="#10b981" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="queueBacklogPeak" name="Queue Backlog Peak" stroke="#f43f5e" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading forecast chart...</div>
                )}
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                <span>⚡ Next predicted bottleneck: none detected</span>
                <span className="text-emerald-600">Infrastructure capacity surplus 48%</span>
              </div>
            </div>

            {/* Column 2: Platform Anonymous Benchmarks */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 size={14} className="text-indigo-600" /> Platform-Wide Anonymous Benchmark Statistics
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Aggregated performance percentiles versus industry averages. Strict tenant isolation maintained.</p>
              </div>

              <div className="overflow-x-auto flex-1 mt-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-2 px-3">Metric Indicator</th>
                      <th className="py-2 px-3 text-right">Industry Avg</th>
                      <th className="py-2 px-3 text-right">Platform Avg</th>
                      <th className="py-2 px-3 text-right">Top Decile (10%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-mono">
                    {intelReport?.benchmarks?.map((bm: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{bm.metricName}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{bm.industryAverage}{bm.unit}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700 font-bold">{bm.platformAverage}{bm.unit}</td>
                        <td className="py-2.5 px-3 text-right text-indigo-600 font-bold">{bm.platformTopDecile}{bm.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* AI Learning Engine Insights */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu size={14} className="text-purple-600" /> AI Learning Engine — LLM Interaction Performance Analysis
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">In-depth telemetry auditing prompt categorizations, execution latencies, average token sizes, costs, and feedback ratings.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Interaction Category</th>
                    <th className="py-2.5 px-3 text-center">Success Rate</th>
                    <th className="py-2.5 px-3 text-center">Avg Latency</th>
                    <th className="py-2.5 px-3 text-center">Avg Tokens</th>
                    <th className="py-2.5 px-3 text-center">Avg Cost (Est)</th>
                    <th className="py-2.5 px-3 text-center">Satisfaction Index</th>
                    <th className="py-2.5 px-3 text-center">Repetition Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-mono">
                  {intelReport?.aiInferenceInsights?.map((insight: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-900">{insight.promptCategory}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-extrabold">
                          {insight.successRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">{insight.avgLatencyMs}ms</td>
                      <td className="py-3 px-3 text-center text-slate-600">{insight.avgTokensUsed.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center text-indigo-600 font-bold">${insight.avgCostUsd.toFixed(5)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-extrabold">
                          ★ {insight.satisfactionRating}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">{insight.repetitionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Adoption Optimizer */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-rose-600" /> Feature Adoption & Utilization Optimizer
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Tracking workspace tool utilization and recommended engagement boosts to maximize user activation scores.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {intelReport?.featureMetrics?.map((feat: any, idx: number) => {
                const statusColor = 
                  feat.status === 'high_adoption' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                  feat.status === 'nominal' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                  feat.status === 'underutilized' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-rose-700 bg-rose-50 border-rose-200';

                return (
                  <div key={idx} className="bg-slate-50 hover:bg-slate-100/50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between space-y-3.5 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-black text-slate-900 leading-tight block">{feat.name}</span>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider shrink-0 whitespace-nowrap ${statusColor}`}>
                          {feat.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 py-1 text-center font-mono">
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-[8px] text-slate-400 block font-sans">DAU</span>
                          <span className="text-xs font-bold text-slate-800">{feat.dau}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-[8px] text-slate-400 block font-sans">WAU</span>
                          <span className="text-xs font-bold text-slate-800">{feat.wau}</span>
                        </div>
                        <div className="bg-white p-1 rounded border border-slate-100">
                          <span className="text-[8px] text-slate-400 block font-sans">MAU</span>
                          <span className="text-xs font-bold text-slate-800">{feat.mau}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline text-[10px] text-slate-500">
                        <span>Activation: <strong>{feat.activationRate}%</strong></span>
                        <span>Retention: <strong>{feat.retentionRate}%</strong></span>
                      </div>
                      <div className="bg-white border border-slate-150 p-2.5 rounded-lg text-[10px] text-slate-600 leading-relaxed font-semibold">
                        <span className="text-rose-600 text-[8px] font-extrabold uppercase tracking-wider block mb-0.5">LEARNED RECOMMENDATION</span>
                        {feat.recommendation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Success Profiles under Tenant Isolation */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-rose-600" /> Customer Success Profiling (Tenant Anonymized Insights)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Monitoring isolated workflow scores, labor hours saved, and engagement metrics to target success triggers.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Business Profile ID</th>
                    <th className="py-2.5 px-3 text-center">Success Index</th>
                    <th className="py-2.5 px-3 text-right">Revenue Growth</th>
                    <th className="py-2.5 px-3 text-right">Lead Growth</th>
                    <th className="py-2.5 px-3 text-right">Booking Rate</th>
                    <th className="py-2.5 px-3 text-right">Saved Hours</th>
                    <th className="py-2.5 px-3 text-right">AI Prompts run</th>
                    <th className="py-2.5 px-3">Prescribed Success Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {intelReport?.businessProfiles?.map((profile: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">{profile.businessName}</span>
                        <span className="text-[9px] text-slate-400 font-mono font-normal">{profile.businessId}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                            profile.successScore >= 90 ? 'bg-emerald-50 text-emerald-800' :
                            profile.successScore >= 70 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {profile.successScore}/100
                          </span>
                          <span className="text-[10px]">
                            {profile.scoreTrend === 'up' ? '↗' : profile.scoreTrend === 'stable' ? '→' : '↘'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-600">+{profile.revenueGrowthRate}%</td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-600">+{profile.leadGrowthRate}%</td>
                      <td className="py-3.5 px-3 text-right font-mono">{profile.bookingConversion}%</td>
                      <td className="py-3.5 px-3 text-right font-mono text-indigo-600">{profile.hoursSaved} hrs</td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500">{profile.aiPromptsCount.toLocaleString()}</td>
                      <td className="py-3.5 px-3 text-xs leading-relaxed max-w-xs">
                        <p className="text-slate-600 font-semibold">{profile.recommendedAction}</p>
                        <span className="text-[9px] text-slate-400 font-normal block mt-0.5">{profile.scoreExplanation}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Self-Improvement Engine Recommendations */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> Self-Improvement Engine — Ranked Technical Recommendations
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated deep learning engineering directives compiled from real system metrics and latency analysis.</p>
            </div>

            <div className="divide-y divide-slate-100">
              {intelReport?.engineeringRecommendations?.map((rec: any, idx: number) => {
                const categoryColor = 
                  rec.category === "Performance" ? "text-emerald-700 bg-emerald-50 border-emerald-150" :
                  rec.category === "Cost Optimization" ? "text-purple-700 bg-purple-50 border-purple-150" :
                  rec.category === "Database Optimization" ? "text-blue-700 bg-blue-50 border-blue-150" :
                  "text-slate-700 bg-slate-100 border-slate-200";

                return (
                  <div key={idx} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-4xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900">{rec.title}</span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${categoryColor}`}>
                          {rec.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">
                          Rank #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">{rec.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-[10px] text-slate-700 leading-relaxed">
                          <strong className="text-rose-600 uppercase tracking-wider text-[8px] font-extrabold block mb-0.5">LEARNED REASONING</strong>
                          {rec.reasoning}
                        </div>
                        {rec.estimatedSavingsUsd > 0 && (
                          <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg text-[10px] text-emerald-800 flex items-center justify-between font-mono font-bold">
                            <span>Projected Monthly Savings:</span>
                            <span className="text-xs font-black text-emerald-700">${rec.estimatedSavingsUsd} USD</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-baseline md:items-end gap-2 text-right shrink-0">
                      <div className="bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl text-center min-w-[120px]">
                        <span className="text-[8px] text-rose-500 uppercase font-extrabold block">Impact Score</span>
                        <span className="text-sm font-black text-rose-700 font-mono">{rec.impactScore}/10</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">Difficulty: {rec.difficulty}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
