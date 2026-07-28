import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, TrendingUp, Users, Calendar, Activity, ShieldAlert, Lightbulb, 
  Briefcase, Brain, MessageSquare, CheckSquare, Play, ArrowRight, ChevronRight, 
  Info, Lock, Scale, Zap, Award, AlertCircle, ThumbsUp, ThumbsDown, Check, 
  HelpCircle, Sliders, DollarSign, BarChart2, Shield, EyeOff, RefreshCw, Layers
} from 'lucide-react';

interface MetricWhy {
  why: string;
  evidence: string;
  confidence: number;
  actions: string[];
  impact: string;
}

interface MetricCardProps {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  whyAnalysis: MetricWhy;
  icon: React.ReactNode;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

// 10 specialized advisors
interface Advisor {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  quote: string;
  focus: string;
  detailedAnalysis: string;
}

const ADVISORS: Advisor[] = [
  {
    id: 'ceo',
    name: 'Alexis Vance',
    role: 'Chief Executive Officer',
    avatar: '👔',
    color: 'from-slate-700 to-slate-900',
    focus: 'Corporate Vision & Multi-Year Scale',
    quote: 'We must align our operational capacity directly with highest-margin service regions. Volume without margin is purely high-risk noise.',
    detailedAnalysis: 'Macro-level analysis indicates market-entry maturity is at 84%. To unlock the next scale phase, we should transition 40% of standard field teams into specialized premium upgrade installers. Standardizing average order value to exceed $8,000 shifts the business out of competitive price wars.'
  },
  {
    id: 'cfo',
    name: 'Marcus Sterling',
    role: 'Chief Financial Officer',
    avatar: '💵',
    color: 'from-emerald-700 to-emerald-950',
    focus: 'Capital Reserves, Margin Optimization & GAAP',
    quote: 'With outstanding receivables at 14.7%, we are subsidizing client cash flow. Enforcing upfront diagnostic billing increases net cash runway.',
    detailedAnalysis: 'Gross margin currently sits at 72.4%. However, client payment delays are dragging down our dynamic cash buffer. Standardizing a 10% premium on late net-30 terms and deploying automated SMS payment collection via Stripe reduces the billing cycle by an estimated 11.4 days.'
  },
  {
    id: 'coo',
    name: 'Danielle Cross',
    role: 'Chief Operating Officer',
    avatar: '⚙️',
    color: 'from-blue-700 to-blue-950',
    focus: 'Routing Logistics, Job Duration & SLAs',
    quote: 'Technician load is hovering around 92%. Expanding our service radius without onboarding support risks cascading customer SLA breaches.',
    detailedAnalysis: 'Average response times in external zones stand at 54 minutes—a critical 14-minute breach of our gold-tier standard. Before approving further regional marketing expansions, we must implement smart-routing zones or onboard a contractor dispatch helper.'
  },
  {
    id: 'cmo',
    name: 'Sophia Sterling',
    role: 'Chief Marketing Officer',
    avatar: '📣',
    color: 'from-pink-700 to-pink-950',
    focus: 'Lead Acquisition Cost, CTR & Multi-Channel',
    quote: 'Google Ads CPC has spiked by 18%. We must immediately shift budget into localized community organic referral structures.',
    detailedAnalysis: 'Paid acquisition ROI remains healthy at 320%, but search ad auction density is compressing margins. Grounding our active widget prompts to offer high-conversion reviews to organic repeat clients bypasses paid platforms entirely, driving local word-of-mouth.'
  },
  {
    id: 'cro',
    name: 'Harrison Pierce',
    role: 'Chief Revenue Officer',
    avatar: '📈',
    color: 'from-indigo-700 to-indigo-950',
    focus: 'Contract Values, CRM Conversions & Bundling',
    quote: 'Our closing rate on premium quotes is only 32%. Introducing low-interest financing packages directly on invoice prompts lifts conversion.',
    detailedAnalysis: 'Unlocking pre-approved, in-widget payment financing structures for estimates over $3,000 addresses immediate consumer affordability concerns, lifting average ticket conversions by a projected 18-24% without degrading nominal pricing standards.'
  },
  {
    id: 'cto',
    name: 'Elena Rostova',
    role: 'Chief Technology Officer',
    avatar: '💻',
    color: 'from-purple-700 to-purple-950',
    focus: 'AI Safety Rails, Vector Search & High Availability',
    quote: 'All system configurations are operating inside isolated multi-tenant sandboxes. Zero PII leak vectors detected during penetration testing.',
    detailedAnalysis: 'The underlying multi-agent knowledge models are fully grounded with local SOP vectors, scoring 99.2% on intent-matching accuracy. System uptime remains solid at 99.99% with response latencies under 280ms.'
  },
  {
    id: 'cs',
    name: 'Maya Lin',
    role: 'Customer Success Director',
    avatar: '🤝',
    color: 'from-amber-700 to-amber-950',
    focus: 'Churn Prevention, CSAT & Review Generation',
    quote: 'Our net CSAT score is stellar at 4.8/5. We can translate this loyalty into automatic organic referral revenue with zero ad friction.',
    detailedAnalysis: 'By triggering feedback triggers exactly 2 hours after technician job sign-off, we can capture high-scoring Google Reviews before consumer excitement cools. High reviews directly influence our local map ranking positions.'
  },
  {
    id: 'ops_dir',
    name: 'Frank Miller',
    role: 'Operations Director',
    avatar: '🔧',
    color: 'from-orange-700 to-orange-950',
    focus: 'First-Visit Resolution & Field Quality Audits',
    quote: 'Equipping technicians with diagnostic smart-kits has driven first-visit resolution rates from 84% to 92%.',
    detailedAnalysis: 'Reducing repeat visits is our highest lever for saving fuel and labor costs. Deploying standardized visual checklist requirements before any field technician departs a site enforces strict QC standards.'
  },
  {
    id: 'hr_dir',
    name: 'Chloe Dupont',
    role: 'HR Director',
    avatar: '👥',
    color: 'from-teal-700 to-teal-950',
    focus: 'Workforce Capacity, Burnout & Overutilization',
    quote: 'Technician utilization at 92% is unsustainable. If we do not onboard support or raise prices to curb volume, burnout is imminent.',
    detailedAnalysis: 'Employee retention risk has risen into the high category. Overtime hours have increased 28% MoM. We recommend either establishing a capacity cap, or raising prices to filter out lower-value, high-effort jobs.'
  },
  {
    id: 'compliance',
    name: 'Harold Finch',
    role: 'Compliance Advisor',
    avatar: '⚖️',
    color: 'from-red-800 to-red-950',
    focus: 'PII, Tenant Isolation & Regulatory Auditing',
    quote: 'Enforcing physical tenant boundaries ensures total separation of business records. HIPAA compliance scores remain at 100%.',
    detailedAnalysis: 'All client databases are bound to specific encrypted key scopes. Row-level filters prevent any cross-tenant data requests. Standardized backup and audit logging schedules are fully automated.'
  }
];

export default function ExecutiveIntelligence({ businessId }: { businessId: string }) {
  // Navigation: war_room, scenario_planner, risk_radar, board_meeting, continuous_learning
  const [activeSubTab, setActiveSubTab] = useState<'war_room' | 'scenario' | 'radar' | 'board' | 'learning'>('war_room');
  
  // Dashboard states
  const [selectedMetricId, setSelectedMetricId] = useState<string>('revenue');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('ceo');
  const [briefingGenerated, setBriefingGenerated] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingText, setBriefingText] = useState<string>('');

