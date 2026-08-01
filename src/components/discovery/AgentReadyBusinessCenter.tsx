// src/components/discovery/AgentReadyBusinessCenter.tsx
import React, { useState, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  Globe,
  Code,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  RotateCcw,
  Sparkles,
  FileText,
  Search,
  ArrowRight,
  ShieldAlert,
  Database
} from 'lucide-react';
import {
  AIAccessibilityAssessmentResult,
  AIAccessibilityFinding,
  CanonicalBusinessProfile,
  AIAccessibilityPreviewDiff
} from '../../types/ai-accessibility.ts';

export const AgentReadyBusinessCenter: React.FC = () => {
  const [tenantId] = useState('joshua_jardin');
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<AIAccessibilityAssessmentResult | null>(null);
  const [activeTab, setActiveTab] = useState<'scores' | 'findings' | 'profile' | 'preview_diff'>('scores');
  const [previewDiff, setPreviewDiff] = useState<AIAccessibilityPreviewDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAssessment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discovery/ai-accessibility/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, websiteUrl: 'https://joshua-jardin-landscaping.com' })
      });
      const json = await res.json();
      if (json.success) {
        setAssessment(json.data);
      }
    } catch (err) {
      console.error('Error loading AI accessibility assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviewDiff = async () => {
    setDiffLoading(true);
    try {
      const res = await fetch(`/api/discovery/ai-accessibility/preview-diff/imp_schema_01?tenantId=${tenantId}`);
      const json = await res.json();
      if (json.success) {
        setPreviewDiff(json.data);
      }
    } catch (err) {
      console.error('Error loading preview diff:', err);
    } finally {
      setDiffLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [tenantId]);

  useEffect(() => {
    if (activeTab === 'preview_diff' && !previewDiff) {
      fetchPreviewDiff();
    }
  }, [activeTab]);

  const toggleFieldVisibility = async (fieldName: keyof CanonicalBusinessProfile) => {
    if (!assessment) return;
    const current = assessment.profile[fieldName] as any;
    if (!current || typeof current !== 'object') return;

    const newVisibility = current.visibility === 'public' ? 'private' : 'public';
    const updatedProfile = {
      ...assessment.profile,
      [fieldName]: {
        ...current,
        visibility: newVisibility
      }
    };

    try {
      const res = await fetch(`/api/discovery/ai-accessibility/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, updates: updatedProfile })
      });
      const json = await res.json();
      if (json.success) {
        setAssessment({
          ...assessment,
          profile: json.data
        });
        setActionMessage(`Updated field '${String(fieldName)}' visibility to ${newVisibility.toUpperCase()}`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update field visibility:', err);
    }
  };

  if (loading && !assessment) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-600 font-medium">Evaluating AI Accessibility & Readiness across 28 business dimensions...</p>
      </div>
    );
  }

  const scores = assessment?.scores;
  const findings = assessment?.findings || [];
  const profile = assessment?.profile;

  const filteredFindings = filterStatus === 'all'
    ? findings
    : findings.filter(f => f.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Platform Architecture Disclaimer Header */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold uppercase tracking-wider block mb-1">Architectural Disclaimer & Safety Principle</span>
          Technical AI accessibility optimizes structured machine readability, JSON-LD schemas, and agent endpoints. It does <strong>not</strong> promise or guarantee inclusion, ranking, recommendation, or traffic from any external AI platform. This engine strictly distinguishes technical readiness from external-platform adoption.
        </div>
      </div>

      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Header & Sub-navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">AI-Accessible Business & Agent Center</h2>
            </div>
            <p className="text-sm text-slate-600">
              Transform public business info, catalogs, scheduling, and policies into machine-readable, agent-ready interfaces.
            </p>
          </div>

          <button
            onClick={fetchAssessment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Re-Assess Website
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('scores')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'scores' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Readiness Scores
          </button>
          <button
            onClick={() => setActiveTab('findings')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'findings' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" />
            28-Dimension Audit ({findings.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            Canonical Business Profile
          </button>
          <button
            onClick={() => setActiveTab('preview_diff')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'preview_diff' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Code className="w-4 h-4" />
            Proposed Markup Diff & Preview
          </button>
        </div>

        {/* TAB 1: READINESS SCORES */}
        {activeTab === 'scores' && scores && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-5 md:col-span-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-indigo-300 uppercase tracking-widest font-semibold block mb-2">
                    Overall Agent-Ready
                  </span>
                  <div className="text-5xl font-extrabold text-indigo-400 mb-2">
                    {scores.overallAgentReady}<span className="text-xl text-slate-400">/100</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Calculated using rule-based scoring without opaque AI numbers.
                </p>
              </div>

              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500 font-semibold mb-1">AI Discoverability</div>
                  <div className="text-2xl font-bold text-slate-900">{scores.aiDiscoverability}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${scores.aiDiscoverability}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500 font-semibold mb-1">AI Answerability</div>
                  <div className="text-2xl font-bold text-slate-900">{scores.aiAnswerability}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${scores.aiAnswerability}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500 font-semibold mb-1">AI Recommendation</div>
                  <div className="text-2xl font-bold text-slate-900">{scores.aiRecommendation}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${scores.aiRecommendation}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500 font-semibold mb-1">AI Transactions</div>
                  <div className="text-2xl font-bold text-slate-900">{scores.aiTransaction}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${scores.aiTransaction}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500 font-semibold mb-1">Data Trustworthiness</div>
                  <div className="text-2xl font-bold text-slate-900">{scores.dataTrustworthiness}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${scores.dataTrustworthiness}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500 font-semibold mb-1">Security Readiness</div>
                  <div className="text-2xl font-bold text-slate-900">{scores.securityReadiness}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${scores.securityReadiness}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rule Explanations Log */}
            <div className="bg-slate-900 text-slate-200 rounded-xl p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                <Info className="w-4 h-4" />
                Score Mathematical Derivation & Rule Trace
              </div>
              <ul className="space-y-1.5 border-t border-slate-800 pt-3">
                {scores.explanationRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: FINDINGS MATRIX */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span>Filter Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-900 font-medium"
                >
                  <option value="all">All Findings</option>
                  <option value="verified_present">Verified Present</option>
                  <option value="partially_present">Partially Present</option>
                  <option value="verified_missing">Verified Missing</option>
                </select>
              </div>
              <span className="text-xs text-slate-500">Showing {filteredFindings.length} of {findings.length} findings</span>
            </div>

            <div className="space-y-3">
              {filteredFindings.map((finding) => (
                <div key={finding.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {finding.status === 'verified_present' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                      {finding.status === 'partially_present' && <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                      {finding.status === 'verified_missing' && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
                      <span className="font-bold text-slate-900 text-sm">{finding.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        finding.status === 'verified_present' ? 'bg-emerald-100 text-emerald-800' :
                        finding.status === 'partially_present' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {finding.status.replace('_', ' ')}
                      </span>
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                        {(finding.confidence * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-mono bg-white p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-900">Evidence ({finding.evidenceSource}):</span> {finding.evidence}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-indigo-700">Recommended Remediation:</span> {finding.recommendedRemediation}
                    </div>

                    {finding.humanConfirmationRequirement && (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200 flex-shrink-0">
                        <Lock className="w-3 h-3" /> Requires Owner Confirmation
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CANONICAL BUSINESS PROFILE */}
        {activeTab === 'profile' && profile && (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900 flex items-center justify-between">
              <div>
                <span className="font-bold">Tenant Data Owner:</span> {profile.dataOwner} | <span className="font-bold">Last Verified:</span> {new Date(profile.provenance.lastVerifiedDate).toLocaleDateString()}
              </div>
              <span className="bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                PROVENANCE STAMPED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Identity */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Business Identity</span>
                  <button
                    onClick={() => toggleFieldVisibility('businessIdentity')}
                    className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                      profile.businessIdentity.visibility === 'public'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {profile.businessIdentity.visibility === 'public' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {profile.businessIdentity.visibility.toUpperCase()}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div><span className="text-slate-500">Legal Name:</span> <span className="font-semibold text-slate-900">{profile.businessIdentity.value.legalName}</span></div>
                  <div><span className="text-slate-500">Public Name:</span> <span className="font-semibold text-slate-900">{profile.businessIdentity.value.publicName}</span></div>
                  <div><span className="text-slate-500">Category:</span> <span className="font-semibold text-slate-900">{profile.businessIdentity.value.industryCategory}</span></div>
                  <div><span className="text-slate-500">Description:</span> <span className="text-slate-700">{profile.businessIdentity.value.description}</span></div>
                </div>

                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span>Source: {profile.businessIdentity.source} ({profile.businessIdentity.evidenceClassification})</span>
                  <span className="text-emerald-700 font-bold">{profile.businessIdentity.ownerConfirmationStatus.toUpperCase()}</span>
                </div>
              </div>

              {/* Services & Offer Catalog */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Services & Offer Catalog</span>
                  <button
                    onClick={() => toggleFieldVisibility('services')}
                    className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                      profile.services.visibility === 'public'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {profile.services.visibility === 'public' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {profile.services.visibility.toUpperCase()}
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {profile.services.value.map(srv => (
                    <div key={srv.id} className="bg-white p-2 rounded border border-slate-200">
                      <div className="font-bold text-slate-900">{srv.name} — ${srv.price} {srv.currency}</div>
                      <div className="text-slate-600 text-[11px]">{srv.description}</div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span>Source: {profile.services.source}</span>
                  <span className="text-emerald-700 font-bold">{profile.services.ownerConfirmationStatus.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROPOSED MARKUP DIFF & PREVIEW */}
        {activeTab === 'preview_diff' && (
          <div className="space-y-4">
            {diffLoading ? (
              <div className="p-8 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Generating sanitized preview diff...
              </div>
            ) : previewDiff ? (
              <div className="space-y-4">
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-indigo-400">{previewDiff.title}</span>
                    <span className="bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      SANITIZED & SECRET-SAFE
                    </span>
                  </div>

                  <ul className="text-xs space-y-1 text-slate-300 border-b border-slate-800 pb-3">
                    {previewDiff.diffSummary.map((sum, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{sum}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2">
                    <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Sanitized HTML Head Injection Preview:</span>
                    <pre className="bg-slate-950 p-4 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                      {previewDiff.sanitizedHtml}
                    </pre>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
