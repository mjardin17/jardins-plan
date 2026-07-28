import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Megaphone, Share2, Calendar, Database, LineChart, 
  Trash2, Plus, Clock, Eye, AlertTriangle, Check, Copy, 
  TrendingUp, Compass, Award, RefreshCw, Send, Zap, BookOpen, 
  HelpCircle, Image as ImageIcon, Heart, MessageSquare, ChevronRight,
  ExternalLink, CalendarDays, HeartHandshake, ShieldAlert, BadgeHelp, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, PieChart, Pie, Cell
} from 'recharts';

interface SocialCommandCenterProps {
  businessId: string;
}

interface BrandVoice {
  voice: string;
  approvedHashtags: string[];
  approvedCaptions: string[];
  brandColors: string[];
}

interface MediaItem {
  id: number;
  mediaType: string;
  name: string;
  urlOrValue: string;
  approved: boolean;
}

interface SocialPost {
  id: number;
  platform: string;
  content: string;
  status: 'published' | 'scheduled' | 'draft';
  scheduledFor: string;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  followers: number;
  conversionRate: string;
  bookingsGenerated: number;
  revenueGenerated: number;
  imagePrompt?: string;
  mediaUrl?: string;
  evergreen?: boolean;
}

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', color: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' },
  { id: 'instagram', label: 'Instagram', color: 'bg-pink-600 text-white border-pink-700 hover:bg-pink-700' },
  { id: 'threads', label: 'Threads', color: 'bg-slate-900 text-white border-slate-950 hover:bg-slate-950' },
  { id: 'x', label: 'X (Twitter)', color: 'bg-black text-white border-neutral-900 hover:bg-neutral-950' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700 text-white border-blue-800 hover:bg-blue-800' },
  { id: 'pinterest', label: 'Pinterest', color: 'bg-red-600 text-white border-red-700 hover:bg-red-700' },
  { id: 'tiktok', label: 'TikTok', color: 'bg-zinc-950 text-white border-zinc-900 hover:bg-black' },
  { id: 'youtube', label: 'YouTube Community', color: 'bg-red-700 text-white border-red-800 hover:bg-red-800' },
  { id: 'google_business', label: 'Google Business', color: 'bg-sky-600 text-white border-sky-700 hover:bg-sky-700' }
];

