import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase, Target, ShieldCheck, Activity, Award, CheckCircle2,
  AlertTriangle, DollarSign, TrendingUp, Cpu, Zap, Clock, ThumbsUp,
  ArrowRight, RefreshCw, BarChart3, HelpCircle, FileText, Sliders,
  Trash2, Plus, X, Search, Check, AlertCircle, Ban, TrendingDown, Eye, Play
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

interface AutonomousEngineViewProps {
  businessId: string;
}

interface SuccessMetric {
  metric: string;
  target: string;
  current: string;
}

interface Objective {
  id: number;
  title: string;
  description: string;
  owner: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string;
  successMetrics: SuccessMetric[];
  progress: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'not_started' | 'planning' | 'in_progress' | 'completed' | 'behind_schedule' | 'at_risk';
  dependencies: string[];
  actualCost: string;
  actualRoi: string;
}

interface TaskPlan {
  id: string;
  stepName: string;
  description: string;
  responsibleAgent: string;
  assignedTool: string;
  durationDays: number;
  estimatedCost: string;
  estimatedRoi: string;
  riskLevel: 'low' | 'medium' | 'high';
  approvalRequired: boolean;
  approvalType?: 'auto' | 'manager' | 'owner' | 'finance' | 'legal';
}

interface ExecutionPlan {
  id: number;
  objectiveId: number;
  title: string;
  tasks: TaskPlan[];
  estimatedRoi: string;
  estimatedCost: string;
  timeEstimate: string;
  businessImpact: string;
  confidenceScore: number;
  explanation: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

interface ApprovalRequest {
  id: number;
  title: string;
  requestType: string;
  requesterRole: string;
  requiredRole: 'owner' | 'manager' | 'finance' | 'legal';
  status: 'pending' | 'approved' | 'rejected';
  payload: any;
  createdAt: string;
}

interface ExecutiveBriefing {
  yesterdaySummary: string;
  todayFocus: string;
  risksDetected: string[];
  winsYesterday: string[];
  recommendedPriorities: string[];
}

export default function AutonomousEngineView({ businessId }: AutonomousEngineViewProps) {
  // State management
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'command' | 'objectives' | 'planning' | 'approvals' | 'simulation' | 'briefing' | 'optimization'>('command');
  const [loading, setLoading] = useState(true);
  
  // Create Objective state
  const [isCreatingObjective, setIsCreatingObjective] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOwner, setNewOwner] = useState('Maya (Marketing Director)');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [newDeadline, setNewDeadline] = useState('2026-12-31');
  const [newMetrics, setNewMetrics] = useState<SuccessMetric[]>([
    { metric: 'Conversion Rate', target: '10%', current: '4.5%' }
  ]);
  const [newDependencies, setNewDependencies] = useState('');

  // AI Planning states
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
  const [strategyOptions, setStrategyOptions] = useState<any[]>([]);
  const [isGeneratingStrategies, setIsGeneratingStrategies] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<ExecutionPlan[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [activeStrategyIndex, setActiveStrategyIndex] = useState<number | null>(null);

  // Simulation states
  const [simObjectiveId, setSimObjectiveId] = useState<number | null>(null);
  const [simStrategyType, setSimStrategyType] = useState<string>('ROI-Optimized');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Briefing states
  const [briefingRole, setBriefingRole] = useState<'ceo' | 'cfo' | 'marketing'>('ceo');
  const [briefingData, setBriefingData] = useState<ExecutiveBriefing | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  // Monitoring Alerts states
  const [monitoringStatus, setMonitoringStatus] = useState<any>({
    activeAlertsCount: 0,
    alerts: [],
    timestamp: null
  });
  const [scanning, setScanning] = useState(false);

  // Self-Optimization states
  const [optObjectiveId, setOptObjectiveId] = useState<number | null>(null);
  const [optCost, setOptCost] = useState('550.00');
  const [optRoi, setOptRoi] = useState('1800.00');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  // Load baseline workspace data
  useEffect(() => {
    fetchInitialData();
  }, [businessId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchObjectives(),
        fetchApprovals(),
        runSystemAudit()
      ]);
    } catch (err) {
      console.error("Error loading autonomous workflow elements", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectives = async () => {
    const res = await fetch('/api/autonomous/objectives');
    if (res.ok) {
      const data = await res.json();
      setObjectives(data.objectives);
      if (data.objectives.length > 0) {
        setSelectedObjectiveId(data.objectives[0].id);
        setSimObjectiveId(data.objectives[0].id);
        setOptObjectiveId(data.objectives[0].id);
      }
    }
  };

  const fetchApprovals = async () => {
    const res = await fetch('/api/autonomous/approvals');
    if (res.ok) {
      const data = await res.json();
      setApprovals(data.approvals);
    }
  };

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;

    try {
      const res = await fetch('/api/autonomous/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          owner: newOwner,
          priority: newPriority,
          deadline: newDeadline,
          successMetrics: newMetrics,
          progress: 0,
          riskLevel: 'low',
          status: 'not_started',
          dependencies: newDependencies ? newDependencies.split(',').map(s => s.trim()) : [],
          actualCost: '0.00',
          actualRoi: '0.00'
        })
      });

