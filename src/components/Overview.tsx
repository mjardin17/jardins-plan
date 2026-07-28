import React, { useState, useEffect } from 'react';
import { 
  Bot, CheckSquare, Sparkles, TrendingUp, AlertCircle, Clock, 
  ArrowRight, ShieldCheck, Mail, Send, CheckCircle2, UserCheck, DollarSign,
  MessageSquare, Calendar, Star, FileText, Settings, Heart, Database, Play,
  Zap, ChevronDown, ChevronUp, Briefcase, Award, ShieldAlert, BadgeInfo,
  TrendingDown, Percent, Info, AlertTriangle, Users, HelpCircle, BookOpen, MapPin
} from 'lucide-react';
import { Lead, Appointment, ChatSession } from '../types';

interface OverviewProps {
  businessId: string;
  ownerName: string;
  setActiveTab?: (tab: any) => void;
}

interface PendingTask {
  id: string;
  clientName: string;
  taskType: 'estimate' | 'financing' | 'no_reply' | 'support';
  text: string;
  completed: boolean;
}

interface AIEmployeeDuty {
  id: string;
  name: string;
  avatar: string;
  avatarBg: string;
  department: string;
  role: string;
  status: string;
  statusColor: string;
  currentTask: string;
  completedWork: string[];
  pendingWork: string[];
  recommendations: string;
  personality: string;
  memory: string;
  commStyle: string;
  expertise: string;
  objectives: string[];
}

interface ChatMessage {
  sender: 'owner' | 'coo';
  text: string;
  timestamp: string;
}

