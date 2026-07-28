import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, Users, Calendar, MessageSquare, Sliders, Code, Power, LogOut, 
  Sparkles, Building, Briefcase, Mail, CheckCircle2, ShieldCheck, HelpCircle,
  TrendingUp, Megaphone, GitFork, Volume2, ShoppingBag, Navigation, BookOpen, Network, Cpu, Settings, Brain, RefreshCw
} from 'lucide-react';

import { UserAccount, BusinessProfile } from './types';
import Onboarding from './components/Onboarding';
import Overview from './components/Overview';
import GrowthHub from './components/GrowthHub';
import Leads from './components/Leads';
import Appointments from './components/Appointments';
import Conversations from './components/Conversations';
import Automations from './components/Automations';
import WidgetSettings from './components/WidgetSettings';
import WidgetView from './components/WidgetView';
import Customers from './components/Customers';
import Marketing from './components/Marketing';
import Reports from './components/Reports';
import AIWorkforce from './components/AIWorkforce';
import OfficeManagerHeader from './components/OfficeManagerHeader';
import IntegrationsConsole from './components/IntegrationsConsole';

import VisualWorkflowBuilder from './components/VisualWorkflowBuilder';
import VoiceWorkforce from './components/VoiceWorkforce';
import CustomerPortal from './components/CustomerPortal';
import MobileWorkforce from './components/MobileWorkforce';
import Marketplace from './components/Marketplace';
import SuperAdmin from './components/SuperAdmin';
import { KnowledgeEngine } from './components/KnowledgeEngine';
import MultiAgentEngineView from './components/MultiAgentEngineView';
import AutonomousEngineView from './components/AutonomousEngineView';
import DeploymentEngine from './components/DeploymentEngine';
import ExecutiveIntelligence from './components/ExecutiveIntelligence';
import DigitalTwin from './components/DigitalTwin';
import { UniversalDashboard } from './components/universal/UniversalDashboard';
import { AutonomousBusinessOSContainer } from './components/discovery/AutonomousBusinessOSContainer';

