// src/components/VoiceWorkforce.tsx
import React, { useState, useEffect } from 'react';
import { 
  Phone, PhoneIncoming, PhoneOutgoing, MessageSquare, Mail, Bell, 
  ShieldAlert, ShieldCheck, Play, Pause, RefreshCw, Sliders, Calendar, 
  Zap, Bot, Activity, Trash2, User, Volume2, Save, Sparkles, Check, 
  ChevronRight, CheckSquare, Star, Send, Database, AlertCircle, 
  TrendingUp, Info, Clock, AlertTriangle, ArrowRight, BookOpen, 
  Layers, Settings, Globe, Plus, X
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend
} from 'recharts';

interface ReceptionistConfig {
  enabled: boolean;
  greetScript: string;
  leadQualRules: Array<{ field: string; label: string; required: boolean }>;
  emergencyRouting: string;
  businessHours: Record<string, { enabled: boolean; start: string; end: string }>;
  escalationRules: Array<{ condition: string; action: string; target: string }>;
  voiceProfile: string;
  voicemailDetection: boolean;
}

interface TimelineItem {
  id: number;
  type: 'call' | 'sms' | 'email' | 'appointment' | 'invoice' | 'review' | 'marketing' | 'chat' | 'note';
  title: string;
  content: string;
  status: string;
  assignedAgent: string;
  metadata: any;
  createdAt: string;
}

interface QAReview {
  id: number;
  agentName: string;
  channel: string;
  prompt: string;
  response: string;
  feedback: 'approved' | 'corrected' | 'flagged';
  correction?: string;
  accuracyScore: number;
  createdAt: string;
}