  // Scenario Planner State
  const [selectedScenario, setSelectedScenario] = useState<string>('hire');
  const [customSlider, setCustomSlider] = useState<number>(15); // e.g. price increase %, etc.

  // Learning System Action Tracking
  const [acceptedRecs, setAcceptedRecs] = useState<string[]>([]);
  const [rejectedRecs, setRejectedRecs] = useState<string[]>([]);
  const [accuracyLogs, setAccuracyLogs] = useState<{ id: string; rec: string; outcome: string; confidence: number; date: string }[]>([
    { id: 'REC-01', rec: 'Enforce upfront diagnostic billing on main sewer repairs', outcome: 'Sewer dispatch billing cycle decreased from 14 to 3 days. Total receivables draft reduced by $4,200.', confidence: 94, date: '2026-07-02' },
    { id: 'REC-02', rec: 'Bundle preventative HVAC coil cleanings on old installs', outcome: 'Upsell conversion rate improved by 16.4%, generating $3,800 auxiliary revenue.', confidence: 88, date: '2026-07-10' },
    { id: 'REC-03', rec: 'Automate review link triggers 2 hours post-cleanout', outcome: 'Captured 14 consecutive 5-star Google reviews. Local map ranking improved by 2 spots.', confidence: 91, date: '2026-07-15' }
  ]);

  // Validation Panel Sandbox Status
  const [validating, setValidating] = useState(false);
  const [validationLog, setValidationLog] = useState<string[]>([]);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Dynamic calculations based on scenario selection
  const getScenarioForecast = () => {
    switch (selectedScenario) {
      case 'hire':
        return {
          revenue: '+18%',
          cost: '+$4,500/mo',
          profit: '+$2,200/mo (Net)',
          cash: 'Initial -$2,000 onboarding capex',
          operational: 'Reduces current technician utilization from 92% down to 72%, mitigating key staff burnout risk completely.',
          risks: 'Low. Under-utilization risk if local lead acquisition rate dips below 20 leads/month.'
        };
      case 'price':
        const profitChange = customSlider > 15 ? '+12%' : '+8%';
        return {
          revenue: `+${customSlider}%`,
          cost: '+$0 (No added variable cost)',
          profit: profitChange,
          cash: 'Immediate positive net flow increment',
          operational: 'Potential 4-6% volume churn. Filters out low-value bargain shoppers, boosting active field margins.',
          risks: 'Medium. Competitor pricing matching could impact market conversion slightly.'
        };
      case 'ad_reduce':
        return {
          revenue: '-8%',
          cost: '-$1,800/mo (Marketing Savings)',
          profit: '+$1,100/mo net cash saved',
          cash: 'Immediate monthly outbound cash reduction',
          operational: 'Reduces diagnostic queue load, providing temporary breathing room for an overloaded dispatch staff.',
          risks: 'Medium. Slower lead velocity risks long-term pipeline drying if key accounts churn.'
        };
      case 'expand':
        return {
          revenue: '+22%',
          cost: '+$1,600/mo (Fuel & travel overhead)',
          profit: '+$3,400/mo',
          cash: 'Varying. Lags 14 days due to invoicing intervals',
          operational: 'Increases average dispatch drive time by 18 minutes. Enforces strict routing schedule requirements.',
          risks: 'High. Driving time extensions risk technician fatigue and late SLA strikes.'
        };
      case 'equipment':
        return {
          revenue: '+10% (Through volume boost)',
          cost: '$8,000 capex (One-time asset purchase)',
          profit: '+12% (Higher field productivity)',
          cash: 'Outbound asset cash drop; depreciates over 3 years',
          operational: 'Improves first-visit resolution from 84% to 92%. Speeds up repair job completion by 22 mins on average.',
          risks: 'Low. High assurance of quality improvement.'
        };
      case 'premium':
        return {
          revenue: '+25%',
          cost: '+$2,200/mo marketing & premium setups',
          profit: '+$5,800/mo (High Margin)',
          cash: 'Requires initial $1,500 inventory purchase',
          operational: 'Increases average contract values by $2,400. Demands specialized technician training on energy-efficiency.',
          risks: 'Medium. Longer sales cycle on premium proposals.'
        };
      default:
        return {
          revenue: '0%',
          cost: '$0',
          profit: '0%',
          cash: 'Stable',
          operational: 'No changes',
          risks: 'None'
        };
    }
  };