export default function Overview({ businessId, ownerName = 'Joshua', setActiveTab }: OverviewProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good morning');
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  
  // Dashboard view selection: Briefing vs Predictive Intelligence vs COO advisory vs Workforce dossiers
  const [dashboardTab, setDashboardTab] = useState<'briefing' | 'predictive' | 'coo_chat' | 'on_duty'>('briefing');

  // Interactive Pending Tasks State
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([
    { id: 'pt-1', clientName: 'Sarah Jenkins', taskType: 'estimate', text: 'Sarah needs an estimate for bathroom drain leak repair', completed: false },
    { id: 'pt-2', clientName: 'Mike Rossetti', taskType: 'financing', text: 'Mike requested financing terms for a new high-efficiency HVAC unit', completed: false },
    { id: 'pt-3', clientName: 'John Davis', taskType: 'no_reply', text: 'John has not replied to his 5-minute automated SMS follow-up', completed: false },
    { id: 'pt-4', clientName: 'Regulus Crassus', taskType: 'support', text: 'Emergency 2:00 AM leak - dispatch confirmation pending', completed: false }
  ]);

  // Executive Advisory Chat Desk State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'coo',
      text: `Good day, ${ownerName}. I am your Chief Operating Officer AI. I have synchronized our real-time CRM pipelines, calendar schedules, technician logs, and on-site chats. Ask me anything about our business optimization or tap one of the direct strategic questions below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isCooTyping, setIsCooTyping] = useState(false);

  // Unified AI Employees Duty Dossiers
  const [employeesDuty] = useState<AIEmployeeDuty[]>([
    {
      id: 'emp-office',
      name: 'Sarah Jenkins',
      avatar: 'SJ',
      avatarBg: 'bg-slate-900 text-white',
      department: 'Administration',
      role: 'Office Manager AI',
      status: 'On Duty & Active on Site',
      statusColor: 'text-emerald-500 bg-emerald-50 border-emerald-100',
      currentTask: 'Greeting live web visitors, validating calendar slots, routing incoming queries',
      completedWork: [
        'Resolved 26 service, pricing, and scheduling customer questions.',
        'Successfully booked 2 technician slots onto Google Calendar.'
      ],
      pendingWork: [
        'Await Dave (technician) confirming dispatch to Regulus emergency leak.'
      ],
      recommendations: 'Trigger automated invoice push with Marcus to confirm diagnostic credits.',
      personality: 'Highly disciplined, organized, professional, and warmly welcoming.',
      memory: 'Understands your local service map boundaries, technician bios, and default diagnostic pricing.',
      commStyle: 'Structured, articulate, polite, and trust-inspiring.',
      expertise: 'Daily scheduling optimization, direct lead intake, and storefront service guidance.',
      objectives: [
        'Capture contact details on 100% of warm visitors.',
        'Keep travel distance grouped under 15 miles per technician dispatch.'
      ]
    },
    {
      id: 'emp-sales',
      name: 'Alex Rivera',
      avatar: 'AR',
      avatarBg: 'bg-sky-600 text-white',
      department: 'Revenue & Pipeline',
      role: 'AI Sales Director',
      status: 'Active Lead Recovery',
      statusColor: 'text-sky-600 bg-sky-50 border-sky-100',
      currentTask: 'Scoring newly captured leads and designing specialized objection-reversal follow-ups',
      completedWork: [
        'Captured 14 CRM Leads based on water heater and emergency intent analysis.',
        'Calculated $4,850 in fresh plumbing contract pipeline value.'
      ],
      pendingWork: [
        'Deliver 10% financing SMS recovery draft to Visitor #3202.'
      ],
      recommendations: 'Introduce standard 5-year premium parts warranty clause to boost water heater closes.',
      personality: 'Highly competitive, strategic, enthusiastic, and results-focused.',
      memory: 'Retains custom objection logs, pricing multipliers, and historical contract values.',
      commStyle: 'Confident, direct, highly persuasive, and transaction-oriented.',
      expertise: 'Deal qualification, outbound pipeline follow-ups, and value positioning.',
      objectives: [
        'Maintain a Lead-to-Booking conversion rate above 42%.',
        'Rescue 100% of website drop-offs within 5 minutes.'
      ]
    },
    {
      id: 'emp-marketing',
      name: 'Chloe Peterson',
      avatar: 'CP',
      avatarBg: 'bg-emerald-600 text-white',
      department: 'Growth & Brand',
      role: 'Marketing Manager AI',
      status: 'Active Campaign Outgoing',
      statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      currentTask: 'Drafting targeted local campaigns and setting up Google Review workflows',
      completedWork: [
        'Compiled high-engagement "Autumn Heating Tune-Up" SMS voucher layouts.',
        'Sent 12 review requests to recently finalized residential service jobs.'
      ],
      pendingWork: [
        'Launch active autumn blast to 8 stagnant customers dormant for 6+ months.'
      ],
      recommendations: 'Optimize the Google review collection delay to 2 hours post-job for optimal mood match.',
      personality: 'Creative, energetic, trend-aware, and highly social.',
      memory: 'Tracks coupon usage metrics, target customer lists, and localized marketing hashtags.',
      commStyle: 'Engaging, friendly, colloquial, and highly motivating.',
      expertise: 'SMS marketing, automated promotional blasts, and online reputation management.',
      objectives: [
        'Acquire at least 5 new 5-star Google Reviews weekly.',
        'Re-engage 15% of stagnant list accounts within 30 days.'
      ]
    },
    {
      id: 'emp-bookkeeper',
      name: 'Marcus Chen',
      avatar: 'MC',
      avatarBg: 'bg-amber-600 text-white',
      department: 'Finance & Ledger',
      role: 'Chief Bookkeeper AI',
      status: 'Auditing Outstanding Bills',
      statusColor: 'text-amber-600 bg-amber-50 border-amber-100',
      currentTask: 'Reconciling ledger, cross-matching diagnostic invoices, drafting project margin estimates',
      completedWork: [
        'Dispatched secure payment invoice notification to Mike Rossetti.',
        'Formatted standard parts and labor estimates for three kitchen remodel drafts.'
      ],
      pendingWork: [
        'Audit Dave\'s travel logs against inventory usage for copper fittings.'
      ],
      recommendations: 'Integrate active Stripe gateway to instantly trigger SMS receipts on confirmed transactions.',
      personality: 'Precise, quiet, detail-obsessed, and highly analytical.',
      memory: 'Retains invoice ledger histories, labor rates, state sales tax parameters, and margins.',
      commStyle: 'Highly structured, formal, concise, and mathematically accurate.',
      expertise: 'P&L reporting, automated diagnostic billings, and custom estimate drafts.',
      objectives: [
        'Keep outstanding invoice balances under 5 days past-due.',
        'Maintain absolute mathematical precision in tax and labor estimates.'
      ]
    },
    {
      id: 'emp-success',
      name: 'Emma Vance',
      avatar: 'EV',
      avatarBg: 'bg-indigo-600 text-white',
      department: 'Customer Retention',
      role: 'Customer Success Specialist',
      status: 'Monitoring Feedback',
      statusColor: 'text-purple-600 bg-purple-50 border-purple-100',
      currentTask: 'Analyzing chat transcripts to detect early retention warning signs and dissatisfaction',
      completedWork: [
        'Addressed and resolved arrival delay queries for 3 active clients.',
        'Polished service satisfaction files for newly scheduled premium jobs.'
      ],
      pendingWork: [
        'Deploy customer loyalty feedback survey following Regulus\'s repair completion.'
      ],
      recommendations: 'Establish a custom Client Referral Program to reward 5-star Google Review advocates.',
      personality: 'Highly empathetic, reassuring, patient, and solutions-oriented.',
      memory: 'Understands customer complaint histories, resolution logs, and service tier statuses.',
      commStyle: 'Comforting, supportive, warm, and highly collaborative.',
      expertise: 'Churn mitigation, active customer listening, and loyalty program management.',
      objectives: [
        'Sustain an overall Net Promoter Score (NPS) above 96%.',
        'Address and mitigate all customer complaints in under 3 minutes.'
      ]
    },
    {
      id: 'emp-operations',
      name: 'Dan Fowler',
      avatar: 'DF',
      avatarBg: 'bg-purple-600 text-white',
      department: 'Operations',
      role: 'Operations Architect AI',
      status: 'Optimizing Workflows',
      statusColor: 'text-rose-600 bg-rose-50 border-rose-100',
      currentTask: 'Analyzing automation trigger-action pathways and coordinating technician fleet geography',
      completedWork: [
        'Optimized truck routes for active technicians to cut fuel costs by 12%.',
        'Streamlined 5-minute automated lead-response pathways with Alex Rivera.'
      ],
      pendingWork: [
        'Integrate copper supply restocking threshold alarms with local supply house.'
      ],
      recommendations: 'Enable automated geographic slot grouping on the booking calendar to minimize travel times.',
      personality: 'Systematic, objective, hyper-logical, and action-focused.',
      memory: 'Retains active automation rules, technician route charts, and warehouse stock levels.',
      commStyle: 'Brief, commanding, highly objective, and direct.',
      expertise: 'Automated rules design, workflow bottleneck discovery, and fleet logistics.',
      objectives: [
        'Decrease average lead response delay to under 2 seconds.',
        'Reduce overall technician route overlap and travel durations.'
      ]
    }
  ]);

  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const matches = priceStr.replace(/[^0-9-]/g, '').split('-');
    if (matches.length > 0 && matches[0]) {
      return parseInt(matches[0], 10) || 0;
    }
    return 0;
  };

  const fetchData = async () => {
    try {
      const [leadsRes, apptsRes, sessionsRes, bizRes, logsRes, secRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/appointments'),
        fetch('/api/chat/sessions'),
        fetch('/api/business'),
        fetch('/api/automations/logs'),
        fetch('/api/security/status')
      ]);
      
      const leadsData = await leadsRes.json();
      const apptsData = await apptsRes.json();
      const sessionsData = await sessionsRes.json();
      const bizData = await bizRes.json();
      const logsData = await logsRes.json();
      const secData = await secRes.json();
      
      setLeads(leadsData.leads || []);
      setAppointments(apptsData.appointments || []);
      setSessions(sessionsData.sessions || []);
      setBusiness(bizData.business || null);
      setLogs(logsData.logs || []);
      setSecurityStatus(secData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Dynamic Greeting based on hours
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    fetchData();
  }, [businessId]);

  const handleDispatch = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'contacted', notes: 'Dispatched emergency response technician Dave.' })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error dispatching lead:', err);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setPendingTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleToggleEmployeeDetail = (id: string) => {
    setExpandedEmployee(prev => prev === id ? null : id);
  };

  // COO Chat Smart Predefined Answers
  const handleSmartQuestion = (question: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      sender: 'owner',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, userMsg]);
    setIsCooTyping(true);

    let answer = '';
    if (question.includes('focus on today')) {
      answer = `Good morning ${ownerName}. Today's primary focal point is dispatch coordination. We have an emergency leak reported by **Regulus Crassus** at 2:00 AM that is currently unassigned. Dave (Technician) is active and within a 12-minute radius. Additionally, **Sarah Jenkins** is awaiting confirmation on her bathroom repair. Resolving these two dispatches secures $1,450 in direct revenue.`;
    } else if (question.includes('costing me money')) {
      answer = `An analysis of website friction shows we had a drop-out rate of 14% at the phone-number collection step, primarily during hot tankless water heater quote queries. This represented approximately $3,250 in rescueable revenue. Authorizing the **'SMS-Only Gating' Bypass Rule** in your reports tab will recover this. Additionally, Dave's truck is reporting a shortage of 1/2 inch copper joint fittings, forcing a detour route that adds 15 miles in travel overhead.`;
    } else if (question.includes('making me money')) {
      answer = `Our core driver this week is the seasonal **'Autumn Heating Tune-Up' SMS campaign** designed by Chloe Peterson. It is generating a **24% conversion rate** on cold list leads, representing $4,850 in newly calculated pipeline value. Additionally, water heater diagnostics are closing at a high 88% rate when Alex Rivera introduces the 5-year parts warranty.`;
    } else if (question.includes('customer should I call first')) {
      answer = `Call **Regulus Crassus** first. His emergency pipe burst was logged at 2:00 AM. He is waiting with a 95% priority lead score. I have pre-calculated Dave's dispatch details and route. Just tap 'Confirm SMS Dispatch' on your dashboard to instantly transmit the job order.`;
    } else if (question.includes('increase revenue this week')) {
      answer = `Three fast-action levers: 1) Deploy Chloe's seasonal Autumn Promo to the remaining 8 stagnant prospects ($1,200 estimated pickup). 2) Authorize Marcus to send Mike Rossetti his pending diagnostic invoice of $49. 3) Reduce the Google Review collection delay to 2 hours post-job to accelerate five-star rating acquisition, increasing overall SEO organic booking volume by an estimated 11%.`;
    } else if (question.includes('employees struggling with')) {
      answer = `Our Sales Agent **Alex Rivera** is encountering friction during financing objections for water heaters—customers are hesitant about the initial installment terms. I recommend updating Alex's pitch instructions to lead with our **10% interest-free option** or the standard parts warranty.`;
    } else {
      answer = `I have received your custom query. I am parsing active booking registers, customer conversation logs, and diagnostic invoices. Based on my data, our operation is highly stable with $5,450 in captured revenue pipeline. Please let me know how I should direct Sarah Jenkins or Marcus Chen to assist with this specific objective.`;
    }

    setTimeout(() => {
      setIsCooTyping(false);
      setChatHistory(prev => [...prev, {
        sender: 'coo',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1200);
  };

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const input = chatInput;
    setChatInput('');
    handleSmartQuestion(input);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500 font-mono">Synchronizing Digital Headquarters...</p>
        </div>
      </div>
    );
  }

  // Count Accomplishments dynamically from the real database
  const totalQuestions = sessions.reduce((acc, s) => acc + (s.messages ? s.messages.filter(m => m.sender === 'bot').length : 0), 0);
  const totalLeads = leads.length;
  const totalAppointments = appointments.length;
  const totalFollowups = logs.filter(l => l.type === 'follow_up').length;
  const totalReviews = logs.filter(l => l.type === 'review_request').length;
  const totalEstimates = leads.filter(l => l.status === 'new' || l.status === 'in_progress').length;

  // Real live revenue calculations based on completed appointments & closed won leads
  let calculatedRevenue = 0;
  appointments.forEach(apt => {
    if (apt.status === 'completed') {
      const s = business?.services?.find((srv: any) => srv.name.toLowerCase() === apt.serviceName.toLowerCase());
      calculatedRevenue += s ? parsePrice(s.price) : 150;
    }
  });
  leads.forEach(l => {
    if (l.status === 'closed_won') {
      const hasCompletedApt = appointments.some(a => a.leadId === l.id && a.status === 'completed');
      if (!hasCompletedApt) {
        calculatedRevenue += 350; // standard average contract
      }
    }
  });

  // Calculate administrative time saved
  // - 15 mins (0.25h) per bot response
  // - 15 mins (0.25h) per automated notification (follow-up / reviews)
  // - 1 hour per booked appointment
  const timeSaved = parseFloat(((totalQuestions * 0.25) + (totalFollowups * 0.25) + (totalReviews * 0.25) + (totalAppointments * 1.0)).toFixed(1));

  return (
    <div className="space-y-8 select-none font-sans pb-12">
      
      {/* GUIDED INTEGRATION WIZARD BANNER */}
      {securityStatus && (!securityStatus.stripeConfigured || !securityStatus.twilioConfigured || !securityStatus.smtpConfigured) && (
        <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white/10 text-sky-400 rounded-xl mt-0.5 md:mt-0 flex-shrink-0 animate-pulse">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[9px] bg-sky-500/20 text-sky-300 px-2.5 py-0.5 rounded-full uppercase tracking-widest font-extrabold">Setup Pending</span>
              <h3 className="text-sm font-black mt-1">Guided Integration Setup Wizard</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Connect Stripe payments, Twilio SMS alerts, and your SMTP mailer channel to unlock real-time autonomous routing for your plumbing customers.
              </p>
            </div>
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('security')}
              className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap self-stretch md:self-auto justify-center"
            >
              Start 10-Minute Wizard <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* CEO GREETINGS & HERO INTEL BLOCK */}
      <div className="bg-white border border-slate-150 p-6 md:p-8 rounded-2xl shadow-sm relative overflow-hidden">
        {/* Subtle decorative background mesh */}
        <div className="absolute right-0 top-0 h-64 w-64 bg-slate-50 rounded-full blur-3xl opacity-60 -z-10" />
        <div className="absolute left-1/3 bottom-0 h-48 w-48 bg-slate-50 rounded-full blur-3xl opacity-40 -z-10" />

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck size={11} className="text-slate-700" /> Executive Control Panel
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              {greeting}, {ownerName}.
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
              While you were away, your custom **AI Workforce Operating System** operated autonomously to capture leads, answer visitor queries, process calendar slots, and secure reviews.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-slate-500" /> Active Accomplishments Summary
            </h3>
            
            {/* 8-Grid of beautiful, sleek metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1 hover:border-slate-200 transition-all">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MessageSquare size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Inquiries Answered</span>
                </div>
                <p className="text-xl font-black text-slate-900">{totalQuestions}</p>
                <p className="text-[10px] text-slate-400">Visitor service & rate questions</p>
              </div>

              <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1 hover:border-slate-200 transition-all">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <UserCheck size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Leads Captured</span>
                </div>
                <p className="text-xl font-black text-slate-900">{totalLeads}</p>
                <p className="text-[10px] text-slate-400">High-probability CRM leads</p>
              </div>

              <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1 hover:border-slate-200 transition-all">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Appointments booked</span>
                </div>
                <p className="text-xl font-black text-slate-900">{totalAppointments}</p>
                <p className="text-[10px] text-slate-400">Slots loaded to Google Calendar</p>
              </div>

              <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1 hover:border-slate-200 transition-all">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <FileText size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Estimates drafted</span>
                </div>
                <p className="text-xl font-black text-slate-900">{totalEstimates}</p>
                <p className="text-[10px] text-slate-400">Pre-calculated project drafts</p>
              </div>

              <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1 hover:border-slate-200 transition-all">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Mail size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Follow-up messages</span>
                </div>
                <p className="text-xl font-black text-slate-900">{totalFollowups}</p>
                <p className="text-[10px] text-slate-400">Automated SMS & emails delivered</p>
              </div>

              <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl space-y-1 hover:border-slate-200 transition-all">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Star size={13} className="text-amber-500 fill-amber-500/20" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Reviews requested</span>
                </div>
                <p className="text-xl font-black text-slate-900">{totalReviews}</p>
                <p className="text-[10px] text-slate-400">Automated feedback solicitations</p>
              </div>

              <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-1 hover:border-emerald-200/60 transition-all">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <DollarSign size={13} />
                  <span className="text-[10px] uppercase tracking-wider">Revenue Generated</span>
                </div>
                <p className="text-xl font-black text-emerald-800">${calculatedRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-600">Calculated pipeline value won</p>
              </div>

              <div className="p-4 bg-sky-50/30 border border-sky-100 rounded-xl space-y-1 hover:border-sky-200/60 transition-all">
                <div className="flex items-center gap-1.5 text-sky-700 font-bold">
                  <Clock size={13} />
                  <span className="text-[10px] uppercase tracking-wider">Administrative Time Saved</span>
                </div>
                <p className="text-xl font-black text-sky-800">{timeSaved} Hours</p>
                <p className="text-[10px] text-sky-600">Automated by AI background tasks</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THREE INTERACTIVE BRAIN DESKS SELECTOR (STRIPE TABS STYLE) */}
      <div className="space-y-4">
        <div className="flex items-center overflow-x-auto gap-2 border-b border-slate-150 pb-px scrollbar-none">
          <button
            onClick={() => setDashboardTab('briefing')}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              dashboardTab === 'briefing'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen size={14} />
            Daily Executive Briefing
          </button>
          <button
            onClick={() => setDashboardTab('predictive')}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              dashboardTab === 'predictive'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Zap size={14} className="text-amber-500 animate-pulse" />
            Predictive Intelligence & Memory
          </button>
          <button
            onClick={() => setDashboardTab('coo_chat')}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              dashboardTab === 'coo_chat'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Bot size={14} className="text-sky-600" />
            COO Advisory Desk Chat
          </button>
          <button
            onClick={() => setDashboardTab('on_duty')}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              dashboardTab === 'on_duty'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users size={14} />
            On Duty Workforce Dossiers
          </button>
        </div>

        {/* Tab CONTENT 1: Daily Executive Briefing */}
        {dashboardTab === 'briefing' && (
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-slate-800" /> Morning CEO Executive Briefing
                </h3>
                <p className="text-xs text-slate-400">Autonomous business summary audited on {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-lg text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Run Status: 100% Synced
              </div>
            </div>

            {/* Core Metrics grid for Briefing */}
            {(() => {
              const revenueGeneratedYesterday = appointments
                .filter(a => a.status === 'completed')
                .reduce((acc, a) => {
                  const s = business?.services?.find((srv: any) => srv.name.toLowerCase() === a.serviceName.toLowerCase());
                  return acc + (s ? parsePrice(s.price) : 150);
                }, 0);

              const revenueAtRisk = leads
                .filter(l => l.status === 'new' || l.status === 'contacted')
                .reduce((acc, l) => acc + 350, 0);

              const outstandingUnpaidInvoices = appointments
                .filter(a => a.status === 'pending')
                .length * 49;

              const totalActivePipeline = leads
                .filter(l => l.status !== 'closed_lost' && l.status !== 'closed_won')
                .reduce((acc, l) => acc + 350, 0) + appointments
                .filter(a => a.status === 'confirmed')
                .reduce((acc, a) => {
                  const s = business?.services?.find((srv: any) => srv.name.toLowerCase() === a.serviceName.toLowerCase());
                  return acc + (s ? parsePrice(s.price) : 120);
                }, 0);

              const activeBookingsCount = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
              const unassignedTickets = leads.filter(l => l.status === 'new').length;
              const waitingResponseCount = leads.filter(l => l.status === 'new').length;
              const dormantCount = leads.filter(l => l.status === 'closed_lost').length || 8;

              const urgentLead = leads.find(l => l.status === 'new');
              const firstOpenLead = leads.find(l => l.status === 'contacted' || l.status === 'in_progress');

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Box 1: Revenue Metrics & Invoicing */}
                    <div className="border border-slate-100 rounded-xl p-4 space-y-3.5 bg-slate-50/50">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign size={13} className="text-slate-500" /> Invoicing & Capital Pool
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Revenue Generated (Completed)</span>
                          <strong className="text-slate-800 font-extrabold">${revenueGeneratedYesterday.toLocaleString()}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Revenue at Risk (Bounces)</span>
                          <strong className="text-rose-600 font-extrabold">${revenueAtRisk.toLocaleString()}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Outstanding Unpaid Invoices</span>
                          <strong className="text-amber-600 font-extrabold">${outstandingUnpaidInvoices.toLocaleString()}</strong>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-slate-700 font-bold">Total Active Pipeline</span>
                          <strong className="text-emerald-700 font-extrabold">${totalActivePipeline.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Box 2: Operations & Technician Dispatch */}
                    <div className="border border-slate-100 rounded-xl p-4 space-y-3.5 bg-slate-50/50">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-500" /> Technician Dispatch Stats
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Appointments Today</span>
                          <strong className="text-slate-800 font-extrabold">{activeBookingsCount}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Technician Fleet Utilization</span>
                          <strong className="text-emerald-600 font-extrabold">78%</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Avg Response Delay</span>
                          <strong className="text-sky-600 font-extrabold">1.8 seconds</strong>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-slate-700 font-bold">Unassigned Support Tickets</span>
                          <strong className="text-rose-600 font-bold">{unassignedTickets} Urgent</strong>
                        </div>
                      </div>
                    </div>

                    {/* Box 3: Marketing & Customers */}
                    <div className="border border-slate-100 rounded-xl p-4 space-y-3.5 bg-slate-50/50">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Star size={13} className="text-amber-500 fill-amber-500/25" /> Brand Quality & Outreach
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Customer Satisfaction (NPS)</span>
                          <strong className="text-emerald-600 font-extrabold">98%</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Customers Waiting Response</span>
                          <strong className="text-slate-800 font-extrabold">{waitingResponseCount} Waiting</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Campaign CTR</span>
                          <strong className="text-slate-800 font-extrabold">24% Conversion</strong>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-slate-700 font-bold">Active Promo Outbox</span>
                          <strong className="text-slate-800 font-bold">{dormantCount} Dormant Leads</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strategic Decision & Actions for Today */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    
                    {/* Decisive Direction */}
                    {urgentLead ? (
                      <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-5 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-900 text-[9px] font-black uppercase px-2 py-0.5 rounded animate-pulse">
                            <ShieldAlert size={10} /> Critical CEO Decision
                          </span>
                          <h4 className="text-sm font-extrabold tracking-tight">Emergency Service Dispatch Needed</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            "Visitor **{urgentLead.name}** requested urgent assistance regarding **{urgentLead.notes || 'general service request'}**. Technician Dave is on duty within a 12-minute radius. Dispatch approval is required to route Dave's mobile GPS directly to client."
                          </p>
                        </div>
                        <button
                          onClick={() => handleDispatch(urgentLead.id)}
                          className="w-full py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Approve & Dispatch Dave <ArrowRight size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-5 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                            <CheckCircle2 size={10} /> System Stable
                          </span>
                          <h4 className="text-sm font-extrabold tracking-tight">All Operations Dispatched</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            "All customer requests have been addressed or successfully dispatched. Sarah is greeting live visitors, and Chloe is running optimized marketing outreach. No urgent manual dispatches pending."
                          </p>
                        </div>
                        <button
                          disabled
                          className="w-full py-2 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed"
                        >
                          No Actions Pending <CheckCircle2 size={12} />
                        </button>
                      </div>
                    )}

                    {/* Recommended Top Actions */}
                    <div className="lg:col-span-7 border border-slate-150 rounded-xl p-5 space-y-3.5">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        🎯 Top 3 Recommended Actions For Today
                      </h4>
                      
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5 text-xs bg-slate-50/50 p-2.5 border border-slate-100 rounded-lg">
                          <span className="h-5 w-5 bg-sky-100 text-sky-700 font-bold rounded flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                          <div className="space-y-0.5">
                            <strong className="text-slate-800 block">
                              {urgentLead ? `Approve Dispatch for ${urgentLead.name}` : `Follow up with ${firstOpenLead?.name || 'Active Contacts'}`}
                            </strong>
                            <span className="text-slate-500 block leading-normal">
                              {urgentLead 
                                ? `Instantly assign Dave to ${urgentLead.name}'s urgent emergency plumbing request (Pipeline impact: $350).`
                                : firstOpenLead 
                                  ? `Initiate lead conversation with ${firstOpenLead.name} regarding their requested ${firstOpenLead.notes || 'service'}.`
                                  : 'Engage live traffic: Prompt Sarah to prioritize proactive outbound inquiries on next-generation bookings.'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs bg-slate-50/50 p-2.5 border border-slate-100 rounded-lg">
                          <span className="h-5 w-5 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                          <div className="space-y-0.5">
                            <strong className="text-slate-800 block">Launch Autumn Promo Campaign</strong>
                            <span className="text-slate-500 block leading-normal">Authorize Chloe to deliver the pre-formatted SMS coupon blast to {dormantCount} dormant plumbing accounts.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs bg-slate-50/50 p-2.5 border border-slate-100 rounded-lg">
                          <span className="h-5 w-5 bg-indigo-100 text-indigo-700 font-bold rounded flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                          <div className="space-y-0.5">
                            <strong className="text-slate-800 block">Confirm Overdue Invoices & Fitting Logs</strong>
                            <span className="text-slate-500 block leading-normal">
                              {appointments.some(a => a.status === 'pending')
                                ? `You have ${appointments.filter(a => a.status === 'pending').length} appointments waiting. Reconcile these with Marcus Chen to book direct deposits.`
                                : "Instruct Marcus to audit Dave's copper fitting logs against direct inventory counts to secure operational margins."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Tab CONTENT 2: Predictive Intelligence */}
        {dashboardTab === 'predictive' && (
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" /> Predictive Business Intelligence & Memory
              </h3>
              <p className="text-xs text-slate-500">Our machine neural layer models seasonality, cash trends, cancellation threats, and logistics delays to protect margins.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Column A: Predictive Alerts */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  🚨 Logistical & Financial Predictions
                </h4>

                <div className="space-y-3">
                  {/* Warning 1: Cancel Likelihood */}
                  <div className="p-3.5 bg-rose-50/40 border border-rose-100/50 rounded-xl flex items-start gap-3 text-xs leading-normal">
                    <AlertTriangle size={15} className="text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-rose-800 font-bold block">Customer Cancellation Threshold (John Davis)</strong>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        John has not answered his 5-minute automated lead response SMS. Historic models show drop-out probabilities increase to **78%** after 12 hours of silence. 
                      </p>
                      <button
                        onClick={() => handleSmartQuestion('customer should I call first')}
                        className="mt-2 text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Initiate lead recovery call <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Warning 2: Likely to run late */}
                  <div className="p-3.5 bg-amber-50/40 border border-amber-100/50 rounded-xl flex items-start gap-3 text-xs leading-normal">
                    <Clock size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-amber-800 font-bold block">Route Delay Prediction (Technician Dave)</strong>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        Dave's scheduled route to Sarah Jenkins overlaps with central construction blockades. Projected delay probability is **65%**. I recommend automatic scheduling holds or dispatching Dave 15 minutes early.
                      </p>
                    </div>
                  </div>

                  {/* Warning 3: Inventory Shortages */}
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-3 text-xs leading-normal">
                    <Database size={15} className="text-slate-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-800 font-bold block">Inventory Warning (Copper Fittings)</strong>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        Truck stock audits show copper fitting count down to 22. Historical models predict wholesale price spikes of **12%** starting next Tuesday. Automatic re-order recommended.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column B: Seasonal & Demand Predictions */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  📈 Seasonality & Demand Forecasts
                </h4>

                <div className="space-y-4">
                  {/* Forecast card 1 */}
                  <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <TrendingUp size={14} className="text-emerald-500" /> Winter Peak Demand Period
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold">95% Conf.</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      "Historical plumbing data shows a **34% spike in local freeze-pipe queries** starting October 15th. Recommended: Hire Jenna Vance next week to prep technician capacity."
                    </p>
                  </div>

                  {/* Forecast card 2 */}
                  <div className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <TrendingDown size={14} className="text-rose-500" /> Late Summer Low-Call Valley
                      </span>
                      <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-mono font-bold">80% Conf.</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      "Local HVAC operations historically dip between August 10th and Sept 5th. Action prep: Schedule Chloe's 'Cool Breeze' discount coupons targeting stagnant customer accounts."
                    </p>
                  </div>

                  {/* Operational Memory Logs */}
                  <div className="border border-slate-100 rounded-xl p-4 space-y-2 bg-white text-xs">
                    <strong className="text-[9px] font-bold text-slate-400 uppercase block">AI System Memory Ledger</strong>
                    <div className="space-y-1.5 text-slate-600 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span>Most profitable job class: **Tankless Water Heater Replacements** (Average margin: 48%).</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span>Best closing technician: **Dave** (closes 82% of residential HVAC tune-ups).</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab CONTENT 3: COO Advisory Desk Chat */}
        {dashboardTab === 'coo_chat' && (
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden animate-fade-in flex flex-col h-[520px]">
            {/* Header info */}
            <div className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-sm">
                  OB
                </div>
                <div>
                  <h4 className="text-xs font-extrabold tracking-tight">COO AI Advisory Desk</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Real-time Intelligence Layer Activated</p>
                </div>
              </div>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                Observing All Channels
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
              {chatHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === 'owner' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-1 shadow-xs border ${
                    msg.sender === 'owner'
                      ? 'bg-slate-900 border-slate-800 text-white rounded-br-none'
                      : 'bg-white border-slate-100 text-slate-800 rounded-bl-none'
                  }`}>
                    <span className="text-[9px] block font-bold text-slate-400">
                      {msg.sender === 'owner' ? ownerName : 'Chief Operating Officer AI'}
                    </span>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className="text-[8px] text-slate-400 block text-right mt-1 font-mono">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {isCooTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none text-xs text-slate-500 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] font-mono">COO AI is analyzing ledger...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Strategic Prompts Grid */}
            <div className="p-4 bg-white border-t border-slate-150 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tap a strategic inquiry to run diagnostic models</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSmartQuestion('What should I focus on today?')}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 rounded-lg text-left text-[11px] font-medium leading-tight truncate transition-colors cursor-pointer"
                >
                  “What should I focus on today?”
                </button>
                <button
                  type="button"
                  onClick={() => handleSmartQuestion('What is costing me money?')}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 rounded-lg text-left text-[11px] font-medium leading-tight truncate transition-colors cursor-pointer"
                >
                  “What is costing me money?”
                </button>
                <button
                  type="button"
                  onClick={() => handleSmartQuestion('What is making me money?')}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 rounded-lg text-left text-[11px] font-medium leading-tight truncate transition-colors cursor-pointer"
                >
                  “What is making me money?”
                </button>
                <button
                  type="button"
                  onClick={() => handleSmartQuestion('Which customer should I call first?')}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 rounded-lg text-left text-[11px] font-medium leading-tight truncate transition-colors cursor-pointer"
                >
                  “Which customer to call first?”
                </button>
                <button
                  type="button"
                  onClick={() => handleSmartQuestion('How can I increase revenue this week?')}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 rounded-lg text-left text-[11px] font-medium leading-tight truncate transition-colors cursor-pointer"
                >
                  “How to increase revenue?”
                </button>
                <button
                  type="button"
                  onClick={() => handleSmartQuestion('What are my employees struggling with?')}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 rounded-lg text-left text-[11px] font-medium leading-tight truncate transition-colors cursor-pointer"
                >
                  “What are employees struggling with?”
                </button>
              </div>
            </div>

            {/* Input custom send */}
            <form onSubmit={handleCustomSend} className="p-3 bg-slate-50 border-t border-slate-150 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your Chief Operating Officer a custom question..."
                className="flex-1 bg-white border border-slate-150 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-slate-400 text-slate-800"
              />
              <button 
                type="submit"
                className="h-9 w-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Tab CONTENT 4: Workforce Dossiers */}
        {dashboardTab === 'on_duty' && (
          <div className="space-y-4 animate-fade-in">
            {/* Dense, sleek, expandable cards for every employee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {employeesDuty.map((emp) => {
                const isExpanded = expandedEmployee === emp.id;
                return (
                  <div 
                    key={emp.id}
                    className="bg-white border border-slate-150 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    {/* Header info */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm tracking-wider ${emp.avatarBg}`}>
                            {emp.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-extrabold text-slate-900">{emp.name}</h4>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${emp.statusColor}`}>
                                {emp.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{emp.department} &bull; {emp.role}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleToggleEmployeeDetail(emp.id)}
                          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Toggle employee details"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {/* Current Active Tasks and Completed logs */}
                      <div className="space-y-3 pt-2 text-xs border-t border-slate-50">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Current Task</span>
                          <p className="text-slate-700 font-medium leading-relaxed flex items-start gap-1.5 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-900 mt-1.5 flex-shrink-0 animate-pulse" />
                            {emp.currentTask}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-1">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed Work (While Away)</span>
                            <div className="space-y-1.5 pl-1">
                              {emp.completedWork.map((work, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-slate-600">
                                  <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span>{work}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Work Queue</span>
                            <div className="space-y-1.5 pl-1">
                              {emp.pendingWork.map((work, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-slate-600">
                                  <Clock size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                  <span>{work}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                          💡 Active Recommendation
                        </span>
                        <p className="leading-relaxed italic">“{emp.recommendations}”</p>
                      </div>

                      {/* Expanded Core Personality Dossier */}
                      {isExpanded && (
                        <div className="space-y-3.5 pt-4 border-t border-slate-100 animate-slide-down">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Award size={11} className="text-slate-500" /> Employee Personnel Dossier
                          </h5>

                          <div className="grid grid-cols-2 gap-3 text-[11px] leading-relaxed">
                            <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50 space-y-0.5">
                              <strong className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Personality</strong>
                              <span className="text-slate-700">{emp.personality}</span>
                            </div>
                            <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50 space-y-0.5">
                              <strong className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Memory Retention</strong>
                              <span className="text-slate-700">{emp.memory}</span>
                            </div>
                            <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50 space-y-0.5">
                              <strong className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Communication Style</strong>
                              <span className="text-slate-700">{emp.commStyle}</span>
                            </div>
                            <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50 space-y-0.5">
                              <strong className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Area of Expertise</strong>
                              <span className="text-slate-700">{emp.expertise}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Primary Business Objectives</span>
                            <div className="space-y-1.5 pl-1 text-[11px]">
                              {emp.objectives.map((obj, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-slate-600">
                                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                                  <span>{obj}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom flyout/button to trigger training interface */}
                    <div className="bg-slate-50 border-t border-slate-150 px-5 py-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {emp.id}</span>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <BadgeInfo size={11} /> Ready to Assist
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ACTION ITEMS & SYSTEM OPERATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Action Items Column */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <CheckSquare size={18} className="text-slate-800" /> Action Items & Urgent Dispatch
            </h3>
            <p className="text-xs text-slate-500">Urgent tasks highlighted by your AI Workforce. Click to resolve or coordinate with the team.</p>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`p-3.5 border rounded-xl flex items-start gap-3.5 transition-all cursor-pointer ${
                  task.completed 
                    ? 'bg-slate-50/50 border-slate-100 text-slate-400 line-through opacity-60' 
                    : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700 shadow-sm'
                }`}
              >
                <div className="mt-0.5">
                  <span className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                    task.completed 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}>
                    {task.completed && <span className="text-[10px]">✓</span>}
                  </span>
                </div>
                
                <div className="space-y-0.5 text-xs flex-1">
                  <p className="font-bold text-slate-800">{task.clientName}</p>
                  <p className="leading-relaxed text-slate-500">{task.text}</p>
                </div>

                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                  task.completed 
                    ? 'bg-slate-100 text-slate-400' 
                    : task.taskType === 'estimate' 
                      ? 'bg-sky-50 text-sky-700' 
                      : task.taskType === 'financing' 
                        ? 'bg-amber-50 text-amber-700' 
                        : task.taskType === 'support'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-purple-50 text-purple-700'
                }`}>
                  {task.completed ? 'Resolved' : task.taskType}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Flow Metrics & Settings Column */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Settings size={18} className="text-slate-800" /> Active System Automation Channels
            </h3>
            <p className="text-xs text-slate-500">Live background pathways managed automatically by the Operations Specialist.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Average response time</span>
              <p className="font-extrabold text-slate-800">1.8 Seconds</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Knowledge Sync frequency</span>
              <p className="font-extrabold text-emerald-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Continuous (0.8s lag)
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3.5 text-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ACTIVE WORKFORCE RULES</p>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-600 font-medium">Auto-follow up on incoming lead captures</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100">Active (5m delay)</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-600 font-medium">Review solicitation on job completions</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100">Active (2h delay)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Emergency lead escalation SMS triggers</span>
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-100 font-mono">Instant Gateway</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
