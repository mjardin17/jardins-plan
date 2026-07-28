// src/components/universal/BusinessProfileReview.tsx
import React, { useState } from 'react';
import {
  StructuredBusinessProfile,
  FactEntry,
  FactSource,
  FactVerificationStatus
} from '../../types/universal-onboarding.ts';
import {
  UserCheck, Sparkles, Check, X, AlertTriangle, Edit3, ShieldCheck,
  CheckCircle2, Info, Building2, HelpCircle
} from 'lucide-react';

interface Props {
  profile: StructuredBusinessProfile;
  onFactCorrect: (fieldPath: string, newValue: any, status: FactVerificationStatus) => void;
}

export const BusinessProfileReview: React.FC<Props> = ({ profile, onFactCorrect }) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const renderProvenanceBadge = (source: FactSource, status: FactVerificationStatus) => {
    if (source === 'owner_provided') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <UserCheck size={11} /> Owner Provided
        </span>
      );
    }
    if (source === 'imported') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
          <Building2 size={11} /> Imported
        </span>
      );
    }
    if (source === 'ai_inferred') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
          status === 'confirmed'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : status === 'rejected'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <Sparkles size={11} /> AI Inferred {status === 'needs_confirmation' && '(Needs Confirmation)'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
        <HelpCircle size={11} /> Unknown
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-emerald-600" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Structured Business Profile & Fact Provenance
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            This structured profile distills owner inputs and domain inferences into audited facts with source tracking.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-1 min-w-[160px]">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Audit</div>
          <div className="text-3xl font-black text-slate-900">{profile.profileCompletionPct}%</div>
          <div className="text-[11px] font-extrabold text-emerald-600 flex items-center justify-center gap-1">
            <CheckCircle2 size={12} /> Fact Audited
          </div>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Business Identity */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 size={16} className="text-sky-600" /> Identity & Structure
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
              <div>
                <span className="text-slate-400 font-bold block">Business Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{profile.identity.name.value}</span>
              </div>
              {renderProvenanceBadge(profile.identity.name.source, profile.identity.name.status)}
            </div>

            <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
              <div>
                <span className="text-slate-400 font-bold block">Owner / Lead</span>
                <span className="font-bold text-slate-800">{profile.identity.owner.value}</span>
              </div>
              {renderProvenanceBadge(profile.identity.owner.source, profile.identity.owner.status)}
            </div>

            <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
              <div>
                <span className="text-slate-400 font-bold block">Industry & Specialty</span>
                <span className="font-bold text-slate-800">{profile.identity.industry.value} — {profile.identity.subIndustry.value}</span>
              </div>
              {renderProvenanceBadge(profile.identity.industry.source, profile.identity.industry.status)}
            </div>

            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-slate-400 font-bold block">Location & Service Area</span>
                <span className="font-bold text-slate-800">{profile.identity.location.value}</span>
              </div>
              {renderProvenanceBadge(profile.identity.location.source, profile.identity.location.status)}
            </div>
          </div>
        </div>

        {/* Section 2: Operating Systems & Stack */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Info size={16} className="text-sky-600" /> Connected Systems & Tools
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 font-bold">Active System Integrations</span>
                {renderProvenanceBadge(profile.systems.source, profile.systems.status)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.systems.value.map((sys, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700 rounded-lg text-[11px]">
                    {sys}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 font-bold block mb-1">Declared Pain Points</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.painPoints.value.map((pain, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold rounded-lg text-[11px]">
                    {pain}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Inferences Inspection Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" /> AI-Inferred Fact Inspection
            </h3>
            <p className="text-xs text-slate-500">
              Review conclusions inferred by the platform. Confirm or reject each item to lock in accuracy.
            </p>
          </div>
        </div>

        {profile.aiInferences.length === 0 ? (
          <div className="p-4 bg-slate-50 text-slate-500 text-xs rounded-2xl text-center font-bold">
            No unconfirmed AI inferences pending review.
          </div>
        ) : (
          <div className="space-y-3">
            {profile.aiInferences.map((inf) => (
              <div
                key={inf.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">{inf.label}</span>
                    {renderProvenanceBadge('ai_inferred', inf.status)}
                    <span className="text-[10px] text-slate-400 font-bold">Confidence: {Math.round(inf.confidence * 100)}%</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{inf.inferredValue}</p>
                  <p className="text-[11px] text-slate-400 italic">Rationale: {inf.rationale}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {inf.status !== 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => onFactCorrect(inf.id, inf.inferredValue, 'confirmed')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} /> Confirm Fact
                    </button>
                  )}
                  {inf.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => onFactCorrect(inf.id, inf.inferredValue, 'rejected')}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <X size={14} /> Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