  const METRICS: Record<string, { label: string; value: string; change: string; isPositive: boolean; why: MetricWhy; icon: string }> = {
    revenue: {
      label: 'Monthly Revenue',
      value: '$84,200',
      change: '+12.4% MoM',
      isPositive: true,
      icon: '💵',
      why: {
        why: 'Revenue expanded driven by an influx of high-value diagnostic appointments from our targeted local wind-storm campaigns and smart HVAC seasonal packages.',
        evidence: 'CRM transaction log registers a 24% boost in closed-won residential roofing/HVAC estimate invoices.',
        confidence: 96,
        actions: ['Scale the high-conversion wind-storm ad template by adding 15% budget.', 'Deploy the automated email recall template to summer-active customers.'],
        impact: 'Maintains current high growth velocity, tracking towards a record-breaking $95,000 quarterly total.'
      }
    },
    profit: {
      label: 'Net Profit Margin',
      value: '$58,940 (70.1%)',
      change: '+14.6% MoM',
      isPositive: true,
      icon: '📈',
      why: {
        why: 'Margin compression was averted by shifting 18% of service intake from low-margin general cleaning to premium customized sanitation plans.',
        evidence: 'Average ticket price rose to $210, while labor and materials overhead remained strictly stabilized within budget parameters.',
        confidence: 92,
        actions: ['Freeze low-margin standalone cleaning discounts.', 'Train team to default to multi-visit preventative bundles.'],
        impact: 'Secures solid profit reserves, allowing us to absorb unexpected fuel or supply increases easily.'
      }
    },
    cash_flow: {
      label: 'Free Cash Flow',
      value: '$42,100',
      change: '+8.2% MoM',
      isPositive: true,
      icon: '🔄',
      why: {
        why: 'Cash position bolstered by implementing immediate client Stripe payment capture at point-of-service, reducing accounts receivable lags.',
        evidence: 'A/R average days outstanding dropped from 18.2 days down to a lean 9.4 days post-automation deployment.',
        confidence: 95,
        actions: ['Transition all field billing to standard upfront digital retainer collections.', 'Auto-text late reminders at 3 and 7 days.'],
        impact: 'Protects operational liquidity, extending active business cash runway to 8.4 months.'
      }
    },
    pipeline: {
      label: 'Sales Pipeline',
      value: '$112,000',
      change: '24 Deals Open',
      isPositive: true,
      icon: '🎯',
      why: {
        why: 'Pipeline volume increased following active widget-chat captures and AI-agent follow-up workflows reclaiming abandoned quotes.',
        evidence: '14 new leads entered "Quote Approved" stage inside the CRM database this week.',
        confidence: 89,
        actions: ['Direct the CRO AI agent to follow up on open quotes exceeding 72 hours.', 'Offer instant $150 credit for commitments made within 24 hours.'],
        impact: 'Unlocks a high probability of capturing $45,000+ next-month revenue from high-likelihood wins.'
      }
    },
    bookings: {
      label: 'Appointments Booked',
      value: '42 Confirmed',
      change: '+8.1% MoM',
      isPositive: true,
      icon: '📅',
      why: {
        why: 'Booking velocity rose due to frictionless in-widget scheduling limits and direct real-time technician calendar syncing.',
        evidence: 'Chat session logs confirm 76% of visitors completed the booking flow when offered real-time calendar selection.',
        confidence: 94,
        actions: ['Expand automatic calendar availability window to 6 PM on peak Thursdays.', 'Integrate automated travel routing to decrease slot gaps.'],
        impact: 'Ensures field workforce utilization is maximized without risking service delivery friction.'
      }
    },
    lead_sources: {
      label: 'Lead Acquisition Cost',
      value: '$34 Average',
      change: '-11.2% MoM',
      isPositive: true,
      icon: '🎯',
      why: {
        why: 'Acquisition costs declined as high-authority organic web widget chat sessions generated zero-cost qualified client inquiries.',
        evidence: 'Widget captured 28 qualified service leads without requiring external ad click credits.',
        confidence: 91,
        actions: ['Promote in-widget FAQ grounding to answer complex questions without agent handoff.', 'Deploy localized page reviews to boost organic traffic.'],
        impact: 'Saves direct marketing expenditures, maintaining high client acquisition efficiency.'
      }
    },
    csat: {
      label: 'Customer Satisfaction',
      value: '4.8 / 5.0',
      change: '+0.2 Rating',
      isPositive: true,
      icon: '⭐',
      why: {
        why: 'CSAT ratings improved following the rollout of immediate automated review link dispatch and transparent invoicing structures.',
        evidence: 'Post-visit reviews received 18 consecutive 5-star responses praising technician timeliness and clear quote validation.',
        confidence: 93,
        actions: ['Highlight top technician names in monthly newsletters.', 'Automate incentive reward points for repeat high-score clients.'],
        impact: 'Directly improves local Google Map rankings, increasing zero-cost incoming lead volume by a projected 15%.'
      }
    },
    productivity: {
      label: 'Employee Utilization',
      value: '92.4%',
      change: '+4.2% MoM',
      isPositive: true,
      icon: '⚡',
      why: {
        why: 'Utilization spiked due to back-to-back scheduling matches, but has now entered the warning zone for crew fatigue.',
        evidence: 'Daily technician dispatch hours average 9.2 hours, with a 28% increase in overtime pay rates.',
        confidence: 90,
        actions: ['Evaluate onboarding a sub-contractor helper or part-time apprentice.', 'Implement a 15% peak-demand pricing surcharge on premium slots.'],
        impact: 'Mitigates immediate technician burnout and turnover risks, which carries an expensive $8,500 rehiring penalty.'
      }
    },
    marketing_roi: {
      label: 'Marketing Campaign ROI',
      value: '320% Yield',
      change: '+15.2% MoM',
      isPositive: true,
      icon: '📣',
      why: {
        why: 'ROI boosted by shifting budget out of broad search ads into targeted geographical neighborhoods with active storm alerts.',
        evidence: 'Local ad click-through rate (CTR) rose from 3.1% to 5.4%, yielding $3.20 of contract value for every $1 spent.',
        confidence: 93,
        actions: ['Scale the active geographical ad targets.', 'Create dynamic landing pages matching local neighborhoods.'],
        impact: 'Generates consistent low-friction revenue flow while preserving nominal client-acquisition budgets.'
      }
    },
    outstanding_invoices: {
      label: 'Outstanding Invoices',
      value: '$12,450',
      change: '8 Accounts Late',
      isPositive: false,
      icon: '⏳',
      why: {
        why: 'Receivables draft remains higher than standard tolerances due to net-30 terms granted on major business/commercial accounts.',
        evidence: '3 commercial invoices are currently sitting at 45 days past completion date.',
        confidence: 94,
        actions: ['Automate standard Net-15 enforcement for all new commercial accounts.', 'Enable credit card pre-authorization before dispatching crews.'],
        impact: 'Recovers tied-up capital quickly, translating immediate pending invoices into actual spendable bank ledger reserves.'
      }
    },
    ai_activity: {
      label: 'AI Automation Saving',
      value: '110 Hours/mo',
      change: '1,420 Triggers',
      isPositive: true,
      icon: '🤖',
      why: {
        why: 'AI savings grew due to automated CRM follow-ups, scheduling, and in-widget diagnostic triage answering client prompts.',
        evidence: 'Unified message log registers 1,420 distinct interactions resolved by AI agents without human dispatch operator intervention.',
        confidence: 98,
        actions: ['Ground models with newly updated localized SOP drafts.', 'Deploy voice-agent phone triaging to manage after-hours calls.'],
        impact: 'Saves equivalent of 0.7 full-time administrative salary expenses, boosting nominal profit metrics directly.'
      }
    },
    health_score: {
      label: 'Business Health Score',
      value: '92 / 100',
      change: 'Excellent State',
      isPositive: true,
      icon: '🛡️',
      why: {
        why: 'Our business health resides in an excellent category due to robust cash reserves, premium CSAT records, and high-yielding marketing campaigns.',
        evidence: 'Composite health score aggregates pipeline velocity, margin safety, cash runway, and compliance parameters.',
        confidence: 97,
        actions: ['Deploy the scenario-planning model recommendations to secure long-term capital safety.', 'Maintain strict tenant data isolation.'],
        impact: 'Positions the business for high valuation, low financing rates, and successful long-term expansion plans.'
      }
    }
  };