export default function VoiceWorkforce({ businessId }: { businessId: string }) {
  // Navigation tabs for Phase 53
  const [activeSubTab, setActiveSubTab] = useState<'hub' | 'receptionist' | 'qa' | 'automations' | 'analytics'>('hub');
  
  // States
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [config, setConfig] = useState<ReceptionistConfig | null>(null);
  const [qaReviews, setQAReviews] = useState<QAReview[]>([]);
  
  // Active filter for Comms Hub Feed
  const [hubFilter, setHubFilter] = useState<string>('all');
  
  // Custom interactive simulation forms
  const [simType, setSimType] = useState<'sms' | 'email' | 'chat' | 'note'>('sms');
  const [simCustomer, setSimCustomer] = useState('Sarah Jenkins');
  const [simContent, setSimContent] = useState('Hey Sarah, checking in to see if you are happy with the hot water installation Alex finished!');
  const [simulating, setSimulating] = useState(false);

  // AI Receptionist Testing Playground (Voice Knowledge Engine)
  const [testQuery, setTestQuery] = useState('What is your emergency dispatch rate for active floods in the evening?');
  const [testingKnowledge, setTestingKnowledge] = useState(false);
  const [testResult, setTestResult] = useState<{
    spokenResponse: string;
    confidenceScore: number;
    matchedSources: string[];
    escalationRequired: boolean;
    escalationReason: string;
  } | null>(null);

  // QA Editing State
  const [editingQAId, setEditingQAId] = useState<number | null>(null);
  const [qaCorrectionText, setQaCorrectionText] = useState('');
  const [qaScore, setQaScore] = useState(100);
  const [qaFeedbackStatus, setQaFeedbackStatus] = useState<'approved' | 'corrected' | 'flagged'>('corrected');
  const [submittingQA, setSubmittingQA] = useState(false);

  // Follow-up automation dispatch
  const [autoCustName, setAutoCustName] = useState('Sarah Jenkins');
  const [autoDetails, setAutoDetails] = useState('Standard Hot Water System Diagnostic Checkup');
  const [dispatchingAuto, setDispatchingAuto] = useState<string | null>(null);

  // Audio Playback
  const [activePlaybackId, setActivePlaybackId] = useState<number | null>(null);

  // Dynamic Notification state
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [businessId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch Comms Timeline
      const timelineRes = await fetch('/api/workforce/comms/timeline');
      if (timelineRes.ok) {
        const data = await timelineRes.json();
        setTimeline(data.timeline || []);
      }

      // Fetch AI Receptionist Config
      const configRes = await fetch('/api/workforce/receptionist/config');
      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data.config);
      }

      // Fetch QA reviews
      const qaRes = await fetch('/api/workforce/qa/list');
      if (qaRes.ok) {
        const data = await qaRes.json();
        setQAReviews(data.reviews || []);
      }

    } catch (e) {
      console.error("Error loading communications data: ", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      setBannerNotice("Saving AI receptionist rules to Cloud database...");
      const res = await fetch('/api/workforce/receptionist/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setBannerNotice("Success: AI Receptionist configuration updated and deployed to voice network.");
        setTimeout(() => setBannerNotice(null), 4000);
      }
    } catch (e) {
      console.error(e);
      setBannerNotice("Error: Failed to save config parameters.");
    }
  };

  const handleSimulateComms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simContent.trim()) return;
    try {
      setSimulating(true);
      const res = await fetch('/api/workforce/comms/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: simType,
          title: `Outbound ${simType.toUpperCase()} - ${simCustomer.toUpperCase()}`,
          content: simContent,
          status: 'sent',
          assignedAgent: simType === 'note' ? 'Alex (Human Tech)' : 'AI Maya (Marketing Agent)',
          metadata: { simulated: true, channel: simType }
        })
      });

      if (res.ok) {
        setSimContent('');
        setBannerNotice(`Simulated ${simType.toUpperCase()} dispatched! Event recorded in CRM timeline.`);
        setTimeout(() => setBannerNotice(null), 4000);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const handleTestKnowledge = async () => {
    if (!testQuery.trim()) return;
    try {
      setTestingKnowledge(true);
      setTestResult(null);
      const res = await fetch('/api/workforce/voice/test-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          spokenResponse: data.spokenResponse,
          confidenceScore: data.confidenceScore,
          matchedSources: data.matchedSources,
          escalationRequired: data.escalationRequired,
          escalationReason: data.escalationReason
        });
        loadAllData(); // Refresh history
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestingKnowledge(false);
    }
  };

  const handleStartQAAudit = (qa: QAReview) => {
    setEditingQAId(qa.id);
    setQaCorrectionText(qa.correction || qa.response);
    setQaScore(qa.accuracyScore);
    setQaFeedbackStatus(qa.feedback);
  };

  const handleSaveQARate = async () => {
    if (editingQAId === null) return;
    try {
      setSubmittingQA(true);
      const res = await fetch('/api/workforce/qa/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingQAId,
          feedback: qaFeedbackStatus,
          correction: qaCorrectionText,
          accuracyScore: qaScore
        })
      });
      if (res.ok) {
        setEditingQAId(null);
        setBannerNotice("QA Correction applied. Model recursively optimizing weights based on admin corrections.");
        setTimeout(() => setBannerNotice(null), 4000);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingQA(false);
    }
  };

  const handleTriggerFollowUp = async (type: string) => {
    try {
      setDispatchingAuto(type);
      const res = await fetch('/api/workforce/comms/trigger-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          customerName: autoCustName,
          details: autoDetails
        })
      });
      if (res.ok) {
        setBannerNotice(`Auto-Trigger Success: Dispatched automatic follow-up to ${autoCustName}!`);
        setTimeout(() => setBannerNotice(null), 4000);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDispatchingAuto(null);
    }
  };

  // Filter timeline
  const filteredTimeline = timeline.filter(item => {
    if (hubFilter === 'all') return true;
    if (hubFilter === 'voice') return item.type === 'call';
    if (hubFilter === 'sms') return item.type === 'sms';
    if (hubFilter === 'email') return item.type === 'email';
    if (hubFilter === 'chat') return item.type === 'chat';
    if (hubFilter === 'review') return item.type === 'review';
    if (hubFilter === 'automations') return ['appointment', 'invoice', 'marketing'].includes(item.type);
    return true;
  });

  // Simple stats for Analytics Tab
  const stats = {
    avgResponseTime: "0.8 sec",
    missedCalls: "0%",
    firstContactResolution: "94.2%",
    csat: "96.5%",
    appointmentConversion: "88.7%",
    leadQualification: "91.4%",
    totalVolume: timeline.length + 34,
    escalationRate: "4.1%"
  };

  // Mock charts data
  const volumeData = [
    { name: 'Mon', calls: 12, sms: 24, email: 18, chat: 9 },
    { name: 'Tue', calls: 18, sms: 35, email: 22, chat: 15 },
    { name: 'Wed', calls: 15, sms: 42, email: 29, chat: 11 },
    { name: 'Thu', calls: 24, sms: 31, email: 26, chat: 19 },
    { name: 'Fri', calls: 29, sms: 48, email: 34, chat: 25 },
    { name: 'Sat', calls: 8, sms: 15, email: 10, chat: 6 },
    { name: 'Sun', calls: 2, sms: 6, email: 4, chat: 2 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <RefreshCw size={36} className="text-slate-900 animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Re-routing SIP channels & loading customer database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Dynamic Status Notifications Banner */}
      {bannerNotice && (
        <div className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl text-xs font-mono flex items-center justify-between gap-3 animate-pulse shadow-md">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-cyan-400 animate-spin" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Unified communications platform header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Volume2 size={22} className="text-indigo-600" /> Unified Communications & Voice AI
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Omnichannel customer communication cockpit merging real-time voice, SMS, email, and live website chat with direct knowledge integration and QA loops.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider font-mono">TELEPHONY NETWORK ONLINE</span>
        </div>
      </div>

      {/* Interactive Platform Tabs Selection */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-2xl w-full">
        <button
          onClick={() => setActiveSubTab('hub')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'hub' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={14} /> Communications Hub
        </button>
        <button
          onClick={() => setActiveSubTab('receptionist')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'receptionist' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot size={14} /> AI Receptionist Config
        </button>
        <button
          onClick={() => setActiveSubTab('qa')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'qa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={14} /> Quality Assurance (QA)
        </button>
        <button
          onClick={() => setActiveSubTab('automations')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'automations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap size={14} /> Follow-Up Automations
        </button>
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={14} /> Analytics & Volume
        </button>
      </div>

      {/* VIEW 1: COMMUNICATIONS HUB & TIMELINE */}
      {activeSubTab === 'hub' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Timeline Feed column */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Timeline filter and summary */}
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Unified Customer Timeline</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Aggregated multichannel conversation and service touchpoints feed</p>
              </div>

              {/* Feed Filters */}
              <div className="flex flex-wrap gap-1">
                {['all', 'voice', 'sms', 'email', 'chat', 'review', 'automations'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHubFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      hubFilter === filter 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Timelines list */}
            <div className="space-y-3">
              {filteredTimeline.length === 0 ? (
                <div className="bg-white border border-slate-100 p-12 text-center text-slate-400 text-xs rounded-2xl">
                  No communication records matches your filter criteria.
                </div>
              ) : (
                filteredTimeline.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow transition-all space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      
                      {/* Left: icon and header */}
                      <div className="flex items-start gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center mt-0.5 ${
                          item.type === 'call' ? 'bg-indigo-50 text-indigo-700' :
                          item.type === 'sms' ? 'bg-emerald-50 text-emerald-700' :
                          item.type === 'email' ? 'bg-cyan-50 text-cyan-700' :
                          item.type === 'chat' ? 'bg-purple-50 text-purple-700' :
                          item.type === 'appointment' ? 'bg-pink-50 text-pink-700' :
                          item.type === 'invoice' ? 'bg-amber-50 text-amber-700' :
                          item.type === 'review' ? 'bg-rose-50 text-rose-700' :
                          'bg-slate-50 text-slate-700'
                        }`}>
                          {item.type === 'call' && <Phone size={14} />}
                          {item.type === 'sms' && <MessageSquare size={14} />}
                          {item.type === 'email' && <Mail size={14} />}
                          {item.type === 'chat' && <Globe size={14} />}
                          {item.type === 'appointment' && <Calendar size={14} />}
                          {item.type === 'invoice' && <Database size={14} />}
                          {item.type === 'review' && <Star size={14} />}
                          {['note', 'marketing'].includes(item.type) && <Zap size={14} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-slate-800">{item.title}</h4>
                            <span className="text-[9px] text-slate-400 font-mono">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-slate-400 font-semibold">Assigned:</span>
                            <span className="text-[10px] text-slate-600 font-bold bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Bot size={10} className="text-indigo-500" /> {item.assignedAgent}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Badge Status */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'completed' || item.status === 'sent' || item.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          item.status === 'pending' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                        
                        {item.type === 'call' && item.metadata?.recording_url && (
                          <button
                            onClick={() => setActivePlaybackId(activePlaybackId === item.id ? null : item.id)}
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50/50 px-1.5 py-0.5 rounded"
                          >
                            {activePlaybackId === item.id ? <Pause size={10} /> : <Play size={10} />}
                            <span>Call Recording</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                      {item.content}
                    </p>

                    {/* Metadata Drawer for granular CRM links */}
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-50">
                        {Object.entries(item.metadata).map(([k, v]: [string, any]) => {
                          if (k === 'recording_url') return null;
                          return (
                            <span key={k} className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                              <strong>{k}:</strong> {String(v)}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Expand Playback and recordings if active */}
                    {activePlaybackId === item.id && item.type === 'call' && (
                      <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-900 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-indigo-400 font-bold flex items-center gap-1">
                            <Bot size={11} /> Call Recording Compliance Audited
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">256-bit SIP Call Encrypted</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <button className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Play size={14} className="ml-0.5" />
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="h-1.5 bg-slate-700 rounded-full w-full overflow-hidden">
                              <div className="h-full bg-indigo-500 w-1/3" />
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-slate-400">
                              <span>0:24</span>
                              <span>Duration: {item.metadata?.duration || 112}s</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                          Compliance Note: Recording is stored and transcribed using GDPR and HIPAA compliant server boundaries. Cross-tenant leakage is locked out.
                        </p>
                      </div>
                    )}

                  </div>
                ))
              )}
            </div>

          </div>

          {/* Connectors & Testing column */}
          <div className="space-y-6">
            
            {/* Simulation dispatch card */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OMNICHANNEL SIMULATOR</p>
                <h3 className="text-xs font-bold text-slate-800 mt-1">Dispatched Manual / Campaign Touches</h3>
              </div>

              <form onSubmit={handleSimulateComms} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Channel Type</label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-xl">
                    {(['sms', 'email', 'chat', 'note'] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setSimType(ch)}
                        className={`py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                          simType === ch ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Select CRM Recipient</label>
                  <input
                    type="text"
                    value={simCustomer}
                    onChange={(e) => setSimCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
                    placeholder="Recipient Name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Simulated Content Payload</label>
                  <textarea
                    value={simContent}
                    onChange={(e) => setSimContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                    rows={3}
                    placeholder="Type simulated SMS message, Email, or Webchat reply..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send size={12} />
                  {simulating ? "Simulating dispatch..." : "Simulate Outbound Touch"}
                </button>
              </form>
            </div>

            {/* Configured Connectors overview */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">CONNECTOR CHANNELS</p>
                <h3 className="text-xs font-bold text-slate-800 mt-1">Provider Connectors Configuration</h3>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Twilio Telephony (SIP)", desc: "Inbound voice answering & call recording", status: "Active & Safe", color: "text-emerald-600 bg-emerald-50" },
                  { name: "Twilio SMS", desc: "Interactive customer texts and updates", status: "Active & Safe", color: "text-emerald-600 bg-emerald-50" },
                  { name: "SendGrid SMTP Engine", desc: "Outbound estimate & invoice automation", status: "Active & Safe", color: "text-emerald-600 bg-emerald-50" },
                  { name: "Live Website Chat Widget", desc: "Captures visitors on homepage", status: "Active & Safe", color: "text-emerald-600 bg-emerald-50" },
                  { name: "WhatsApp Business Connector", desc: "Interactive customer chat channel", status: "Integrable (Click)", color: "text-amber-600 bg-amber-50" },
                ].map((conn, idx) => (
                  <div key={idx} className="p-3 border border-slate-50 rounded-xl space-y-1.5 bg-slate-50/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800">{conn.name}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${conn.color}`}>
                        {conn.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">{conn.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: AI RECEPTIONIST RULES & TEST WORKFLOWS */}
      {activeSubTab === 'receptionist' && config && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Rules and forms panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Greeting Script and core settings */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">AI Receptionist Core Rules</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Control how the Voice receptionist greets callers and screens issues</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Status</span>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">AI RECEPTIONIST GREETING SPEECH</label>
                  <textarea
                    value={config.greetScript}
                    onChange={(e) => setConfig({ ...config, greetScript: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                    rows={4}
                    placeholder="Enter synthetic greeting speech..."
                  />
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Tip: State your business name, name of the AI agent, and capabilities clearly to build trust and streamline qualification.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Synthetic Voice Profile</label>
                    <select
                      value={config.voiceProfile}
                      onChange={(e) => setConfig({ ...config, voiceProfile: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="en-US-Neural2-F">Charlotte (en-US-Neural2-F)</option>
                      <option value="en-US-Neural2-M">Pete (en-US-Neural2-M)</option>
                      <option value="en-GB-Standard-A">Charles - British Accent (en-GB-Standard-A)</option>
                      <option value="es-ES-Standard-B">Marisol - Spanish Speaker (es-ES-Standard-B)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Voicemail Detection</label>
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-600">Auto hang up/record</span>
                      <input
                        type="checkbox"
                        checked={config.voicemailDetection}
                        onChange={(e) => setConfig({ ...config, voicemailDetection: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                    <span>Emergency Routing Phone Number</span>
                    <span className="text-[9px] text-red-600 lowercase font-mono">routes severe events instantly</span>
                  </label>
                  <input
                    type="text"
                    value={config.emergencyRouting}
                    onChange={(e) => setConfig({ ...config, emergencyRouting: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-indigo-500 font-mono"
                    placeholder="E.g. 555-0199"
                  />
                </div>
              </div>
            </div>

            {/* Lead Qualification & Escalation Rules */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Lead Screening & Escalation</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Control dynamic call behaviors, screening requirements, and human handoffs</p>
              </div>

              <div className="space-y-4">
                {/* Lead Screening requirements */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Screening & Qualification Requirements</p>
                  <div className="grid grid-cols-2 gap-2">
                    {config.leadQualRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-xs font-bold text-slate-700">{rule.label}</span>
                        <input
                          type="checkbox"
                          checked={rule.required}
                          onChange={(e) => {
                            const updated = [...config.leadQualRules];
                            updated[idx].required = e.target.checked;
                            setConfig({ ...config, leadQualRules: updated });
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Escalation Rules */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Custom Escalation Paths</p>
                  <div className="space-y-2">
                    {config.escalationRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl text-xs font-mono">
                        <div className="flex-1">
                          <span className="text-indigo-800 font-extrabold uppercase text-[10px]">if:</span> {rule.condition}
                        </div>
                        <div className="flex-1">
                          <span className="text-indigo-800 font-extrabold uppercase text-[10px]">then:</span> {rule.action} → <strong className="text-slate-800">{rule.target}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business hours config */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Respect Business Hours</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(config.businessHours).map(([day, hrs]: [string, any]) => (
                      <div key={day} className="p-2 border border-slate-50 rounded-lg bg-slate-50/20 text-center space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-700 capitalize">{day.substring(0, 3)}</span>
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={hrs.enabled}
                            onChange={(e) => {
                              const updatedHours = { ...config.businessHours };
                              updatedHours[day].enabled = e.target.checked;
                              setConfig({ ...config, businessHours: updatedHours });
                            }}
                            className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-500 font-bold">{hrs.enabled ? `${hrs.start}-${hrs.end}` : 'Closed'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveConfig}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Save size={13} /> Save AI Receptionist Rules & Rulesets
                </button>
              </div>
            </div>

          </div>

          {/* Test playground column */}
          <div className="space-y-6">
            
            {/* Voice Knowledge playground card */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Database size={11} className="text-indigo-600" /> Voice Knowledge Sandbox
                </p>
                <h3 className="text-xs font-bold text-slate-800 mt-1">Simulated Customer Call</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  Speak a query as a customer to test how the AI Receptionist references approved business memory documents and handles uncertainty.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Speaks:</label>
                  <textarea
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleTestKnowledge}
                  disabled={testingKnowledge}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Volume2 size={13} className="animate-pulse" />
                  {testingKnowledge ? "Retrieving memory & formulating..." : "Connect Testing Call"}
                </button>
              </div>

              {testResult && (
                <div className="pt-4 border-t border-slate-50 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Receptionist response:</p>
                  
                  <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[11px] font-mono leading-relaxed space-y-1.5">
                    <p className="text-emerald-400 font-extrabold uppercase text-[9px] flex items-center gap-1">
                      <Bot size={10} /> spoken script:
                    </p>
                    <p className="text-white leading-relaxed">{testResult.spokenResponse}</p>
                    
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                      <span>Accuracy Confidence:</span>
                      <span className={`font-bold ${testResult.confidenceScore > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {testResult.confidenceScore}% Match
                      </span>
                    </div>
                  </div>

                  {/* Sources matched or uncertainty flags */}
                  {testResult.matchedSources.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Check size={10} className="text-emerald-600" /> Matched Knowledge Sources:
                      </p>
                      {testResult.matchedSources.map((src, i) => (
                        <div key={i} className="text-[10px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                          {src}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-start gap-2 text-[10px] text-amber-900 leading-normal">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Uncertainty Handler Triggered:</strong> Information wasn't found in approved document repository. AI Receptionist safely deflated statement.
                      </div>
                    </div>
                  )}

                  {/* Escalation details */}
                  {testResult.escalationRequired && (
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-start gap-2 text-[10px] text-rose-900 leading-normal">
                      <ShieldAlert size={14} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Human Escalation Flagged:</strong> {testResult.escalationReason || "Escalated for immediate technician route."}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Quick knowledge base helper */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-[11px] text-slate-500 leading-normal space-y-1">
              <p className="font-bold text-slate-700 flex items-center gap-1">
                <Info size={12} className="text-indigo-600" /> Memory Engine Guidelines:
              </p>
              <p>The receptionist accesses documents directly from the <strong>Business Knowledge Base</strong> tab. Keep pricing rules and safety protocols updated there to empower the AI voice with correct data.</p>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 3: QUALITY ASSURANCE (QA) PORTAL */}
      {activeSubTab === 'qa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* List of responses to inspect */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Conversation Audit Desk</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Inspect customer prompts, verify accuracy scores, and correct model weights</p>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-1 rounded font-mono">
                {qaReviews.length} Interactions Audited
              </span>
            </div>

            <div className="space-y-3">
              {qaReviews.map((qa) => (
                <div key={qa.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow transition-all space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-800">{qa.agentName}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                        {qa.channel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                        <span>Accuracy:</span>
                        <span className={`${qa.accuracyScore > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {qa.accuracyScore}%
                        </span>
                      </div>

                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        qa.feedback === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                        qa.feedback === 'corrected' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                        'bg-rose-50 text-rose-800 border border-rose-100'
                      }`}>
                        {qa.feedback}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Customer Prompt:</p>
                      <p className="font-semibold text-slate-700">"{qa.prompt}"</p>
                    </div>

                    <div className="p-3 bg-indigo-50/10 border border-indigo-50/30 rounded-xl space-y-1">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">AI response:</p>
                      <p className="text-slate-600 leading-normal">"{qa.response}"</p>
                    </div>

                    {qa.correction && (
                      <div className="p-3 bg-emerald-50/10 border border-emerald-100/30 rounded-xl space-y-1">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Admin Correction / Optimal Target response:</p>
                        <p className="text-slate-700 leading-normal italic">"{qa.correction}"</p>
                      </div>
                    )}
                  </div>

                  {/* Audit button */}
                  {editingQAId !== qa.id && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleStartQAAudit(qa)}
                        className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 uppercase flex items-center gap-1 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1 rounded-lg cursor-pointer"
                      >
                        <Sliders size={11} /> Correct response
                      </button>
                    </div>
                  )}

                  {/* Rating / Correction Form Drawer */}
                  {editingQAId === qa.id && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase">Correct AI Response Log</h4>
                        <button onClick={() => setEditingQAId(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Feedback Category</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['approved', 'corrected', 'flagged'] as const).map((stat) => (
                              <button
                                key={stat}
                                type="button"
                                onClick={() => setQaFeedbackStatus(stat)}
                                className={`py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer border ${
                                  qaFeedbackStatus === stat 
                                    ? 'bg-slate-900 text-white border-slate-900' 
                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                }`}
                              >
                                {stat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Interactive Accuracy Score</label>
                            <span className="text-xs font-mono font-bold text-indigo-600">{qaScore}% Accuracy</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={qaScore}
                            onChange={(e) => setQaScore(Number(e.target.value))}
                            className="w-full text-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Administrative Corrected text</label>
                          <textarea
                            value={qaCorrectionText}
                            onChange={(e) => setQaCorrectionText(e.target.value)}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500"
                            rows={3}
                            placeholder="Type how the AI should ideally answer this prompt..."
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingQAId(null)}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-extrabold uppercase text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveQARate}
                            disabled={submittingQA}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-extrabold uppercase cursor-pointer"
                          >
                            Save correction
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>

          {/* QA analytics sidebar */}
          <div className="space-y-6">
            
            {/* Improvement tracker metric */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QA IMPROVEMENT METER</p>
                <h3 className="text-xs font-bold text-slate-800 mt-1">Accuracy Progression Over Time</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Average Accuracy Rate:</span>
                    <span className="text-indigo-600">92.4%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full w-[92.4%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Audited Approved Rate:</span>
                    <span className="text-emerald-600">88.2%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[88.2%]" />
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-50 leading-relaxed text-slate-500 text-[10px]">
                  <span>System Feedback Loop active. Model recursively parses correction logs to retrain response schemas and parameters.</span>
                </div>
              </div>
            </div>

            {/* QA Guidelines */}
            <div className="bg-slate-900 border border-slate-950 p-5 rounded-2xl shadow text-white space-y-3">
              <h4 className="text-xs font-bold uppercase flex items-center gap-1">
                <ShieldCheck size={13} className="text-indigo-400" /> Admin QA Protocols
              </h4>
              <p className="text-[10px] leading-relaxed text-slate-300">
                To guarantee zero-leak policy boundaries and pristine CSAT levels, review flagged responses at least once weekly. 
                Applying corrections refines AI contextual routing weights recursively.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 4: AUTOMATION FLOW TRiggers */}
      {activeSubTab === 'automations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main triggers grid */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Follow-Up Automations Engine</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Let AI employees automatically dispatch confirmations, review requests, past due notices and re-engagements.</p>
              </div>

              {/* CRM targets config inside trigger */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Target CRM Recipient</label>
                  <input
                    type="text"
                    value={autoCustName}
                    onChange={(e) => setAutoCustName(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-700"
                    placeholder="E.g. Sarah Jenkins"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Work Details context</label>
                  <input
                    type="text"
                    value={autoDetails}
                    onChange={(e) => setAutoDetails(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    type: "confirmation",
                    title: "Appointment Confirmation",
                    desc: "Dispatches SMS/Email upon customer calendar booking block.",
                    agent: "AI Charlotte",
                    color: "border-indigo-100 bg-indigo-50/20"
                  },
                  {
                    type: "reminder",
                    title: "24-Hour Reminder Notice",
                    desc: "Reminds customers day before service to reduce missed slot slippages.",
                    agent: "AI Charlotte",
                    color: "border-indigo-100 bg-indigo-50/20"
                  },
                  {
                    type: "estimate",
                    title: "Estimate Follow-up campaign",
                    desc: "Re-engages unresolved estimates with discount diagnostic credits.",
                    agent: "AI Maya",
                    color: "border-purple-100 bg-purple-50/20"
                  },
                  {
                    type: "review",
                    title: "Google Review Request",
                    desc: "Dispatches CSAT survey link upon field invoice collection completions.",
                    agent: "AI Maya",
                    color: "border-purple-100 bg-purple-50/20"
                  },
                  {
                    type: "invoice_reminder",
                    title: "Overdue Invoice Dunning",
                    desc: "Reminds past due invoices to improve capital recovery cash flow.",
                    agent: "AI Bob",
                    color: "border-amber-100 bg-amber-50/20"
                  },
                  {
                    type: "reengage",
                    title: "6-Month Customer Audit",
                    desc: "Re-engages inactive historical accounts with discount seasonal checklists.",
                    agent: "AI Maya",
                    color: "border-emerald-100 bg-emerald-50/20"
                  },
                ].map((rule) => (
                  <div key={rule.type} className={`p-5 border rounded-2xl space-y-4 shadow-sm flex flex-col justify-between ${rule.color}`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-slate-900">{rule.title}</h4>
                        <span className="text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">
                          {rule.agent}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">{rule.desc}</p>
                    </div>

                    <button
                      onClick={() => handleTriggerFollowUp(rule.type)}
                      disabled={dispatchingAuto !== null}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-[10px] font-extrabold uppercase py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all"
                    >
                      <Zap size={11} />
                      {dispatchingAuto === rule.type ? "Dispatching..." : "Simulate Auto Trigger"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Verification / Security Compliance panel */}
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <ShieldCheck size={12} className="text-emerald-600" /> Security Gate Policy
                </p>
                <h3 className="text-xs font-bold text-slate-800 mt-1">Human Approval Requirement</h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  To secure client privacy and eliminate errant emails, all automated re-engagement and overdue invoice triggers enforce a Human-in-the-Loop policy gatekeeper.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-[10px] font-bold">
                  <div className="flex items-center justify-between">
                    <span>Overdue Invoices dunning:</span>
                    <span className="text-indigo-600 uppercase">Requires CFO signoff</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pricing edits updates:</span>
                    <span className="text-indigo-600 uppercase">Requires Owner gate</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 5: COMMUNICATION ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Grid of KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Avg Response Time", val: stats.avgResponseTime, icon: <Clock size={16} className="text-indigo-600" />, change: "Stable" },
              { label: "First Contact Resolution", val: stats.firstContactResolution, icon: <CheckSquare size={16} className="text-emerald-600" />, change: "+1.2% this wk" },
              { label: "Customer Satisfaction", val: stats.csat, icon: <Star size={16} className="text-amber-500 fill-amber-500" />, change: "+0.5% vs yesterday" },
              { label: "Total Comms Volume", val: stats.totalVolume, icon: <Layers size={16} className="text-cyan-600" />, change: "+18 messages today" },
              { label: "Missed Calls", val: stats.missedCalls, icon: <PhoneIncoming size={16} className="text-rose-600" />, change: "Optimal" },
              { label: "Apt Conversion Rate", val: stats.appointmentConversion, icon: <Calendar size={16} className="text-pink-600" />, change: "+3.4% this mo" },
              { label: "Lead Qualification Rate", val: stats.leadQualification, icon: <Bot size={16} className="text-purple-600" />, change: "Excellent" },
              { label: "Escalation Rate", val: stats.escalationRate, icon: <AlertTriangle size={16} className="text-amber-600" />, change: "Within safety" },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">{stat.label}</span>
                  {stat.icon}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-extrabold text-slate-900">{stat.val}</span>
                  <span className="text-[9px] font-bold text-slate-500 font-mono">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Visual volume charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1 */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Weekly Communication Volume by Channel</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Logs total touchpoints generated across Twilio and email integrations</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="calls" name="Voice Calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sms" name="SMS Texts" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="email" name="Emails" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="chat" name="Website Chats" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">CSAT & Resolution Performance Trend</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Compares average audited CSAT score against first-contact resolution</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { day: 'Mon', csat: 94, resolution: 91 },
                    { day: 'Tue', csat: 95, resolution: 92 },
                    { day: 'Wed', csat: 95, resolution: 94 },
                    { day: 'Thu', csat: 96, resolution: 93 },
                    { day: 'Fri', csat: 96, resolution: 94 },
                    { day: 'Sat', csat: 97, resolution: 95 },
                    { day: 'Sun', csat: 96, resolution: 94 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="csat" name="Customer CSAT %" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.05)" />
                    <Area type="monotone" dataKey="resolution" name="Resolution Rate %" stroke="#10b981" fill="rgba(16, 185, 129, 0.05)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