      if (res.ok) {
        setIsCreatingObjective(false);
        // Reset inputs
        setNewTitle('');
        setNewDescription('');
        setNewOwner('Maya (Marketing Director)');
        setNewPriority('high');
        setNewDeadline('2026-12-31');
        setNewMetrics([{ metric: 'Conversion Rate', target: '10%', current: '4.5%' }]);
        setNewDependencies('');
        await fetchObjectives();
      }
    } catch (err) {
      console.error("Error creating objective", err);
    }
  };

  const handleDeleteObjective = async (id: number) => {
    if (!confirm("Are you sure you want to delete this strategic objective?")) return;
    try {
      const res = await fetch(`/api/autonomous/objectives/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchObjectives();
      }
    } catch (err) {
      console.error("Error deleting objective", err);
    }
  };

  // Decision Engine: Evaluate compete strategies
  const handleEvaluateStrategies = async () => {
    if (!selectedObjectiveId) return;
    setIsGeneratingStrategies(true);
    setStrategyOptions([]);
    setGeneratedPlans([]);
    try {
      const res = await fetch(`/api/autonomous/objectives/${selectedObjectiveId}/strategies`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setStrategyOptions(data.strategies);
      }
    } catch (err) {
      console.error("Error evaluating strategies", err);
    } finally {
      setIsGeneratingStrategies(false);
    }
  };

  // Planning Engine: Draft detailed agent work steps
  const handleDraftPlan = async (strategyName: string, index: number) => {
    if (!selectedObjectiveId) return;
    setIsPlanning(true);
    setActiveStrategyIndex(index);
    try {
      const res = await fetch(`/api/autonomous/objectives/${selectedObjectiveId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyName })
      });
      if (res.ok) {
        const data = await res.json();
        // Append plan
        setGeneratedPlans(prev => [data.plan, ...prev]);
        fetchObjectives();
      }
    } catch (err) {
      console.error("Error drafting plan", err);
    } finally {
      setIsPlanning(false);
      setActiveStrategyIndex(null);
    }
  };

  // Action plan (Approve & Deploy Workflow)
  const handleDeployPlan = async (planId: number, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/autonomous/plans/${planId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // Refresh plans
        if (selectedObjectiveId) {
          const plansRes = await fetch(`/api/autonomous/objectives/${selectedObjectiveId}/plans`);
          if (plansRes.ok) {
            const pData = await plansRes.json();
            setGeneratedPlans(pData.plans);
          }
        }
        await fetchObjectives();
        await fetchApprovals();
      }
    } catch (err) {
      console.error("Error deploying plan", err);
    }
  };

  // Process human approval
  const handleProcessApproval = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/autonomous/approvals/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchApprovals();
      }
    } catch (err) {
      console.error("Error processing approval request", err);
    }
  };

  // Run audit monitoring
  const runSystemAudit = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/autonomous/monitor');
      if (res.ok) {
        const data = await res.json();
        setMonitoringStatus({
          activeAlertsCount: data.activeAlertsCount,
          alerts: data.alerts,
          timestamp: data.timestamp
        });
      }
    } catch (err) {
      console.error("Error running monitoring scan", err);
    } finally {
      setScanning(false);
    }
  };

  // Run Simulation Sandbox
  const handleRunSimulation = async () => {
    if (!simObjectiveId) return;
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await fetch(`/api/autonomous/objectives/${simObjectiveId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyType: simStrategyType })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data.simulation);
      }
    } catch (err) {
      console.error("Error running simulation", err);
    } finally {
      setSimulating(false);
    }
  };

  // Load Morning Briefing
  const loadBriefing = async (role: 'ceo' | 'cfo' | 'marketing') => {
    setLoadingBriefing(true);
    setBriefingData(null);
    try {
      const res = await fetch(`/api/autonomous/briefings/${role}`);
      if (res.ok) {
        const data = await res.json();
        setBriefingData(data.briefing);
      }
    } catch (err) {
      console.error("Error loading daily briefing", err);
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    loadBriefing(briefingRole);
  }, [briefingRole]);

  // Execute Post-Execution optimization (Self-Learning loop)
  const handleOptimizeObjective = async () => {
    if (!optObjectiveId) return;
    setOptimizing(true);
    setOptimizationResult(null);
    try {
      const res = await fetch(`/api/autonomous/objectives/${optObjectiveId}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualCost: optCost,
          actualRoi: optRoi
        })
      });
      if (res.ok) {
        const data = await res.json();
        setOptimizationResult(data.optimization);
        await fetchObjectives();
      }
    } catch (err) {
      console.error("Error running optimization evaluation", err);
    } finally {
      setOptimizing(false);
    }
  };

  // Helper metric calculators
  const completedObjectivesCount = objectives.filter(o => o.status === 'completed').length;
  const inProgressObjectivesCount = objectives.filter(o => o.status === 'in_progress' || o.status === 'behind_schedule' || o.status === 'at_risk').length;
  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  const totalActualCost = objectives.reduce((acc, o) => acc + parseFloat(o.actualCost || '0'), 0);
  const totalActualRoi = objectives.reduce((acc, o) => acc + parseFloat(o.actualRoi || '0'), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Top Brand Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
              <Cpu className="w-5 h-5 animate-pulse" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">Autonomous Business Module</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">AI Autonomous Business Execution Engine</h1>
          <p className="text-slate-400 text-sm mt-0.5 max-w-xl">
            Coordinating specialized AI workforce agents to translate, structure, simulate, and execute strategic corporate objectives.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInitialData}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-slate-100 text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Platform
          </button>
          <button
            onClick={() => setIsCreatingObjective(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-sm shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Strategic Objective
          </button>
        </div>
      </div>

      {/* Bento Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-800 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">Active Objectives</span>
            <div className="text-2xl font-bold mt-1 text-slate-100">{inProgressObjectivesCount} <span className="text-xs text-slate-500 font-normal">in progress</span></div>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">Financial ROI Return</span>
            <div className="text-2xl font-bold mt-1 text-emerald-400">${totalActualRoi.toFixed(2)}</div>
            <span className="text-[10px] text-slate-500 font-mono">Actual yield from completed objectives</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">Pending Approvals</span>
            <div className="text-2xl font-bold mt-1 text-amber-500">{pendingApprovalsCount} <span className="text-xs text-slate-500 font-normal">awaiting HITL</span></div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">Platform Health Scans</span>
            <div className="text-2xl font-bold mt-1 text-sky-400">{monitoringStatus.activeAlertsCount === 0 ? "0 Risk Indicators" : `${monitoringStatus.activeAlertsCount} Anomalies`}</div>
            <span className="text-[10px] text-slate-500 font-mono">Last run: {monitoringStatus.timestamp ? new Date(monitoringStatus.timestamp).toLocaleTimeString() : 'Awaiting check'}</span>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-slate-800 mb-6 overflow-x-auto gap-2">
        <button
          onClick={() => { setActiveTab('command'); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'command' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Sliders className="w-4 h-4" />
          Command Center
        </button>
        <button
          onClick={() => { setActiveTab('objectives'); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'objectives' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Target className="w-4 h-4" />
          Business Objectives
        </button>
        <button
          onClick={() => { setActiveTab('planning'); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'planning' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Cpu className="w-4 h-4" />
          AI Strategy Planner
        </button>
        <button
          onClick={() => { setActiveTab('approvals'); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'approvals' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <ShieldCheck className="w-4 h-4" />
          Human Approvals ({pendingApprovalsCount})
        </button>
        <button
          onClick={() => { setActiveTab('simulation'); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'simulation' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <BarChart3 className="w-4 h-4" />
          Strategy Simulation Sandbox
        </button>
        <button
          onClick={() => { setActiveTab('briefing'); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'briefing' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <FileText className="w-4 h-4" />
          Executive Briefings
        </button>
        <button
          onClick={() => { setActiveTab('optimization'); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'optimization' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Award className="w-4 h-4" />
          Self-Optimization
        </button>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Synchronizing autonomous workspace modules...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* 1. COMMAND CENTER VIEW */}
          {activeTab === 'command' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Alert Ribbon for Anomaly Detection */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-4 mb-4">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                      <Activity className="w-5 h-5 text-sky-400" />
                      Continuous System Auditor (Risk & Anomaly Engine)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Periodically evaluates schedule slippage, budget overruns, and active workflow pipeline health.
                    </p>
                  </div>
                  <button
                    onClick={runSystemAudit}
                    disabled={scanning}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-sky-500 text-slate-950 hover:bg-sky-400 font-semibold rounded-lg text-xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                    Trigger System Audit Scan
                  </button>
                </div>

                {scanning ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mr-2" />
                    <span className="text-sm text-slate-400">Scanning strategic roadmap for slippage triggers...</span>
                  </div>
                ) : monitoringStatus.alerts.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-xl text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="text-xs font-mono">
                      All systems green. No schedule slips, budget variances, or multi-agent communication friction detected in this interval.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monitoringStatus.alerts.map((alert: any, idx: number) => (
                      <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-slate-950 border border-slate-800/80 rounded-xl">
                        <div className="flex items-start gap-3">
                          <span className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${alert.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-900/30' : 'bg-amber-500/10 text-amber-400 border border-amber-900/30'}`}>
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wide">{alert.type}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${alert.severity === 'high' ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40' : 'bg-amber-950/50 text-amber-400 border border-amber-900/40'}`}>{alert.severity.toUpperCase()} RISK</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{alert.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-500">Suggested Move:</span>
                          <span className="px-3 py-1.5 bg-slate-900 text-slate-300 border border-slate-800 text-xs font-medium rounded-lg font-mono">{alert.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid block */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Goals list summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-100">
                    <Target className="w-5 h-5 text-indigo-400" />
                    Strategic Goals Dashboard
                  </h3>
                  <div className="space-y-4">
                    {objectives.slice(0, 3).map((obj) => (
                      <div key={obj.id} className="p-4 bg-slate-950 border border-slate-800/60 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{obj.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">Owner: {obj.owner}</span>
                          </div>
                          <span className={`text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded-full ${obj.status === 'completed' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40' : obj.status === 'behind_schedule' ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40' : 'bg-sky-950/50 text-sky-400 border border-sky-900/40'}`}>
                            {obj.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-2">
                          <div className={`h-full transition-all duration-300 ${obj.status === 'completed' ? 'bg-emerald-500' : obj.status === 'behind_schedule' ? 'bg-rose-500 animate-pulse' : 'bg-sky-500'}`} style={{ width: `${obj.progress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>{obj.progress}% Complete</span>
                          <span>Deadline: {obj.deadline}</span>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setActiveTab('objectives')}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs text-sky-400 font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      Manage All Objectives
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Workflow approvals summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-md font-bold mb-4 flex items-center gap-2 text-slate-100">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    HITL Approval Queue ({pendingApprovalsCount} Awaiting)
                  </h3>
                  {approvals.filter(a => a.status === 'pending').length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 bg-slate-950 rounded-xl border border-slate-800/40">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="text-xs text-slate-400">Autonomous loop is fully cleared and running smoothly.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {approvals.filter(a => a.status === 'pending').slice(0, 2).map((appr) => (
                        <div key={appr.id} className="p-4 bg-slate-950 border border-slate-800/50 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-200">{appr.title}</h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Requested by: {appr.requesterRole}</p>
                            </div>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-950/50 text-amber-400 border border-amber-900/40 rounded-full">
                              Required: {appr.requiredRole}
                            </span>
                          </div>
                          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-900">
                            <button
                              onClick={() => handleProcessApproval(appr.id, 'rejected')}
                              className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/30 text-rose-400 border border-rose-900/40 text-[11px] font-bold rounded-lg transition-all"
                            >
                              Deny Block
                            </button>
                            <button
                              onClick={() => handleProcessApproval(appr.id, 'approved')}
                              className="px-3 py-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-[11px] font-bold rounded-lg transition-all"
                            >
                              Grant Authorization
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setActiveTab('approvals')}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs text-sky-400 font-semibold transition-all flex items-center justify-center gap-1.5"
                      >
                        Launch Action Center
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. BUSINESS OBJECTIVES VIEW */}
          {activeTab === 'objectives' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                  <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                    <Target className="w-5 h-5 text-sky-400" />
                    Strategic Roadmap Matrix
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{objectives.length} Strategic Items Active</p>
                </div>

                <div className="space-y-4">
                  {objectives.map((obj) => (
                    <div key={obj.id} className="p-5 bg-slate-950 border border-slate-800 rounded-xl relative group">
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedObjectiveId(obj.id);
                            setActiveTab('planning');
                          }}
                          className="p-1.5 bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 rounded-lg text-xs transition-all flex items-center gap-1 font-semibold"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          Plan
                        </button>
                        <button
                          onClick={() => handleDeleteObjective(obj.id)}
                          className="p-1.5 bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-start gap-3.5 max-w-[85%] mb-4">
                        <div className={`p-2 rounded-xl ${obj.priority === 'critical' ? 'bg-rose-500/10 text-rose-400' : obj.priority === 'high' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'}`}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-md font-bold text-slate-100">{obj.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wide font-semibold ${obj.priority === 'critical' ? 'bg-rose-950/60 text-rose-400 border border-rose-900/40' : obj.priority === 'high' ? 'bg-amber-950/60 text-amber-400 border border-amber-900/40' : 'bg-sky-950/60 text-sky-400 border border-sky-900/40'}`}>
                              {obj.priority} Priority
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{obj.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-900 pt-4 text-xs">
                        <div>
                          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-mono">Assigned Executive:</span>
                          <p className="text-slate-300 font-medium mt-0.5">{obj.owner}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-mono">Target Date:</span>
                          <p className="text-slate-300 font-mono mt-0.5">{obj.deadline}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-mono">Risk Level:</span>
                          <span className={`inline-flex items-center gap-1 font-semibold font-mono mt-0.5 capitalize ${obj.riskLevel === 'high' ? 'text-rose-400' : obj.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            <AlertCircle className="w-3 h-3" />
                            {obj.riskLevel}
                          </span>
                        </div>
                      </div>

                      {/* Success metrics nested details */}
                      <div className="mt-4 pt-4 border-t border-slate-900">
                        <span className="text-slate-500 uppercase tracking-wider text-[10px] font-mono mb-2 block">Quantifiable Success Metrics:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {obj.successMetrics.map((sm, index) => (
                            <div key={index} className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg">
                              <span className="text-[10px] text-slate-400 font-medium">{sm.metric}</span>
                              <div className="flex items-center justify-between mt-1 text-xs">
                                <span className="text-slate-500 font-mono">Current: <strong className="text-slate-300">{sm.current}</strong></span>
                                <span className="text-sky-400 font-semibold font-mono">Target: {sm.target}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Progress slider layout */}
                      <div className="mt-4 pt-4 border-t border-slate-900 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
                            <span>Strategic Progress Completion</span>
                            <span>{obj.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-300 ${obj.progress === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${obj.progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form trigger modal */}
              {isCreatingObjective && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-xl"
                  >
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-sky-400" />
                        Create Strategic Objective
                      </h3>
                      <button onClick={() => setIsCreatingObjective(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateObjective} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">Objective Title</label>
                        <input
                          type="text"
                          required
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. Optimize localized cold call response metrics"
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">Strategic Description</label>
                        <textarea
                          required
                          rows={3}
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="Provide deep context for the AI multi-agent workforce to structure an appropriate planning roadmap."
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">Lead Owner Agent</label>
                          <select
                            value={newOwner}
                            onChange={(e) => setNewOwner(e.target.value)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-sky-500"
                          >
                            <option value="Maya (Marketing Director)">Maya (Marketing Director)</option>
                            <option value="Marcus (Sales Manager)">Marcus (Sales Manager)</option>
                            <option value="Dave (Dispatcher)">Dave (Dispatcher)</option>
                            <option value="Bob (Bookkeeper)">Bob (Bookkeeper)</option>
                            <option value="Chloe (Receptionist)">Chloe (Receptionist)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">Deadline Target</label>
                          <input
                            type="date"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">Priority Tier</label>
                          <select
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value as any)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">SOP Dependencies (Comma separated)</label>
                          <input
                            type="text"
                            value={newDependencies}
                            onChange={(e) => setNewDependencies(e.target.value)}
                            placeholder="e.g. FAQ Update, SEO Setup"
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-slate-400 font-mono uppercase tracking-wider text-[10px] block">Key Quantifiable Metric</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={newMetrics[0].metric}
                            onChange={(e) => {
                              const updated = [...newMetrics];
                              updated[0].metric = e.target.value;
                              setNewMetrics(updated);
                            }}
                            placeholder="Metric Name"
                            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newMetrics[0].current}
                            onChange={(e) => {
                              const updated = [...newMetrics];
                              updated[0].current = e.target.value;
                              setNewMetrics(updated);
                            }}
                            placeholder="Current"
                            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newMetrics[0].target}
                            onChange={(e) => {
                              const updated = [...newMetrics];
                              updated[0].target = e.target.value;
                              setNewMetrics(updated);
                            }}
                            placeholder="Target"
                            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsCreatingObjective(false)}
                          className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-all"
                        >
                          Save Objective
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* 3. AI STRATEGY PLANNER */}
          {activeTab === 'planning' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-400" />
                      AI Decision & Strategy Planner
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Select a strategic objective to analyze and compare competing AI execution roadmaps.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedObjectiveId || ''}
                      onChange={(e) => setSelectedObjectiveId(Number(e.target.value))}
                      className="p-2 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-lg focus:outline-none"
                    >
                      {objectives.map((o) => (
                        <option key={o.id} value={o.id}>{o.title}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleEvaluateStrategies}
                      disabled={isGeneratingStrategies || !selectedObjectiveId}
                      className="flex items-center gap-2 px-3.5 py-1.5 bg-sky-500 text-slate-950 hover:bg-sky-400 font-bold rounded-lg text-xs transition-all disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Run Strategy Evaluation
                    </button>
                  </div>
                </div>

                {isGeneratingStrategies && (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-xs text-slate-400 font-mono">Decision Engine running multi-parameter SWOT simulations via Gemini-3.5...</p>
                  </div>
                )}

                {!isGeneratingStrategies && strategyOptions.length > 0 && (
                  <div className="space-y-6">
                    {/* Strategy Comparison Console */}
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 block">Competing Execution Strategies Generated</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {strategyOptions.map((opt, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between ${opt.recommended ? 'bg-indigo-950/10 border-indigo-500/50 shadow-indigo-950/10 shadow-lg' : 'bg-slate-950 border-slate-800/80'}`}>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-slate-100">{opt.strategyName}</h4>
                                {opt.recommended && (
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-full">
                                    AI RECOMMENDED
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-400 leading-relaxed italic">"{opt.executiveReasoning}"</p>

                              <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-900 pt-3">
                                <div className="p-1.5 bg-slate-900/40 rounded-lg">
                                  <span className="text-slate-500 font-mono block text-[9px]">PROJECTED RETURN</span>
                                  <span className="text-emerald-400 font-bold">{opt.estimatedRoi}</span>
                                </div>
                                <div className="p-1.5 bg-slate-900/40 rounded-lg">
                                  <span className="text-slate-500 font-mono block text-[9px]">CONFIDENCE</span>
                                  <span className="text-sky-400 font-bold">{opt.confidenceScore}%</span>
                                </div>
                                <div className="p-1.5 bg-slate-900/40 rounded-lg">
                                  <span className="text-slate-500 font-mono block text-[9px]">ESTIMATED COST</span>
                                  <span className="text-slate-300 font-bold">{opt.estimatedCost}</span>
                                </div>
                                <div className="p-1.5 bg-slate-900/40 rounded-lg">
                                  <span className="text-slate-500 font-mono block text-[9px]">TIMELINE</span>
                                  <span className="text-slate-300 font-bold">{opt.timeDays} Days</span>
                                </div>
                              </div>

                              <div className="space-y-1 text-[11px] pt-1">
                                <span className="text-slate-500 font-semibold">Strategic Pros:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                                  {opt.pros.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                </ul>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDraftPlan(opt.strategyName, idx)}
                              disabled={isPlanning}
                              className={`w-full mt-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${isPlanning && activeStrategyIndex === idx ? 'bg-slate-900 text-indigo-400' : opt.recommended ? 'bg-indigo-500 hover:bg-indigo-400 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100'}`}
                            >
                              {isPlanning && activeStrategyIndex === idx ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Drafting Agents SOP Roadmap...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5" />
                                  Draft & Review Execution Plan
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Active Plans Console */}
                    {generatedPlans.length > 0 && (
                      <div className="border-t border-slate-800/80 pt-6 space-y-4">
                        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">Formulated Multi-Agent Action Plans</span>
                        {generatedPlans.map((plan) => (
                          <div key={plan.id} className="p-5 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                <h4 className="text-sm font-bold text-slate-100">{plan.title}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">{plan.explanation}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-1 rounded-full ${plan.status === 'executed' || plan.status === 'approved' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40' : 'bg-amber-950/50 text-amber-400 border border-amber-900/40'}`}>
                                  STATUS: {plan.status}
                                </span>
                                {plan.status === 'pending' && (
                                  <button
                                    onClick={() => handleDeployPlan(plan.id, 'approved')}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md"
                                  >
                                    Deploy Strategy
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3 text-xs bg-slate-900/40 p-3 rounded-lg text-center border border-slate-900">
                              <div>
                                <span className="text-slate-500 block text-[10px] font-mono">ESTIMATED ROI</span>
                                <strong className="text-emerald-400 font-mono text-sm">{plan.estimatedRoi}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] font-mono">ESTIMATED COST</span>
                                <strong className="text-slate-200 font-mono text-sm">{plan.estimatedCost}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] font-mono">CONFIDENCE THRESHOLD</span>
                                <strong className="text-sky-400 font-mono text-sm">{plan.confidenceScore}%</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] font-mono">TOTAL ESTIMATE</span>
                                <strong className="text-slate-300 font-mono text-sm">{plan.timeEstimate}</strong>
                              </div>
                            </div>

                            <div className="space-y-3 pt-2">
                              <span className="text-xs font-semibold text-slate-400">Sequential AI Agents SOP Roadmap Steps:</span>
                              <div className="relative border-l border-slate-800 pl-4 space-y-4 ml-2">
                                {plan.tasks.map((task, idx) => (
                                  <div key={idx} className="relative">
                                    <span className="absolute -left-6 top-0.5 w-3.5 h-3.5 bg-slate-950 border border-sky-500 rounded-full flex items-center justify-center text-[8px] font-bold text-sky-400 font-mono">
                                      {idx + 1}
                                    </span>
                                    <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-lg">
                                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-200 text-xs">{task.stepName}</span>
                                          <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-indigo-400 font-semibold font-mono rounded-lg">{task.responsibleAgent}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                                          <span>Tool: <strong>{task.assignedTool}</strong></span>
                                          <span>Duration: <strong>{task.durationDays} days</strong></span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-slate-400">{task.description}</p>
                                      {task.approvalRequired && (
                                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/25 border border-amber-900/30 px-2 py-1 rounded-md w-fit font-mono">
                                          <ShieldCheck className="w-3 h-3" />
                                          Requires manual Human approval: {task.approvalType?.toUpperCase()} policy authorization.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 4. HUMAN APPROVALS VIEW */}
          {activeTab === 'approvals' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      Human-In-The-Loop Policy Gatekeeper
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Approve, modify or reject critical financial, messaging, or service transactions proposed by autonomous agents.</p>
                  </div>
                  <span className="text-xs bg-slate-950 px-2.5 py-1 text-slate-400 rounded-lg border border-slate-850 font-mono">{approvals.length} Total Logs</span>
                </div>

                {approvals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    <p className="text-xs text-slate-400">All agent proposals are currently clear and authorized.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvals.map((appr) => (
                      <div key={appr.id} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3 pb-3 border-b border-slate-900 text-xs">
                          <div className="space-y-1">
                            <span className="text-slate-500 font-mono uppercase tracking-wider text-[9px]">Authorization Request ID #{appr.id}</span>
                            <h4 className="text-sm font-bold text-slate-100">{appr.title}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>Requester: <strong className="text-indigo-400">{appr.requesterRole}</strong></span>
                              <span>•</span>
                              <span>Policy Area: <strong className="text-slate-300">{appr.requestType.toUpperCase()}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-mono text-[10px]">Required Stakeholder:</span>
                            <span className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 font-mono font-bold uppercase tracking-wide rounded-lg text-[10px]">
                              {appr.requiredRole}
                            </span>
                          </div>
                        </div>

                        {appr.payload && (
                          <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-900 text-xs font-mono text-slate-300 overflow-x-auto">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">PROPOSED PAYLOAD METRICS:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {appr.payload.stepName && (
                                <div>
                                  <span className="text-[9px] text-slate-500 block">Step Target</span>
                                  <span>{appr.payload.stepName}</span>
                                </div>
                              )}
                              {appr.payload.estimatedCost && (
                                <div>
                                  <span className="text-[9px] text-slate-500 block">Proposed Cost</span>
                                  <span className="text-rose-400 font-bold">{appr.payload.estimatedCost}</span>
                                </div>
                              )}
                              {appr.payload.estimatedRoi && (
                                <div>
                                  <span className="text-[9px] text-slate-500 block">Expected Return</span>
                                  <span className="text-emerald-400 font-bold">{appr.payload.estimatedRoi}</span>
                                </div>
                              )}
                              {appr.payload.durationDays && (
                                <div>
                                  <span className="text-[9px] text-slate-500 block">Planned Duration</span>
                                  <span>{appr.payload.durationDays} Days</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-4">
                          <span className="text-[10px] text-slate-500 font-mono">Received: {new Date(appr.createdAt).toLocaleString()}</span>
                          <div className="flex items-center gap-2">
                            {appr.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleProcessApproval(appr.id, 'rejected')}
                                  className="px-3.5 py-1.5 bg-rose-950/30 hover:bg-rose-900/20 text-rose-400 border border-rose-900/40 text-xs font-bold rounded-lg transition-all"
                                >
                                  Reject Proposal
                                </button>
                                <button
                                  onClick={() => handleProcessApproval(appr.id, 'approved')}
                                  className="px-4 py-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold rounded-lg transition-all"
                                >
                                  Grant Auth
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-1 text-xs">
                                {appr.status === 'approved' ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Approved
                                  </span>
                                ) : (
                                  <span className="text-rose-400 font-bold flex items-center gap-1">
                                    <Ban className="w-4 h-4 text-rose-400" /> Rejected
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 5. STRATEGY SIMULATION SANDBOX */}
          {activeTab === 'simulation' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      Strategic Simulation Sandbox
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Simulate cash flow, marketing velocity, and operational strain curves before deploying actual multi-agent systems.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={simObjectiveId || ''}
                      onChange={(e) => setSimObjectiveId(Number(e.target.value))}
                      className="p-2 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-lg focus:outline-none"
                    >
                      {objectives.map((o) => (
                        <option key={o.id} value={o.id}>{o.title}</option>
                      ))}
                    </select>

                    <select
                      value={simStrategyType}
                      onChange={(e) => setSimStrategyType(e.target.value)}
                      className="p-2 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-lg focus:outline-none"
                    >
                      <option value="ROI-Optimized">ROI-Optimized Strategy</option>
                      <option value="Fast-Execution">Fast-Execution Strategy</option>
                      <option value="Risk-Mitigated">Risk-Mitigated Strategy</option>
                    </select>

                    <button
                      onClick={handleRunSimulation}
                      disabled={simulating || !simObjectiveId}
                      className="flex items-center gap-2 px-3.5 py-1.5 bg-sky-500 text-slate-950 hover:bg-sky-400 font-bold rounded-lg text-xs transition-all disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Run Monte-Carlo Simulation
                    </button>
                  </div>
                </div>

                {simulating && (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
                    <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                    <p className="text-xs text-slate-400 font-mono">Running 1,000 algorithmic parameter iterations across CRM & Billing variables...</p>
                  </div>
                )}

                {!simulating && simulationResult && (
                  <div className="space-y-6">
                    {/* Key Simulation metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                        <span className="text-slate-500 uppercase tracking-wider text-[9px] font-mono block">Simulation Confidence Score</span>
                        <div className="text-xl font-bold text-sky-400 mt-1">{simulationResult.confidenceScore}% Threshold</div>
                      </div>
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                        <span className="text-slate-500 uppercase tracking-wider text-[9px] font-mono block">Staffing Level Requirement</span>
                        <div className="text-xl font-bold text-slate-200 mt-1">{simulationResult.staffingRequirement}</div>
                      </div>
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                        <span className="text-slate-500 uppercase tracking-wider text-[9px] font-mono block">Revenue Growth Velocity</span>
                        <div className="text-xl font-bold text-emerald-400 mt-1">{simulationResult.revenueForecast}</div>
                      </div>
                    </div>

                    {/* Chart area */}
                    <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">30-Day Cash Flow Projections & Operational Strain Chart</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={simulationResult.metrics.cashFlowCurve}>
                            <defs>
                              <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: 10 }} />
                            <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                            <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorCash)" name="Estimated Capital Balance ($)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-slate-500 italic mt-2">Simulation note: {simulationResult.cashFlowImpact}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 6. EXECUTIVE BRIEFINGS ROOM */}
          {activeTab === 'briefing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      Morning Executive Briefings Room
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Role-customized morning updates consolidating complete operations, billing, and retention milestones.</p>
                  </div>

                  <div className="flex gap-2">
                    {['ceo', 'cfo', 'marketing'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setBriefingRole(role as any)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase font-mono rounded-lg transition-all ${briefingRole === role ? 'bg-sky-500 text-slate-950' : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200'}`}
                      >
                        {role} BRIEFING
                      </button>
                    ))}
                  </div>
                </div>

                {loadingBriefing ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
                    <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
                    <p className="text-xs text-slate-400 font-mono">Consolidating yesterday metrics and forecasting risk parameters via Gemini-3.5...</p>
                  </div>
                ) : briefingData ? (
                  <div className="space-y-5 text-xs">
                    {/* Role Intro Card */}
                    <div className="p-4.5 bg-slate-950 border border-slate-850 rounded-xl">
                      <div className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest mb-1">Morning Update for {briefingRole.toUpperCase()}</div>
                      <h4 className="text-sm font-bold text-slate-100 mb-2">Primary Actionable Focus for Today:</h4>
                      <p className="text-slate-300 leading-relaxed italic">"{briefingData.todayFocus}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Summary & Wins */}
                      <div className="space-y-4">
                        <div className="p-4.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Yesterday Operations Summary</span>
                          <p className="text-slate-300 leading-relaxed">{briefingData.yesterdaySummary}</p>
                        </div>

                        <div className="p-4.5 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Yesterday Core Milestones & Wins</span>
                          <ul className="space-y-2">
                            {briefingData.winsYesterday.map((win, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300">
                                <span className="p-0.5 bg-emerald-500/10 text-emerald-400 rounded-md mt-0.5">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                                <span>{win}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Risks & Strategic Moves */}
                      <div className="space-y-4">
                        <div className="p-4.5 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">Anomalies & Risks Flagged</span>
                          <ul className="space-y-2">
                            {briefingData.risksDetected.map((risk, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300">
                                <span className="p-0.5 bg-rose-500/10 text-rose-400 rounded-md mt-0.5">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4.5 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block">AI Suggested Strategic Priorities</span>
                          <ul className="space-y-2">
                            {briefingData.recommendedPriorities.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-300">
                                <span className="p-0.5 bg-sky-500/10 text-sky-400 rounded-md mt-0.5">
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}

          {/* 7. SELF-OPTIMIZATION CONSOLE */}
          {activeTab === 'optimization' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      Self-Optimization & Learning Loop
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Runs post-execution audits comparing actual results with predictions to adjust internal weight algorithms.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={optObjectiveId || ''}
                      onChange={(e) => setOptObjectiveId(Number(e.target.value))}
                      className="p-2 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-lg focus:outline-none"
                    >
                      {objectives.map((o) => (
                        <option key={o.id} value={o.id}>{o.title}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">Actual Cost ($)</span>
                      <input
                        type="text"
                        value={optCost}
                        onChange={(e) => setOptCost(e.target.value)}
                        placeholder="e.g. 500"
                        className="p-1.5 w-20 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">Actual ROI ($)</span>
                      <input
                        type="text"
                        value={optRoi}
                        onChange={(e) => setOptRoi(e.target.value)}
                        placeholder="e.g. 1500"
                        className="p-1.5 w-20 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-lg focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleOptimizeObjective}
                      disabled={optimizing || !optObjectiveId}
                      className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold rounded-lg text-xs transition-all disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Optimize Planning Weights
                    </button>
                  </div>
                </div>

                {optimizing && (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-xs text-slate-400 font-mono">Calculating cost-variance parameters and updating planning neural matrices...</p>
                  </div>
                )}

                {!optimizing && optimizationResult && (
                  <div className="space-y-5 text-xs font-mono">
                    <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-xl text-emerald-400 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm">Post-Execution Audit Complete</h4>
                        <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                          {optimizationResult.selfOptimizationAdjustment}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Financial comparisons */}
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                        <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block">Financial Variance Matrix</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-500">Predicted Cost:</span>
                            <p className="text-sm font-bold text-slate-300">{optimizationResult.predictedCost}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">Actual Cost:</span>
                            <p className="text-sm font-bold text-rose-400">{optimizationResult.actualCost}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">Predicted ROI multiplier:</span>
                            <p className="text-sm font-bold text-slate-300">{optimizationResult.predictedRoi}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">Actual ROI achieved:</span>
                            <p className="text-sm font-bold text-emerald-400">{optimizationResult.actualRoi}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-slate-500">Cost Variance:</span>
                            <strong className="text-rose-400 ml-1">{optimizationResult.costVariancePercent}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">ROI Variance:</span>
                            <strong className="text-emerald-400 ml-1">{optimizationResult.roiVariancePercent}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Updated Weights */}
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                        <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block">Adjusted Planning Coefficients</span>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Confidence Threshold Weight:</span>
                            <strong className="text-sky-400">{optimizationResult.optimizedModelWeights.confidenceThreshold}%</strong>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Risk Penalty Coefficient:</span>
                            <strong className="text-amber-400">x{optimizationResult.optimizedModelWeights.riskPenaltyCoefficient}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                          Algorithm updates successfully committed. Future multi-agent plans formulated by the AI strategy planner will employ these updated safety thresholds.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