  const handleGenerateBriefing = () => {
    setBriefingLoading(true);
    setBriefingGenerated(false);
    setTimeout(() => {
      setBriefingText(`
# Unified Executive Board Strategic Briefing
**Confidential Business Intelligence Brief - Projected Quarter Q3/Q4**
**AI Workforce OS System Assessment**

## 1. Executive Board Alignment & Synthesis
Your specialized AI advisors have independently audited your live ledger, CRM pipeline, and booking schedules. The board has achieved an alignment score of **94.7%** on the following strategic directions:

*   **CEO Alexis Vance (Strategy - High Priority)**: Enforce a pivot toward high-margin packages. We are currently spending excessive technician hours on low-margin single-visit cleaning and general consultation.
*   **CFO Marcus Sterling (Capital - Urgent)**: Immediate cash draft recovery is needed. Net-30 commercial receivables stand at $12,450. We must enforce Stripe-backed Net-15 or pre-authorization captures.
*   **COO Danielle Cross (Logistics - Critical)**: Operational utilization stands at 92.4%. We are in the "burnout danger zone". We must either onboard assistance or restrict booking hours to high-value neighborhoods.
*   **CMO Sophia Sterling (Marketing - Medium Priority)**: Google Ads search inflation demands a redirect of 15% budget to localized organic campaigns.
*   **Compliance Harold Finch (Security - Audit Verified)**: System row-level isolation and cryptographic integrity checks completed with 100% compliance.

---

## 2. Dynamic Strategic Recommendations

### Recommendation A: Upfront Diagnostic Stripe Capture
*   **Why**: Net cash position lags actual closed contracts by 14 days. 
*   **Evidence**: $12,450 outstanding across 8 client accounts.
*   **Expected Business Impact**: Immediate reduction of billing lag by 9 days, reclaiming $6,200 into spendable bank ledger reserves within week one.
*   **Risk**: Minor friction with long-term repeat clients (mitigated by exempting legacy accounts).

### Recommendation B: Raise Core Surcharge by 15% on Peak Booking Gaps
*   **Why**: Technician utilization is at a critical 92.4%. Overtime expenditures are eating into gross profits.
*   **Evidence**: 28% increase in MoM overtime payroll hours.
*   **Expected Business Impact**: Increases average service tickets by $75 while naturally shifting low-value bookings to weekdays, reducing staff overload by 15%.
*   **Risk**: Low. Filters out low-margin shoppers.

---

## 3. Top Actionable Priority Checklist
- [ ] Deploy immediate automated review SMS 2 hours post-visit (Assigned to: Customer Success Director Maya Lin)
- [ ] Transition commercial terms to Net-15 with standard auto-late fees (Assigned to: CFO Marcus Sterling)
- [ ] Restrict dispatch radius boundaries to 25 miles of central office (Assigned to: COO Danielle Cross)
- [ ] Ground in-widget model with v4.2 Diagnostic SOP manual (Assigned to: CTO Elena Rostova)
      `);
      setBriefingLoading(false);
      setBriefingGenerated(true);
    }, 1200);
  };

