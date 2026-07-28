import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Bot, Play, Settings, RefreshCw, Layers, CheckCircle2,
  AlertTriangle, ShieldCheck, Activity, DollarSign, TrendingUp, Cpu,
  Network, Zap, Clock, ThumbsUp, ArrowRight, CornerDownRight, History,
  HelpCircle, AlertCircle, FileText, BarChart3, GraduationCap, X, Sliders, Shield
} from 'lucide-react';

interface MultiAgentEngineViewProps {
  businessId: string;
}

interface AgentEmployee {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'coaching';
  capabilities: string[];
  permissions: string[];
  knowledgeAccess: string[];
  assignedTools: string[];
  avatarColor: string;
}

interface WorkflowRun {
  id: number;
  workflowType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'needs_intervention';
  timeline: any[];
  sharedContext: any;
  supervisorLogs: any[];
  totalTokens: number;
  totalCost: string;
  createdAt: string;
}

interface AgentPerformance {
  id: number;
  agentRole: string;
  tasksCompleted: number;
  successRate: number;
  avgCompletionTimeSec: number;
  handoffSuccessRate: number;
  customerSatisfaction: number;
  costUsd: string;
  tokenUsage: number;
  coachingRecommendations: Array<{ date: string; advice: string }>;
}

export default function MultiAgentEngineView({ businessId }: MultiAgentEngineViewProps) {
  const [agents, setAgents] = useState<AgentEmployee[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'directory' | 'simulate' | 'metrics' | 'history'>('simulate');
  
  // Simulation form states
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('new_customer');
  const [simContext, setSimContext] = useState({
    customerName: 'Eleanor Vance',
    customerEmail: 'eleanor.vance@gmail.com',
    customerPhone: '415-555-8901',
    issueDescription: 'Kitchen main drain is fully backed up. Water overflowing on floor when dishwasher runs.',
    serviceRequested: 'Sewer Line Diagnostics & Cleanout'
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [activeRun, setActiveRun] = useState<WorkflowRun | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentEmployee | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Poll for active simulation progress if in_progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeRunId && isSimulating) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/multi-agent/runs/${activeRunId}`);
          if (res.ok) {
            const data = await res.json();
            setActiveRun(data.run);
            if (data.run.status !== 'in_progress') {
              setIsSimulating(false);
              fetchPerformance();
              fetchRuns();
            }
          }
        } catch (err) {
          console.error("Error polling simulation run", err);
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeRunId, isSimulating]);

  useEffect(() => {
    fetchInitialData();
  }, [businessId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAgents(),
        fetchRuns(),
        fetchPerformance()
      ]);
    } catch (err) {
      console.error("Error fetching multi-agent data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    const res = await fetch('/api/multi-agent/agents');
    if (res.ok) {
      const data = await res.json();
      setAgents(data.agents);
    }
  };

  const fetchRuns = async () => {
    const res = await fetch('/api/multi-agent/runs');
    if (res.ok) {
      const data = await res.json();
      setRuns(data.runs);
      // If there's an in_progress run, select it as active
      const inProgress = data.runs.find((r: any) => r.status === 'in_progress');
      if (inProgress) {
        setActiveRunId(inProgress.id);
        setActiveRun(inProgress);
        setIsSimulating(true);
      }
    }
  };

  const fetchPerformance = async () => {
    const res = await fetch('/api/multi-agent/performance');
    if (res.ok) {
      const data = await res.json();
      setPerformance(data.metrics);
    }
  };

  const handleResetAgents = async () => {
    if (!window.confirm("Are you sure you want to restore all AI employees to standard settings? Any custom parameters will be reset.")) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/multi-agent/agents/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents);
        setFeedbackMsg("Agents successfully restored to standard factory settings!");
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveAgent = async (agent: AgentEmployee) => {
    try {
      const res = await fetch(`/api/multi-agent/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent)
      });
      if (res.ok) {
        setAgents(agents.map(a => a.id === agent.id ? agent : a));
        setSelectedAgent(null);
        setFeedbackMsg(`${agent.name} parameters updated successfully!`);
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSimulation = async () => {
    setIsSimulating(true);
    setActiveRun(null);
    try {
      const res = await fetch('/api/multi-agent/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: selectedWorkflow,
          context: simContext
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRunId(data.runId);
        // fetch single run immediately
        const runRes = await fetch(`/api/multi-agent/runs/${data.runId}`);
        if (runRes.ok) {
          const runData = await runRes.json();
          setActiveRun(runData.run);
        }
      } else {
        setIsSimulating(false);
        alert("Failed to start simulation. Check console logs.");
      }
    } catch (err) {
      console.error(err);
      setIsSimulating(false);
    }
  };

  const handleWorkflowChange = (type: string) => {
    setSelectedWorkflow(type);
    if (type === 'new_customer') {
      setSimContext({
        customerName: 'Eleanor Vance',
        customerEmail: 'eleanor.vance@gmail.com',
        customerPhone: '415-555-8901',
        issueDescription: 'Kitchen main drain is fully backed up. Water overflowing on floor when dishwasher runs.',
        serviceRequested: 'Sewer Line Diagnostics & Cleanout'
      });
    } else if (type === 'estimate_request') {
      setSimContext({
        customerName: 'Dr. Gregory House',
        customerEmail: 'house@diagnostics.org',
        customerPhone: '609-555-0133',
        issueDescription: 'Needs multi-zone replacement proposal for a high-efficiency boiler and commercial-grade hydronic piping.',
        serviceRequested: 'Commercial Boiler Retrofit Proposal'
      });
    } else if (type === 'invoice_reminder') {
      setSimContext({
        customerName: 'Apex Properties Corp',
        customerEmail: 'accounts@apexprop.com',
        customerPhone: '800-555-9011',
        issueDescription: 'Outstanding payment for primary sewage main pipe replacement invoice #INV-9022.',
        serviceRequested: 'Invoice Reminder Escalation'
      });
    } else if (type === 'appointment_booking') {
      setSimContext({
        customerName: 'Sarah Jenkins',
        customerEmail: 'sarah.j@outlook.com',
        customerPhone: '510-555-3344',
        issueDescription: 'Urgent hot water heater leaking from base. Requesting tank replacement availability.',
        serviceRequested: 'Water Heater Replacement Slot Booking'
      });
    } else if (type === 'complaint_resolution') {
      setSimContext({
        customerName: 'Marcus Aurelius',
        customerEmail: 'emperor@stoic.edu',
        customerPhone: '312-555-1212',
        issueDescription: 'Technician left tool grease marks on new Persian rug during sink valve replacement. Demanding cleaning reimbursement.',
        serviceRequested: 'Damage Dispute Resolution'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
        <RefreshCw className="text-slate-950 animate-spin mb-4" size={32} />
        <p className="text-slate-500 font-mono text-xs">Loading AI Workforce Multi-Agent Orchestrator...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="multi-agent-orchestrator-main">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Network className="text-slate-900" size={20} /> Multi-Agent Collaboration Engine
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Coordinate specialized AI employees cooperating seamlessly to complete complex, cross-functional business operations with Supervisor AI audit tracing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAgents}
            disabled={isResetting}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-medium border border-slate-200/60 rounded-xl px-3 py-1.5 bg-white transition-all hover:shadow-sm"
          >
            <RefreshCw size={13} className={isResetting ? 'animate-spin' : ''} /> Restore Defaults
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 shadow-sm"
        >
          <CheckCircle2 size={15} /> {feedbackMsg}
        </motion.div>
      )}

      {/* Orchestrator Sub Navigation */}
      <div className="flex border-b border-slate-100 p-1 bg-slate-50 rounded-xl max-w-lg">
        <button
          onClick={() => setActiveTab('simulate')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'simulate' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Play size={13} /> Run Simulation
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'directory' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={13} /> Employee Registry
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'metrics' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 size={13} /> Performance KPI
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'history' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History size={13} /> Trace Audit Logs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TAB 1: RUN SIMULATION */}
        {activeTab === 'simulate' && (
          <>
            {/* Simulation Setup Pane */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders size={14} className="text-slate-500" /> Simulation Configurator
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Business Scenario</label>
                  <select
                    value={selectedWorkflow}
                    onChange={(e) => handleWorkflowChange(e.target.value)}
                    disabled={isSimulating}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                  >
                    <option value="new_customer">New Customer Inquiry</option>
                    <option value="estimate_request">Estimate & Pricing Proposal</option>
                    <option value="invoice_reminder">Overdue Invoice Escalation</option>
                    <option value="appointment_booking">Appointment Slot Booking</option>
                    <option value="complaint_resolution">Complaint Triage & SOP Update</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer / Context Name</label>
                  <input
                    type="text"
                    value={simContext.customerName}
                    onChange={(e) => setSimContext({ ...simContext, customerName: e.target.value })}
                    disabled={isSimulating}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                    <input
                      type="text"
                      value={simContext.customerEmail}
                      onChange={(e) => setSimContext({ ...simContext, customerEmail: e.target.value })}
                      disabled={isSimulating}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                    <input
                      type="text"
                      value={simContext.customerPhone}
                      onChange={(e) => setSimContext({ ...simContext, customerPhone: e.target.value })}
                      disabled={isSimulating}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Core Issue / Diagnostics SOP Payload</label>
                  <textarea
                    rows={4}
                    value={simContext.issueDescription}
                    onChange={(e) => setSimContext({ ...simContext, issueDescription: e.target.value })}
                    disabled={isSimulating}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleStartSimulation}
                  disabled={isSimulating}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-950 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} /> Orchestrating Multi-Agents...
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Trigger Business Simulation
                    </>
                  )}
                </button>
              </div>

              {/* Work Isolation Notice */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <div className="flex gap-2 text-slate-700">
                  <ShieldCheck size={16} className="text-sky-600 flex-shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tenant & Knowledge Isolation Rules</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Every handoff strictly isolates personal records from agents who lack clear clearance roles. Knowledge specialize sets limits so Chloe the Receptionist has access to general SOP lists, while Bob the Bookkeeper retains billing rates access.
                </p>
              </div>
            </div>

            {/* Simulation Playback & Visual Map */}
            <div className="lg:col-span-2 space-y-6">
              {!activeRun ? (
                <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center flex flex-col items-center justify-center min-h-[300px]">
                  <Network size={40} className="text-slate-300 mb-3 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-700">No Simulation Active</h4>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm">
                    Configure and launch a scenario from the sidebar configuration panel to observe the multi-agent collaboration timeline in action.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 border rounded-2xl flex items-center justify-between shadow-sm bg-white ${
                    activeRun.status === 'completed' ? 'border-emerald-200' :
                    activeRun.status === 'in_progress' ? 'border-sky-200' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        activeRun.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        activeRun.status === 'in_progress' ? 'bg-sky-50 text-sky-600 animate-pulse' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {activeRun.status === 'completed' ? <CheckCircle2 size={18} /> :
                         activeRun.status === 'in_progress' ? <Cpu className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 uppercase">
                            {selectedWorkflow.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            activeRun.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            activeRun.status === 'in_progress' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {activeRun.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Run UID: MA-RUN-{activeRun.id} | Cost: ${activeRun.totalCost} | Tokens: {activeRun.totalTokens}</p>
                      </div>
                    </div>
                  </div>

                  {/* VISUAL WORKFLOW MAP */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
                      <Network size={14} className="text-slate-500" /> Interactive Handoff & Flow Map
                    </h3>

                    {/* Horizontal Node graph */}
                    <div className="flex flex-wrap items-center justify-start gap-4 py-2">
                      {activeRun.timeline && activeRun.timeline.map((event: any, idx: number) => (
                        <React.Fragment key={event.id}>
                          {idx > 0 && (
                            <div className="text-slate-300">
                              <ArrowRight size={16} />
                            </div>
                          )}
                          <div className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                            event.status === 'completed' ? 'border-emerald-200 bg-emerald-50/20' :
                            event.status === 'running' ? 'border-sky-300 bg-sky-50/30 ring-1 ring-sky-200 animate-pulse' : 'border-slate-100 bg-slate-50'
                          }`}>
                            <div className={`w-8 h-8 rounded-full bg-${event.avatarColor || 'slate-500'} flex items-center justify-center text-white text-[11px] font-black`}>
                              {event.agentName.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 leading-tight">{event.agentName}</p>
                              <p className="text-[9px] text-slate-500 leading-none mt-0.5">{event.agentRole}</p>
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                      {activeRun.status === 'in_progress' && (
                        <>
                          <div className="text-slate-300 animate-pulse">
                            <ArrowRight size={16} />
                          </div>
                          <div className="flex items-center gap-2.5 p-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                              <Bot size={13} className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400">Next Agent</p>
                              <p className="text-[9px] text-slate-300 mt-0.5">Handoff Pending</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* REAL-TIME DELEGATION TIMELINE TRACE */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
                      <History size={14} className="text-slate-500" /> Trace Timeline & Context Handoffs
                    </h3>

                    <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                      {activeRun.timeline && activeRun.timeline.map((event: any, idx: number) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          className="flex gap-4 relative"
                        >
                          <div className="flex-shrink-0 z-10">
                            <div className={`w-8.5 h-8.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black ring-4 ring-white`}>
                              {event.agentName.substring(0,2)}
                            </div>
                          </div>

                          <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[11px] font-black text-slate-900">{event.agentName} </span>
                                <span className="text-[10px] text-slate-500 font-medium">({event.agentRole})</span>
                              </div>
                              <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> {event.latencyMs ? `${event.latencyMs}ms` : '620ms'}
                              </span>
                            </div>

                            <div className="border-l-2 border-slate-300 pl-2.5 py-0.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Internal Thought Process</p>
                              <p className="text-slate-600 text-[11px] leading-relaxed mt-1 italic font-medium">
                                "{event.thought}"
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Actions Taken & Artifact Outputs</p>
                              <p className="text-slate-500 text-[10.5px] font-mono leading-none mt-1">{event.action}</p>
                              <div className="mt-2 bg-white border border-slate-100 rounded-xl p-3 text-[11px] text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner">
                                {event.output}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* SUPERVISOR AI HUD */}
                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 text-slate-100 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Shield className="text-amber-500 animate-pulse" size={16} />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                          Supervisor AI ("Supervisor Sovereign") HUD
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        MONITOR ACTIVE
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {activeRun.supervisorLogs && activeRun.supervisorLogs.map((log: any, idx: number) => (
                        <div key={idx} className="flex gap-2.5 text-xs font-mono border-b border-slate-900/50 pb-2">
                          <span className={`text-[10px] uppercase font-black tracking-wider ${
                            log.level === 'critical' ? 'text-red-500' :
                            log.level === 'warning' ? 'text-amber-400' :
                            log.level === 'success' ? 'text-emerald-400' : 'text-sky-400'
                          }`}>
                            [{log.level}]
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className="text-slate-300 leading-relaxed text-[11px]">
                              <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}:</span> {log.message}
                            </p>
                            {log.recommendation && (
                              <p className="text-amber-400 text-[10px] pl-3 border-l border-amber-500/40">
                                <span className="font-bold">Recommendation:</span> {log.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: AGENT DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="lg:col-span-3 space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Cooperating AI Employee Directory</h3>
                <p className="text-slate-500 text-xs">Total Active Specialists: {agents.length}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="border border-slate-100 hover:border-slate-300 rounded-2xl p-4 bg-slate-50/20 hover:bg-white transition-all cursor-pointer shadow-sm relative group flex flex-col justify-between min-h-[190px]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-${agent.avatarColor || 'slate-500'} flex items-center justify-center text-white text-xs font-black`}>
                            {agent.name.substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-sky-600 transition-colors">{agent.name}</h4>
                            <p className="text-[10px] text-slate-400 leading-none mt-0.5">{agent.role}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          agent.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          agent.status === 'coaching' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {agent.status}
                        </span>
                      </div>

                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map((cap, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded-md">
                              {cap}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5 text-[10px] text-slate-500 font-mono mt-2 leading-none">
                          <span className="font-bold text-slate-400">Clearance:</span> {agent.knowledgeAccess.join(", ")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Cpu size={11} /> {agent.assignedTools.length} Tools</span>
                      <span className="text-sky-600 group-hover:underline">Configure parameters →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PERFORMANCE METRICS */}
        {activeTab === 'metrics' && (
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-sm font-bold text-slate-900">AI Employees Operational Analytics</h3>
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Activity size={12} className="text-sky-500 animate-pulse" /> Live Metrics Aggregation
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tasks Orchestrated</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {performance.reduce((acc, curr) => acc + curr.tasksCompleted, 0)}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Handoff Success Rate</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {performance.length > 0 ? `${Math.round(performance.reduce((acc, curr) => acc + curr.handoffSuccessRate, 0) / performance.length)}%` : '100%'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collective Customer Satisfaction</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {performance.length > 0 ? `${(performance.reduce((acc, curr) => acc + curr.customerSatisfaction, 0) / performance.length).toFixed(1)}%` : '96.2%'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accumulative AI Cost</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    ${performance.reduce((acc, curr) => acc + parseFloat(curr.costUsd || "0.00"), 0).toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Table details */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-500 border-collapse">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">AI Employee Role</th>
                      <th className="px-4 py-3">Tasks Completed</th>
                      <th className="px-4 py-3">Execution Success</th>
                      <th className="px-4 py-3">Handoff Success</th>
                      <th className="px-4 py-3">Avg Latency</th>
                      <th className="px-4 py-3">Cost Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {performance.map((perf) => (
                      <tr key={perf.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-800">{perf.agentRole}</td>
                        <td className="px-4 py-3 font-mono">{perf.tasksCompleted}</td>
                        <td className="px-4 py-3 font-mono text-emerald-600 font-bold">{perf.successRate}%</td>
                        <td className="px-4 py-3 font-mono">{perf.handoffSuccessRate}%</td>
                        <td className="px-4 py-3 font-mono">{perf.avgCompletionTimeSec}s</td>
                        <td className="px-4 py-3 font-mono">${parseFloat(perf.costUsd).toFixed(5)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* COACHING RECOMMENDATIONS */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
                <GraduationCap className="text-sky-600" size={16} /> HR Assistant coaching recommendations
              </h3>

              <div className="space-y-3">
                {performance.map((perf) => (
                  perf.coachingRecommendations && (perf.coachingRecommendations as any[]).map((rec: any, idx: number) => (
                    <div key={`${perf.id}-${idx}`} className="flex gap-3 bg-sky-50/20 border border-sky-100/40 p-3 rounded-xl">
                      <div className="p-1 rounded-lg bg-sky-50 text-sky-600 flex-shrink-0 self-start">
                        <GraduationCap size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-900 uppercase">Coaching: {perf.agentRole}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{rec.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{rec.advice}</p>
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT HISTORY */}
        {activeTab === 'history' && (
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Historical trace audit database</h3>
                <p className="text-slate-500 text-xs">Observe full context logs and isolation lineages</p>
              </div>

              {runs.length === 0 ? (
                <div className="text-center py-10">
                  <History size={32} className="text-slate-200 mx-auto mb-2 animate-pulse" />
                  <p className="text-slate-400 text-xs">No traces stored yet. Run a simulation above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {runs.map((runItem) => (
                    <div
                      key={runItem.id}
                      onClick={() => {
                        setActiveRun(runItem);
                        setActiveTab('simulate');
                      }}
                      className="border border-slate-100 hover:border-sky-200 hover:shadow-sm rounded-2xl p-4 bg-slate-50/35 hover:bg-white transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-black text-slate-900 uppercase">
                            {runItem.workflowType.replace('_', ' ')}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            runItem.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {runItem.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">Run UID: MA-RUN-{runItem.id} | Completed At: {new Date(runItem.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-6 text-[11px] font-mono text-slate-500">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase leading-none font-sans font-bold">Handoffs</p>
                          <p className="mt-1 font-black text-slate-800">{runItem.timeline?.length || 0} Steps</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase leading-none font-sans font-bold">Token Volume</p>
                          <p className="mt-1 font-black text-slate-800">{runItem.totalTokens} Tokens</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase leading-none font-sans font-bold">Trace Cost</p>
                          <p className="mt-1 font-black text-slate-800">${parseFloat(runItem.totalCost).toFixed(4)}</p>
                        </div>
                        <button className="text-sky-600 font-sans font-bold hover:underline">Inspect trace →</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AGENT PARAMETER CONFIGURATION DRAWER/MODAL */}
      <AnimatePresence>
        {selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-100"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-${selectedAgent.avatarColor} flex items-center justify-center text-white text-xs font-black`}>
                      {selectedAgent.name.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{selectedAgent.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{selectedAgent.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Status selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specialist Status</label>
                  <select
                    value={selectedAgent.status}
                    onChange={(e) => setSelectedAgent({ ...selectedAgent, status: e.target.value as any })}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                  >
                    <option value="active">Active (On Duty)</option>
                    <option value="coaching">Under Coaching Loop</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>

                {/* Capabilities list input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Functional Capabilities (SOP actions)</label>
                  <div className="space-y-1.5">
                    {selectedAgent.capabilities.map((cap, i) => (
                      <input
                        key={i}
                        type="text"
                        value={cap}
                        onChange={(e) => {
                          const newCaps = [...selectedAgent.capabilities];
                          newCaps[i] = e.target.value;
                          setSelectedAgent({ ...selectedAgent, capabilities: newCaps });
                        }}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-slate-600 outline-none"
                      />
                    ))}
                  </div>
                </div>

                {/* Permissions List */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OS Database Permissions</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgent.permissions.map((perm, i) => (
                      <span key={i} className="text-[10px] font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-100">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Knowledge Access clearances */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RAG Knowledge Category clearances</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgent.knowledgeAccess.map((clearance, i) => (
                      <span key={i} className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                        {clearance}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Assigned Tools */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned OS Toolboxes</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgent.assignedTools.map((tool, i) => (
                      <span key={i} className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveAgent(selectedAgent)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Apply Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
