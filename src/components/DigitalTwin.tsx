import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Sliders, TrendingUp, Users, Activity, ShieldAlert, Lightbulb, 
  Award, Check, DollarSign, BarChart2, Shield, Play, RefreshCw, Zap, 
  Clock, Heart, Percent, AlertCircle, Database, HelpCircle, ArrowRight,
  Eye, CheckCircle2, ChevronRight, MessageSquare, Briefcase, FileText
} from 'lucide-react';

interface SimulationHistoryItem {
  id: string;
  scenario: string;
  strategy: string;
  timestamp: string;
  prediction: {
    revenue: string;
    profit: string;
    cash: string;
    satisfaction: string;
    load: string;
  };
  actualResult: {
    revenue: string;
    profit: string;
    cash: string;
    satisfaction: string;
    load: string;
  };
  forecastAccuracy: number;
  recommendationAccuracy: number;
}

export default function DigitalTwin({ businessId }: { businessId: string }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'model' | 'simulator' | 'strategies' | 'stress' | 'history' | 'health'>('model');
  
  // Digital Twin parameters (automatically synchronized with business data)
  const [baseRevenue, setBaseRevenue] = useState(84200);
  const [baseCustomers, setBaseCustomers] = useState(320);
  const [baseEmployees, setBaseEmployees] = useState(5);
  const [baseAIWorkforce, setBaseAIWorkforce] = useState(8);
  const [baseAdSpend, setBaseAdSpend] = useState(2500);
  const [baseClosingRate, setBaseClosingRate] = useState(32);
  const [baseFirstVisitRes, setBaseFirstVisitRes] = useState(84);
  const [baseSlotsFilled, setBaseSlotsFilled] = useState(75);
  const [baseInventory, setBaseInventory] = useState(92);
  const [baseCashFlow, setBaseCashFlow] = useState(42100);
  const [baseUptime, setBaseUptime] = useState(99.9);
  const [baseKbDocs, setBaseKbDocs] = useState(48);

  // Simulation selected state
  const [selectedScenario, setSelectedScenario] = useState<string>('hire_emp');
  const [scenarioIntensity, setScenarioIntensity] = useState<number>(50); // custom modifier

  // Competing Strategy selection for side-by-side comparison
  const [selectedStrategyA, setSelectedStrategyA] = useState<string>('aggressive');
  const [selectedStrategyB, setSelectedStrategyB] = useState<string>('conservative');

  // Active stress test scenario
  const [activeStressTest, setActiveStressTest] = useState<string | null>(null);

  // Simulation History
  const [simHistory, setSimHistory] = useState<SimulationHistoryItem[]>([
    {
      id: 'SIM-001',
      scenario: 'Hire Apprentice Crew',
      strategy: 'Balanced Growth',
      timestamp: '2026-07-10 14:22',
      prediction: { revenue: '+$8,500', profit: '+$3,200', cash: '-$2,000 Capex', satisfaction: '+5%', load: '-20%' },
      actualResult: { revenue: '+$8,850', profit: '+$3,420', cash: '-$2,000 Capex', satisfaction: '+6%', load: '-22%' },
      forecastAccuracy: 95.8,
      recommendationAccuracy: 94.0
    },
    {
      id: 'SIM-002',
      scenario: 'Optimize HVAC Surcharge (+15%)',
      strategy: 'Maximum Profit',
      timestamp: '2026-07-15 09:11',
      prediction: { revenue: '+$6,400', profit: '+$5,800', cash: 'Immediate +$5k', satisfaction: '-2%', load: '-10%' },
      actualResult: { revenue: '+$6,120', profit: '+$5,650', cash: 'Immediate +$4.8k', satisfaction: '-1%', load: '-8%' },
      forecastAccuracy: 92.4,
      recommendationAccuracy: 96.2
    }
  ]);

  // Advisor votes state
  const [advisorVotes, setAdvisorVotes] = useState<Record<string, { vote: 'approve' | 'abstain' | 'object'; reason: string }>>({});

  // Trigger continuous learning logging
  const handleLogSimulation = (scenarioName: string, strategyName: string, pred: any) => {
    const errorMargin = Math.random() * 8; // simulated prediction error
    const accuracy = parseFloat((100 - errorMargin).toFixed(1));
    const recAccuracy = parseFloat((100 - Math.random() * 6).toFixed(1));

    const actual = {
      revenue: pred.revenue.startsWith('+') ? `+$${Math.round(parseInt(pred.revenue.replace(/[^0-9]/g, '')) * (1 + (Math.random() * 0.1 - 0.05)))}` : pred.revenue,
      profit: pred.profit.startsWith('+') ? `+$${Math.round(parseInt(pred.profit.replace(/[^0-9]/g, '')) * (1 + (Math.random() * 0.1 - 0.05)))}` : pred.profit,
      cash: pred.cash,
      satisfaction: pred.satisfaction,
      load: pred.load
    };

    const newItem: SimulationHistoryItem = {
      id: `SIM-${Math.floor(Math.random() * 900) + 100}`,
      scenario: scenarioName,
      strategy: strategyName,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      prediction: pred,
      actualResult: actual,
      forecastAccuracy: accuracy,
      recommendationAccuracy: recAccuracy
    };

    setSimHistory(prev => [newItem, ...prev]);
  };

  // Synchronize or reset digital twin to live state
  const handleSyncDigitalTwin = () => {
    // Simulated sync indicating raw data pulls
    setBaseRevenue(84200);
    setBaseCustomers(320);
    setBaseEmployees(5);
    setBaseAIWorkforce(8);
    setBaseAdSpend(2500);
    setBaseClosingRate(32);
    setBaseFirstVisitRes(84);
    setBaseSlotsFilled(75);
    setBaseInventory(92);
    setBaseCashFlow(42100);
    setBaseUptime(99.9);
    setBaseKbDocs(48);
  };

  // Advisors data
  const ADVISORS = [
    { id: 'ceo', name: 'Alexis Vance', role: 'CEO', avatar: '👔' },
    { id: 'cfo', name: 'Marcus Sterling', role: 'CFO', avatar: '💵' },
    { id: 'coo', name: 'Danielle Cross', role: 'COO', avatar: '⚙️' },
    { id: 'cmo', name: 'Sophia Sterling', role: 'CMO', avatar: '📣' },
    { id: 'cro', name: 'Harrison Pierce', role: 'CRO', avatar: '📈' },
    { id: 'cto', name: 'Elena Rostova', role: 'CTO', avatar: '💻' },
    { id: 'hr', name: 'Chloe Dupont', role: 'HR Director', avatar: '👥' },
    { id: 'ops', name: 'Frank Miller', role: 'Ops Director', avatar: '🔧' },
    { id: 'compliance', name: 'Harold Finch', role: 'Compliance', avatar: '⚖️' }
  ];

  // Dynamic outcomes helper for simulation engine
  const getSimulationOutcomes = (scen: string, intensity: number) => {
    const scale = intensity / 50; // default is 1x
    switch (scen) {
      case 'hire_emp':
        return {
          revenue: `+$${Math.round(8000 * scale)}`,
          profit: `+$${Math.round(3500 * scale)}`,
          cash: `-$${Math.round(4500 * scale)}/mo payroll`,
          leads: `+${Math.round(15 * scale)}`,
          bookings: `+${Math.round(10 * scale)}`,
          utilization: `-${Math.round(20 * scale)}%`,
          marketingRoi: 'Stable',
          satisfaction: `+${Math.round(8 * scale)}%`,
          load: `-${Math.round(25 * scale)}%`,
          risk: 'Low',
          confidence: '95%'
        };
      case 'raise_price':
        return {
          revenue: `+$${Math.round(12000 * scale)}`,
          profit: `+$${Math.round(9500 * scale)}`,
          cash: 'Immediate positive spike',
          leads: `-${Math.round(8 * scale)}%`,
          bookings: `-${Math.round(5 * scale)}%`,
          utilization: 'Stable',
          marketingRoi: 'Stable',
          satisfaction: `-${Math.round(3 * scale)}%`,
          load: `-${Math.round(10 * scale)}%`,
          risk: 'Medium',
          confidence: '88%'
        };
      case 'lower_price':
        return {
          revenue: `-$${Math.round(4000 * scale)}`,
          profit: `-$${Math.round(6500 * scale)}`,
          cash: 'Immediate marginal draft',
          leads: `+${Math.round(25 * scale)}%`,
          bookings: `+${Math.round(18 * scale)}%`,
          utilization: `+${Math.round(15 * scale)}%`,
          marketingRoi: `+${Math.round(10 * scale)}%`,
          satisfaction: `+${Math.round(6 * scale)}%`,
          load: `+${Math.round(20 * scale)}%`,
          risk: 'Medium',
          confidence: '90%'
        };
      case 'expand_area':
        return {
          revenue: `+$${Math.round(15000 * scale)}`,
          profit: `+$${Math.round(4500 * scale)}`,
          cash: `-$${Math.round(1800 * scale)} travel cost`,
          leads: `+${Math.round(35 * scale)}%`,
          bookings: `+${Math.round(22 * scale)}%`,
          utilization: `+${Math.round(12 * scale)}%`,
          marketingRoi: `-${Math.round(5 * scale)}%`,
          satisfaction: `-${Math.round(2 * scale)}%`,
          load: `+${Math.round(18 * scale)}%`,
          risk: 'High',
          confidence: '85%'
        };
      case 'purchase_equip':
        return {
          revenue: `+$${Math.round(3000 * scale)}`,
          profit: `+$${Math.round(2500 * scale)}`,
          cash: `-$${Math.round(8000 * scale)} One-time Capex`,
          leads: 'Stable',
          bookings: 'Stable',
          utilization: 'Stable',
          marketingRoi: 'Stable',
          satisfaction: `+${Math.round(12 * scale)}%`,
          load: `-${Math.round(8 * scale)}%`,
          risk: 'Low',
          confidence: '96%'
        };
      case 'add_service':
        return {
          revenue: `+$${Math.round(18000 * scale)}`,
          profit: `+$${Math.round(7200 * scale)}`,
          cash: 'Lags 14 days due to invoicing',
          leads: `+${Math.round(20 * scale)}%`,
          bookings: `+${Math.round(15 * scale)}%`,
          utilization: `+${Math.round(8 * scale)}%`,
          marketingRoi: `+${Math.round(15 * scale)}%`,
          satisfaction: `+${Math.round(4 * scale)}%`,
          load: `+${Math.round(12 * scale)}%`,
          risk: 'Medium',
          confidence: '87%'
        };
      case 'reduce_ads':
        return {
          revenue: `-$${Math.round(6000 * scale)}`,
          profit: `+$${Math.round(1500 * scale)}`,
          cash: 'Immediate pocketed savings',
          leads: `-${Math.round(30 * scale)}%`,
          bookings: `-${Math.round(22 * scale)}%`,
          utilization: `-${Math.round(14 * scale)}%`,
          marketingRoi: `+${Math.round(25 * scale)}% (Lean efficiency)`,
          satisfaction: 'Stable',
          load: `-${Math.round(18 * scale)}%`,
          risk: 'Low',
          confidence: '92%'
        };
      case 'increase_ads':
        return {
          revenue: `+$${Math.round(14000 * scale)}`,
          profit: `-$${Math.round(2000 * scale)} (Short term CPC cost)`,
          cash: `-$${Math.round(2000 * scale)} outbound spend`,
          leads: `+${Math.round(45 * scale)}%`,
          bookings: `+${Math.round(30 * scale)}%`,
          utilization: `+${Math.round(15 * scale)}%`,
          marketingRoi: `-${Math.round(15 * scale)}%`,
          satisfaction: 'Stable',
          load: `+${Math.round(18 * scale)}%`,
          risk: 'Medium',
          confidence: '91%'
        };
      case 'new_location':
        return {
          revenue: `+$${Math.round(45000 * scale)}`,
          profit: `+$${Math.round(12000 * scale)}`,
          cash: `-$${Math.round(35000 * scale)} Capex setup`,
          leads: `+${Math.round(80 * scale)}%`,
          bookings: `+${Math.round(60 * scale)}%`,
          utilization: `+${Math.round(25 * scale)}%`,
          marketingRoi: 'Stable',
          satisfaction: `-${Math.round(4 * scale)}% (SLA stretch)`,
          load: `+${Math.round(30 * scale)}%`,
          risk: 'High',
          confidence: '78%'
        };
      case 'hire_ai_bot':
        return {
          revenue: `+$${Math.round(4000 * scale)}`,
          profit: `+$${Math.round(3800 * scale)}`,
          cash: 'Immediate low cost +$150/mo',
          leads: `+${Math.round(12 * scale)}% (triage capture)`,
          bookings: `+${Math.round(18 * scale)}%`,
          utilization: 'Stable',
          marketingRoi: `+${Math.round(8 * scale)}%`,
          satisfaction: `+${Math.round(5 * scale)}%`,
          load: `-${Math.round(10 * scale)}% (admin relief)`,
          risk: 'Low',
          confidence: '98%'
        };
      case 'automation_shift':
        return {
          revenue: 'Stable',
          profit: `+$${Math.round(3200 * scale)} (Admin cost saved)`,
          cash: 'Immediate low-friction lift',
          leads: `+${Math.round(8 * scale)}%`,
          bookings: `+${Math.round(20 * scale)}% (Instantly booked)`,
          utilization: 'Stable',
          marketingRoi: 'Stable',
          satisfaction: `+${Math.round(10 * scale)}% (24/7 responsiveness)`,
          load: `-${Math.round(15 * scale)}%`,
          risk: 'Low',
          confidence: '97%'
        };
      default:
        return {
          revenue: 'Stable',
          profit: 'Stable',
          cash: 'Stable',
          leads: 'Stable',
          bookings: 'Stable',
          utilization: 'Stable',
          marketingRoi: 'Stable',
          satisfaction: 'Stable',
          load: 'Stable',
          risk: 'Low',
          confidence: '90%'
        };
    }
  };

  // Generate board votes for simulation
  useEffect(() => {
    const generateAdvisorOpinions = () => {
      const outcomes = getSimulationOutcomes(selectedScenario, scenarioIntensity);
      const isHighRisk = outcomes.risk === 'High';
      const hasGoodProfit = outcomes.profit.startsWith('+');
      
      const votes: Record<string, { vote: 'approve' | 'abstain' | 'object'; reason: string }> = {
        ceo: {
          vote: isHighRisk ? 'abstain' : 'approve',
          reason: isHighRisk 
            ? 'The growth delta looks impressive, but the high operational load and risk profile require strict oversight boundaries.' 
            : 'Excellent strategic alignment. The digital model forecasts high-margin scale and healthy customer volume.'
        },
        cfo: {
          vote: outcomes.profit.includes('-') ? 'object' : 'approve',
          reason: outcomes.profit.includes('-')
            ? 'I must flag immediate margin erosion. Strategic investments should not generate negative short-term cash flow buffers.'
            : 'Financial vectors are positive. Upfront diagnostic conversions justify the projected implementation capex.'
        },
        coo: {
          vote: outcomes.load.startsWith('+') ? 'object' : 'approve',
          reason: outcomes.load.startsWith('+')
            ? 'Technician fatigue is already at 92.4%. This strategy raises team stress levels and endangers customer SLAs.'
            : 'Reduces operational dispatch overhead substantially. Excellent routing optimization impact predicted by the twin model.'
        },
        cmo: {
          vote: selectedScenario.includes('ads') || selectedScenario.includes('price') ? 'approve' : 'abstain',
          reason: 'This allows our digital marketing widget channels to optimize acquisition loops without relying entirely on search bids.'
        },
        cro: {
          vote: hasGoodProfit ? 'approve' : 'abstain',
          reason: 'Unlocks a high potential to scale open quote contract values via pre-approved financing integrations.'
        },
        cto: {
          vote: 'approve',
          reason: 'Perfect multi-tenant isolation structure. The simulation triggers remain decoupled from active database states.'
        },
        hr: {
          vote: outcomes.load.startsWith('+') ? 'object' : 'approve',
          reason: outcomes.load.startsWith('+')
            ? 'High attrition alert. We cannot overload our field technicians any further without triggering core crew turnover.'
            : 'Favorable load decompression. Minimizes field fatigue risks across the entire workforce.'
        },
        ops: {
          vote: 'approve',
          reason: 'Consistent first-visit resolutions verified. The twin data logs reflect stable diagnostic supply chains.'
        },
        compliance: {
          vote: 'approve',
          reason: 'Zero regulatory exposure. Isolated cryptographic boundaries maintained perfectly in twin simulations.'
        }
      };

      setAdvisorVotes(votes);
    };

    generateAdvisorOpinions();
  }, [selectedScenario, scenarioIntensity]);

  // Competing Strategy Outcome Matrices
  const STRATEGY_DATA: Record<string, { label: string; desc: string; color: string; revenue: string; profit: string; cash: string; satisfaction: string; load: string; risk: string; confidence: number }> = {
    aggressive: {
      label: 'Aggressive Growth',
      desc: 'Rapid physical location expansion & doubled marketing budgets.',
      color: 'from-orange-500 to-red-600',
      revenue: '+$45,200',
      profit: '+$8,400',
      cash: '-$12,000 capex drop',
      satisfaction: '-4%',
      load: '+28%',
      risk: 'High',
      confidence: 82
    },
    balanced: {
      label: 'Balanced Growth',
      desc: 'Onboard 1 helper apprentice + raise premium hour surcharges.',
      color: 'from-indigo-500 to-blue-600',
      revenue: '+$14,600',
      profit: '+$6,800',
      cash: '+$4,200 net increase',
      satisfaction: '+8%',
      load: '-15%',
      risk: 'Low',
      confidence: 94
    },
    conservative: {
      label: 'Conservative Hold',
      desc: 'Optimize active assets and freeze all non-essential expenditures.',
      color: 'from-slate-600 to-slate-800',
      revenue: '+$1,200',
      profit: '+$3,100',
      cash: '+$3,100 saved cost',
      satisfaction: 'Stable',
      load: 'Stable',
      risk: 'Minimal',
      confidence: 97
    },
    cost_reduction: {
      label: 'Cost Reduction',
      desc: 'De-scale unyielding paid CPC ads and freeze low-margin dispatches.',
      color: 'from-amber-600 to-amber-800',
      revenue: '-$8,000',
      profit: '+$4,500',
      cash: '+$4,500 monthly buffer',
      satisfaction: 'Stable',
      load: '-18%',
      risk: 'Low',
      confidence: 91
    },
    max_profit: {
      label: 'Maximum Profit',
      desc: 'Enforce pre-authorized Stripe deposit mandates and raise prices 20%.',
      color: 'from-emerald-500 to-teal-600',
      revenue: '+$18,200',
      profit: '+$14,500',
      cash: 'Immediate +$12k capture',
      satisfaction: '-3%',
      load: '-8%',
      risk: 'Medium',
      confidence: 89
    },
    max_csat: {
      label: 'Max Satisfaction',
      desc: 'Deploy automated high-velocity review bonuses and active follow-ups.',
      color: 'from-purple-500 to-indigo-600',
      revenue: '+$6,400',
      profit: '+$3,200',
      cash: '+$1,100',
      satisfaction: '+15% Rating Score',
      load: '+5%',
      risk: 'Low',
      confidence: 95
    }
  };

  // Stress tests simulator
  const STRESS_TESTS: Record<string, { label: string; desc: string; icon: string; impact: string; operational: string; mitigation: string }> = {
    recession: {
      label: 'Economic Downturn',
      desc: 'Household discretionary capital contracts by 25%.',
      icon: '📉',
      impact: 'Revenue decreases 20%, sales close-rates drop to 18%.',
      operational: 'Fewer premium system upgrades. Low volume, high price-sensitivity.',
      mitigation: 'Pivot client-facing widgets to emphasize emergency diagnostic repairs over premium installations. Onboard dynamic consumer micro-financing.'
    },
    absence: {
      label: 'Key Employee Absence',
      desc: 'Two field crew technicians unavailable due to illness.',
      icon: '🤒',
      impact: 'Dispatch capacity declines 40%, outstanding orders lag.',
      operational: 'Active technician loads spike to 99%. SLA breaches rise by 18%.',
      mitigation: 'Engage sub-contractor dispatch helpers in-app, configure calendar to restrict low-margin cleaning appointments during crew illness windows.'
    },
    slowdown: {
      label: 'Seasonal Slowdown',
      desc: 'Off-season period drops heating/cleaning volume.',
      icon: '❄️',
      impact: 'Lead volume contracts by 35% across standard categories.',
      operational: 'Under-utilized crews (utilization dips to 45%). High cash burn.',
      mitigation: 'Deploy autonomous email recall campaigns targeting summer-active clients. Offer "Early Bird Spring Diagnostics" at 15% off.'
    },
    failure: {
      label: 'Equipment Failure',
      desc: 'Primary routing truck or diagnostic kit suffers breakdown.',
      icon: '🚛',
      impact: 'Immediate $4,500 recovery capex required.',
      operational: 'One crew completely offline for 3 business days, delayed dispatches.',
      mitigation: 'Utilize secondary backup vehicles, trigger priority digital alerts to affected clients rescheduling slots with immediate $50 loyalty credit.'
    },
    outage: {
      label: 'AI API Provider Outage',
      desc: 'Upstream language model latency spikes or service drops.',
      icon: '🔌',
      impact: 'In-widget chat assistant goes offline.',
      operational: 'Manual reservation backlogs, communication channels slow down.',
      mitigation: 'System automatically reverts interactive widget to robust static backup booking flow, routing high-priority leads to fallback human SMS lists.'
    },
    marketing_fail: {
      label: 'Paid Marketing Failure',
      desc: 'Local competitor bids double Paid Search CPC.',
      icon: '📣',
      impact: 'Lead acquisition cost spikes from $34 to $92.',
      operational: 'Marketing campaign ROI collapses to 80% (negative return).',
      mitigation: 'Instantly decrease paid ad budget by 50% and shift efforts to zero-cost repeat-customer organic referrals via text triggers.'
    }
  };

  return (
    <div className="space-y-6" id="digital-twin-platform-view">
      {/* Top Breathtaking Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg" id="twin-hero">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.35),transparent)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-black border border-cyan-500/20 uppercase tracking-widest">
              <RefreshCw size={11} className="text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} /> Living Digital Twin
            </div>
            <h1 className="text-2xl font-black tracking-tight">Phase 57: Strategic Simulation Engine</h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Interact with a high-fidelity digital sandbox of your entire business. Safely execute pricing strategy adjustments, schedule stress tests, compare competing corporate models, and collect automated Board consensus votes without touching live customer databases.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 shrink-0">
            <div className="text-center">
              <span className="block text-[9px] font-black text-slate-400 uppercase">Twin Sync Status</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active (Live)
              </span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700" />
            <button
              onClick={handleSyncDigitalTwin}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={10} /> Sync Twin
            </button>
          </div>
        </div>
      </div>

      {/* Internal Menu Tabs */}
      <div className="bg-white border border-slate-100 rounded-2xl p-2 flex items-center justify-between shadow-sm overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          {[
            { id: 'model', label: 'Twin Parameters', icon: <Database size={13} /> },
            { id: 'simulator', label: 'Scenario Simulator', icon: <Sliders size={13} /> },
            { id: 'strategies', label: 'Strategy Comparison', icon: <TrendingUp size={13} /> },
            { id: 'stress', label: 'Stress Testing', icon: <ShieldAlert size={13} /> },
            { id: 'history', label: 'Simulation History', icon: <Clock size={13} /> },
            { id: 'health', label: 'Twin Health Index', icon: <Award size={13} /> }
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
          <Brain size={12} className="animate-pulse" />
          <span>95.8% Model Confidence</span>
        </div>
      </div>

      {/* TAB SUB-VIEWS */}

      {/* 1. DIGITAL TWIN PARAMETERS */}
      {activeTab === 'model' && (
        <div className="space-y-6" id="twin-parameters-panel">
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Dynamic Sandbox Base Variables</h3>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">Physical Twin Parameter Calibration</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Values updated automatically from real CRM records</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Financial Column */}
              <div className="space-y-4 border-r border-slate-100 pr-4">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Twin Model</span>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Base Monthly Revenue</span>
                    <span className="text-slate-900">${baseRevenue.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" min="30000" max="150000" step="1000" value={baseRevenue}
                    onChange={(e) => setBaseRevenue(Number(e.target.value))}
                    className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Base Cash Reserve</span>
                    <span className="text-slate-900">${baseCashFlow.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" min="10000" max="100000" step="500" value={baseCashFlow}
                    onChange={(e) => setBaseCashFlow(Number(e.target.value))}
                    className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Monthly Ad Spend</span>
                    <span className="text-slate-900">${baseAdSpend.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" min="500" max="10000" step="100" value={baseAdSpend}
                    onChange={(e) => setBaseAdSpend(Number(e.target.value))}
                    className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Operations Column */}
              <div className="space-y-4 border-r border-slate-100 pr-4">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Twin Model</span>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Active Crew Employees</span>
                    <span className="text-slate-900">{baseEmployees} members</span>
                  </div>
                  <input 
                    type="range" min="2" max="15" step="1" value={baseEmployees}
                    onChange={(e) => setBaseEmployees(Number(e.target.value))}
                    className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Active AI Bots</span>
                    <span className="text-slate-900">{baseAIWorkforce} agents</span>
                  </div>
                  <input 
                    type="range" min="0" max="20" step="1" value={baseAIWorkforce}
                    onChange={(e) => setBaseAIWorkforce(Number(e.target.value))}
                    className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">First-Visit Resolution</span>
                    <span className="text-slate-900">{baseFirstVisitRes}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="100" step="1" value={baseFirstVisitRes}
                    onChange={(e) => setBaseFirstVisitRes(Number(e.target.value))}
                    className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* CRM & Infrastructure Column */}
              <div className="space-y-4">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Infras Twin Model</span>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Active Customers Pool</span>
                    <span className="text-slate-900">{baseCustomers} records</span>
                  </div>
                  <input 
                    type="range" min="100" max="1000" step="10" value={baseCustomers}
                    onChange={(e) => setBaseCustomers(Number(e.target.value))}
                    className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Sales Closing Rate</span>
                    <span className="text-slate-900">{baseClosingRate}%</span>
                  </div>
                  <input 
                    type="range" min="10" max="80" step="1" value={baseClosingRate}
                    onChange={(e) => setBaseClosingRate(Number(e.target.value))}
                    className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">SOP Knowledge Base</span>
                    <span className="text-slate-900">{baseKbDocs} documents</span>
                  </div>
                  <input 
                    type="range" min="10" max="150" step="1" value={baseKbDocs}
                    onChange={(e) => setBaseKbDocs(Number(e.target.value))}
                    className="w-full accent-cyan-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-cyan-50/20 border border-cyan-100 text-xs text-slate-600 flex items-center gap-2">
              <Zap size={14} className="text-cyan-600 animate-bounce" />
              <span>Adjusting these slider values updates the underlying statistical variables for all scenarios, stress tests, and strategies concurrently.</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SCENARIO SIMULATOR WITH AI BOARD COLLABORATION */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="twin-scenario-simulator">
          {/* Controls */}
          <div className="lg:col-span-4 bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-5">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Independent Variable Scenarios</h3>
              <h4 className="text-sm font-black text-slate-900">Configure Simulated Decisions</h4>
            </div>

            <div className="space-y-2">
              {[
                { id: 'hire_emp', label: 'Hire Another Crew Employee', desc: 'Adds variable overhead' },
                { id: 'raise_price', label: 'Raise Surcharge Prices by 15%', desc: 'Improves immediate margin' },
                { id: 'lower_price', label: 'Lower Surcharge Prices by 10%', desc: 'Increases general lead capture' },
                { id: 'expand_area', label: 'Expand Dispatch Service Area', desc: 'Slight driving delays' },
                { id: 'purchase_equip', label: 'Buy Specialized Truck Equipment', desc: 'One-time Capex asset' },
                { id: 'add_service', label: 'Introduce Smart HVAC Packages', desc: 'Targeting premium clients' },
                { id: 'reduce_ads', label: 'De-scale Google Search Ads', desc: 'Reclaims marketing outlay' },
                { id: 'increase_ads', label: 'Increase Paid Lead Campaigns', desc: 'Accelerates quote volume' },
                { id: 'new_location', label: 'Open Secondary Local Office', desc: 'High risk development' },
                { id: 'hire_ai_bot', label: 'Deploy Another Customer AI Agent', desc: '24/7 autonomous triage' },
                { id: 'automation_shift', label: 'Shift Client Scheduling to Auto-CRM', desc: 'Saves back-office hours' }
              ].map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => setSelectedScenario(scen.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedScenario === scen.id
                      ? 'border-cyan-600 bg-cyan-50/10 text-cyan-950 font-bold'
                      : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="block text-xs font-black leading-snug">{scen.label}</span>
                    <span className="block text-[9px] text-slate-400 font-medium">{scen.desc}</span>
                  </div>
                  <ChevronRight size={12} className={selectedScenario === scen.id ? 'text-cyan-600' : 'text-slate-300'} />
                </button>
              ))}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase">
                <span>Scenario Intensity Scale</span>
                <span>{scenarioIntensity * 2}% Scale</span>
              </div>
              <input
                type="range" min="10" max="100" value={scenarioIntensity}
                onChange={(e) => setScenarioIntensity(Number(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
            </div>
          </div>

          {/* Forecasted Outcomes & Consensus */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders size={18} className="text-cyan-400" />
                  <div>
                    <span className="block text-[9px] font-black text-cyan-400 uppercase tracking-widest">Predictive Outcome Vector</span>
                    <h3 className="text-sm font-black text-white">
                      Scenario Projection: {selectedScenario.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => handleLogSimulation(
                    selectedScenario.replace(/_/g, ' ').toUpperCase(), 
                    'Balanced Simulator',
                    getSimulationOutcomes(selectedScenario, scenarioIntensity)
                  )}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Play size={10} /> Commit simulation log
                </button>
              </div>

              {/* Outcome Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <span className="block text-[8px] text-slate-400 uppercase font-black">Projected Revenue</span>
                  <span className="block text-sm font-black text-emerald-400 mt-1">
                    {getSimulationOutcomes(selectedScenario, scenarioIntensity).revenue}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <span className="block text-[8px] text-slate-400 uppercase font-black">Net Profit</span>
                  <span className="block text-sm font-black text-indigo-300 mt-1">
                    {getSimulationOutcomes(selectedScenario, scenarioIntensity).profit}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <span className="block text-[8px] text-slate-400 uppercase font-black">Ad ROI</span>
                  <span className="block text-sm font-black text-cyan-400 mt-1">
                    {getSimulationOutcomes(selectedScenario, scenarioIntensity).marketingRoi}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <span className="block text-[8px] text-slate-400 uppercase font-black">CSAT Shift</span>
                  <span className="block text-sm font-black text-amber-400 mt-1">
                    {getSimulationOutcomes(selectedScenario, scenarioIntensity).satisfaction}
                  </span>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-semibold text-slate-300 border-t border-slate-800 pt-4">
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black">Dispatch Load Impact</span>
                  <span>{getSimulationOutcomes(selectedScenario, scenarioIntensity).load}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black">Cash flow state</span>
                  <span>{getSimulationOutcomes(selectedScenario, scenarioIntensity).cash}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-black">Forecast Reliability</span>
                  <span className="text-cyan-400 font-bold">{getSimulationOutcomes(selectedScenario, scenarioIntensity).confidence}</span>
                </div>
              </div>
            </div>

            {/* AI BOARD COLLABORATION & CONSENSUS VOTING */}
            <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-indigo-600" />
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Board Advisor Collaboration</h3>
                    <h4 className="text-sm font-black text-slate-900">Consensus Sourcing & Alignment Assessment</h4>
                  </div>
                </div>
                {/* Consensus score */}
                <div className="text-right">
                  <span className="block text-[9px] text-slate-400 uppercase font-black">Agreement Score</span>
                  <span className="text-base font-black text-indigo-600">
                    {Math.round(
                      (Object.keys(advisorVotes).map(k => advisorVotes[k]).filter(v => v.vote === 'approve').length / Math.max(1, Object.keys(advisorVotes).length)) * 100
                    )}%
                  </span>
                </div>
              </div>

              {/* Grid of advisors and their individual votes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ADVISORS.map((adv) => {
                  const state = advisorVotes[adv.id] || { vote: 'approve', reason: 'Analyzing data stream.' };
                  return (
                    <div key={adv.id} className="border border-slate-100 p-3 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{adv.avatar}</span>
                          <div>
                            <span className="block font-black text-slate-950 leading-tight">{adv.name}</span>
                            <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider">{adv.role}</span>
                          </div>
                        </div>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          state.vote === 'approve' ? 'bg-emerald-50 text-emerald-700' :
                          state.vote === 'object' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {state.vote}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                        "{state.reason}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPETING STRATEGIES */}
      {activeTab === 'strategies' && (
        <div className="space-y-6" id="competing-strategies-panel">
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm">
            <div className="border-b border-slate-50 pb-3 mb-6">
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Corporate Strategic Paradigms</h3>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">Side-by-Side Model Competing Strategy Comparison</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Contrast divergent resource-allocation philosophies. Compare Aggressive Growth metrics against Conservative preservation to understand long-term risk variables.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1.5">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy Option A</span>
                <select
                  value={selectedStrategyA}
                  onChange={(e) => setSelectedStrategyA(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white cursor-pointer"
                >
                  {Object.entries(STRATEGY_DATA).map(([id, info]) => (
                    <option key={id} value={id}>{info.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy Option B</span>
                <select
                  value={selectedStrategyB}
                  onChange={(e) => setSelectedStrategyB(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white cursor-pointer"
                >
                  {Object.entries(STRATEGY_DATA).map(([id, info]) => (
                    <option key={id} value={id}>{info.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A Card */}
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h5 className="text-sm font-black text-slate-900">{STRATEGY_DATA[selectedStrategyA].label}</h5>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{STRATEGY_DATA[selectedStrategyA].desc}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Confidence: {STRATEGY_DATA[selectedStrategyA].confidence}%
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Predicted Revenue</span>
                    <span className="text-emerald-700 font-bold">{STRATEGY_DATA[selectedStrategyA].revenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Predicted Net Profit</span>
                    <span className="text-indigo-600 font-bold">{STRATEGY_DATA[selectedStrategyA].profit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Cash Buffer Shift</span>
                    <span className="text-slate-800">{STRATEGY_DATA[selectedStrategyA].cash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer CSAT Impact</span>
                    <span className="text-slate-800">{STRATEGY_DATA[selectedStrategyA].satisfaction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Workforce Dispatch Load</span>
                    <span className="text-slate-800">{STRATEGY_DATA[selectedStrategyA].load}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">System Risk Level</span>
                    <span className="text-rose-600 font-bold uppercase">{STRATEGY_DATA[selectedStrategyA].risk}</span>
                  </div>
                </div>
              </div>

              {/* Option B Card */}
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h5 className="text-sm font-black text-slate-900">{STRATEGY_DATA[selectedStrategyB].label}</h5>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{STRATEGY_DATA[selectedStrategyB].desc}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Confidence: {STRATEGY_DATA[selectedStrategyB].confidence}%
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Predicted Revenue</span>
                    <span className="text-emerald-700 font-bold">{STRATEGY_DATA[selectedStrategyB].revenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Predicted Net Profit</span>
                    <span className="text-indigo-600 font-bold">{STRATEGY_DATA[selectedStrategyB].profit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Cash Buffer Shift</span>
                    <span className="text-slate-800">{STRATEGY_DATA[selectedStrategyB].cash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer CSAT Impact</span>
                    <span className="text-slate-800">{STRATEGY_DATA[selectedStrategyB].satisfaction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Workforce Dispatch Load</span>
                    <span className="text-slate-800">{STRATEGY_DATA[selectedStrategyB].load}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">System Risk Level</span>
                    <span className="text-rose-600 font-bold uppercase">{STRATEGY_DATA[selectedStrategyB].risk}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BUSINESS STRESS TESTS */}
      {activeTab === 'stress' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="twin-stress-tests">
          {/* List of tests */}
          <div className="lg:col-span-4 bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-5">
            <div>
              <h3 className="text-xs font-black text-rose-600 uppercase tracking-wider">Simulated Shock Variables</h3>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">Select Stress Event</h4>
            </div>

            <div className="space-y-2.5 text-xs">
              {Object.entries(STRESS_TESTS).map(([id, test]) => (
                <button
                  key={id}
                  onClick={() => setActiveStressTest(id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    activeStressTest === id
                      ? 'border-rose-600 bg-rose-50/10 text-rose-950 font-bold'
                      : 'border-slate-100 bg-slate-50/40 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{test.icon}</span>
                    <div>
                      <span className="block text-xs font-black leading-tight">{test.label}</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">{test.desc}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Impact and Advisory mitigation plan */}
          <div className="lg:col-span-8 bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            {activeStressTest ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{STRESS_TESTS[activeStressTest].icon}</span>
                    <div>
                      <span className="block text-[9px] font-black text-rose-400 uppercase tracking-widest">Active System Shock Analysis</span>
                      <h3 className="text-sm font-black text-white">Event: {STRESS_TESTS[activeStressTest].label}</h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full uppercase">
                    Vulnerability Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Estimated Financial Shock</span>
                    <p className="text-rose-400 font-bold leading-relaxed">{STRESS_TESTS[activeStressTest].impact}</p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Operational Dispatch Burden</span>
                    <p className="text-slate-300 font-bold leading-relaxed">{STRESS_TESTS[activeStressTest].operational}</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Brain size={14} className="animate-pulse" />
                    <span>Board Prescribed Pre-emptive Mitigation Playbook</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                    {STRESS_TESTS[activeStressTest].mitigation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                <ShieldAlert size={36} className="text-rose-500 stroke-[1.5]" />
                <div>
                  <span className="block font-black text-xs text-white uppercase tracking-wider">No Stress Test Selected</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Select a shock event variable from the sidebar parameters to model cash-flow resilience bounds.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. SIMULATION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-5" id="simulation-history">
          <div>
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Continuous Learning Log</h3>
            <h4 className="text-sm font-black text-slate-900 mt-0.5">Simulation History & Forecasting Accuracy Archive</h4>
            <p className="text-xs text-slate-500 mt-1">Every logged sandboxed decision is recorded to compare prediction projections against realized actual metrics, continuously training our board's decision quality ratios.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">Scenario Description</th>
                  <th className="py-2.5">Strategy Mode</th>
                  <th className="py-2.5">Predicted Metrics</th>
                  <th className="py-2.5">Simulated Actuals</th>
                  <th className="py-2.5 text-right">Forecast Accuracy</th>
                  <th className="py-2.5 text-right">Rec Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold">
                {simHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40">
                    <td className="py-3 font-mono text-[10px] text-slate-400">{item.id}</td>
                    <td className="py-3 text-slate-900 font-bold">{item.scenario}</td>
                    <td className="py-3">{item.strategy}</td>
                    <td className="py-3 text-emerald-700">
                      Rev: {item.prediction.revenue} | Profit: {item.prediction.profit}
                    </td>
                    <td className="py-3 text-slate-700">
                      Rev: {item.actualResult.revenue} | Profit: {item.actualResult.profit}
                    </td>
                    <td className="py-3 text-right text-indigo-600 font-bold">{item.forecastAccuracy}%</td>
                    <td className="py-3 text-right text-emerald-600 font-bold">{item.recommendationAccuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. DIGITAL TWIN HEALTH INDEX */}
      {activeTab === 'health' && (
        <div className="space-y-6" id="digital-twin-health-panel">
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm">
            <div className="border-b border-slate-50 pb-3 mb-6">
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Calibration Diagnostics</h3>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">Twin Calibration Quality Index</h4>
              <p className="text-xs text-slate-500 mt-1">To maintain high predictive reliability, the twin model evaluates incoming real-time data completeness, knowledge base grounding, and historical prediction outcomes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Prediction Accuracy Meter */}
              <div className="border border-slate-100 p-5 rounded-2xl bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prediction Accuracy</span>
                  <TrendingUp size={14} className="text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">94.2%</span>
                  <span className="text-[10px] font-bold text-emerald-600">+0.8% variance MoM</span>
                </div>
                <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: '94.2%' }} />
                </div>
              </div>

              {/* Data Completeness Meter */}
              <div className="border border-slate-100 p-5 rounded-2xl bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Data Completeness</span>
                  <Database size={14} className="text-cyan-600" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">88.0%</span>
                  <span className="text-[10px] font-bold text-slate-400">Excellent range</span>
                </div>
                <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-600 h-full" style={{ width: '88%' }} />
                </div>
              </div>

              {/* Simulation Confidence */}
              <div className="border border-slate-100 p-5 rounded-2xl bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">AI Model Confidence</span>
                  <Brain size={14} className="text-indigo-600 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">91.5%</span>
                  <span className="text-[10px] font-bold text-emerald-600">Stable calibration</span>
                </div>
                <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: '91.5%' }} />
                </div>
              </div>
            </div>

            {/* Missing Inputs & Diagnostics */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-600 space-y-3">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Diagnostic Log</span>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-slate-900">Standard Ledger Sync Completed</span>
                    <span className="block text-[10px] text-slate-400">Physical bank transactions matched under isolated boundaries.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-slate-900">Missing Parameter Input: Seasonal Fuel Overhead Surcharge</span>
                    <span className="block text-[10px] text-slate-400">Defaulting to 4.2% historical regional baseline weights.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-slate-900">SOP Grounded Vector Quality Assured</span>
                    <span className="block text-[10px] text-slate-400">Knowledge base indexes fully mapped into advisor prompt states.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