export default function App() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'growth' | 'leads' | 'appointments' | 'chats' | 'automations' | 'widget' | 'customers' | 'marketing' | 'reports' | 'workforce' | 'security' |
    'workflows' | 'voice' | 'portal' | 'mobile' | 'marketplace' | 'admin' | 'knowledge' | 'multi_agent' | 'autonomous' | 'deployment' | 'executive' | 'twin' | 'universal' | 'discovery'
  >('discovery');
  
  // Auth Form State
  const [email, setEmail] = useState('owner@apexplumbing.com');
  const [authLoading, setAuthLoading] = useState(false);

  // Load user session on mount
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        if (data.user.businessId) {
          const bizRes = await fetch('/api/business');
          const bizData = await bizRes.json();
          if (bizData.business) {
            setBusiness(bizData.business);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'demo-token-' + email }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        if (data.user.businessId) {
          const bizRes = await fetch('/api/business');
          const bizData = await bizRes.json();
          if (bizData.business) {
            setBusiness(bizData.business);
          }
        } else {
          setBusiness(null);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setBusiness(null);
      setActiveTab('overview');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleOnboardComplete = (newBusiness: BusinessProfile) => {
    setBusiness(newBusiness);
    if (user) {
      setUser({ ...user, onboarded: true, businessId: newBusiness.id });
    }
  };

  const refreshBusiness = async () => {
    try {
      const res = await fetch('/api/business');
      const data = await res.json();
      if (data.business) {
        setBusiness(data.business);
      }
    } catch (err) {
      console.error('Failed to refresh business:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Launching AI Employee Portal...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // Logged Out view: Login Page
  // ----------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans select-none">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-4 px-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
            <Bot size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Workforce OS</h2>
            <p className="text-xs font-semibold text-sky-600">Deploy an autonomous AI workforce for your business</p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 space-y-6">
          <div className="bg-white py-8 px-4 border border-slate-100 shadow-sm rounded-2xl sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-1">
                <label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Work Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="E.g. manager@apexplumbing.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none transition-colors cursor-pointer"
                >
                  {authLoading ? 'Signing in...' : 'Sign In / Register'}
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-50 pt-4 text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Interactive Demo account pre-configured</span>
              <p className="text-[11px] text-slate-500 mt-1">Submit with "owner@apexplumbing.com" to skip onboarding and explore a fully populated demo dashboard immediately!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // Logged In but Not Onboarded view: Onboarding Wizard
  // ----------------------------------------
  if (!user.onboarded || !business) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
            <Building size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Onboard Your Small Business</h2>
            <p className="text-xs text-slate-500 mt-1">Train your dedicated AI assistant in less than 3 minutes.</p>
          </div>
        </div>

        <Onboarding onOnboardComplete={handleOnboardComplete} />
      </div>
    );
  }

  // ----------------------------------------
  // Logged In and Onboarded: Full Owner Dashboard
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none text-slate-800">
      {/* Top navbar header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none">{business.name}</h1>
            <p className="text-[10px] text-sky-600 font-bold mt-1 uppercase flex items-center gap-1">
              <Sparkles size={11} /> AI Workforce OS Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-slate-900">{user.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">Owner Account</span>
          </div>
          
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
          >
            <LogOut size={13} /> Log out
          </button>
        </div>
      </header>

      {/* Main dashboard grid */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Responsive Dashboard sidebar menu */}
        <nav className="bg-white border-r border-slate-100 lg:w-64 p-4 space-y-1.5 flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
          <div className="hidden lg:block pb-4 border-b border-slate-50 mb-4 px-2">
            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">AI Growth Platform</p>
          </div>

          <button
            onClick={() => setActiveTab('discovery')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'discovery' ? 'bg-slate-900 text-white shadow-sm font-black' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Sparkles size={16} className="text-indigo-400 animate-pulse" /> Autonomous Business OS
          </button>

          <button
            onClick={() => setActiveTab('universal')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'universal' ? 'bg-slate-900 text-white shadow-sm font-black' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Sparkles size={16} className="text-amber-400" /> Universal Engine Studio
          </button>

          <button
            onClick={() => setActiveTab('twin')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'twin' ? 'bg-slate-900 text-white shadow-sm font-black' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <RefreshCw size={16} className="text-cyan-500 animate-spin" style={{ animationDuration: '6s' }} /> Digital Twin
          </button>

          <button
            onClick={() => setActiveTab('executive')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'executive' ? 'bg-slate-900 text-white shadow-sm font-black' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Brain size={16} className="text-indigo-500 animate-pulse" /> Executive Board
          </button>

          <button
            onClick={() => setActiveTab('growth')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'growth' ? 'bg-slate-900 text-white shadow-sm font-black' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Sparkles size={16} className="text-sky-500" /> AI Growth Hub
          </button>

          <button
            onClick={() => setActiveTab('deployment')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'deployment' ? 'bg-slate-900 text-white shadow-sm font-black' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Settings size={16} className="text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} /> OS Deployment Hub
          </button>

          <div className="hidden lg:block pb-2 pt-2 border-b border-slate-50 mb-2 px-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Management</p>
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'overview' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Bot size={16} /> Overview / ROI
          </button>

          <button
            onClick={() => setActiveTab('workforce')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'workforce' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Briefcase size={16} /> AI Workforce
          </button>

          <button
            onClick={() => setActiveTab('multi_agent')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'multi_agent' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Network size={16} className="text-sky-500" /> Multi-Agent Engine
          </button>

          <button
            onClick={() => setActiveTab('autonomous')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'autonomous' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Cpu size={16} className="text-sky-500 animate-pulse" /> Autonomous Engine
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'knowledge' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <BookOpen size={16} /> Business Knowledge
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'leads' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Users size={16} /> Leads CRM
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'customers' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Users size={16} /> Customers Database
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'appointments' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Calendar size={16} /> Calendar & Bookings
          </button>

          <button
            onClick={() => setActiveTab('marketing')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'marketing' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Megaphone size={16} /> Marketing Campaigns
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'reports' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <TrendingUp size={16} /> Performance Reports
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'chats' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <MessageSquare size={16} /> Chat Transcripts
          </button>

          <button
            onClick={() => setActiveTab('automations')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'automations' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Sliders size={16} /> Automation Rules
          </button>

          <button
            onClick={() => setActiveTab('widget')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'widget' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Code size={16} /> Web Chat Widget
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'security' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <ShieldCheck size={16} /> Integrations & Security
          </button>

          <div className="hidden lg:block pb-1 pt-3 border-b border-slate-50 mb-1 px-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enterprise Suite</p>
          </div>

          <button
            onClick={() => setActiveTab('workflows')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'workflows' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <GitFork size={16} /> Visual Builder
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'voice' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Volume2 size={16} /> Unified Comms & Voice
          </button>

          <button
            onClick={() => setActiveTab('portal')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'portal' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Users size={16} /> Customer Portal
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'mobile' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Navigation size={16} /> Mobile Dispatch
          </button>

          <button
            onClick={() => setActiveTab('marketplace')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'marketplace' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <ShoppingBag size={16} /> AI Marketplace
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 flex-shrink-0 lg:flex-shrink ${
              activeTab === 'admin' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <ShieldCheck size={16} /> Super Admin
          </button>
        </nav>

        {/* Primary Tab Workspace */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Digital Office Manager check-in briefing desk */}
            <OfficeManagerHeader activeTab={activeTab} businessName={business.name} />

            {activeTab === 'discovery' && <AutonomousBusinessOSContainer />}
            {activeTab === 'universal' && <UniversalDashboard />}
            {activeTab === 'overview' && <Overview businessId={business.id} ownerName={user?.name || 'Joshua'} setActiveTab={setActiveTab} />}
            {activeTab === 'growth' && <GrowthHub businessId={business.id} />}
            {activeTab === 'workforce' && <AIWorkforce businessId={business.id} />}
            {activeTab === 'multi_agent' && <MultiAgentEngineView businessId={business.id} />}
            {activeTab === 'autonomous' && <AutonomousEngineView businessId={business.id} />}
            {activeTab === 'knowledge' && <KnowledgeEngine businessId={business.id} />}
            {activeTab === 'leads' && <Leads businessId={business.id} />}
            {activeTab === 'customers' && <Customers businessId={business.id} />}
            {activeTab === 'appointments' && <Appointments businessId={business.id} />}
            {activeTab === 'marketing' && <Marketing businessId={business.id} />}
            {activeTab === 'reports' && <Reports businessId={business.id} />}
            {activeTab === 'chats' && <Conversations businessId={business.id} />}
            {activeTab === 'automations' && <Automations businessId={business.id} />}
            {activeTab === 'widget' && <WidgetSettings businessId={business.id} onUpdate={refreshBusiness} />}
            {activeTab === 'security' && <IntegrationsConsole businessId={business.id} />}

            {activeTab === 'workflows' && <VisualWorkflowBuilder businessId={business.id} />}
            {activeTab === 'voice' && <VoiceWorkforce businessId={business.id} />}
            {activeTab === 'portal' && <CustomerPortal businessId={business.id} />}
            {activeTab === 'mobile' && <MobileWorkforce businessId={business.id} />}
            {activeTab === 'marketplace' && <Marketplace businessId={business.id} />}
            {activeTab === 'admin' && <SuperAdmin businessId={business.id} />}
            {activeTab === 'deployment' && <DeploymentEngine businessId={business.id} />}
            {activeTab === 'executive' && <ExecutiveIntelligence businessId={business.id} />}
            {activeTab === 'twin' && <DigitalTwin businessId={business.id} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