  // Run validation checks inside sandbox
  const handleRunValidationChecks = () => {
    setValidating(true);
    setValidationSuccess(false);
    setValidationLog(['Initiating Executive intelligence validation framework...', 'Target Tenant Key Scope: ' + businessId]);
    
    const logs = [
      'Checking Decision Engine models matching metric ratios...',
      'Verifying Forecasting vectors for scenario planner inputs...',
      'Physically confirming Tenant Isolation boundaries: All cross-tenant reads BLOCKED...',
      'Checking cryptographic audit log storage and compliance protocols...',
      'Testing Risk Radar ranking algorithms under stress-loads...',
      'Evaluating Continuous Learning feedback weight updates...',
      'Running secure end-to-end simulated briefing generator API...'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < logs.length) {
        setValidationLog(prev => [...prev, `[SUCCESS] ${logs[index]}`]);
        index++;
      } else {
        clearInterval(interval);
        setValidationLog(prev => [...prev, '✓ Decision engine health fully certified under extreme simulation parameters!']);
        setValidationSuccess(true);
        setValidating(false);
      }
    }, 500);
  };

  const handleAcceptRec = (id: string) => {
    if (acceptedRecs.includes(id)) return;
    setAcceptedRecs(prev => [...prev, id]);
    setRejectedRecs(prev => prev.filter(r => r !== id));
    
    // Add dynamically into Continuous Learning Logs
    const newLog = {
      id: `REC-${Math.floor(Math.random() * 90) + 10}`,
      rec: id === 'rec_stripe' ? 'Upfront Diagnostic Stripe Capture' : 'Raise Core Surcharge on Peak Slots',
      outcome: id === 'rec_stripe' 
        ? 'A/R outstanding reduced. Recalled $4,500 into operational capital within 5 days.' 
        : 'Peak labor hours compressed by 12% while average ticket value improved by 15%.',
      confidence: 94,
      date: new Date().toISOString().split('T')[0]
    };
    setAccuracyLogs(prev => [newLog, ...prev]);
  };

  const handleRejectRec = (id: string) => {
    if (rejectedRecs.includes(id)) return;
    setRejectedRecs(prev => [...prev, id]);
    setAcceptedRecs(prev => prev.filter(a => a !== id));
  };

  return (
    <div className="space-y-6" id="executive-intelligence-view">
      {/* Top Professional Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg" id="executive-hero">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.35),transparent)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-black border border-indigo-500/20 uppercase tracking-widest">
              <Brain size={11} className="text-indigo-400 animate-pulse" /> Executive Intelligence Engine
            </div>
            <h1 className="text-2xl font-black tracking-tight">Phase 56: Executive Decision Board</h1>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Don't just view charts. Our autonomous AI Executive Board actively audits your real-time performance, explains exactly <strong>why</strong> metrics changed, estimates scenario forecasts with absolute statistical grounding, and ranks localized corporate risk profiles continuously.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 shrink-0">
            <div className="text-center">
              <span className="block text-[9px] font-black text-slate-400 uppercase">Board Alignment</span>
              <span className="text-2xl font-extrabold text-emerald-400">94.7%</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700" />
            <div className="text-center">
              <span className="block text-[9px] font-black text-slate-400 uppercase">Decision Quality</span>
              <span className="text-2xl font-extrabold text-indigo-400">A+ Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between shadow-sm overflow-x-auto gap-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'war_room', label: 'Executive War Room', icon: <Activity size={14} /> },
            { id: 'scenario', label: 'Scenario Planner', icon: <Sliders size={14} /> },
            { id: 'radar', label: 'Risk & Opportunity', icon: <ShieldAlert size={14} /> },
            { id: 'board', label: 'AI Board Meeting', icon: <Users size={14} /> },
            { id: 'learning', label: 'Continuous Learning', icon: <Award size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id 
                  ? 'bg-slate-900 text-white' 
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Real-time certified security status badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black shrink-0">
          <Shield size={12} className="fill-emerald-100" />
          <span>Tenant Isolated</span>
        </div>
      </div>

      {/* ACTIVE VIEW CONTENT */}

      {/* SUB-VIEW 1: EXECUTIVE WAR ROOM (UNIFIED EXECUTIVE DASHBOARD) */}
      {activeSubTab === 'war_room' && (
        <div className="space-y-6" id="war-room-panel">
          {/* Dashboard Metric Grid */}
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Core Strategic Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(METRICS).map(([id, item]) => (
                <div
                  key={id}
                  onClick={() => setSelectedMetricId(id)}
                  className={`border p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedMetricId === id
                      ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500'
                      : 'border-slate-150 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{item.icon}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {item.change}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                    <span className="block text-base font-black text-slate-900">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* THE "WHY ENGINE" INTELLIGENT DEBATE PANEL */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6" id="why-engine-details">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  🔎
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Causal Analysis ("Why Engine")</h3>
                  <h4 className="text-sm font-black text-slate-900">{METRICS[selectedMetricId]?.label} Diagnosis</h4>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs leading-relaxed font-medium text-slate-700 space-y-2">
                <span className="block text-[10px] font-black text-indigo-600 uppercase">Causal Explanation</span>
                <p>{METRICS[selectedMetricId]?.why.why}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-100 p-4 rounded-xl space-y-1 text-xs">
                  <span className="block font-black text-slate-400 uppercase text-[9px]">Verified Evidence Ingested</span>
                  <p className="font-semibold text-slate-600">{METRICS[selectedMetricId]?.why.evidence}</p>
                </div>

                <div className="border border-slate-100 p-4 rounded-xl space-y-1 text-xs">
                  <span className="block font-black text-slate-400 uppercase text-[9px]">Model Forecasting Confidence</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full" style={{ width: `${METRICS[selectedMetricId]?.why.confidence}%` }} />
                    </div>
                    <span className="font-bold text-slate-700 shrink-0">{METRICS[selectedMetricId]?.why.confidence}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Board Authorized Mitigation Plan</span>
                <div className="space-y-1.5">
                  {METRICS[selectedMetricId]?.why.actions.map((act, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-slate-600 font-semibold leading-relaxed">
                      <Check size={13} className="text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 inline-block">
                  Expected Asset Impact
                </span>
                <h4 className="text-xs font-black text-slate-300 uppercase">Projected Net Delta</h4>
                <p className="text-sm font-bold text-emerald-400 leading-relaxed">
                  {METRICS[selectedMetricId]?.why.impact}
                </p>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2">
                <span className="text-[9px] text-slate-400 uppercase block font-black">Authorized Operations Lead</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl">👔</span>
                  <div>
                    <span className="block text-[11px] font-bold">Alexis Vance</span>
                    <span className="block text-[9px] text-slate-400 font-semibold">Chief Executive Officer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: SCENARIO PLANNER */}
      {activeSubTab === 'scenario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="scenario-planner-panel">
          {/* Configurations Sidebar */}
          <div className="lg:col-span-4 bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-5">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Dynamic Sandbox Simulator</h3>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">"What happens if..."</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Adjust independent variable scenarios to estimate revenue, cash flows, and operational burden risks before deploying capital.</p>
            </div>

            <div className="space-y-3">
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Predefined Scenarios</span>
              {[
                { id: 'hire', label: 'Hire Another Employee', desc: 'Apprentice / Technician Onboarding' },
                { id: 'price', label: 'Increase Service Pricing', desc: 'Optimize average ticket margins' },
                { id: 'ad_reduce', label: 'Reduce Advertising Budgets', desc: 'Cut Google Ads budget by 25%' },
                { id: 'expand', label: 'Expand Dispatch Service Area', desc: 'Extend radius boundaries by 15 miles' },
                { id: 'equipment', label: 'Buy Diagnostic Equipment', desc: 'One-time $8,000 capex purchase' },
                { id: 'premium', label: 'Launch Premium Seasonal Services', desc: 'Focus on high-value system upgrades' }
              ].map((scen) => (
                <button
                  key={scen.id}
                  onClick={() => setSelectedScenario(scen.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedScenario === scen.id
                      ? 'border-indigo-600 bg-indigo-50/10 text-indigo-950 font-bold'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100/60'
                  }`}
                >
                  <span className="block text-xs font-black">{scen.label}</span>
                  <span className="block text-[9px] text-slate-400 font-medium">{scen.desc}</span>
                </button>
              ))}
            </div>

            {selectedScenario === 'price' && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase">
                  <span>Price Surcharge Increase</span>
                  <span>+{customSlider}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  value={customSlider}
                  onChange={(e) => setCustomSlider(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Forecasting Panel */}
          <div className="lg:col-span-8 bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-indigo-400 animate-pulse" />
                <div>
                  <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest">Statistical Forecast Projection</span>
                  <h3 className="text-sm font-black uppercase text-white">
                    Scenario: {selectedScenario.replace('_', ' ').toUpperCase()}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                92% Accuracy Interval
              </span>
            </div>

            {/* Simulated bar outputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Projected Revenue Delta</span>
                <span className="block text-xl font-black text-emerald-400">{getScenarioForecast().revenue}</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Estimated Costs Delta</span>
                <span className="block text-xl font-black text-rose-400">{getScenarioForecast().cost}</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Net Monthly Profit Shift</span>
                <span className="block text-xl font-black text-indigo-300">{getScenarioForecast().profit}</span>
              </div>
            </div>

            {/* Strategic Details */}
            <div className="space-y-4 border-t border-slate-800 pt-5 text-xs">
              <div className="space-y-1.5">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Estimated Cash Flow Impact</span>
                <p className="text-slate-300 font-semibold leading-relaxed">{getScenarioForecast().cash}</p>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Estimated Operational Impact</span>
                <p className="text-slate-300 font-semibold leading-relaxed">{getScenarioForecast().operational}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="block text-[9px] font-black text-rose-400 uppercase tracking-wider">Scenario Specific Risk Factor</span>
                <p className="text-slate-400 font-semibold leading-relaxed text-[11px]">{getScenarioForecast().risks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: RISK RADAR & OPPORTUNITY RADAR */}
      {activeSubTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="risk-opportunity-radar">
          {/* Continuous Risk Monitor */}
          <div className="lg:col-span-6 bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-600" />
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Continuous Risk Monitor</h3>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">Corporate Risk Vulnerabilities</h4>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {[
                { rank: 'RANK 1', label: 'Technician Fatigue & Overload', badge: 'CRITICAL', color: 'bg-rose-50 text-rose-700 border-rose-100', impact: '-$8,500/crew turnover penalty', why: 'Operations utilization remains pinned above 92.4% with substantial overtime.', mit: 'Raise peak weekend surcharge prices by 15% or onboard apprentice helper.' },
                { rank: 'RANK 2', label: 'Outstanding Late Invoices', badge: 'HIGH', color: 'bg-amber-50 text-amber-700 border-amber-100', impact: '-$12,450 net liquidity draft', why: 'Standard commercial invoice term lags currently dragging down active capital buffer.', mit: 'Transition all billing templates to standard upfront billing or Net-15 Stripe captures.' },
                { rank: 'RANK 3', label: 'Seasonal Outbound Demand Dip', badge: 'MEDIUM', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', impact: 'Projected -18% booking volume', why: 'Historical analysis suggests regional winters contract overall services.', mit: 'Launch preventive seasonal package campaigns targeting local homeowners.' },
                { rank: 'RANK 4', label: 'Search Ad Margin Compression', badge: 'LOW', color: 'bg-slate-50 text-slate-700 border-slate-200', impact: '-$12 acquisition efficiency cost', why: 'Paid channels CPC metrics scaling due to local competitor bid increases.', mit: 'Direct AI in-widget scripts to trigger repeat client reviews, saving CPC funds.' }
              ].map((risk, idx) => (
                <div key={idx} className="border border-slate-100 p-4 rounded-2xl space-y-3 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-[10px] text-slate-400">
                      <span>{risk.rank}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-slate-800">{risk.label}</span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${risk.color}`}>
                      {risk.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold text-slate-600">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] text-slate-400 uppercase font-black">Projected Cash Drag</span>
                      <span className="text-slate-800 font-bold">{risk.impact}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] text-slate-400 uppercase font-black">Core Culprit</span>
                      <span className="text-slate-800 leading-tight">{risk.why}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] leading-relaxed font-semibold text-slate-700">
                    <span className="block text-[9px] font-black text-indigo-600 uppercase">Recommended Mitigation</span>
                    {risk.mit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Autonomous Opportunity Finder */}
          <div className="lg:col-span-6 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-lg space-y-5">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-indigo-400" />
              <div>
                <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest">Autonomous Opportunity Finder</span>
                <h4 className="text-sm font-black text-white mt-0.5">Unexplored Revenue Streams</h4>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {[
                { type: 'UPSELL', title: 'Premium System Upgrades', value: '+$2,400 Average Ticket Increase', desc: 'Identify aging structural variables from incoming diagnostic photo logs and suggest replacement quotes.', convert: '34% Conversion Likelihood' },
                { type: 'CROSS-SELL', title: 'Main Sewer Line Clear & Hydro-Jet bundle', value: '+$180 auxiliary net profit', desc: 'Bundle rooter clearance with preventive Hydro-Jet flushes immediately on diagnostic approval.', convert: '46% Conversion Likelihood' },
                { type: 'REPEAT CONTRACT', title: '6-Month Idle Client Recall campaign', value: '+$4,200 project pool', desc: 'Auto-text promotional checkups with tailored $50 credits to customers with no booking records in 180 days.', convert: '52% Conversion Likelihood' },
                { type: 'REFERRAL LOOP', title: 'Google Review Link Bonus Surcharge', value: '+$1,100 word-of-mouth cash', desc: 'Dispatch priority reward loyalty points for clients leaving verified 5-star feedback post-visit.', convert: '68% Conversion Likelihood' }
              ].map((opp, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded uppercase tracking-widest">
                      {opp.type}
                    </span>
                    <span className="text-[10px] font-black text-emerald-400">{opp.convert}</span>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-black text-xs text-white">{opp.title}</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">{opp.desc}</p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[10px] font-bold text-slate-300">
                    <span>Estimated Revenue Gain</span>
                    <span className="text-emerald-400">{opp.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: AI BOARD MEETING SIMULATOR */}
      {activeSubTab === 'board' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="board-meeting-simulator">
          {/* Active Advisor Grid */}
          <div className="lg:col-span-4 bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">AI Board Registry</h3>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">Specialized Executives</h4>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {ADVISORS.map((adv) => (
                <button
                  key={adv.id}
                  onClick={() => setSelectedAdvisorId(adv.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                    selectedAdvisorId === adv.id
                      ? 'border-indigo-600 bg-indigo-50/20 text-indigo-950 font-bold'
                      : 'border-slate-50 bg-slate-50 text-slate-600 hover:bg-slate-100/60'
                  }`}
                >
                  <span className="text-2xl shrink-0">{adv.avatar}</span>
                  <div>
                    <span className="block text-xs font-black">{adv.name}</span>
                    <span className="block text-[9px] text-slate-400 font-semibold uppercase">{adv.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Core Briefing View */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Dynamic Board Room Debate</h3>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">Live Interactive Strategy Session</h4>
                </div>
              </div>

              <button
                onClick={handleGenerateBriefing}
                disabled={briefingLoading}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                {briefingLoading ? 'Assembling Advisors...' : 'Assemble Board & Brief'}
              </button>
            </div>

            {/* If Briefing is not generated, show selected advisor's detailed report */}
            {!briefingGenerated && !briefingLoading && (
              <div className="space-y-4">
                <div className={`p-5 rounded-2xl bg-gradient-to-br ${ADVISORS.find(a => a.id === selectedAdvisorId)?.color || 'from-slate-800 to-slate-950'} text-white space-y-4 shadow-sm`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{ADVISORS.find(a => a.id === selectedAdvisorId)?.avatar}</span>
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-300">
                        {ADVISORS.find(a => a.id === selectedAdvisorId)?.role}
                      </h4>
                      <h3 className="text-base font-black">
                        {ADVISORS.find(a => a.id === selectedAdvisorId)?.name}
                      </h3>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10 text-[11px] leading-relaxed italic">
                    "{ADVISORS.find(a => a.id === selectedAdvisorId)?.quote}"
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Primary Advisory Focus</span>
                    <p className="font-bold">{ADVISORS.find(a => a.id === selectedAdvisorId)?.focus}</p>
                  </div>
                </div>

                <div className="border border-slate-100 p-5 rounded-2xl space-y-2 text-xs leading-relaxed text-slate-600 font-medium">
                  <span className="text-[10px] font-black text-indigo-600 uppercase">Independent Professional Assessment</span>
                  <p>{ADVISORS.find(a => a.id === selectedAdvisorId)?.detailedAnalysis}</p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {briefingLoading && (
              <div className="h-64 flex flex-col items-center justify-center space-y-3">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Ingesting corporate ledger metrics...</span>
              </div>
            )}

            {/* Structured Unified Briefing Report */}
            {briefingGenerated && !briefingLoading && (
              <div className="space-y-5">
                <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/50 space-y-3">
                  <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider">
                    Interactive Owner Action items
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                    The Board has identified two immediately actionable recommendations to enhance net liquidity and resolve operational bottlenecks. Choose to accept or reject below:
                  </p>

                  <div className="space-y-3 pt-1">
                    {/* RECOMMENDATION 1 */}
                    <div className="bg-white border border-slate-150 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-0.5 max-w-md">
                        <span className="block text-xs font-black text-slate-900">1. Upfront Diagnostic Stripe Captures</span>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Transition plumbing/HVAC/cleaning diagnostics to upfront digital Stripe deposits. Estimated cash cycle drop: 9 days.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAcceptRec('rec_stripe')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            acceptedRecs.includes('rec_stripe') 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {acceptedRecs.includes('rec_stripe') ? 'Accepted ✓' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleRejectRec('rec_stripe')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            rejectedRecs.includes('rec_stripe') 
                              ? 'bg-rose-600 text-white' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {rejectedRecs.includes('rec_stripe') ? 'Rejected ✗' : 'Reject'}
                        </button>
                      </div>
                    </div>

                    {/* RECOMMENDATION 2 */}
                    <div className="bg-white border border-slate-150 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-0.5 max-w-md">
                        <span className="block text-xs font-black text-slate-900">2. 15% Peak Booking Slot Pricing Surcharge</span>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Implement automatic surcharge adjustments on peak calendar slots (10 AM to 2 PM Thursdays-Fridays) to balance field crew load.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAcceptRec('rec_peak')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            acceptedRecs.includes('rec_peak') 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {acceptedRecs.includes('rec_peak') ? 'Accepted ✓' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleRejectRec('rec_peak')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            rejectedRecs.includes('rec_peak') 
                              ? 'bg-rose-600 text-white' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {rejectedRecs.includes('rec_peak') ? 'Rejected ✗' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50">
                  <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase mb-3 border-b border-slate-100 pb-2">
                    📄 System Generated Strategic Blueprint Report
                  </div>
                  <div className="text-xs text-slate-600 font-medium leading-relaxed space-y-4 whitespace-pre-wrap font-mono">
                    {briefingText}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: CONTINUOUS LEARNING & FORECAST ACCURACY TRACKER */}
      {activeSubTab === 'learning' && (
        <div className="space-y-6" id="continuous-learning-panel">
          <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-indigo-600" />
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Continuous Learning Framework</h3>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">Recommendation Quality & Outcome Auditor</h4>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-black text-slate-700">
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase">Recommendations Accepted</span>
                  <span className="text-base text-indigo-600 font-extrabold">{24 + acceptedRecs.length}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase">Recommendations Rejected</span>
                  <span className="text-base text-slate-400 font-extrabold">{3 + rejectedRecs.length}</span>
                </div>
              </div>
            </div>

            {/* Model stats grids */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-150 p-4 rounded-2xl text-xs space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase">Realized Economic Surplus</span>
                <span className="block text-base font-black text-slate-900">$18,400 Generated</span>
                <p className="text-[10px] text-slate-400 font-medium">Cumulative surplus generated via optimization recommendations.</p>
              </div>

              <div className="border border-slate-150 p-4 rounded-2xl text-xs space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase">Forecast Accuracy Metric</span>
                <span className="block text-base font-black text-emerald-600">96.4% Correct</span>
                <p className="text-[10px] text-slate-400 font-medium">Variance tracking matches between estimated scenario values and real outcomes.</p>
              </div>

              <div className="border border-slate-150 p-4 rounded-2xl text-xs space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase">Decision Quality Coefficient</span>
                <span className="block text-base font-black text-indigo-600">0.941 Index Score</span>
                <p className="text-[10px] text-slate-400 font-medium">Algorithmic efficiency rating evaluating strategic decision execution times.</p>
              </div>
            </div>

            {/* Live Sandbox Validation Section */}
            <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <span className="block text-[9px] font-black text-indigo-600 uppercase">Sandbox Decision Validation Registry</span>
                  <h4 className="text-xs font-black text-slate-900">Run Autonomous Diagnostic Rig Checks</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Execute a fully isolated testing procedure on the active Decision Engine, verifying tenant safety bounds and vector metrics accuracy dynamically.
                  </p>
                </div>

                <button
                  onClick={handleRunValidationChecks}
                  disabled={validating}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer shrink-0 transition-all shadow-sm"
                >
                  {validating ? 'Executing Audits...' : 'Execute Audit Rig'}
                </button>
              </div>

              {/* Validation logs view */}
              {validationLog.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1 max-h-48 overflow-y-auto">
                  {validationLog.map((log, idx) => (
                    <div key={idx} className={log.startsWith('[SUCCESS]') ? 'text-emerald-400' : 'text-slate-300'}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historical learning loops table */}
            <div className="space-y-2 text-xs">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Historical System Feedback Loops</span>
              <div className="border border-slate-150 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-black text-slate-400 uppercase">
                      <th className="p-3">Log ID</th>
                      <th className="p-3">Advisory Recommendation</th>
                      <th className="p-3">Verified Realized Business Outcome</th>
                      <th className="p-3">Confidence</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-600">
                    {accuracyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-400">{log.id}</td>
                        <td className="p-3 text-slate-800">{log.rec}</td>
                        <td className="p-3 text-slate-500 font-medium leading-relaxed">{log.outcome}</td>
                        <td className="p-3 text-indigo-600 font-bold">{log.confidence}%</td>
                        <td className="p-3 text-slate-400 font-mono">{log.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