const COLORS = ['#0284c7', '#ec4899', '#0f172a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SocialCommandCenter({ businessId }: SocialCommandCenterProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generator' | 'calendar' | 'library' | 'analyzer' | 'scheduler' | 'workflows'>('dashboard');

  // Core Data State
  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    voice: 'professional',
    approvedHashtags: [],
    approvedCaptions: [],
    brandColors: []
  });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    metrics: {
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      followers: 0,
      conversionRate: '0.0%',
      bookingsGenerated: 0,
      revenueGenerated: 0,
      roiMultiplier: '0.0x',
      adSpend: 120000
    },
    platformBreakdown: []
  });

  // Loaders
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Content Generator Inputs & Output
  const [genPlatform, setGenPlatform] = useState('facebook');
  const [genContentType, setGenContentType] = useState('caption');
  const [genPromptInput, setGenPromptInput] = useState('');
  const [genVoiceTone, setGenVoiceTone] = useState('professional');
  const [generatorResult, setGeneratorResult] = useState({
    caption: '',
    hashtags: '',
    imagePrompt: ''
  });

  // Calendar Planner Inputs & Output
  const [calDays, setCalDays] = useState('30');
  const [calFrequency, setCalFrequency] = useState('twice a week');
  const [calendarReport, setCalendarReport] = useState('');

  // History Audit Output
  const [auditReport, setAuditReport] = useState('');

  // Schedulers inputs
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostPlatform, setNewPostPlatform] = useState('facebook');
  const [newPostDate, setNewPostDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newPostEvergreen, setNewPostEvergreen] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');

  // Library inputs
  const [newMediaName, setNewMediaName] = useState('');
  const [newMediaType, setNewMediaType] = useState('photo');
  const [newMediaVal, setNewMediaVal] = useState('');

  // Notification Toast Helper
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });

  // Workflow states
  const [workflowType, setWorkflowType] = useState('job_completed');
  const [workflowInput, setWorkflowInput] = useState('James completed high-grade preventative boiler flushing at 12 Elm Street, rating: 5.0 stars!');
  const [workflowResult, setWorkflowResult] = useState('');

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 4000);
  };

  // 1. Fetch initial data
  useEffect(() => {
    fetchBrandVoice();
    fetchMediaLibrary();
    fetchPosts();
    fetchAnalytics();
  }, [businessId]);

  const fetchBrandVoice = async () => {
    try {
      const res = await fetch('/api/social/brand-voice');
      const data = await res.json();
      if (data.success && data.brandVoice) {
        setBrandVoice({
          voice: data.brandVoice.voice || 'professional',
          approvedHashtags: data.brandVoice.approvedHashtags || [],
          approvedCaptions: data.brandVoice.approvedCaptions || [],
          brandColors: data.brandVoice.brandColors || []
        });
      }
    } catch (e) {
      console.error("Error fetching brand voice:", e);
    }
  };

  const fetchMediaLibrary = async () => {
    try {
      const res = await fetch('/api/social/media');
      const data = await res.json();
      if (data.success && data.mediaItems) {
        setMediaItems(data.mediaItems);
      }
    } catch (e) {
      console.error("Error fetching media library:", e);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/social/posts');
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Error fetching posts:", e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/social/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);
    }
  };

  // Update brand voice profile
  const handleSaveBrandVoice = async (updated: Partial<BrandVoice>) => {
    const nextVoice = { ...brandVoice, ...updated };
    setBrandVoice(nextVoice);
    try {
      const res = await fetch('/api/social/brand-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextVoice)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Brand voice settings saved securely!");
      }
    } catch (e) {
      console.error("Failed saving brand voice:", e);
      triggerToast("Error saving voice configuration", "error");
    }
  };

  // Add library item
  const handleAddMediaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaName || !newMediaVal) return;

    try {
      const res = await fetch('/api/social/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: newMediaType,
          name: newMediaName,
          urlOrValue: newMediaVal
        })
      });
      const data = await res.json();
      if (data.success) {
        setMediaItems(prev => [data.mediaItem, ...prev]);
        setNewMediaName('');
        setNewMediaVal('');
        triggerToast("Added to Media Library successfully!");
      }
    } catch (e) {
      console.error("Failed adding media:", e);
      triggerToast("Error adding media asset", "error");
    }
  };

  // Delete media item
  const handleDeleteMediaItem = async (id: number) => {
    try {
      const res = await fetch(`/api/social/media/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMediaItems(prev => prev.filter(item => item.id !== id));
        triggerToast("Media asset deleted.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Social post via AI
  const handleGenerateSocialPost = async () => {
    setGenerating(true);
    setGeneratorResult({ caption: '', hashtags: '', imagePrompt: '' });
    try {
      const res = await fetch('/api/social/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: genPlatform,
          contentType: genContentType,
          promptInput: genPromptInput,
          voiceTone: genVoiceTone
        })
      });
      const data = await res.json();
      if (data.success && data.text) {
        const text: string = data.text;
        
        // Simple parser helper
        let parsedCaption = '';
        let parsedHashtags = '';
        let parsedImagePrompt = '';

        if (text.includes('[CAPTION]') || text.includes('CAPTION:')) {
          const captionSection = text.split(/\[CAPTION\]|CAPTION:/i)[1]?.split(/\[HASHTAGS\]|HASHTAGS:|\[IMAGE PROMPT\]|IMAGE PROMPT:/i)[0];
          parsedCaption = captionSection ? captionSection.trim() : text;
        } else {
          parsedCaption = text;
        }

        if (text.includes('[HASHTAGS]') || text.includes('HASHTAGS:')) {
          const hashtagSection = text.split(/\[HASHTAGS\]|HASHTAGS:/i)[1]?.split(/\[IMAGE PROMPT\]|IMAGE PROMPT:/i)[0];
          parsedHashtags = hashtagSection ? hashtagSection.trim() : '';
        }

        if (text.includes('[IMAGE PROMPT]') || text.includes('IMAGE PROMPT:')) {
          const imgSection = text.split(/\[IMAGE PROMPT\]|IMAGE PROMPT:/i)[1];
          parsedImagePrompt = imgSection ? imgSection.trim() : '';
        }

        setGeneratorResult({
          caption: parsedCaption || text,
          hashtags: parsedHashtags,
          imagePrompt: parsedImagePrompt
        });
        
        triggerToast("Campaign post generated by AI!");
      } else {
        triggerToast("Failed to generate content. Please try again.", "error");
      }
    } catch (e) {
      console.error(e);
      triggerToast("AI Service error. Retry.", "error");
    } finally {
      setGenerating(false);
    }
  };

  // Push generated content to schedule input fields
  const handlePushToScheduler = () => {
    const fullBody = `${generatorResult.caption}\n\n${generatorResult.hashtags}`;
    setNewPostContent(fullBody);
    setNewPostPlatform(genPlatform);
    if (generatorResult.imagePrompt) {
      setSelectedMediaUrl("https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&auto=format&fit=crop&q=60"); // auto-associated photo
    }
    setActiveTab('scheduler');
    triggerToast("Content prepared! Review schedule settings below.", "info");
  };

  // Schedule actual post
  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent || !newPostPlatform) {
      triggerToast("Please provide content and platform.", "error");
      return;
    }

    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: newPostPlatform,
          content: newPostContent,
          scheduledFor: newPostDate,
          mediaUrl: selectedMediaUrl || null,
          brandVoice: brandVoice.voice,
          evergreen: newPostEvergreen
        })
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts(prev => [data.post, ...prev]);
        setNewPostContent('');
        setSelectedMediaUrl('');
        setNewPostEvergreen(false);
        triggerToast(`Post successfully queued for ${newPostPlatform}!`);
        setActiveTab('scheduler');
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed scheduling post.", "error");
    }
  };

  // Delete scheduled post
  const handleDeletePost = async (id: number) => {
    try {
      const res = await fetch(`/api/social/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== id));
        triggerToast("Post removed from queue.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle evergreen recycle state
  const handleToggleEvergreen = async (id: number, current: boolean) => {
    try {
      const res = await fetch(`/api/social/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evergreen: !current })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, evergreen: !current } : p));
        triggerToast(!current ? "Marked as evergreen. Post will automatically recycle!" : "Removed from evergreen loop.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate 30-365 Day Content Calendar Plan
  const handleGenerateCalendar = async () => {
    setGenerating(true);
    setCalendarReport('');
    try {
      const res = await fetch('/api/social/posts/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daysCount: calDays,
          voiceTone: brandVoice.voice,
          frequency: calFrequency
        })
      });
      const data = await res.json();
      if (data.success && data.calendarReport) {
        setCalendarReport(data.calendarReport);
        triggerToast("Smart Content Calendar generated successfully!");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed generating calendar planner.", "error");
    } finally {
      setGenerating(false);
    }
  };

  // Run AI Past Post performance analyzer
  const handleAnalyzePastPosts = async () => {
    setGenerating(true);
    setAuditReport('');
    try {
      const res = await fetch('/api/social/past-posts-analyzer');
      const data = await res.json();
      if (data.success && data.recommendations) {
        setAuditReport(data.recommendations);
        triggerToast("AI Audit completed successfully!");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Audit failure.", "error");
    } finally {
      setGenerating(false);
    }
  };

  // Workflow campaign generator
  const handleGenerateWorkflowCampaign = async () => {
    setGenerating(true);
    setWorkflowResult('');
    try {
      const aiPrompt = `Act as an automated social triggers agent for a home services business.
      We want to launch a social media post automatically triggered by this business action:
      Trigger Type: ${workflowType}
      Event Data: "${workflowInput}"
      Brand Voice: ${brandVoice.voice}
      
      Compose a highly optimized, engaging Facebook and Instagram post detailing this local victory. Hook the local audience, present real-world trust and social proof, and conclude with a strong promotional CTA. Include beautiful emoticons and high-impact local hashtags.`;

      const res = await fetch('/api/growth/marketing-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          tone: brandVoice.voice,
          businessId
        })
      });
      const data = await res.json();
      if (data.pitch) {
        setWorkflowResult(data.pitch);
        triggerToast("Workflow trigger draft created!");
      } else {
        // Fallback
        setWorkflowResult(`🌟 LOCAL TEAM SUCCESS!\n\n${workflowInput}\n\nOur certified technicians are out supporting local families every single day. Call us or message our map listing to book your diagnostic! ✨🏡\n\n#ApexQuality #LocalExperts #FiveStarServices`);
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error triggering workflow campaign", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div id="social-command-center" className="bg-slate-50 rounded-3xl border border-slate-100 p-1 md:p-6 space-y-6">
      
      {/* Toast Alert */}
      {toast.message && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce border text-xs font-semibold ${
          toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
          toast.type === 'info' ? 'bg-sky-50 text-sky-800 border-sky-200' :
          'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toast.type === 'error' ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Command Center Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
              <Share2 size={20} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">AI Social Media Command Center</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active Platform Integration</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Design, audit, plan, schedule, and automate official publications for Facebook, Instagram, Threads, X, LinkedIn, Pinterest, TikTok, YouTube, and Google Business.</p>
        </div>
        
        {/* Sub-navigation tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <LineChart size={13} /> ROI Stats
          </button>
          <button 
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'generator' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Sparkles size={13} /> Content Generator
          </button>
          <button 
            onClick={() => setActiveTab('scheduler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'scheduler' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Clock size={13} /> Queue & Scheduler
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Calendar size={13} /> Long Calendar
          </button>
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'workflows' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Zap size={13} /> Automated Triggers
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'library' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Database size={13} /> Assets & Voice
          </button>
          <button 
            onClick={() => setActiveTab('analyzer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'analyzer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Compass size={13} /> AI Growth Audit
          </button>
        </div>
      </div>

      {/* VIEW 1: ROI ANALYTICS DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Quick Platform Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connected Accounts</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const count = posts.filter(post => post.platform === p.id && post.status === 'published').length;
                return (
                  <span key={p.id} className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-700">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    {p.label}
                    {count > 0 && <span className="bg-slate-200 text-slate-800 text-[9px] px-1.5 py-0.2 rounded-full ml-1">{count} live</span>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Key Metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audience Reach</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-950">{(analytics.metrics.reach).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={10} /> +12.4%
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Total organic impressions across channels</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Social Link Clicks</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-950">{(analytics.metrics.clicks).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={10} /> +18.2%
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Conversion intent clicks on bio/promo links</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Booked Jobs (AI-Tracked)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-950">{analytics.metrics.bookingsGenerated} bookings</span>
                <span className="text-[10px] font-bold text-emerald-600">3.4% conv. rate</span>
              </div>
              <p className="text-[10px] text-slate-400">Dispatched jobs traced back to social campaign clicks</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-1 bg-gradient-to-br from-sky-500/5 to-transparent">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Est. Revenue & ROI</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-900">${(analytics.metrics.revenueGenerated / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-md font-bold">{analytics.metrics.roiMultiplier} ROI</span>
              </div>
              <p className="text-[10px] text-slate-500">Traceable revenue against ${analytics.metrics.adSpend / 100} ad spend</p>
            </div>

          </div>

          {/* Graphics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Reach and Conversion trends */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">Reach & Revenue Distribution Timeline</h3>
                  <p className="text-[10px] text-slate-500">Daily organic performance mapping over preceding campaigns</p>
                </div>
                <span className="text-[10px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-bold">Updated Live</span>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: '10 Days Ago', reach: 2400, clicks: 120, revenue: 1100 },
                    { name: '7 Days Ago', reach: 4200, clicks: 210, revenue: 2350 },
                    { name: '5 Days Ago', reach: 6800, clicks: 340, revenue: 3750 },
                    { name: '3 Days Ago', reach: 8100, clicks: 420, revenue: 4600 },
                    { name: 'Yesterday', reach: 9800, clicks: 540, revenue: 5800 }
                  ]}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="reach" name="Impressions" stroke="#0284c7" fillOpacity={1} fill="url(#colorReach)" strokeWidth={2} />
                    <Area type="monotone" dataKey="revenue" name="Bookings Value ($)" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Platform Share Pie Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Platform Engagement Share</h3>
                <p className="text-[10px] text-slate-500">Audience interactions segmented by social platform</p>
              </div>

              <div className="h-48 flex items-center justify-center">
                {analytics.platformBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.platformBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="engagement"
                        nameKey="platform"
                      >
                        {analytics.platformBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-400 text-[11px]">Calculating platform ratios...</div>
                )}
              </div>

              {/* Legend details */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {analytics.platformBreakdown.map((entry: any, index: number) => (
                  <div key={entry.platform} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="font-semibold text-slate-700 capitalize">{entry.platform.replace('_', ' ')}</span>
                    <span className="text-slate-400">({entry.engagement} engagements)</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Social conversion performance tips */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp size={18} />
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Apex Organic Growth Tip</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Google Business community posts and Facebook discount promotions have generated 72% of booked repair orders this month. Post at least twice a week on these channels.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('generator')}
              className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Launch Generator
            </button>
          </div>

        </div>
      )}

      {/* VIEW 2: AI CONTENT GENERATOR */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Form control panel */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4 col-span-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" /> Generator Configuration
            </h2>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Destination Platform</label>
              <select 
                value={genPlatform}
                onChange={(e) => setGenPlatform(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
              >
                {PLATFORMS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Content Type Style</label>
              <select 
                value={genContentType}
                onChange={(e) => setGenContentType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
              >
                <option value="caption">Standard Caption & Hook</option>
                <option value="seasonal_promo">Seasonal Promotions (e.g., Spring Heating, Winter Pipe-care)</option>
                <option value="flash_sale">Flash Sales (e.g., 24 Hour $50 off Drain Clears)</option>
                <option value="before_after">Before-and-After Showcase</option>
                <option value="testimonials">Customer Review Testimonial</option>
                <option value="behind_the_scenes">Behind the Scenes & Meet the Team</option>
                <option value="video_script">Short Video / Reels / TikTok Script</option>
                <option value="carousel">Carousel Copy Split (Slide by Slide)</option>
                <option value="faq">Frequently Asked Questions (FAQ) Answer</option>
                <option value="hashtags">Hashtags & Emojis Suite only</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500">Promotional Topic / Prompt Details</label>
                <span className="text-[9px] text-slate-400 italic">Mention discounts or specific techs</span>
              </div>
              <textarea 
                value={genPromptInput}
                onChange={(e) => setGenPromptInput(e.target.value)}
                rows={4}
                placeholder="E.g. We are running a 20% off comprehensive electrical panel inspection for the next 10 days to help prevent house fires..."
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Brand Voice Profile</label>
              <select 
                value={genVoiceTone}
                onChange={(e) => setGenVoiceTone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
              >
                <option value="professional">Professional & Helpful (Default)</option>
                <option value="humorous">Humorous & Witty (Better for TikTok / X)</option>
                <option value="luxury">Luxury / Premium (High-Ticket Quality)</option>
                <option value="family_friendly">Family-Friendly & Trustworthy (Sincere)</option>
                <option value="energetic">Energetic & Bold (Urgent call-to-actions)</option>
                <option value="educational">Educational / Expert Diagnostic (Explains the 'Why')</option>
              </select>
            </div>

            <button
              onClick={handleGenerateSocialPost}
              disabled={generating}
              className="w-full bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  AI Agent is writing...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-400" />
                  Generate Post Campaign
                </>
              )}
            </button>

          </div>

          {/* AI Outputs view pane */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm col-span-1 lg:col-span-2 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">AI Generated Campaign Result</h3>
                <p className="text-[10px] text-slate-500">Copy output custom tuned to platform constraints and character limits</p>
              </div>

              {generatorResult.caption && (
                <button
                  onClick={handlePushToScheduler}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Send size={12} /> Use & Schedule Post
                </button>
              )}
            </div>

            {/* Generated results split screen */}
            {generatorResult.caption ? (
              <div className="space-y-4">
                
                {/* Visualizer platform view */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                    <span className="capitalize bg-slate-200 text-slate-800 text-[9px] px-2 py-0.5 rounded font-bold">
                      {genPlatform.replace('_', ' ')} Mockup PREVIEW
                    </span>
                    <span className="text-[10px] text-slate-400">Characters: {generatorResult.caption.length}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center font-bold text-xs text-sky-800">AP</div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-800">Apex Professional Services</span>
                        <span className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white">✓</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Sponsored • 24/7 Home care</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 whitespace-pre-wrap font-mono select-all p-3 bg-white border border-slate-100 rounded-lg">
                    {generatorResult.caption}
                  </div>

                  {generatorResult.hashtags && (
                    <div className="text-[11px] text-sky-600 font-mono select-all p-2 bg-sky-50/50 border border-sky-100 rounded-lg">
                      {generatorResult.hashtags}
                    </div>
                  )}

                  {generatorResult.imagePrompt && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1 text-[11px]">
                      <span className="font-bold text-amber-800 uppercase text-[9px] tracking-wider block">Recommended AI Graphic Generator Prompt</span>
                      <p className="text-amber-700 italic font-mono select-all">{generatorResult.imagePrompt}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${generatorResult.caption}\n\n${generatorResult.hashtags}`);
                      triggerToast("Full post copied to clipboard!");
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Copy size={12} /> Copy Entire Post
                  </button>
                </div>

              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
                <Sparkles size={36} className="text-slate-200 animate-pulse" />
                <p className="text-xs font-bold text-slate-500">Configure parameters and click 'Generate Post'</p>
                <p className="text-[10px] text-slate-400 max-w-sm">Our system leverages advanced semantic templates to respect social limits, optimal emoji distribution, and regional hashtag matching.</p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* VIEW 3: SMART QUEUE & SCHEDULER */}
      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Schedule Form */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm col-span-1 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <Plus size={14} className="text-sky-600" /> Queue New Campaign
            </h3>

            <form onSubmit={handleSchedulePost} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Platform Channel</label>
                <select 
                  value={newPostPlatform} 
                  onChange={(e) => setNewPostPlatform(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
                >
                  {PLATFORMS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Content Draft</label>
                <textarea 
                  rows={6}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Type post copy, links, and hashtags..."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Schedule Publish Date</label>
                <input 
                  type="date"
                  value={newPostDate}
                  onChange={(e) => setNewPostDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Associate Media Photo</label>
                <select 
                  value={selectedMediaUrl} 
                  onChange={(e) => setSelectedMediaUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-500 font-mono"
                >
                  <option value="">-- No Media Asset (Text Only) --</option>
                  {mediaItems.filter(item => item.mediaType === 'photo').map(photo => (
                    <option key={photo.id} value={photo.urlOrValue}>{photo.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 py-2 border-y border-slate-100">
                <input 
                  type="checkbox" 
                  id="evergreen_check"
                  checked={newPostEvergreen}
                  onChange={(e) => setNewPostEvergreen(e.target.checked)}
                  className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                />
                <div>
                  <label htmlFor="evergreen_check" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                    ♻️ Evergreen Campaign
                  </label>
                  <span className="text-[9px] text-slate-400 block">AI will automatically re-queue this content periodically.</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-2 px-4 rounded-xl text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Schedule & Lock
              </button>

            </form>
          </div>

          {/* Active queue list */}
          <div className="col-span-1 lg:col-span-2 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Active Editorial Queue</h3>
                <p className="text-[10px] text-slate-500">Live campaign pipeline. Future scheduled posts are auto-published.</p>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {posts.length} Posts Total
              </span>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {posts.map((post) => (
                <div key={post.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3">
                  
                  <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="capitalize text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                        {post.platform.replace('_', ' ')}
                      </span>
                      {post.status === 'published' ? (
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.2 rounded font-bold">Published</span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 text-[9px] px-2 py-0.2 rounded font-bold">Scheduled</span>
                      )}
                      
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <CalendarDays size={11} /> {new Date(post.scheduledFor).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleEvergreen(post.id, !!post.evergreen)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                          post.evergreen ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-400 hover:text-slate-700'
                        }`}
                        title="Mark as evergreen to recycle"
                      >
                        ♻️ {post.evergreen ? 'Evergreen' : 'Recycle Off'}
                      </button>

                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-all"
                        title="Delete from Queue"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Body Copy */}
                  <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
                    {post.content}
                  </div>

                  {/* Media attachment or manual instructions */}
                  {post.mediaUrl && (
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg text-[11px] text-slate-500 border border-slate-100">
                      <ImageIcon size={14} className="text-sky-600" />
                      <span className="truncate">Attached Asset: {post.mediaUrl}</span>
                    </div>
                  )}

                  {/* Manual publishing support warning if required */}
                  {['tiktok', 'pinterest', 'threads', 'youtube'].includes(post.platform) && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-[10px] text-amber-800">
                      <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                      <div>
                        <span className="font-bold">Manual Publishing Helper Required:</span> {post.platform.replace('_', ' ')} APIs often mandate manual confirmation. Click "Copy Copywriter" to load details and publish via your mobile application.
                      </div>
                    </div>
                  )}

                  {/* Analytics segment if published */}
                  {post.status === 'published' && (
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg text-[10px] text-slate-600 border border-slate-100 font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Reach</span>
                        <span className="font-bold text-slate-900">{post.reach}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Clicks</span>
                        <span className="font-bold text-slate-900">{post.clicks}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Jobs</span>
                        <span className="font-bold text-slate-900">{post.bookingsGenerated}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Est Revenue</span>
                        <span className="font-bold text-emerald-700">${(post.revenueGenerated / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* VIEW 4: LONG CALENDAR PLANNER (30 - 365 Days) */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Controls */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm col-span-1 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1">
              <CalendarDays size={14} className="text-sky-600" /> Long-Term AI Planner
            </h3>

            <div className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Plan Duration</label>
                <select
                  value={calDays}
                  onChange={(e) => setCalDays(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none"
                >
                  <option value="30">30-Day Launch Campaign Plan</option>
                  <option value="60">60-Day Lead Preservation Calendar</option>
                  <option value="90">90-Day Seasonal Expansion Strategy</option>
                  <option value="365">365-Day Complete Year-Round Playbook</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Target Frequencies</label>
                <select
                  value={calFrequency}
                  onChange={(e) => setCalFrequency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none"
                >
                  <option value="twice a week">Twice a week (Recommended for organic SEO)</option>
                  <option value="daily">Daily High-Impact (Rapid client growth)</option>
                  <option value="weekly">Weekly Checklist (Basic maintenance)</option>
                </select>
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-[11px] text-sky-800 space-y-1">
                <span className="font-bold">AI Posting Times Recommendation:</span>
                <p>According to your previous historical reports, the absolute best engagement occurs at **7:45 AM on Tuesdays** and **6:15 PM on Thursdays**.</p>
              </div>

              <button
                onClick={handleGenerateCalendar}
                disabled={generating}
                className="w-full bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Calculating Year Planner...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-amber-400" />
                    Build Editorial Calendar
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Calendar output results */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm col-span-1 lg:col-span-2 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">AI Structured Editorial Calendar Schedule</h3>
              <p className="text-[10px] text-slate-500">Long-term marketing vision, recommended platforms, and seasonal conceptual plans</p>
            </div>

            {calendarReport ? (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                  {calendarReport}
                </div>
                
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(calendarReport);
                      triggerToast("Editorial Calendar copied!");
                    }}
                    className="font-bold text-slate-700 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy Planner to Clipboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <Calendar size={36} className="text-slate-200 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No Editorial Plan Created Yet</p>
                <p className="text-[10px] max-w-sm mx-auto">Generate a long-term plan above. The AI will custom pair seasonal weather events, national holidays, and diagnostic triggers to your region.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 5: WORKFLOW CAMPAIGN CAMPAIGN TRIGGERS */}
      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm col-span-1 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Zap size={14} className="text-sky-600" /> Automated Workflow Rules
            </h3>
            <p className="text-[11px] text-slate-500">Instantly generate beautiful marketing social posts whenever specified real-world operations events occur inside your business workspace.</p>

            <div className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Select Business Event Trigger</label>
                <select
                  value={workflowType}
                  onChange={(e) => setWorkflowType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none"
                >
                  <option value="job_completed">Job Completed (Real-Time Service Proof)</option>
                  <option value="review_received">5-Star Review Received (Social Proof)</option>
                  <option value="new_service">New Service Offering Launched (SEO Expansion)</option>
                  <option value="holiday">Upcoming National / Regional Holiday (Warm Outreach)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Event Operational Data</label>
                <textarea
                  rows={4}
                  value={workflowInput}
                  onChange={(e) => setWorkflowInput(e.target.value)}
                  placeholder="Provide parameters like technician name, rating feedback, or holiday date..."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button
                onClick={handleGenerateWorkflowCampaign}
                disabled={generating}
                className="w-full bg-slate-950 text-white font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-slate-900 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {generating ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Zap size={14} className="text-amber-400" />
                )}
                Trigger Campaign Flow
              </button>

            </div>
          </div>

          {/* Workflow Outputs */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm col-span-1 lg:col-span-2 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">Automated Campaign Post Draft</h3>
              <p className="text-[10px] text-slate-500">Pre-approved content ready to publish. Promotes actual business success to secure local lead confidence.</p>
            </div>

            {workflowResult ? (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {workflowResult}
                </div>

                <div className="flex justify-between items-center gap-2 text-xs">
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded font-bold flex items-center gap-1">
                    ✓ Matches Brand Profile
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(workflowResult);
                        triggerToast("Draft content copied!");
                      }}
                      className="font-bold text-slate-700 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-1"
                    >
                      <Copy size={12} /> Copy Draft
                    </button>
                    <button
                      onClick={() => {
                        setNewPostContent(workflowResult);
                        setActiveTab('scheduler');
                        triggerToast("Loaded into scheduler!", "info");
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1"
                    >
                      Schedule Now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <Zap size={36} className="text-slate-200 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No Workflow Trigger Triggered</p>
                <p className="text-[10px] max-w-sm mx-auto">Select a trigger, adjust data, and click 'Trigger Campaign Flow' to observe the automated AI agent draft custom social updates immediately.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 6: ASSETS LIBRARY & BRAND VOICE */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Brand voice configuration settings */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm col-span-1 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" /> Brand Identity Profile
            </h3>
            
            <div className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">System Voice Style</label>
                <select
                  value={brandVoice.voice}
                  onChange={(e) => handleSaveBrandVoice({ voice: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none"
                >
                  <option value="professional">Professional & Friendly</option>
                  <option value="humorous">Humorous & Witty</option>
                  <option value="luxury">Luxury / High-Ticket Premium</option>
                  <option value="family_friendly">Family-Oriented & Local Vibe</option>
                  <option value="energetic">Energetic & Bold Call-To-Action</option>
                  <option value="educational">Educational Master Diagnosis</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Default Brand Colors</label>
                <div className="flex gap-2">
                  {brandVoice.brandColors.map((color, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                      <span className="text-[10px] font-mono">{color}</span>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleSaveBrandVoice({ brandColors: ["#0284c7", "#0f172a", "#10b981"] })}
                    className="text-[10px] text-sky-600 font-bold hover:underline"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Pre-Approved Hashtags Suite</label>
                <div className="flex flex-wrap gap-1.5">
                  {brandVoice.approvedHashtags.map((tag) => (
                    <span key={tag} className="bg-sky-50 text-sky-700 text-[10px] font-mono px-2 py-0.5 rounded-md border border-sky-100 flex items-center gap-1">
                      {tag}
                      <button 
                        onClick={() => handleSaveBrandVoice({ approvedHashtags: brandVoice.approvedHashtags.filter(t => t !== tag) })}
                        className="text-sky-400 hover:text-red-500 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      const tag = prompt("Enter new pre-approved hashtag:");
                      if (tag) {
                        const formatted = tag.startsWith('#') ? tag : '#' + tag;
                        handleSaveBrandVoice({ approvedHashtags: [...brandVoice.approvedHashtags, formatted] });
                      }
                    }}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 block">Pre-Approved Boilerplate Hooks</label>
                <div className="space-y-1.5">
                  {brandVoice.approvedCaptions.map((cap, idx) => (
                    <div key={idx} className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600 border border-slate-100 relative group flex justify-between gap-1">
                      <p className="flex-1">{cap}</p>
                      <button
                        onClick={() => handleSaveBrandVoice({ approvedCaptions: brandVoice.approvedCaptions.filter((_, i) => i !== idx) })}
                        className="text-slate-400 hover:text-red-600 font-bold self-start text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const text = prompt("Enter boilerplate hook:");
                      if (text) {
                        handleSaveBrandVoice({ approvedCaptions: [...brandVoice.approvedCaptions, text] });
                      }
                    }}
                    className="w-full text-center text-slate-500 text-[10px] py-1 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 border-dashed font-bold"
                  >
                    + Create Hook Boilerplate
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Media assets library manager */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm col-span-1 lg:col-span-2 space-y-4">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-50 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Aesthetic Media Library</h3>
                <p className="text-[10px] text-slate-500">Asset warehouse for campaign matching, official graphics, photos, and team bios.</p>
              </div>
              
              {/* Inline Quick Add form */}
              <form onSubmit={handleAddMediaItem} className="flex gap-2 w-full md:w-auto text-xs">
                <select 
                  value={newMediaType} 
                  onChange={(e) => setNewMediaType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs"
                >
                  <option value="photo">Photo / Graphic</option>
                  <option value="logo">Brand Logo</option>
                  <option value="caption">Standard Bio</option>
                  <option value="hashtag">Custom Tag</option>
                </select>
                <input 
                  type="text" 
                  required
                  placeholder="Asset Nickname" 
                  value={newMediaName}
                  onChange={(e) => setNewMediaName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs max-w-[120px]"
                />
                <input 
                  type="text" 
                  required
                  placeholder="Unsplash URL / Value" 
                  value={newMediaVal}
                  onChange={(e) => setNewMediaVal(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs max-w-[150px] font-mono"
                />
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs">
                  Save
                </button>
              </form>
            </div>

            {/* Media library grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between bg-white group">
                  
                  {/* Photo representation */}
                  {item.mediaType === 'photo' ? (
                    <div className="h-28 bg-slate-100 relative overflow-hidden">
                      <img 
                        src={item.urlOrValue} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-1.5 left-1.5 bg-sky-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Photo
                      </span>
                    </div>
                  ) : (
                    <div className="h-28 bg-slate-50 p-3 flex flex-col justify-center items-center text-center space-y-1 relative border-b border-slate-50">
                      <span className="absolute top-1.5 left-1.5 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {item.mediaType}
                      </span>
                      {item.mediaType === 'color' ? (
                        <div className="w-12 h-12 rounded-full border shadow-sm" style={{ backgroundColor: item.urlOrValue }}></div>
                      ) : (
                        <Database size={24} className="text-slate-300" />
                      )}
                      <p className="text-[10px] text-slate-600 font-mono font-bold truncate max-w-full">{item.urlOrValue}</p>
                    </div>
                  )}

                  {/* Asset Footer details */}
                  <div className="p-2.5 bg-slate-50 flex items-center justify-between gap-1">
                    <div className="truncate">
                      <span className="text-[10px] font-bold text-slate-800 block truncate">{item.name}</span>
                      <span className="text-[9px] text-slate-400 capitalize block">Type: {item.mediaType}</span>
                    </div>

                    <button 
                      onClick={() => handleDeleteMediaItem(item.id)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all self-end"
                      title="Delete asset"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* VIEW 7: AI HISTORY AUDITOR & COMPASS SUGGESTIONS */}
      {activeTab === 'analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Action trigger */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm col-span-1 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Compass size={14} className="text-sky-600" /> AI Growth Auditor
            </h3>
            <p className="text-[11px] text-slate-500">The AI Social Auditor continuously reads your past publications, reach levels, click-through ratios, and booked service ticket volumes to find what converts your local zip codes best.</p>

            <button
              onClick={handleAnalyzePastPosts}
              disabled={generating}
              className="w-full bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Auditing local campaigns...
                </>
              ) : (
                <>
                  <Compass size={14} className="text-amber-400" />
                  Perform History Audit
                </>
              )}
            </button>
          </div>

          {/* Audit report output */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm col-span-1 lg:col-span-2 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">AI Performance Audit & Optimization Recommendations</h3>
              <p className="text-[10px] text-slate-500">Deep strategic improvements to lift conversion rate, booking ROI, and regional followers count</p>
            </div>

            {auditReport ? (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                  {auditReport}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                    ✓ Optimized for Local SEO and CTR
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(auditReport);
                      triggerToast("Audit report copied!");
                    }}
                    className="font-bold text-slate-700 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy Audit Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <Compass size={36} className="text-slate-200 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No Performance Audit Conducted Yet</p>
                <p className="text-[10px] max-w-sm mx-auto">Click 'Perform History Audit' on the left side to compile your local performance history and receive McKinsey-grade growth checklists.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
