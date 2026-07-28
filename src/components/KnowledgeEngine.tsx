// src/components/KnowledgeEngine.tsx
import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  UploadCloud, 
  Database, 
  Bot, 
  ShieldAlert, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  History, 
  FolderKey, 
  FileText, 
  ArrowRight, 
  Plus, 
  Sparkles, 
  Trash2, 
  Check, 
  RefreshCw, 
  UserCheck, 
  Fingerprint,
  PieChart,
  Lightbulb,
  FileSpreadsheet,
  Globe,
  Settings
} from "lucide-react";

interface KnowledgeEngineProps {
  businessId: string;
}

export const KnowledgeEngine: React.FC<KnowledgeEngineProps> = ({ businessId }) => {
  // Navigation within the tab
  const [subTab, setSubTab] = useState<'vault' | 'memory' | 'simulation' | 'training' | 'analytics'>('vault');

  // Loaders
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // States
  const [documents, setDocuments] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [aiResponses, setAiResponses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Search & Filters in vault
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Ingestion form state
  const [newDoc, setNewDoc] = useState({
    title: "",
    content: "",
    category: "FAQ" as any,
    fileType: "txt" as any,
    roleRequired: "agent" as any
  });
  const [ingestStatus, setIngestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Simulation state
  const [simChannel, setSimChannel] = useState<string>("support");
  const [simPrompt, setSimPrompt] = useState<string>("Do you waive your $89 dispatch diagnostic fee if we agree to a leak repair?");
  const [simContext, setSimContext] = useState<any | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // Active document details modal
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, memRes, trainRes, analRes] = await Promise.all([
        fetch("/api/knowledge/documents"),
        fetch("/api/knowledge/memory"),
        fetch("/api/knowledge/training/responses"),
        fetch("/api/knowledge/analytics")
      ]);

      const docsData = await docsRes.json();
      const memData = await memRes.json();
      const trainData = await trainRes.json();
      const analData = await analRes.json();

      if (docsData.success) setDocuments(docsData.documents);
      if (memData.success) setMemories(memData.memories);
      if (trainData.success) setAiResponses(trainData.responses);
      if (analData.success) setAnalytics(analData.analytics);
    } catch (err) {
      console.error("Error loading knowledge engine data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [businessId]);

  // Handle Document Ingestion
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title.trim() || !newDoc.content.trim()) return;

    setActionLoading(true);
    setIngestStatus(null);
    try {
      const res = await fetch("/api/knowledge/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDoc)
      });
      const data = await res.json();
      setIngestStatus({ success: data.success, message: data.message });
      if (data.success) {
        // Clear form
        setNewDoc({
          title: "",
          content: "",
          category: "FAQ",
          fileType: "txt",
          roleRequired: "agent"
        });
        // Refresh docs & analytics
        await fetchData();
      }
    } catch (err: any) {
      setIngestStatus({ success: false, message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Document Status/Role changes & deletion
  const handleDocAction = async (id: number, updates: { action?: string; roleRequired?: string; status?: string }) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/knowledge/documents/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        if (viewingDoc && viewingDoc.id === id) {
          setViewingDoc(null);
        }
        await fetchData();
      }
    } catch (err) {
      console.error("Doc action failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Memory field changes
  const handleMemoryUpdate = async (key: string, fieldKey: string, newValue: string) => {
    const memory = memories.find(m => m.key === key);
    if (!memory) return;

    const updatedValue = { ...memory.value, [fieldKey]: newValue };
    try {
      const res = await fetch("/api/knowledge/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: updatedValue })
      });
      const data = await res.json();
      if (data.success) {
        setMemories(prev => prev.map(m => m.key === key ? { ...m, value: updatedValue } : m));
      }
    } catch (err) {
      console.error("Memory update failed:", err);
    }
  };

  // Run Pre-Simulation (RAG engine match check)
  const runSimulation = async () => {
    if (!simPrompt.trim()) return;
    setSimLoading(true);
    setSimContext(null);
    try {
      const res = await fetch("/api/knowledge/retrieve-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: simChannel, prompt: simPrompt })
      });
      const data = await res.json();
      if (data.success) {
        setSimContext(data.context);
      }
    } catch (err) {
      console.error("Simulation retrieval failed:", err);
    } finally {
      setSimLoading(false);
    }
  };

  // Submit AI Feedback loop correction
  const handleFeedbackSubmit = async (id: number, feedback: 'approved' | 'corrected' | 'flagged', correction: string) => {
    try {
      const res = await fetch(`/api/knowledge/training/responses/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, correction })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh feedback feed & memory changes
        await fetchData();
      }
    } catch (err) {
      console.error("Feedback submit failed:", err);
    }
  };

  // Filter documents based on search & category
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (doc.tags as string[] || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50/50">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 text-sky-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Assembling Tenant Intelligence Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="knowledge-engine-root">
      {/* Premium Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-sky-50 text-sky-700 rounded-full border border-sky-100 uppercase tracking-wider">
              Tenant Isolated Engine
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FolderKey className="h-6 w-6 text-sky-600" />
            Business Knowledge & Memory Center
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl mt-1">
            Empower your workforce agents with secure business manuals, evolving brand voice preferences, pre-run context checks, and human-in-the-loop training feedback loops.
          </p>
        </div>
        
        {/* Dynamic Accuracy Score Badge */}
        <div className="flex items-center gap-4 bg-sky-50/50 rounded-xl p-3 border border-sky-100">
          <div className="bg-sky-500 text-white rounded-lg p-2.5">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-sky-600/80 font-semibold uppercase tracking-wider">AI Accuracy Rate</div>
            <div className="text-xl font-bold text-sky-950">{analytics?.averageAccuracy ?? 85}%</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap gap-1 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50">
        <button
          onClick={() => setSubTab('vault')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
            subTab === 'vault' 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200/30' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <BookOpen className="h-4 w-4 text-sky-600" />
          Knowledge Vault
        </button>
        
        <button
          onClick={() => setSubTab('memory')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
            subTab === 'memory' 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200/30' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Database className="h-4 w-4 text-indigo-600" />
          Brand Memory
        </button>

        <button
          onClick={() => setSubTab('simulation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
            subTab === 'simulation' 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200/30' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="h-4 w-4 text-violet-600" />
          RAG Simulation Lab
        </button>

        <button
          onClick={() => setSubTab('training')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
            subTab === 'training' 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200/30' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <UserCheck className="h-4 w-4 text-emerald-600" />
          AI Training Center
        </button>

        <button
          onClick={() => setSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
            subTab === 'analytics' 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200/30' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-rose-600" />
          Analytics & Gaps
        </button>
      </div>

      {/* Vault Tab Content */}
      {subTab === 'vault' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: List and search */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents, tags, SOP protocols..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                >
                  <option value="all">All Categories</option>
                  <option value="FAQ">FAQs</option>
                  <option value="SOP">SOP Manuals</option>
                  <option value="Manual">Service Manuals</option>
                  <option value="Handbook">Employee Handbooks</option>
                  <option value="Pricing">Pricing Lists</option>
                  <option value="Policy">Policy Documents</option>
                  <option value="Training">Training Guides</option>
                  <option value="Script">Sales Scripts</option>
                  <option value="Guideline">Marketing Guidelines</option>
                </select>
              </div>

              {/* Ingestion results list */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Cataloged Guidelines ({filteredDocs.length})</h3>
                
                {filteredDocs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">No custom guidelines match filters.</p>
                    <p className="text-xs text-gray-400 mt-1">Upload a PDF/TXT document on the right to expand knowledge.</p>
                  </div>
                ) : (
                  filteredDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      className="group p-4 bg-gray-50 hover:bg-sky-50/30 rounded-xl border border-gray-100 hover:border-sky-100 transition-all duration-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 uppercase tracking-wider">
                            {doc.category}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-full border border-gray-200 uppercase">
                            {doc.fileType}
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                            v{doc.version}
                          </span>
                          {doc.status === 'archived' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                              Archived
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-sky-950 transition-colors truncate">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {doc.content}
                        </p>
                        
                        {/* Auto-extracted Tags */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(doc.tags as string[] || []).map((t, idx) => (
                            <span key={idx} className="text-[10px] font-medium text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Detail triggers */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="px-3 py-1.5 text-xs font-semibold bg-white text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        >
                          Details & History
                        </button>
                        <button
                          onClick={() => handleDocAction(doc.id, { action: "delete" })}
                          className="p-1.5 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-100 rounded-lg transition-colors"
                          title="Delete Guideline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Ingest Document Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <UploadCloud className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold text-gray-900">Ingest Document</h3>
              </div>

              <form onSubmit={handleIngest} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOP-101: Heat Tank Diagnostic wav"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                    <select
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    >
                      <option value="FAQ">FAQ</option>
                      <option value="SOP">SOP Manual</option>
                      <option value="Manual">Service Manual</option>
                      <option value="Handbook">Handbook</option>
                      <option value="Pricing">Pricing</option>
                      <option value="Policy">Policy</option>
                      <option value="Training">Training Guide</option>
                      <option value="Script">Sales Script</option>
                      <option value="Guideline">Marketing Guideline</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">File Format</label>
                    <select
                      value={newDoc.fileType}
                      onChange={(e) => setNewDoc({ ...newDoc, fileType: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    >
                      <option value="pdf">PDF</option>
                      <option value="docx">Word (.docx)</option>
                      <option value="txt">Plain Text (.txt)</option>
                      <option value="csv">Data Sheet (.csv)</option>
                      <option value="web">Website Content</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role Restriction</label>
                  <select
                    value={newDoc.roleRequired}
                    onChange={(e) => setNewDoc({ ...newDoc, roleRequired: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="agent">All Agents & Managers</option>
                    <option value="manager">Manager Level & Above</option>
                    <option value="owner">Owner Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content Guidelines / Text Extract</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Paste parsed document content here..."
                    value={newDoc.content}
                    onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Catalog & Parse Document
                </button>
              </form>

              {ingestStatus && (
                <div className={`p-4 rounded-xl border text-xs ${
                  ingestStatus.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex gap-2">
                    {ingestStatus.success ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <p>{ingestStatus.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viewing Details & Version History Modal Overlay */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 uppercase tracking-wider">
                    {viewingDoc.category}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">Version {viewingDoc.version}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-snug">{viewingDoc.title}</h3>
              </div>
              <button 
                onClick={() => setViewingDoc(null)}
                className="p-1.5 bg-white hover:bg-gray-150 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Document Content View */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Guideline Text</h4>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-sans text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {viewingDoc.content}
                </div>
              </div>

              {/* Status and Permissions control */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Document Status</h4>
                  <div className="flex gap-1.5">
                    {['approved', 'draft', 'archived'].map((statusOption) => (
                      <button
                        key={statusOption}
                        onClick={() => handleDocAction(viewingDoc.id, { status: statusOption })}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all uppercase tracking-wider ${
                          viewingDoc.status === statusOption
                            ? 'bg-sky-600 border-sky-600 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role Requirement</h4>
                  <div className="flex gap-1.5">
                    {['agent', 'manager', 'owner'].map((roleOption) => (
                      <button
                        key={roleOption}
                        onClick={() => handleDocAction(viewingDoc.id, { roleRequired: roleOption })}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all uppercase tracking-wider ${
                          viewingDoc.roleRequired === roleOption
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {roleOption}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Update History / Audit trail */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <History className="h-4 w-4 text-gray-500" />
                  Vault Audit Ledger & Updates
                </h4>
                <div className="space-y-2 border-l-2 border-gray-100 pl-4">
                  {((viewingDoc.updateHistory as any[]) || []).map((audit, idx) => (
                    <div key={idx} className="relative pb-1">
                      <div className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full bg-sky-500 ring-4 ring-white" />
                      <div className="text-xs">
                        <span className="font-bold text-gray-900">{audit.action}</span>
                        <span className="text-gray-400"> by {audit.email}</span>
                        <span className="text-gray-400 block mt-0.5">{new Date(audit.timestamp).toLocaleString()}</span>
                        <p className="text-gray-500 mt-1 font-medium italic">"{audit.details}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Archived Content Versions */}
              {((viewingDoc.versionHistory as any[]) || []).length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prior Version Archives</h4>
                  <div className="space-y-3">
                    {((viewingDoc.versionHistory as any[]) || []).map((v, idx) => (
                      <details key={idx} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                        <summary className="p-3 font-semibold text-xs text-gray-700 hover:text-sky-600 cursor-pointer flex justify-between items-center">
                          <span>v{v.version} Archive (Saved {new Date(v.updatedAt).toLocaleDateString()})</span>
                          <span className="text-[10px] text-gray-400">By {v.updatedBy}</span>
                        </summary>
                        <div className="p-4 bg-white border-t border-gray-150 text-xs font-mono text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {v.content}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Brand Memory Tab Content */}
      {subTab === 'memory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Database className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Brand Memory Configuration</h3>
              </div>
              <p className="text-xs text-gray-500">
                Adjust the direct intelligence anchors that align the agent's sales tactics and client support guidelines. These memories continuously evolve as administrators submit corrections in the Training Center.
              </p>

              {memories.map((m) => (
                <div key={m.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 border border-indigo-100 rounded-full tracking-wider">
                      {m.key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Fingerprint className="h-3.5 w-3.5" /> Static Anchor Key
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    {Object.entries(m.value || {}).map(([field, val]: [string, any]) => (
                      <div key={field} className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                        <textarea
                          rows={2}
                          value={val}
                          onChange={(e) => handleMemoryUpdate(m.key, field, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Bento */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-gray-900">Evolving Memory Engine</h3>
              </div>
              
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  AI Workforce OS leverages a unique <strong>dual-tier knowledge structure</strong>:
                </p>

                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" /> 1. Explicit Guidelines (Knowledge Vault)
                  </h4>
                  <p className="text-xs text-amber-800">
                    Static, high-accuracy documents (PDFs, manuals, pricing catalogs) that specify immutable facts. The RAG loop reads these directly before formulation.
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Database className="h-4 w-4" /> 2. Implicit Evolving Parameters (Brand Memory)
                  </h4>
                  <p className="text-xs text-indigo-800">
                    Dynamic parameters containing sales objection formulas, successful communication styles, and customer expectations. Evolved inline automatically from admin adjustments.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
              <div className="font-bold text-gray-700">Memory isolation check:</div>
              <p className="text-gray-500 font-mono">
                tenant_id: "{businessId}" isolates all queries. Memory crossover is strictly blocked at the database engine query layer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RAG Simulation Lab Tab */}
      {subTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Query Input */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <h3 className="font-bold text-gray-900">RAG Context Engine Tester</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Agent Context / Channel</label>
                  <select
                    value={simChannel}
                    onChange={(e) => setSimChannel(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="support">Customer Support Chat Agent</option>
                    <option value="sales">Inbound Sales outreach & Objections</option>
                    <option value="scheduling">Appointment Booking Assistant</option>
                    <option value="marketing">Social Media Command Generator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Simulated Customer Inquiry</label>
                  <textarea
                    rows={4}
                    value={simPrompt}
                    onChange={(e) => setSimPrompt(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-sans"
                  />
                </div>

                <button
                  onClick={runSimulation}
                  disabled={simLoading}
                  className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {simLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Simulate Retrieval & Reasoning
                </button>
              </div>

              {/* Quick suggestions to click */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Sample Test Cases:</span>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSimPrompt("Do you waive your $89 dispatch diagnostic fee if we agree to a leak repair?"); setSimChannel("support"); }}
                    className="w-full p-2.5 text-left text-xs bg-gray-50 hover:bg-violet-50 hover:border-violet-200 border border-gray-100 rounded-lg text-gray-600 transition-all font-medium"
                  >
                    "Do you waive your $89 dispatch diagnostic fee if we agree to a leak repair?" (Radiator Leaks)
                  </button>
                  <button
                    onClick={() => { setSimPrompt("How much does a 50 gallon power water heater tank system cost to install tomorrow?"); setSimChannel("sales"); }}
                    className="w-full p-2.5 text-left text-xs bg-gray-50 hover:bg-violet-50 hover:border-violet-200 border border-gray-100 rounded-lg text-gray-600 transition-all font-medium"
                  >
                    "How much does a 50 gallon power water heater tank system cost to install tomorrow?" (Install)
                  </button>
                  <button
                    onClick={() => { setSimPrompt("I've got sparks shooting out of my laundry wall plug right now! Can someone come at 4pm?"); setSimChannel("scheduling"); }}
                    className="w-full p-2.5 text-left text-xs bg-gray-50 hover:bg-violet-50 hover:border-violet-200 border border-gray-100 rounded-lg text-gray-600 transition-all font-medium"
                  >
                    "I've got sparks shooting out of my laundry wall plug right now! Can someone come at 4pm?" (Emergency)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Simulation Output */}
          <div className="lg:col-span-7 space-y-4">
            {simLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
                <RefreshCw className="h-8 w-8 text-violet-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-sm">Querying isolated indices & synthesizing prompt context...</p>
              </div>
            )}

            {!simLoading && !simContext && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center text-sm text-gray-400">
                <Sparkles className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="font-semibold">Context Lab Idle</p>
                <p className="text-xs mt-1">Submit a simulated customer inquiry on the left to review match confidence levels, retrieved source documents, and LLM reasoning steps.</p>
              </div>
            )}

            {!simLoading && simContext && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="font-bold text-gray-900 text-sm">Simulation Results Log</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Match Confidence:</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      simContext.hasContext 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {simContext.confidenceScore}% {simContext.hasContext ? '(Custom Context Loaded)' : '(General Base LLM fallback)'}
                    </span>
                  </div>
                </div>

                {/* Retrieved Source & Content */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-400">
                    <span>Retrieved Knowledge Source</span>
                    <span className="text-sky-600">{simContext.retrievedSource}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {simContext.retrievedContent}
                  </div>
                </div>

                {/* Injected Prompts */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-gray-400 block">Synthesized System Prompt Extension</span>
                  <div className="p-3 bg-violet-50/30 border border-violet-100 rounded-xl text-xs text-violet-950 font-medium leading-relaxed whitespace-pre-wrap">
                    {simContext.injectedPrompt}
                  </div>
                </div>

                {/* Model Reasoning */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase text-gray-400 block">LLM Cognitive Reasoning Log</span>
                  <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl text-xs text-indigo-900 italic font-medium leading-relaxed">
                    {simContext.aiReasoning}
                  </div>
                </div>

                {/* Bot Response Output */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold uppercase text-gray-400 block">Formulated Custom Bot Response</span>
                  <div className="p-4 bg-sky-600 text-white rounded-xl text-sm font-sans leading-relaxed shadow-sm">
                    {simContext.botResponse}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Training Center Feedbacks Loop */}
      {subTab === 'training' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">AI Response Audit & Corrections Feed</h3>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                Human-in-the-Loop Active
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Administrators review sample AI agent conversations below. Click <strong>Approve</strong> to ratify the response (adds 100% confidence rating) or <strong>Correct</strong> to inject explicit repair parameters which instantly evolve the brand voice memories.
            </p>

            <div className="space-y-4">
              {aiResponses.map((item) => (
                <div key={item.id} className="p-5 bg-gray-50 border border-gray-150 rounded-xl space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{item.agentName}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 uppercase">
                          {item.channel}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 block">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Audit Status:</span>
                      {item.feedback === 'approved' && (
                        <span className="px-2 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Approved (100% Score)
                        </span>
                      )}
                      {item.feedback === 'corrected' && (
                        <span className="px-2 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg flex items-center gap-1">
                          <History className="h-3.5 w-3.5" /> Corrected (70% Score)
                        </span>
                      )}
                      {item.feedback === 'flagged' && (
                        <span className="px-2 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Critical Error Flagged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Prompt & response display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="p-3 bg-white border border-gray-100 rounded-lg space-y-1">
                      <span className="font-bold text-gray-400 uppercase tracking-wider block">Visitor Prompt</span>
                      <p className="text-gray-700 leading-relaxed font-medium">"{item.prompt}"</p>
                    </div>

                    <div className="p-3 bg-white border border-gray-100 rounded-lg space-y-1">
                      <span className="font-bold text-gray-400 uppercase tracking-wider block">Agent Response Out</span>
                      <p className="text-sky-800 leading-relaxed font-medium">"{item.response}"</p>
                    </div>
                  </div>

                  {/* Corrections view if existing */}
                  {item.correction && (
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs">
                      <span className="font-bold text-indigo-950 block mb-0.5">Admin Injected Correction Guideline:</span>
                      <p className="text-indigo-800 italic font-medium">"{item.correction}"</p>
                    </div>
                  )}

                  {/* Feedback action buttons */}
                  {item.feedback !== 'approved' && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleFeedbackSubmit(item.id, 'approved', '')}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 hover:border-emerald-200 rounded-lg border border-gray-200 transition-all flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> Approve Response
                      </button>

                      <button
                        onClick={() => {
                          const correctText = prompt("Enter specific corrected guideline details to inject into Brand Memory:", item.correction || "");
                          if (correctText) {
                            handleFeedbackSubmit(item.id, 'corrected', correctText);
                          }
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 hover:border-indigo-200 rounded-lg border border-gray-200 transition-all flex items-center gap-1"
                      >
                        <History className="h-3.5 w-3.5 text-indigo-600" /> Correct & Evolve Memory
                      </button>

                      <button
                        onClick={() => handleFeedbackSubmit(item.id, 'flagged', 'Flagged as critically incorrect.')}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-red-50 text-gray-700 hover:text-red-700 hover:border-red-200 rounded-lg border border-gray-200 transition-all flex items-center gap-1"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> Flag Critical Fail
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics & Gaps Tab */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Guidelines Catalog</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-extrabold text-gray-900">{analytics?.totalDocuments ?? 0}</span>
                <span className="text-xs text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-100">Guidelines</span>
              </div>
              <p className="text-[10px] text-gray-400">Total ingested policy documents</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">RAG Match Index</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-extrabold text-emerald-600">{analytics?.averageAccuracy ?? 85}%</span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Avg Score</span>
              </div>
              <p className="text-[10px] text-gray-400">Average matched AI fact correctness</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Searches Tracked</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-extrabold text-gray-900">
                  {analytics?.searchFrequency?.reduce((sum: number, i: any) => sum + i.count, 0) ?? 50}
                </span>
                <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Queries</span>
              </div>
              <p className="text-[10px] text-gray-400">RAG lookup queries resolved</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Corrections Log</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-extrabold text-indigo-600">{analytics?.correctedCount ?? 0}</span>
                <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Manuals</span>
              </div>
              <p className="text-[10px] text-gray-400">Evolving memory overrides cataloged</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Action Recommendations */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Lightbulb className="h-5 w-5 text-amber-500 animate-pulse" />
                <h3 className="font-bold text-gray-900">Recommended Expansion Actions</h3>
              </div>
              <p className="text-xs text-gray-500">
                Autonomous system diagnostic audit results have identified the following opportunities to expand your AI knowledge base and maximize RAG performance.
              </p>

              <div className="space-y-3">
                {(analytics?.recommendations || []).map((rec: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-gray-50 hover:bg-amber-50/20 border border-gray-150 hover:border-amber-200/50 rounded-xl space-y-1.5 transition-all">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-gray-900 text-xs">{rec.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest ${
                        rec.priority === 'critical' 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : rec.priority === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-sky-50 text-sky-700 border border-sky-100'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      {rec.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Gaps Analysis */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-gray-900">Unresolved Search Gaps</h3>
              </div>
              <p className="text-xs text-gray-500">
                Queries submitted by visitors or agents that failed to retrieve matched facts (match scores below 30%). Resolve these by clicking ingest standard guidelines.
              </p>

              <div className="space-y-3">
                {(analytics?.knowledgeGaps || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    All searches successfully resolved with custom knowledge. No gaps detected!
                  </div>
                ) : (
                  (analytics?.knowledgeGaps || []).map((gap: any, idx: number) => (
                    <div key={idx} className="p-3 bg-rose-50/20 border border-rose-100/50 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-rose-950 block">"{gap.query}"</span>
                        <span className="text-gray-400 mt-0.5 block">{gap.count} failed lookup attempts</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                        {gap.matchConfidence}% Match
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Most Used & Unused Documents */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <BarChart3 className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold text-gray-900">Utilization & References</h3>
              </div>
              <p className="text-xs text-gray-500 font-medium">Most referred guidelines extracted during live sessions.</p>

              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Top References</span>
                <div className="space-y-2">
                  {(analytics?.mostUsedDocuments || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-medium truncate max-w-[180px]">{item.title}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-sky-500 h-full" 
                            style={{ width: `${Math.min((item.count / 50) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900">{item.count} references</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Unused Guidelines</span>
                  <div className="space-y-2">
                    {(analytics?.unusedDocuments || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-gray-400 font-medium">
                        <span className="truncate max-w-[180px]">{item.title}</span>
                        <span>0 references</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
